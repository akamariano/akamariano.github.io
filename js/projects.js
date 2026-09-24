(function () {
  "use strict";

  const statusEl = document.getElementById("projects-status");
  const gridEl = document.getElementById("projects-grid");

  let cachedProjects = null;
  let loadFailed = false;

  const dateFormatters = {
    es: new Intl.DateTimeFormat("es-GT", { year: "numeric", month: "short" }),
    en: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }),
  };

  function t(key) {
    const lang = window.currentLang || "es";
    return (window.translations[lang] || window.translations.es)[key] || key;
  }

  function repoIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h11l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/></svg>';
  }

  function starIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right:4px"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17l-6.1 3.5 1.5-6.8L2.2 9l6.9-.7L12 2Z"/></svg>';
  }

  function demoIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18l15-9L5 3Z"/></svg>';
  }

  function renderProject(project) {
    const lang = window.currentLang || "es";
    const card = document.createElement("div");
    card.className = "card project-card" + (project.screenshot ? " has-thumb" : "");

    const description = project.description || t("projects.noDescription");
    const updated = project.updatedAt
      ? (dateFormatters[lang] || dateFormatters.es).format(new Date(project.updatedAt))
      : "";
    // Título legible por idioma (projects.config.json → "titles"); si no hay, se usa el nombre del repo
    const title = (project.title && (project.title[lang] || project.title.es)) || project.name;
    const tech = project.tech && project.tech.length ? project.tech : (project.language ? [project.language] : []);

    card.innerHTML = `
      ${project.screenshot ? `<img class="project-thumb" src="${project.screenshot}" alt="${title}" loading="lazy" />` : ""}
      <div class="project-card-body">
        <a class="project-name" href="${project.url}" target="_blank" rel="noopener" title="${project.name}">${repoIconSvg()}${title}</a>
        <p>${description}</p>
        ${tech.length ? `<div class="project-tech">${tech.map((t) => `<span class="tech-tag">${t}</span>`).join("")}</div>` : ""}
        <div class="project-meta">
          ${project.stars ? `<span>${starIconSvg()}${project.stars}</span>` : ""}
          ${updated ? `<span>${t("projects.updated")} ${updated}</span>` : ""}
        </div>
        ${project.demoUrl ? `
          <a class="btn btn-primary project-demo-btn" href="${project.demoUrl}" target="_blank" rel="noopener">
            ${demoIconSvg()}<span>${t("projects.viewDemo")}</span>
          </a>
        ` : ""}
        ${project.howTo ? `
          <p class="project-howto"><strong>${t("projects.howTo")}:</strong> ${project.howTo}</p>
        ` : ""}
      </div>
    `;
    return card;
  }

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
    cachedProjects.forEach((project) => gridEl.appendChild(renderProject(project)));
  }

  fetch("data/projects.json")
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
