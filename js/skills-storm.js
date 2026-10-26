/* Skills como "lluvia de ideas": al llegar a la sección, la laptop llega deslizándose y cerrada,
   la tapa vence la bisagra y se abre, la pantalla enciende (primero la retroiluminación, luego el
   contenido), el reflejo del vidrio la recorre y la luz cae sobre el teclado. Una terminal escribe
   whoami, ls skills/ y ./deploy --all; cuando imprime "✓ N skills ready", las skills salen volando
   de la pantalla (desenfocadas al principio, nítidas al aterrizar, con un destello cada una), y la
   laptop se aleja cerrando la tapa hasta desaparecer. Mientras la sección está en pantalla brillan
   destellos sueltos. Si la sección sale por completo de la pantalla, la animación se rearma. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const section = document.getElementById("habilidades");
  if (!section || !("IntersectionObserver" in window)) return;
  const chips = Array.from(section.querySelectorAll(".chip"));
  if (!chips.length) return;

  const COLORS = ["#ff2bd6", "#4fc8ff", "#3ee8cf", "#3dd332", "#fff27a"];
  const AMBIENT_EVERY = 380; // ms entre destellos sueltos
  const MAX_SPARKLES = 24;

  const laptopWrap = section.querySelector(".skills-laptop");
  const laptopZoom = section.querySelector(".laptop-zoom");
  const lid = section.querySelector(".laptop-lid");
  const screen = section.querySelector(".laptop-screen");
  const termLines = Array.from(section.querySelectorAll(".term-line"));
  const glare = section.querySelector(".screen-glare");
  const lights = Array.from(section.querySelectorAll(".laptop-spill, .laptop-backlight"));
  const count = section.querySelector(".term-count");
  if (count) count.textContent = chips.length;
  const SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";
  const EXPO_OUT = "cubic-bezier(0.19, 1, 0.22, 1)";
  const ZOOM_MS = 1150; // la laptop llega deslizándose, todavía cerrada
  const OPEN_AT = 820; // la tapa empieza a abrirse cuando la laptop ya casi se detuvo
  const OPEN_MS = 1100; // duración de la apertura
  const POWER_AT = OPEN_AT + 380; // la pantalla enciende con la tapa a medio abrir
  const TYPE_AT = POWER_AT + 420; // la terminal empieza a escribir
  const CMD_MS = 200; // cada comando se escribe en este tiempo
  const OUT_GAP = 90; // pausa antes de que aparezca la salida de un comando
  // las skills salen justo cuando la terminal imprime "✓ N skills ready"
  const BURST_AT = TYPE_AT + 3 * (CMD_MS + OUT_GAP) + 60;

  let played = false;
  let timers = [];
  let ambientTimer = 0;
  let sparkleCount = 0;

  section.classList.add("storm-armed", "laptop-armed");

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function sparkle(x, y, size = rand(8, 18), duration = rand(700, 1100)) {
    if (sparkleCount >= MAX_SPARKLES) return;
    const el = document.createElement("span");
    el.className = "sparkle";
    el.setAttribute("aria-hidden", "true");
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.setProperty("--size", size.toFixed(0) + "px");
    el.style.setProperty("--spark", pick(COLORS));
    section.appendChild(el);
    sparkleCount += 1;
    const spin = rand(-90, 90);
    el.animate(
      [
        { transform: "scale(0) rotate(0deg)", opacity: 0 },
        { transform: `scale(1.15) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `scale(0) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    ).onfinish = () => {
      el.remove();
      sparkleCount -= 1;
    };
  }

  // Posición de un elemento relativa a la sección (sin contar transforms en curso)
  function localCenter(el) {
    const s = section.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  function laptopIntro() {
    if (!laptopZoom) return;
    const k = parseFloat(getComputedStyle(laptopWrap).getPropertyValue("--laptop-scale")) || 1;
    section.classList.remove("laptop-armed");
    // Llega deslizándose sobre la mesa: de lejos, girada y algo desenfocada, y se asienta de frente
    laptopZoom.animate(
      [
        { transform: `translateZ(-520px) rotateY(-26deg) rotateX(6deg) scale(${k * 0.45})`, opacity: 0, filter: "blur(6px)" },
        { transform: `translateZ(0) rotateY(2deg) rotateX(0deg) scale(${k * 1.31})`, opacity: 1, filter: "blur(0px)", offset: 0.78 },
        { transform: `translateZ(0) rotateY(0deg) rotateX(0deg) scale(${k * 1.3})`, opacity: 1, filter: "blur(0px)" },
      ],
      { duration: ZOOM_MS, easing: EXPO_OUT, fill: "forwards" }
    );
    // La tapa vence la bisagra (arranque lento), sube rápido, se pasa un poco y se asienta
    lid.animate(
      [
        { transform: "rotateX(-88deg)", easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { transform: "rotateX(-74deg)", offset: 0.16, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        { transform: "rotateX(12deg)", offset: 0.72, easing: "ease-in-out" },
        { transform: "rotateX(6.5deg)", offset: 0.87, easing: "ease-in-out" },
        { transform: "rotateX(8deg)" },
      ],
      { duration: OPEN_MS, delay: OPEN_AT, fill: "backwards" }
    );
    // Encendido: primero la retroiluminación (gris oscuro), luego el contenido con un leve destello
    screen.animate(
      [
        { filter: "brightness(0)" },
        { filter: "brightness(0.18)", offset: 0.2 },
        { filter: "brightness(0.18)", offset: 0.35 },
        { filter: "brightness(1.35)", offset: 0.7 },
        { filter: "brightness(1)" },
      ],
      { duration: 650, delay: POWER_AT, easing: "ease-out", fill: "backwards" }
    );
    // El reflejo del vidrio recorre la pantalla mientras cambia el ángulo de la tapa
    if (glare) {
      glare.animate([{ transform: "translateX(-45%)" }, { transform: "translateX(28%)" }], {
        duration: OPEN_MS,
        delay: OPEN_AT + 120,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)",
        fill: "backwards",
      });
    }
    // La luz de la pantalla cae sobre el teclado y se prenden las teclas
    lights.forEach((el, i) => {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 600,
        delay: POWER_AT + 200 + i * 120,
        easing: "ease-out",
        fill: "backwards",
      });
    });
    // La terminal escribe: los comandos letra por letra, la salida aparece de golpe
    let t = TYPE_AT;
    termLines.forEach((line) => {
      if (line.classList.contains("term-cmd")) {
        const chars = Math.max(4, line.textContent.trim().length);
        line.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
          duration: CMD_MS,
          delay: t,
          easing: `steps(${chars}, end)`,
          fill: "backwards",
        });
        t += CMD_MS;
      } else {
        t += OUT_GAP;
        line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: t, fill: "backwards" });
      }
    });
    // Después de soltar las skills, la tapa se va cerrando mientras la laptop se aleja y se desvanece
    later(() => {
      lid.animate([{ transform: "rotateX(8deg)" }, { transform: "rotateX(-60deg)" }], {
        duration: 1700,
        easing: "cubic-bezier(0.4, 0, 0.6, 1)",
        fill: "forwards",
      });
      laptopZoom.animate(
        [
          { transform: `translateZ(0) rotateY(0deg) scale(${k * 1.3})`, opacity: 1, filter: "blur(0px)" },
          { transform: `translateZ(-140px) rotateY(10deg) scale(${k * 0.95})`, opacity: 0.35, filter: "blur(2px)", offset: 0.5 },
          { transform: `translateZ(-220px) rotateY(14deg) scale(${k * 0.85})`, opacity: 0, filter: "blur(5px)" },
        ],
        { duration: 2200, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
      );
    }, BURST_AT + 1150);
  }

  function storm() {
    played = true;
    laptopIntro();
    later(burst, laptopZoom ? BURST_AT : 0);
  }

  function burst() {
    section.classList.remove("storm-armed");
    const s = section.getBoundingClientRect();
    // Las skills salen del centro de la pantalla de la laptop (o del centro visible si no hay laptop)
    let cloud;
    if (screen) {
      const r = screen.getBoundingClientRect();
      cloud = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    } else {
      cloud = { x: s.width / 2, y: Math.min(Math.max(window.innerHeight * 0.5 - s.top, 80), s.height - 80) };
    }

    // Orden aleatorio: las ideas no llegan en fila
    const order = chips.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((chipIndex, n) => {
      const chip = chips[chipIndex];
      const home = localCenter(chip);
      // Arranca en la pantalla, dispersa un poco al azar
      const dx = cloud.x - home.x + rand(-90, 90);
      const dy = cloud.y - home.y + rand(-50, 50);
      const rot = rand(-35, 35);
      const delay = n * 38;
      const duration = rand(1000, 1400);
      chip.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.2)`, opacity: 0, filter: "blur(6px)" },
          {
            transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 50}px) rotate(${rot * -0.5}deg) scale(1.12)`,
            opacity: 1,
            filter: "blur(1.5px)",
            offset: 0.45,
          },
          { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1, filter: "blur(0px)" },
        ],
        { duration, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
      );
      // Destello al aterrizar
      later(() => {
        const p = localCenter(chip);
        sparkle(p.x + rand(-20, 20), p.y + rand(-14, 6), rand(10, 18), 800);
      }, delay + duration * 0.85);
    });

    // Un estallido de destellos saliendo de la pantalla
    for (let i = 0; i < 10; i++) {
      later(() => sparkle(cloud.x + rand(-140, 140), cloud.y + rand(-80, 80), rand(10, 22)), i * 50);
    }
  }

  function ambient() {
    const s = section.getBoundingClientRect();
    sparkle(rand(0, s.width), rand(0, s.height), rand(6, 14), rand(900, 1400));
  }

  // Destellos sueltos mientras la sección está a la vista
  new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          if (!ambientTimer) ambientTimer = setInterval(ambient, AMBIENT_EVERY);
        } else {
          clearInterval(ambientTimer);
          ambientTimer = 0;
        }
      });
    },
    { rootMargin: "0px 0px -30% 0px" }
  ).observe(section);

  // Arranca cuando el inicio de la sección sube por encima del ~60% de la pantalla.
  // Se mide la sección y no la laptop: la laptop va al 52% de su altura, así que con más
  // grupos de skills quedaba por debajo de la línea y las skills nunca aparecían.
  new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !played) storm();
      });
    },
    { rootMargin: "0px 0px -40% 0px" }
  ).observe(section);

  // Al salir por completo, se rearma para volver a jugar
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting && played) {
        played = false;
        timers.forEach(clearTimeout);
        timers = [];
        section.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        section.classList.add("storm-armed", "laptop-armed");
      }
    });
  }).observe(section);
})();
