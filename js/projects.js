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
      ${project.screenshot ? `<div class="project-thumb-wrap"><img class="project-thumb" src="${project.screenshot}" alt="${title}" loading="lazy" /></div>` : ""}
      <div class="project-card-body">
        <a class="project-name" href="${project.url}" target="_blank" rel="noopener" title="${project.name}">${repoIconSvg()}${title}</a>
        <div class="project-desc-wrap">
          <p class="project-desc is-clamped">${description}</p>
          <button class="project-more" type="button" aria-expanded="false" hidden>${t("projects.more")}</button>
        </div>
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
    const desc = card.querySelector(".project-desc");
    const moreBtn = card.querySelector(".project-more");
    moreBtn.addEventListener("click", () => {
      const expanded = desc.classList.toggle("is-clamped") === false;
      moreBtn.textContent = t(expanded ? "projects.less" : "projects.more");
      moreBtn.setAttribute("aria-expanded", String(expanded));
    });

    if (canTilt) addTilt(card);
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

  /* Inclinación 3D suave siguiendo el mouse (solo con mouse y sin "reducir movimiento") */
  const canTilt =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_TILT = 5; // grados

  function addTilt(card) {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.classList.add("is-tilting");
      card.style.transform =
        `perspective(900px) rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.transform = "";
    });
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
    updateMoreButtons();
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateMoreButtons, 150);
  });

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
