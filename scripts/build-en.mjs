// Genera en/index.html: la portada ya traducida al inglés en el HTML (para buscadores y vistas
// previas), a partir de index.html y el diccionario de js/i18n.js. Corre en CI antes de publicar.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SITE = "https://akamariano.github.io/";

const i18nSource = await readFile(new URL("js/i18n.js", ROOT), "utf-8");
// i18n.js solo declara el diccionario y funciones; se evalúa con un `window` falso
const translations = new Function("window", `${i18nSource}; return translations;`)({});
const en = translations.en;

let html = await readFile(new URL("index.html", ROOT), "utf-8");

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s) => escapeHtml(s).replace(/"/g, "&quot;");

// Texto de elementos sin hijos: <tag ... data-i18n="clave">texto</tag>
let missing = [];
html = html.replace(/(<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, text, close) => {
  if (en[key] === undefined) {
    missing.push(key);
    return m;
  }
  return open + escapeHtml(en[key]) + close;
});

// Atributos traducidos: data-i18n-attr="aria-label:clave"
html = html.replace(/<[^>]*\sdata-i18n-attr="([^":]+):([^"]+)"[^>]*>/g, (tagHtml, attr, key) => {
  if (en[key] === undefined) return tagHtml;
  const re = new RegExp(`\\s${attr}="[^"]*"`);
  return tagHtml.replace(re, ` ${attr}="${escapeAttr(en[key])}"`);
});

// Enlaces por idioma (CV en inglés)
html = html.replace(/<[^>]*\sdata-i18n-href="([^"]+)"[^>]*>/g, (tagHtml, key) =>
  en[key] === undefined ? tagHtml : tagHtml.replace(/\shref="[^"]*"/, ` href="${en[key]}"`)
);

// Metadatos de la página en inglés
html = html
  .replace('<html lang="es">', '<html lang="en" data-lang="en" data-root="../">')
  .replace(/<title>[^<]*<\/title>/, "<title>Mariano Rac — Software Developer</title>")
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    '<meta name="description" content="Mariano Roberto Rac Noguera — Computer Science and Systems Engineering student at USAC and freelance software developer: full-stack apps, Kubernetes, Linux kernel and networking projects." />'
  )
  .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${SITE}en/" />`)
  .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${SITE}en/" />`)
  .replace('<meta property="og:locale" content="es_GT" />', '<meta property="og:locale" content="en_US" />')
  .replace(/<meta property="og:title" content="[^"]*" \/>/, '<meta property="og:title" content="Mariano Rac — Software Developer" />')
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, '<meta name="twitter:title" content="Mariano Rac — Software Developer" />')
  .replace('<a class="skip-link" href="#main">Saltar al contenido</a>', '<a class="skip-link" href="#main">Skip to content</a>');

// Rutas relativas: la página vive en /en/, así que todo lo local sube un nivel
html = html.replace(/\s(href|src)="(?!https?:|#|mailto:|tel:|data:|\/|\.\.\/)([^"]+)"/g, (m, attr, url) => ` ${attr}="../${url}"`);

await mkdir(new URL("en/", ROOT), { recursive: true });
await writeFile(new URL("en/index.html", ROOT), html);
if (missing.length) console.warn("Claves sin traducción:", [...new Set(missing)].join(", "));
console.log("Escrito en/index.html");
