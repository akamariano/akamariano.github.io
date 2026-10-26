(function () {
  "use strict";

  const statusEl = document.getElementById("projects-status");
  const gridEl = document.getElementById("projects-grid");
  const filterEl = document.getElementById("projects-filter");

  let cachedProjects = null;
  let loadFailed = false;
  let activeFilter = "all";
  let lastFilter = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // En /en/ las rutas locales suben un nivel (data-root="../"); las absolutas quedan igual
  const SITE_ROOT = document.documentElement.dataset.root || "";
  const local = (url) => (url && !/^(https?:|\/|#)/.test(url) ? SITE_ROOT + url : url);

  const dateFormatters = {
    es: new Intl.DateTimeFormat("es-GT", { year: "numeric", month: "short" }),
    en: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }),
  };

  function t(key) {
    const lang = window.currentLang || "es";
    return (window.translations[lang] || window.translations.es)[key] || key;
  }

  function externalIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  }

  // La flecha ↗ va pegada a la última palabra para que nunca quede sola en una línea
  function titleWithIcon(title) {
    const i = title.lastIndexOf(" ");
    const head = i === -1 ? "" : title.slice(0, i + 1);
    const last = i === -1 ? title : title.slice(i + 1);
    return `${head}<span class="nowrap">${last}${externalIconSvg()}</span>`;
  }

  // Barra de ventana sobre la captura: navegador con la URL real, terminal o app de escritorio
  function windowBar(project) {
    const win = project.window || {};
    const kind = win.kind || "browser";
    const fallback = (project.demoUrl && /^https?:/.test(project.demoUrl) ? project.demoUrl : project.url) || "";
    const title = win.title || fallback.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const lights = '<span class="win-lights" aria-hidden="true"><i></i><i></i><i></i></span>';
    if (kind === "browser") {
      return `<div class="win-bar win-browser">${lights}<span class="win-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span class="win-url-text">${title}</span></span></div>`;
    }
    return `<div class="win-bar win-${kind}">${lights}<span class="win-title">${title}</span></div>`;
  }

  function starIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right:4px"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7L12 2Z"/></svg>';
  }

  function demoIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18l15-9L5 3Z"/></svg>';
  }

  // descriptions/howTo pueden venir como texto (solo español) o como { es, en }
  function localized(value, lang) {
    if (!value || typeof value === "string") return value;
    return value[lang] || value.es;
  }

  // Máximo 5 etiquetas a la vista (primero las competencias destacadas, luego el stack);
  // el resto queda detrás de un botón "+N" para que la tarjeta se pueda leer de un vistazo
  const TAG_LIMIT = 5;
  function tagsHtml(highlights, tech) {
    const all = [...highlights.map((h) => ({ h, kind: "hl" })), ...tech.map((h) => ({ h, kind: "tech" }))];
    if (!all.length) return "";
    const extra = Math.max(0, all.length - TAG_LIMIT);
    const item = ({ h, kind }, i) =>
      `<li class="${kind === "hl" ? "tag-hl" : "tech-tag"}${i >= TAG_LIMIT ? " is-extra" : ""}">${h}</li>`;
    return `<ul class="project-tags" aria-label="${t("projects.highlights")}">${all.map(item).join("")}${
      extra ? `<li class="tags-more-wrap"><button class="tags-more" type="button" aria-expanded="false">+${extra}</button></li>` : ""
    }</ul>`;
  }

  function renderProject(project, isLead) {
    const lang = window.currentLang || "es";
    const card = document.createElement("div");
    // El primer destacado de la vista ocupa toda la fila; los demás destacados conservan
    // insignia y competencias pero van en la cuadrícula normal
    card.className =
      "card project-card" +
      (project.screenshot ? " has-thumb" : "") +
      (project.featured ? " has-highlights" : "") +
      (project.featured && isLead ? " is-featured" : "");

    const description = localized(project.description, lang) || t("projects.noDescription");
    const howTo = localized(project.howTo, lang);
    const updated = project.updatedAt
      ? (dateFormatters[lang] || dateFormatters.es).format(new Date(project.updatedAt))
      : "";
    // Título legible por idioma (projects.config.json → "titles"); si no hay, se usa el nombre del repo
    const title = (project.title && (project.title[lang] || project.title.es)) || project.name;
    const tech = project.tech && project.tech.length ? project.tech : (project.language ? [project.language] : []);
    // Proyecto destacado (projects.config.json → "featured"): insignia y lista de competencias por idioma
    const highlights = project.featured ? (project.featured[lang] || project.featured.es || []) : [];
    // Sin repetir en el stack lo que ya aparece como competencia destacada (p. ej. Docker, Vite)
    const shown = new Set(highlights.map((h) => h.toLowerCase()));
    const techShown = tech.filter((name) => !shown.has(name.toLowerCase()));

    card.innerHTML = `
      ${project.screenshot ? `<div class="project-thumb-wrap">${windowBar(project)}<div class="win-view"><img class="project-thumb" src="${local(project.screenshot)}" alt="" loading="lazy" /></div></div>` : ""}
      <div class="project-card-body">
        <div class="project-kicker">
          ${project.featured ? `<span class="project-featured-badge">${starIconSvg()}${t("projects.featured")}</span>` : ""}
          <span class="project-category">${t("projects.cat." + (project.category || "software"))}</span>
        </div>
        <a class="project-name" href="${project.url}" target="_blank" rel="noopener">${titleWithIcon(title)}</a>
        <div class="project-desc-wrap">
          <p class="project-desc is-clamped">${description}</p>
          <button class="project-more" type="button" aria-expanded="false" hidden>${t("projects.more")}</button>
        </div>
        ${tagsHtml(highlights, techShown)}
        <div class="project-meta">
          ${project.stars ? `<span>${starIconSvg()}${project.stars}</span>` : ""}
          ${updated ? `<span>${t("projects.updated")} ${updated}</span>` : ""}
        </div>
        ${project.caseStudy || project.demoUrl ? `<div class="project-actions">
          ${project.caseStudy ? `<a class="btn btn-primary project-demo-btn" href="${local(project.caseStudy)}"><span>${t("projects.caseStudy")}</span></a>` : ""}
          ${project.demoUrl ? `<a class="btn ${project.caseStudy ? "btn-secondary" : "btn-primary"} project-demo-btn" href="${local(project.demoUrl)}" target="_blank" rel="noopener">${demoIconSvg()}<span>${t("projects.viewDemo")}</span></a>` : ""}
        </div>` : ""}
        ${howTo ? `
          <p class="project-howto"><strong>${t("projects.howTo")}:</strong> ${howTo}</p>
        ` : ""}
      </div>
    `;
    const more = card.querySelector(".tags-more");
    if (more) {
      more.addEventListener("click", () => {
        const open = card.classList.toggle("tags-open");
        more.setAttribute("aria-expanded", String(open));
        more.textContent = open ? "−" : more.dataset.label;
      });
      more.dataset.label = more.textContent;
    }
    const desc = card.querySelector(".project-desc");
    const moreBtn = card.querySelector(".project-more");
    moreBtn.addEventListener("click", () => {
      const expanded = desc.classList.toggle("is-clamped") === false;
      moreBtn.textContent = t(expanded ? "projects.less" : "projects.more");
      moreBtn.setAttribute("aria-expanded", String(expanded));
    });

    return card;
  }

  // Muestra "Ver más" solo en las descripciones que realmente quedan cortadas
  function updateMoreButtons() {
    gridEl.querySelectorAll(".project-card").forEach((card) => {
      const desc = card.querySelector(".project-desc");
      const moreBtn = card.querySelector(".project-more");
      if (!desc.classList.contains("is-clamped")) return;
      moreBtn.hidden = desc.scrollHeight <= desc.clientHeight + 1;
    });
  }

  /* La inclinación 3D y la entrada al hacer scroll las maneja js/cards3d.js */

  function render() {
    if (loadFailed) {
      statusEl.textContent = t("projects.error");
      statusEl.hidden = false;
      gridEl.hidden = true;
      return;
    }

    if (!cachedProjects) {
      statusEl.textContent = t("projects.loading");
      statusEl.hidden = false;
      gridEl.hidden = true;
      return;
    }

    if (cachedProjects.length === 0) {
      statusEl.textContent = t("projects.empty");
      statusEl.hidden = false;
      gridEl.hidden = true;
      return;
    }

    statusEl.hidden = true;
    gridEl.hidden = false;
    gridEl.innerHTML = "";
    const shown = cachedProjects.filter((p) => activeFilter === "all" || (p.category || "software") === activeFilter);
    // Al cambiar de pestaña, la cuadrícula entra con un fundido corto en vez de aparecer de golpe
    if (lastFilter !== null && lastFilter !== activeFilter && !reduceMotion) {
      gridEl.animate([{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)" }], { duration: 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    }
    lastFilter = activeFilter;
    const lead = shown.find((p) => p.featured);
    shown.forEach((project) => gridEl.appendChild(renderProject(project, project === lead)));
    updateFilterCounts();
    updateMoreButtons();
  }

  // Pestañas por categoría (role=tablist); flechas izquierda/derecha mueven el foco como en macOS
  function updateFilterCounts() {
    if (!filterEl) return;
    filterEl.querySelectorAll("[data-filter]").forEach((btn) => {
      const f = btn.dataset.filter;
      const n = cachedProjects.filter((p) => f === "all" || (p.category || "software") === f).length;
      const count = btn.querySelector(".filter-count");
      if (count) count.textContent = n;
      const selected = f === activeFilter;
      btn.setAttribute("aria-selected", String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    moveIndicator();
  }

  // Píldora que se desliza hasta la pestaña elegida (control segmentado al estilo de iOS)
  const indicator = filterEl ? document.createElement("span") : null;
  if (indicator) {
    indicator.className = "filter-indicator";
    indicator.setAttribute("aria-hidden", "true");
    filterEl.prepend(indicator);
  }
  function moveIndicator() {
    if (!indicator) return;
    const btn = filterEl.querySelector('[aria-selected="true"]');
    if (!btn) return;
    indicator.style.width = btn.offsetWidth + "px";
    indicator.style.height = btn.offsetHeight + "px";
    indicator.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    filterEl.classList.add("has-indicator");
  }
  window.addEventListener("resize", () => requestAnimationFrame(moveIndicator));
  document.addEventListener("langchange", () => requestAnimationFrame(moveIndicator));

  // Accesos del hero ("Cloud y sistemas", "Redes"…): bajan a Proyectos con esa pestaña elegida
  document.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      activeFilter = link.dataset.filterLink;
      render();
    });
  });

  if (filterEl) {
    filterEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn || btn.dataset.filter === activeFilter) return;
      activeFilter = btn.dataset.filter;
      render();
    });
    filterEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = Array.from(filterEl.querySelectorAll("[data-filter]"));
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
      e.preventDefault();
    });
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateMoreButtons, 150);
  });

  fetch(`${SITE_ROOT}data/projects.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((payload) => {
      cachedProjects = payload.projects || [];
      render();
    })
    .catch(() => {
      loadFailed = true;
      render();
    });

  document.addEventListener("langchange", render);
  render();
})();
