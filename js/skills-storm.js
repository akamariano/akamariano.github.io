/* Skills como "lluvia de ideas": al llegar a la sección, la laptop de fondo hace zoom hacia
   el frente todavía cerrada; ya cerca abre la tapa y se enciende la pantalla; de la pantalla salen volando
   todas las skills, girando, y se acomodan en su lugar (cada una suelta un destello al
   aterrizar), y la laptop se aleja y se desvanece hasta desaparecer. Mientras la sección
   está en pantalla brillan destellos sueltos.
   Si la sección sale por completo de la pantalla, la animación se rearma para la próxima vez. */
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
  const codeLines = Array.from(section.querySelectorAll(".code-line"));
  const SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";
  const ZOOM_MS = 1100; // zoom de la laptop (llega cerrada)
  const OPEN_AT = 950; // cuándo empieza a abrirse la tapa
  const OPEN_MS = 1000; // duración de la apertura
  const BURST_AT = OPEN_AT + 750; // las skills salen cuando la tapa ya casi está abierta

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
    // Zoom hacia el frente: llega desde lejos y se acerca más grande que en reposo
    laptopZoom.animate(
      [
        { transform: `translateZ(-400px) scale(${k * 0.4})`, opacity: 0 },
        { transform: `translateZ(0) scale(${k * 1.35})`, opacity: 1, offset: 0.7 },
        { transform: `translateZ(0) scale(${k * 1.3})`, opacity: 1 },
      ],
      { duration: ZOOM_MS, easing: SPRING, fill: "forwards" }
    );
    // La tapa llega cerrada (acostada sobre el teclado) y se abre cuando el zoom ya casi terminó,
    // pasándose un poquito y asentándose en su ángulo
    lid.animate(
      [
        { transform: "rotateX(-88deg)" },
        { transform: "rotateX(14deg)", offset: 0.75 },
        { transform: "rotateX(8deg)" },
      ],
      { duration: OPEN_MS, delay: OPEN_AT, easing: SPRING, fill: "backwards" }
    );
    // La pantalla se enciende mientras se abre
    screen.animate([{ filter: "brightness(0)" }, { filter: "brightness(1.6)", offset: 0.6 }, { filter: "brightness(1)" }], {
      duration: 700,
      delay: OPEN_AT + 250,
      easing: "ease-out",
      fill: "backwards",
    });
    // El código se "escribe" en la pantalla
    codeLines.forEach((line, i) => {
      line.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: 380,
        delay: OPEN_AT + 450 + i * 70,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      });
    });
    // Después de soltar las skills, se aleja hacia el fondo y se va opacando hasta desaparecer
    later(() => {
      laptopZoom.animate(
        [
          { transform: `translateZ(0) scale(${k * 1.3})`, opacity: 1 },
          { transform: `translateZ(-120px) scale(${k * 0.95})`, opacity: 0.35, offset: 0.5 },
          { transform: `translateZ(-200px) scale(${k * 0.85})`, opacity: 0 },
        ],
        { duration: 2200, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
      );
    }, BURST_AT + 1050);
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
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.2)`, opacity: 0 },
          {
            transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 50}px) rotate(${rot * -0.5}deg) scale(1.12)`,
            opacity: 1,
            offset: 0.45,
          },
          { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
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

  // Arranca cuando el centro de la laptop sube por encima del ~60% de la pantalla
  // (sin laptop, cuando la sección pasa del ~70% inferior)
  new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !played) storm();
      });
    },
    { rootMargin: laptopWrap ? "0px 0px -40% 0px" : "0px 0px -30% 0px" }
  ).observe(laptopWrap || section);

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
