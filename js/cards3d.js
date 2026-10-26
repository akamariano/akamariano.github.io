/* Tarjetas 3D estilo Apple (Servicios, Experiencia, Proyectos, Badges, Certificados,
   Educación, Contacto/redes y la descripción del hero):
   - Entrada ligada al scroll: llegan inclinadas desde el fondo (las de los lados abiertas
     en abanico) y se enderezan mientras bajas; al subir se revierte igual.
   - Con mouse: inclinación que sigue el puntero, capas internas en profundidad y un brillo
     que sigue el cursor. En celular lo mismo al tocar (se cancela si el toque es un scroll).
   - Íconos: al terminar de entrar la tarjeta, el ícono gira en 3D, rebota y su trazo se dibuja.
   Todo se anima desde el valor actual (suavizado por frame), así que se puede interrumpir
   y revertir en cualquier momento sin saltos. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Teléfonos de gama baja (poca memoria o pocos núcleos con pantalla táctil) o "ahorro de datos":
  // tarjetas estáticas, sin inclinación ni entrada por scroll, para no trabar el desplazamiento
  const lowEnd =
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 && window.matchMedia("(pointer: coarse)").matches) ||
    (navigator.connection && navigator.connection.saveData);
  if (lowEnd) return;

  const GRID_SELECTOR =
    ".services-grid, .projects-grid, .notes-list, .badges-grid, .certs-grid, .resume-summary, .contact-grid";
  const ICON_SELECTOR = ".contact-icon, .badge-image, .project-name svg";
  // Elementos sueltos (no en grid): entran al cargar la página en vez de con el scroll
  const SOLO_SELECTOR = ".hero-lede";
  const solos = Array.from(document.querySelectorAll(SOLO_SELECTOR));
  solos.forEach((el) => el.parentElement.classList.add("stage-3d"));
  const grids = [...document.querySelectorAll(GRID_SELECTOR), ...solos];
  if (!grids.length) return;

  const TOUCH_SCALE = 0.5; // con el dedo la inclinación y elevación son más suaves (pantalla angosta)
  const TAP_HOLD = 650; // ms que la tarjeta se queda inclinada después de soltar el toque
  const MAX_TILT = 9; // grados al inclinar con el mouse
  const ENTER_RX = 26; // inclinación inicial hacia atrás
  const ENTER_RY = 16; // apertura en abanico de las tarjetas laterales
  const STAGGER = 0.14; // retraso entre columnas de una misma fila (fracción del recorrido)
  const SMOOTH = 0.14; // suavizado por frame (~ resorte críticamente amortiguado)

  let cards = [];
  const visible = new Set();

  function setupCard(el, grid) {
    el.classList.add("card-3d");
    const icon = el.querySelector(ICON_SELECTOR);
    if (icon) {
      icon.classList.add("icon-3d");
      icon.addEventListener("animationend", (e) => {
        if (e.animationName === "icon-pop") icon.classList.add("is-settled");
      });
      // pathLength normalizado para dibujar el trazo de cualquier figura con un solo dasharray
      icon.querySelectorAll("path, rect, circle, ellipse, line, polyline").forEach((shape) => {
        if (shape.closest("[fill='currentColor']")) return; // íconos rellenos no tienen trazo
        shape.setAttribute("pathLength", "100");
        shape.style.strokeDasharray = "100";
      });
    }
    const c = {
      el,
      grid,
      icon,
      col: 0, // columna dentro de su fila (para el escalonado)
      side: 0, // -1 izquierda, 0 centro, 1 derecha
      rowOffset: 0, // distancia vertical desde la primera fila del grid
      enter: 0,
      tiltX: 0,
      tiltY: 0,
      lift: 0,
      popped: false,
      target: { tiltX: 0, tiltY: 0, lift: 0 },
      depth: 1, // 1 con mouse, TOUCH_SCALE con el dedo
    };
    bindPointer(c);
    return c;
  }

  function collect() {
    const old = new Map(cards.map((c) => [c.el, c]));
    cards = [];
    grids.forEach((grid) => {
      if (solos.includes(grid)) {
        cards.push(old.get(grid) || Object.assign(setupCard(grid, grid), { solo: true }));
        return;
      }
      grid.classList.add("stage-3d");
      Array.from(grid.children).forEach((el) => {
        if (!el.classList.contains("card")) return;
        cards.push(old.get(el) || setupCard(el, grid));
      });
    });
    measure();
  }

  // offsetLeft/offsetTop ignoran los transforms, así que no los afecta la inclinación actual
  function measure() {
    grids.forEach((grid) => {
      const items = cards.filter((c) => c.grid === grid && !c.solo);
      if (!items.length) return;
      const firstTop = Math.min(...items.map((c) => c.el.offsetTop));
      const lefts = [...new Set(items.map((c) => c.el.offsetLeft))].sort((a, b) => a - b);
      const multiCol = lefts.length > 1;
      items.forEach((c) => {
        c.rowOffset = c.el.offsetTop - firstTop;
        c.col = lefts.indexOf(c.el.offsetLeft);
        if (!multiCol) c.side = 0;
        else if (c.col === 0) c.side = -1;
        else if (c.col === lefts.length - 1) c.side = 1;
        else c.side = 0;
      });
      grid.dataset.cols = lefts.length;
    });
  }

  function bindPointer(c) {
    let releaseTimer = 0;

    function aim(e) {
      c.depth = e.pointerType === "mouse" ? 1 : TOUCH_SCALE;
      const rect = c.el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      c.target.tiltY = (x - 0.5) * 2 * MAX_TILT * c.depth;
      c.target.tiltX = -(y - 0.5) * 2 * MAX_TILT * c.depth;
      c.target.lift = 1;
      c.el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      c.el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      c.el.classList.add("is-hovered");
      wake();
    }

    function release() {
      clearTimeout(releaseTimer);
      c.target.tiltX = 0;
      c.target.tiltY = 0;
      c.target.lift = 0;
      c.el.classList.remove("is-hovered");
      wake();
    }

    // Mouse: sigue al puntero mientras está encima
    c.el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") aim(e);
    });
    c.el.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") release();
    });

    // Toque: responde al tocar (no al soltar) y se suelta solo un momento después
    c.el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(releaseTimer);
      aim(e);
    });
    c.el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(release, TAP_HOLD);
    });
    // Si el dedo empieza a hacer scroll, el navegador cancela el puntero: se suelta de inmediato
    c.el.addEventListener("pointercancel", release);
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Perfil tranquilo para tarjetas altas o apiladas (proyectos, y cualquier grid de una columna):
  // con la entrada completa (26° de inclinación, 90 px hacia abajo, 15 % de opacidad) una tarjeta
  // a medio entrar se montaba sobre la de abajo y, translúcida, el texto de ambas se mezclaba
  function isCalm(c) {
    return c.grid.classList.contains("projects-grid") || Number(c.grid.dataset.cols) === 1;
  }

  function enterTarget(c) {
    if (c.solo) return 1;
    const vh = window.innerHeight;
    const top = c.grid.getBoundingClientRect().top + c.rowOffset;
    // 0 cuando la fila asoma por abajo, 1 cuando su borde superior llega al ~40% de la pantalla
    // (en el perfil tranquilo termina antes, al ~70%, para no seguir moviéndose mientras se lee)
    const raw = (vh - top) / (vh * (isCalm(c) ? 0.3 : 0.6));
    const cols = Number(c.grid.dataset.cols) || 1;
    const span = 1 - STAGGER * (cols - 1);
    return easeOut(clamp01((raw - c.col * STAGGER) / span));
  }

  // El trazo se dibuja con Web Animations (más confiable que @keyframes en figuras SVG)
  function drawStrokes(icon) {
    icon.querySelectorAll("[pathLength]").forEach((shape, i) => {
      shape.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
        duration: 1100,
        delay: 150 + i * 90,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "both",
      });
    });
  }

  let running = false;

  function frame() {
    let moving = false;
    cards.forEach((c) => {
      if (!visible.has(c.grid) || c.grid.hidden) return;
      const goals = { enter: enterTarget(c), ...c.target };
      for (const k in goals) {
        const d = goals[k] - c[k];
        if (Math.abs(d) > 0.001) {
          c[k] += d * SMOOTH;
          moving = true;
        } else {
          c[k] = goals[k];
        }
      }
      const away = 1 - c.enter;
      const calm = isCalm(c);
      // Tranquilo: poca inclinación, sin desplazamiento hacia abajo (no invade a la vecina)
      const rx = away * (calm ? 8 : ENTER_RX) + c.tiltX;
      const ry = away * (calm ? 0 : ENTER_RY) * c.side + c.tiltY;
      const ty = away * (calm ? 0 : 90) - c.lift * 6 * c.depth;
      const tz = away * (calm ? -60 : -240) + c.lift * 24 * c.depth;
      const s = calm ? 0.96 + 0.04 * c.enter : 0.88 + 0.12 * c.enter;
      // En el perfil tranquilo cada tarjeta lleva su propia perspectiva, centrada en ella. Con la
      // perspectiva del grid (un solo punto de fuga para un grid de miles de px de alto), alejar
      // una tarjeta en Z también la arrastraba hacia ese punto y se montaba sobre su vecina.
      c.el.style.transform =
        `${calm ? "perspective(1400px) " : ""}translate3d(0, ${ty.toFixed(2)}px, ${tz.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      c.el.style.opacity = (calm ? 0.4 + 0.6 * c.enter : 0.15 + 0.85 * c.enter).toFixed(3);
      c.el.style.setProperty("--lift", c.lift.toFixed(3));

      // El ícono hace su animación al llegar la tarjeta; se rearma si la tarjeta vuelve a salir
      if (c.icon) {
        if (!c.popped && c.enter > 0.85) {
          c.popped = true;
          c.icon.classList.add("is-popped");
          drawStrokes(c.icon);
        } else if (c.popped && c.enter < 0.25) {
          c.popped = false;
          c.icon.classList.remove("is-popped", "is-settled");
          c.icon.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        }
      }
    });
    if (moving) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function wake() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  // Solo se anima mientras el grid está cerca de la pantalla
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) visible.add(en.target);
        else visible.delete(en.target);
      });
      wake();
    },
    { rootMargin: "20% 0px" }
  );
  grids.forEach((g) => io.observe(g));

  // Proyectos se generan después (y se regeneran al cambiar idioma)
  const mo = new MutationObserver(() => {
    collect();
    wake();
  });
  grids.forEach((g) => mo.observe(g, { childList: true, attributes: true, attributeFilter: ["hidden"] }));

  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    wake();
  });
  window.addEventListener("load", () => {
    measure();
    wake();
  });
  collect();
  wake();
})();
