(function () {
  "use strict";

  /* ---------------- Theme (claro/oscuro) ---------------- */
  const THEME_KEY = "mr-theme";
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");

  function systemPrefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* almacenamiento no disponible (modo privado, etc.) — se ignora */
    }
  }

  function reflectTheme(theme) {
    const isDark = theme === "dark" || (theme === null && systemPrefersDark());
    sunIcon.style.display = isDark ? "none" : "block";
    moonIcon.style.display = isDark ? "block" : "none";
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    reflectTheme(theme);
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  let currentTheme = getStoredTheme();
  applyTheme(currentTheme);

  themeToggle.addEventListener("click", () => {
    const isDarkNow = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && systemPrefersDark());
    currentTheme = isDarkNow ? "light" : "dark";
    setStoredTheme(currentTheme);
    applyTheme(currentTheme);
  });

  /* ---------------- Idioma (ES/EN) ---------------- */
  const LANG_KEY = "mr-lang";
  const langToggle = document.getElementById("lang-toggle");
  const langLabel = document.getElementById("lang-toggle-label");

  function getStoredLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null;
    }
  }

  function setStoredLang(value) {
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      /* almacenamiento no disponible — se ignora */
    }
  }

  function setLang(lang) {
    window.applyTranslations(lang);
    langLabel.textContent = lang === "es" ? "EN" : "ES";
    langToggle.setAttribute("aria-label", lang === "es" ? "Switch to English" : "Cambiar a español");
    window.currentLang = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  const initialLang = getStoredLang() || (navigator.language || "es").slice(0, 2);
  setLang(initialLang === "en" ? "en" : "es");

  langToggle.addEventListener("click", () => {
    const next = window.currentLang === "es" ? "en" : "es";
    setStoredLang(next);
    setLang(next);
  });

  /* ---------------- Menú móvil ---------------- */
  const navToggle = document.getElementById("nav-toggle");
  const navLinksMobile = document.getElementById("nav-links-mobile");

  if (navToggle && navLinksMobile) {
    navToggle.addEventListener("click", () => {
      const isOpen = !navLinksMobile.hidden;
      navLinksMobile.hidden = isOpen;
      navToggle.setAttribute("aria-expanded", String(!isOpen));
    });

    navLinksMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinksMobile.hidden = true;
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------- Año del footer ---------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- Barra de progreso de scroll ---------------- */
  const progressBar = document.getElementById("scroll-progress");
  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  }

  /* ---------------- WhatsApp FAB: aparece tras pasar el hero ---------------- */
  const whatsappFab = document.getElementById("whatsapp-fab");
  const heroSection = document.getElementById("top");
  function updateFab() {
    if (!whatsappFab) return;
    const heroBottom = heroSection ? heroSection.getBoundingClientRect().bottom : 0;
    whatsappFab.classList.toggle("is-visible", heroBottom < 0);
  }

  /* ---------------- Nav: resalta la sección activa ---------------- */
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

  function setActiveLink(id) {
    navAnchors.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  let scrollTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateProgress();
        updateFab();
        scrollTicking = false;
      });
    },
    { passive: true }
  );

  updateProgress();
  updateFab();
})();
