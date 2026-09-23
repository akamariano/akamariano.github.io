(function () {
  "use strict";

  /* Estela de destellos pixelados que sigue al cursor. Solo en dispositivos con
     mouse y si el usuario no pidió menos movimiento. */
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const COLOR = "#3dd332";
  const PIXEL = 3; // tamaño base de cada destello (px CSS)
  const MAX_SPARKS = 90;
  const MIN_DIST = 6; // distancia mínima recorrida entre tandas de destellos

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  let sparks = [];
  let rafId = null;
  let lastX = null;
  let lastY = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      sparks.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.2 + Math.random() * 0.6, // caen un poco, como chispas
        size: PIXEL * (Math.random() < 0.3 ? 2 : 1),
        life: 0,
        maxLife: 24 + Math.random() * 20,
      });
    }
    if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLOR;
    sparks.forEach((s) => {
      s.life += 1;
      s.x += s.vx;
      s.y += s.vy;
      const t = s.life / s.maxLife;
      // Parpadeo ocasional para que se vea como destello y no como rastro liso
      ctx.globalAlpha = Math.max(1 - t, 0) * (Math.random() < 0.15 ? 0.4 : 1);
      // Posiciones redondeadas a la cuadrícula para mantener el look pixelado
      const px = Math.round(s.x / PIXEL) * PIXEL;
      const py = Math.round(s.y / PIXEL) * PIXEL;
      ctx.fillRect(px, py, s.size, s.size);
    });
    ctx.globalAlpha = 1;
    sparks = sparks.filter((s) => s.life < s.maxLife);
    rafId = sparks.length ? requestAnimationFrame(draw) : null;
  }

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => {
    if (lastX !== null && Math.hypot(e.clientX - lastX, e.clientY - lastY) < MIN_DIST) return;
    lastX = e.clientX;
    lastY = e.clientY;
    // Desplazado hacia el cuerpo del cursor para que la estela salga de atrás de la punta
    spawn(e.clientX + 6, e.clientY + 10);
    if (!rafId) rafId = requestAnimationFrame(draw);
  }, { passive: true });

  resize();
})();
