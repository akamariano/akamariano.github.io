/* Intro de "hackeo" en la primera visita: una terminal se conecta y "descifra" el portafolio,
   el nombre se decodifica entre caracteres al azar y la pantalla se apaga como un CRT para
   mostrar la página. Dura ~2.5 s antes del apagado, se salta con clic, cualquier tecla o el botón "Saltar". */
(function () {
  const root = document.documentElement;
  const overlay = document.getElementById("intro");
  if (!overlay) return;
  if (!root.classList.contains("intro-on")) {
    overlay.remove();
    return;
  }

  const log = overlay.querySelector(".intro-log");
  const nameEl = overlay.querySelector(".intro-name");
  const skipBtn = overlay.querySelector(".intro-skip");
  const blocked = Array.from(document.querySelectorAll("header, main, footer, #whatsapp-fab"));
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@<>/\\{}[]=+*";
  const NAME = "MARIANO RAC";

  let lang = "es";
  try {
    lang = localStorage.getItem("mr-lang") || (navigator.language || "es").slice(0, 2);
  } catch (e) {
    /* se usa el idioma por defecto */
  }
  const en = lang === "en" || root.dataset.lang === "en";

  // [texto, clase] — los comandos se escriben letra por letra; la salida aparece de golpe
  const LINES = en
    ? [
        ["$ ssh visitor@akamariano.github.io", "cmd"],
        ["connecting to akamariano.github.io:443 … ok", "out"],
        ["$ sudo ./decrypt --portfolio", "cmd"],
        ["[bar] decrypting projects, kernel, cloud, network", "bar"],
        ["> access granted. welcome.", "ok"],
      ]
    : [
        ["$ ssh visitante@akamariano.github.io", "cmd"],
        ["conectando a akamariano.github.io:443 … ok", "out"],
        ["$ sudo ./descifrar --portafolio", "cmd"],
        ["[bar] descifrando proyectos, kernel, nube y redes", "bar"],
        ["> acceso concedido. bienvenido.", "ok"],
      ];
  skipBtn.textContent = en ? "Skip ↵" : "Saltar ↵";
  skipBtn.setAttribute("aria-label", en ? "Skip intro" : "Saltar la intro");

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let finished = false;

  // Mientras corre, el resto de la página no recibe foco ni clics
  blocked.forEach((el) => (el.inert = true));
  skipBtn.focus({ preventScroll: true });

  function addLine(cls) {
    const line = document.createElement("div");
    line.className = "intro-line intro-" + cls;
    log.appendChild(line);
    return line;
  }

  // Cada línea se crea en su orden desde el inicio (vacía) y se llena en su momento
  function typeLine([text, cls], start) {
    if (cls === "cmd") {
      const line = addLine(cls);
      [...text].forEach((ch, i) => later(() => (line.textContent += ch), start + i * 11));
      return start + text.length * 11 + 70;
    }
    if (cls === "bar") {
      const line = addLine("out");
      const label = text.replace("[bar] ", "");
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        later(() => {
          const pct = Math.round((i / steps) * 100);
          line.textContent = `[${"■".repeat(i)}${"·".repeat(steps - i)}] ${String(pct).padStart(3)}%  ${label}`;
        }, start + i * 26);
      }
      return start + steps * 26 + 90;
    }
    const line = addLine(cls);
    later(() => (line.textContent = text), start);
    return start + 90;
  }

  // El nombre aparece revuelto y cada letra se fija de izquierda a derecha
  function decodeName(start) {
    later(() => overlay.classList.add("is-decoding"), start);
    const FRAMES = 16;
    for (let f = 0; f <= FRAMES; f++) {
      later(() => {
        const fixed = Math.floor((f / FRAMES) * NAME.length);
        nameEl.textContent = [...NAME]
          .map((ch, i) => (ch === " " || i < fixed ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("");
      }, start + f * 28);
    }
    return start + FRAMES * 28 + 300;
  }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    try {
      localStorage.setItem("mr-intro-seen", "1");
    } catch (e) {
      /* sin almacenamiento: se verá otra vez, sin más efecto */
    }
    blocked.forEach((el) => (el.inert = false));
    overlay.classList.add("is-leaving");
    // Apagado de CRT: la imagen se aplasta en una línea y la línea se cierra al centro
    const done = () => {
      root.classList.remove("intro-on");
      overlay.remove();
    };
    const anim = overlay.animate(
      [
        { clipPath: "inset(0 0 0 0)", filter: "brightness(1)" },
        { clipPath: "inset(49.6% 0 49.6% 0)", filter: "brightness(1.8)", offset: 0.55 },
        { clipPath: "inset(49.6% 50% 49.6% 50%)", filter: "brightness(2.2)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards" }
    );
    anim.onfinish = done;
    setTimeout(done, 900); // por si la animación no termina (pestaña en segundo plano)
  }

  let t = 120;
  LINES.forEach((line) => (t = typeLine(line, t)));
  t = decodeName(t);
  later(finish, t);

  skipBtn.addEventListener("click", finish);
  overlay.addEventListener("click", finish);
  window.addEventListener("keydown", finish, { once: true });
})();
