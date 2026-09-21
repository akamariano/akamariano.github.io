# Landing page — Mariano Rac

Sitio estático (HTML + CSS + JS plano, sin frameworks) para GitHub Pages, con despliegue
automático vía GitHub Actions.

## Estructura

```
├── .github/workflows/deploy.yml   # build + deploy a GitHub Pages en cada push a main
├── assets/
│   ├── cv.pdf                     # currículum descargable
│   └── favicon.svg
├── css/styles.css
├── js/
│   ├── i18n.js                    # diccionario ES/EN
│   ├── main.js                    # tema claro/oscuro, idioma, menú móvil, animaciones
│   └── projects.js                # pinta data/projects.json en la sección de proyectos
├── scripts/fetch-projects.mjs     # corre en CI: consulta la API de GitHub y genera data/projects.json
├── projects.config.json           # repos a excluir / destacar primero
└── index.html
```

`data/projects.json` se genera en cada build (local o CI) y **no se commitea** (ver `.gitignore`).

## Desarrollo local

```bash
node scripts/fetch-projects.mjs   # genera data/projects.json con tus repos reales
python3 -m http.server 8811       # o cualquier servidor estático
```

Abre `http://localhost:8811`.

## Cómo ocultar o destacar un repo

Edita `projects.config.json`:

```json
{
  "exclude": ["nombre-del-repo-a-ocultar"],
  "pinned": ["nombre-del-repo-a-destacar-primero"]
}
```

Los forks se excluyen automáticamente. El script vuelve a correr en cada push a `main` y también
una vez al día (cron), así que los cambios se reflejan solos sin que edites este proyecto.

## Poner en marcha GitHub Pages

1. En **Settings → Pages**, cambia "Source" a **GitHub Actions**.
2. En **Settings → Actions → General**, deja los permisos por defecto (solo lectura) — el propio
   workflow declara `pages: write` e `id-token: write`, que es lo que autoriza el deploy.
3. No hace falta crear ningún secret: `GITHUB_TOKEN` ya lo provee GitHub Actions automáticamente,
   y se usa únicamente para subir el límite de peticiones a la API de GitHub (de 60 a 5000/hora).
4. Haz push a `main` — el workflow construye y publica el sitio.
