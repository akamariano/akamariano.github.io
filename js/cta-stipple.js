/* "¿Tienes un proyecto en mente?": degradado punteado interactivo.
   Una malla de puntos con un poco de desorden (punteado, no cuadrícula): el tamaño de cada
   punto dibuja el degradado (denso a la derecha, se disuelve hacia el texto). El cursor hincha
   y aparta los puntos; un clic o un toque lanza una onda con borde fucsia. La tarjeta se inclina
   un poco y el texto y los puntos se mueven a distinta profundidad.
   Solo anima mientras se ve; con "reducir movimiento" se dibuja una vez, quieta. */
(function () {
  "use strict";

  const card = document.querySelector(".cta-stipple");
  if (!card) return;
  const canvas = card.querySelector(".stipple-canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Verdes de la marca: verde agua → verde → lima. El fucsia solo vive en el borde de la onda.
  const STOPS = [
    [0.0, [62, 232, 207]],
    [0.7, [61, 211, 50]],
    [1.0, [203, 255, 61]],
  ];
  const FUCHSIA = [255, 43, 214];
  const BUCKETS = 10;

  let W = 0, H = 0, dpr = 1, dots = [], spacing = 12;
  let visible = false, raf = 0, last = 0;
  const pointer = { x: -9999, y: -9999, on: false, sx: -9999, sy: -9999 };
  const ripples = [];

  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function colorAt(v) {
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [p0, c0] = STOPS[i - 1], [p1, c1] = STOPS[i];
        const t = (v - p0) / (p1 - p0);
        return [mix(c0[0], c1[0], t), mix(c0[1], c1[1], t), mix(c0[2], c1[2], t)];
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  // Pseudoaleatorio con semilla: el punteado sale igual en cada visita
  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function build() {
    const r = card.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    spacing = W < 560 ? 10 : 12;
    const rand = rng(20260510);
    const narrow = W < 760;
    dots = [];
    for (let y = spacing / 2; y < H; y += spacing) {
      for (let x = spacing / 2; x < W; x += spacing) {
        const jx = x + (rand() - 0.5) * spacing * 0.7;
        const jy = y + (rand() - 0.5) * spacing * 0.7;
        const u = jx / W, w = jy / H;
        // Campo del degradado: diagonal hacia abajo a la derecha + un núcleo brillante
        let v = narrow ? Math.pow(Math.max(0, (w - 0.42) / 0.58), 1.5) * (0.6 + 0.4 * u) : Math.pow(u, 1.9) * (0.5 + 0.4 * w);
        const cx = narrow ? 0.85 : 0.82, cy = narrow ? 0.95 : 0.62;
        const d = Math.hypot(u - cx, (w - cy) * (H / W));
        v = Math.min(1, v + Math.max(0, 0.36 - d) * 0.9);
        dots.push({ x: jx, y: jy, v, n: rand() });
      }
    }
  }

  function frame(t) {
    raf = 0;
    const dt = Math.min(48, t - (last || t));
    last = t;
    if (fine || pointer.on) {
      pointer.sx += (pointer.x - pointer.sx) * 0.18;
      pointer.sy += (pointer.y - pointer.sy) * 0.18;
    }
    for (const rp of ripples) rp.r += dt * 0.55;
    while (ripples.length && ripples[0].r > Math.hypot(W, H)) ripples.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const maxR = spacing * 0.4;
    const R = W < 560 ? 90 : 130;
    const paths = Array.from({ length: BUCKETS + 1 }, () => new Path2D());
    const hot = new Path2D();
    const wave = reduce ? 0 : t * 0.0005;

    for (const d of dots) {
      // el degradado "respira" despacio
      let v = d.v + (reduce ? 0 : 0.07 * Math.sin(wave + d.x * 0.012 + d.y * 0.009));
      let x = d.x, y = d.y, onRing = false;
      const dx = d.x - pointer.sx, dy = d.y - pointer.sy;
      const dist = Math.hypot(dx, dy);
      if (dist < R) {
        const k = 1 - dist / R;
        v += 0.55 * k * k;
        const push = 9 * k * k;
        x += (dx / (dist || 1)) * push;
        y += (dy / (dist || 1)) * push;
      }
      for (const rp of ripples) {
        const gap = Math.abs(Math.hypot(d.x - rp.x, d.y - rp.y) - rp.r);
        if (gap < 34) {
          const k = 1 - gap / 34;
          const fade = Math.max(0, 1 - rp.r / (Math.hypot(W, H) * 0.9));
          v += 0.6 * k * fade;
          if (k > 0.55 && fade > 0.25) onRing = true;
        }
      }
      v = Math.max(0, Math.min(1.25, v));
      const r = maxR * Math.pow(Math.min(1, v), 1.35) * (0.82 + d.n * 0.3);
      if (r < 0.45) continue;
      const p = onRing ? hot : paths[Math.min(BUCKETS, Math.round(Math.min(1, v) * BUCKETS))];
      p.moveTo(x + r, y);
      p.arc(x, y, r, 0, Math.PI * 2);
    }
    for (let i = 0; i <= BUCKETS; i++) {
      const c = colorAt(i / BUCKETS);
      ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.3 + 0.55 * (i / BUCKETS)})`;
      ctx.fill(paths[i]);
    }
    ctx.fillStyle = `rgb(${FUCHSIA.join(",")})`;
    ctx.fill(hot);

    if (!reduce && visible) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function local(e) {
    const r = card.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top, r];
  }

  card.addEventListener("pointermove", (e) => {
    const [x, y, r] = local(e);
    pointer.x = x;
    pointer.y = y;
    if (pointer.sx < -999) { pointer.sx = x; pointer.sy = y; }
    // inclinación y capas: -1..1 desde el centro de la tarjeta
    if (fine && !reduce) {
      card.style.setProperty("--tx", ((x / r.width) * 2 - 1).toFixed(3));
      card.style.setProperty("--ty", ((y / r.height) * 2 - 1).toFixed(3));
      card.classList.add("is-tilting");
    }
    kick();
  });
  card.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -9999;
    pointer.sx = pointer.sy = -9999;
    card.style.setProperty("--tx", "0");
    card.style.setProperty("--ty", "0");
    card.classList.remove("is-tilting");
    kick();
  });
  card.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    const [x, y] = local(e);
    if (!reduce) {
      ripples.push({ x, y, r: 0 });
      if (ripples.length > 4) ripples.shift();
    }
    if (e.pointerType !== "mouse") { pointer.on = true; pointer.x = pointer.sx = x; pointer.y = pointer.sy = y; setTimeout(() => { pointer.on = false; pointer.x = pointer.sx = -9999; pointer.y = pointer.sy = -9999; }, 900); }
    kick();
  });

  // Una onda de bienvenida la primera vez que aparece
  let greeted = false;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !greeted && !reduce) {
      greeted = true;
      ripples.push({ x: W * 0.8, y: H * 0.6, r: 0 });
    }
    if (visible) kick();
  }, { threshold: 0.15 });

  let rz = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => { build(); kick(); }, 150);
  });

  build();
  io.observe(card);
  card.classList.add("stipple-ready");
  kick();
})();
