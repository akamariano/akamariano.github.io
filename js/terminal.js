(function () {
  "use strict";

  /* Terminal interactiva que se abre al presionar la foto del hero.
     Todo el texto se inserta con textContent (nunca innerHTML) para que lo que
     escribe el visitante no pueda inyectar HTML. */
  const dialog = document.getElementById("terminal");
  const openBtn = document.getElementById("terminal-open");
  if (!dialog || !openBtn || typeof dialog.showModal !== "function") return;

  const closeBtn = document.getElementById("terminal-close");
  const body = document.getElementById("terminal-body");
  const chips = document.getElementById("terminal-chips");
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  const EMAIL = "marianoracnoguera@gmail.com";
  const WHATSAPP = "https://wa.me/50247264846";
  const LINKEDIN = "https://www.linkedin.com/in/mariano-roberto-rac-noguera-ab4b123b3/";
  const GITHUB = "https://github.com/akamariano";

  const lang = () => (window.currentLang === "en" ? "en" : "es");
  const link = (text, href) => ({ text, href });
  const hl = (text) => ({ text, cls: "t-hl" });
  const dim = (text) => ({ text, cls: "t-dim" });

  /* ---------------- Contenido ---------------- */
  const TEXT = {
    es: {
      welcome: [
        [hl("¡Hola! Soy Mariano 👋")],
        ["Bienvenido a mi terminal. Escribe un comando o toca una opción de abajo."],
        [dim("Escribe "), hl("ayuda"), dim(" para ver todos los comandos.")],
      ],
      notFound: (cmd) => [[`Comando no encontrado: ${cmd}. Escribe `, hl("ayuda"), "."]],
      loading: "Cargando proyectos…",
      loadError: "No pude cargar los proyectos. Míralos en:",
      chips: ["sobre-mi", "servicios", "proyectos", "habilidades", "contacto", "cv"],
      help: [
        [hl("Comandos disponibles:")],
        ["  sobre-mi      ", dim("quién soy")],
        ["  servicios     ", dim("lo que puedo hacer por tu negocio")],
        ["  proyectos     ", dim("mis proyectos más recientes")],
        ["  experiencia   ", dim("dónde he trabajado")],
        ["  habilidades   ", dim("lenguajes y herramientas")],
        ["  contacto      ", dim("cómo escribirme")],
        ["  cv            ", dim("descargar mi currículum")],
        ["  limpiar       ", dim("limpiar la pantalla")],
        ["  salir         ", dim("cerrar la terminal")],
      ],
      about: [
        [hl("Mariano Roberto Rac Noguera")],
        ["🎓 Estudiante de Ingeniería en Ciencias y Sistemas — USAC (7mo semestre)"],
        ["💼 Desarrollador y agente de ventas en ", link("TechnoMaya", "https://technomaya.dev/")],
        ["🤝 Mentor — The Church of Jesus Christ of Latter-day Saints"],
        ["🌎 Español nativo · Inglés avanzado (B2–C1) · Miskitu intermedio"],
        ["🏅 Reconocimiento a la excelencia académica — USAC (2 veces)"],
        [dim("Me gusta aprender de cada equipo y convertir ideas en software que funciona.")],
      ],
      services: [
        [hl("Servicios")],
        ["🌐 Sitios web para negocios"],
        [dim("   modernos, rápidos y adaptados a celular")],
        ["🗄️ Sistemas a medida"],
        [dim("   registro, inventario, citas, asistencia")],
        ["📱 Apps móviles"],
        [dim("   Android e iOS conectadas a tu sistema")],
        [""],
        ["¿Tienes un proyecto? ", link("Cotiza por WhatsApp →", WHATSAPP)],
      ],
      experience: [
        [hl("Experiencia")],
        ["2026 — hoy   Desarrollador & Agente de Ventas · TechnoMaya"],
        ["2026 — hoy   Mentor · The Church of Jesus Christ of Latter-day Saints"],
        ["2024 — 2026  Executive Assistant, Team Lead & Volunteer Mentor"],
        [dim("             liderazgo de operaciones para más de 150 colaboradores")],
        ["2023         Educador de Matemática y Física · El Castaño Bilingual School"],
      ],
      skills: [
        [hl("Habilidades")],
        ["Lenguajes    ", dim("Python · Java · JavaScript/TypeScript · C++ · PHP · x86")],
        ["Web          ", dim("HTML & CSS · React · Express · Tailwind")],
        ["Datos        ", dim("SQL · PostgreSQL · MongoDB · Oracle · DBeaver")],
        ["Herramientas ", dim("Git & GitHub · Docker · Linux · AWS EC2/S3")],
        ["Blandas      ", dim("ventas consultivas · liderazgo · mentoría · trabajo en equipo")],
      ],
      contact: [
        [hl("Contacto")],
        ["📧 ", link(EMAIL, `mailto:${EMAIL}`)],
        ["💬 ", link("WhatsApp +502 4726 4846", WHATSAPP)],
        ["🔗 ", link("LinkedIn", LINKEDIN)],
        ["🐙 ", link("GitHub · akamariano", GITHUB)],
      ],
      cv: [["📄 ", link("Descargar mi CV (PDF)", "assets/cv.pdf")]],
      projectsTitle: "Proyectos destacados",
      sudo: [["🔒 Buen intento. Aquí el único con permisos de root es Mariano 😄"]],
      hire: [["🚀 ¡Excelente decisión! ", link("Escríbeme por WhatsApp", WHATSAPP)]],
    },
    en: {
      welcome: [
        [hl("Hi! I'm Mariano 👋")],
        ["Welcome to my terminal. Type a command or tap an option below."],
        [dim("Type "), hl("help"), dim(" to see every command.")],
      ],
      notFound: (cmd) => [[`Command not found: ${cmd}. Type `, hl("help"), "."]],
      loading: "Loading projects…",
      loadError: "Couldn't load the projects. See them at:",
      chips: ["about", "services", "projects", "skills", "contact", "cv"],
      help: [
        [hl("Available commands:")],
        ["  about         ", dim("who I am")],
        ["  services      ", dim("what I can do for your business")],
        ["  projects      ", dim("my latest projects")],
        ["  experience    ", dim("where I've worked")],
        ["  skills        ", dim("languages and tools")],
        ["  contact       ", dim("how to reach me")],
        ["  cv            ", dim("download my résumé")],
        ["  clear         ", dim("clear the screen")],
        ["  exit          ", dim("close the terminal")],
      ],
      about: [
        [hl("Mariano Roberto Rac Noguera")],
        ["🎓 Systems Engineering student — USAC (7th semester)"],
        ["💼 Developer & sales agent at ", link("TechnoMaya", "https://technomaya.dev/")],
        ["🤝 Mentor — The Church of Jesus Christ of Latter-day Saints"],
        ["🌎 Native Spanish · Advanced English (B2–C1) · Intermediate Miskitu"],
        ["🏅 Academic excellence award — USAC (twice)"],
        [dim("I love learning from every team and turning ideas into software that works.")],
      ],
      services: [
        [hl("Services")],
        ["🌐 Business websites"],
        [dim("   modern, fast and mobile-friendly")],
        ["🗄️ Custom systems"],
        [dim("   registration, inventory, appointments, attendance")],
        ["📱 Mobile apps"],
        [dim("   Android & iOS connected to your system")],
        [""],
        ["Have a project? ", link("Get a quote on WhatsApp →", WHATSAPP)],
      ],
      experience: [
        [hl("Experience")],
        ["2026 — now   Developer & Sales Agent · TechnoMaya"],
        ["2026 — now   Mentor · The Church of Jesus Christ of Latter-day Saints"],
        ["2024 — 2026  Executive Assistant, Team Lead & Volunteer Mentor"],
        [dim("             led operations for 150+ collaborators")],
        ["2023         Math & Physics Educator · El Castaño Bilingual School"],
      ],
      skills: [
        [hl("Skills")],
        ["Languages  ", dim("Python · Java · JavaScript/TypeScript · C++ · PHP · x86")],
        ["Web        ", dim("HTML & CSS · React · Express · Tailwind")],
        ["Data       ", dim("SQL · PostgreSQL · MongoDB · Oracle · DBeaver")],
        ["Tools      ", dim("Git & GitHub · Docker · Linux · AWS EC2/S3")],
        ["Soft       ", dim("consultative sales · leadership · mentoring · teamwork")],
      ],
      contact: [
        [hl("Contact")],
        ["📧 ", link(EMAIL, `mailto:${EMAIL}`)],
        ["💬 ", link("WhatsApp +502 4726 4846", WHATSAPP)],
        ["🔗 ", link("LinkedIn", LINKEDIN)],
        ["🐙 ", link("GitHub · akamariano", GITHUB)],
      ],
      cv: [["📄 ", link("Download my CV (PDF)", "assets/cv.pdf")]],
      projectsTitle: "Featured projects",
      sudo: [["🔒 Nice try. Only Mariano has root access here 😄"]],
      hire: [["🚀 Great choice! ", link("Message me on WhatsApp", WHATSAPP)]],
    },
  };

  // Alias en ambos idiomas → comando interno
  const ALIASES = {
    ayuda: "help", help: "help", "?": "help",
    "sobre-mi": "about", sobremi: "about", about: "about", whoami: "about",
    servicios: "services", services: "services",
    proyectos: "projects", projects: "projects", ls: "projects",
    experiencia: "experience", experience: "experience",
    habilidades: "skills", skills: "skills",
    contacto: "contact", contact: "contact",
    cv: "cv", resume: "cv", curriculum: "cv",
    limpiar: "clear", clear: "clear", cls: "clear",
    salir: "exit", exit: "exit", quit: "exit",
    sudo: "sudo", contratar: "hire", hire: "hire",
  };

  /* ---------------- Salida ---------------- */
  function printLine(segments, cls) {
    const line = document.createElement("div");
    line.className = "t-line" + (cls ? ` ${cls}` : "");
    segments.forEach((seg) => {
      if (typeof seg === "string") {
        line.appendChild(document.createTextNode(seg));
      } else if (seg.href) {
        const a = document.createElement("a");
        a.href = seg.href;
        a.textContent = seg.text;
        a.className = "t-link";
        if (/^https?:/.test(seg.href)) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        if (seg.href.endsWith(".pdf")) a.setAttribute("download", "");
        line.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.className = seg.cls || "";
        span.textContent = seg.text;
        line.appendChild(span);
      }
    });
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function printBlock(lines) {
    lines.forEach((segments) => printLine(segments));
    printLine([""]);
  }

  function echoCommand(cmd) {
    printLine([{ text: "visitante@mariano:~$ ", cls: "t-prompt" }, cmd]);
  }

  let projectsCache = null;
  async function printProjects() {
    const t = TEXT[lang()];
    if (!projectsCache) {
      printLine([dim(t.loading)]);
      try {
        const res = await fetch("data/projects.json");
        if (!res.ok) throw new Error(res.status);
        projectsCache = (await res.json()).projects || [];
      } catch {
        printBlock([[t.loadError + " ", link("github.com/akamariano", GITHUB)]]);
        return;
      }
    }
    const lines = [[hl(t.projectsTitle)]];
    projectsCache.slice(0, 5).forEach((p) => {
      const title = (p.title && (p.title[lang()] || p.title.es)) || p.name;
      const tech = (p.tech || []).slice(0, 3).join(" · ");
      lines.push(["▸ ", link(title, p.demoUrl || p.url), tech ? dim(`  ${tech}`) : ""]);
    });
    lines.push([dim("→ "), link("github.com/akamariano", GITHUB)]);
    printBlock(lines);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    echoCommand(cmd);
    history.push(cmd);
    historyIndex = history.length;

    const key = ALIASES[cmd.toLowerCase().split(/\s+/)[0]];
    const t = TEXT[lang()];
    switch (key) {
      case "clear":
        body.textContent = "";
        return;
      case "exit":
        dialog.close();
        return;
      case "projects":
        printProjects();
        return;
      case "help": case "about": case "services": case "experience":
      case "skills": case "contact": case "cv": case "sudo": case "hire":
        printBlock(t[key]);
        return;
      default:
        printBlock(t.notFound(cmd));
    }
  }

  /* ---------------- Interacción ---------------- */
  const history = [];
  let historyIndex = 0;

  function renderChips() {
    chips.textContent = "";
    TEXT[lang()].chips.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "terminal-chip";
      btn.textContent = name;
      btn.addEventListener("click", () => run(name));
      chips.appendChild(btn);
    });
  }

  function boot() {
    body.textContent = "";
    renderChips();
    const lines = TEXT[lang()].welcome;
    if (reduceMotion) {
      printBlock(lines);
      return;
    }
    lines.forEach((segments, i) => setTimeout(() => printLine(segments, "t-fade"), 120 * i));
    setTimeout(() => printLine([""]), 120 * lines.length);
  }

  openBtn.addEventListener("click", () => {
    openBtn.parentElement.classList.add("terminal-seen");
    boot();
    dialog.showModal();
    // En celular no se enfoca el campo para no abrir el teclado de golpe; están los botones
    if (!isTouch) input.focus();
  });

  closeBtn.addEventListener("click", () => dialog.close());

  // Clic fuera de la ventana (en el fondo) la cierra
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    } else if (e.key === "Tab") {
      // Autocompletar con el primer comando que empiece igual
      const partial = input.value.trim().toLowerCase();
      if (!partial) return;
      const match = Object.keys(ALIASES).find((name) => name.startsWith(partial) && name !== partial);
      if (match) {
        e.preventDefault();
        input.value = match;
      }
    }
  });

  document.addEventListener("langchange", () => {
    if (dialog.open) renderChips();
  });
})();
