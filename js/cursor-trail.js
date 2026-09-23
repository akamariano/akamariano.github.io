(function () {
  "use strict";

  /* Estela de destellos pixelados que sigue al cursor. Solo en dispositivos con
     mouse y si el usuario no pidió menos movimiento. */
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const COLOR = "#3dd332";
  const PIXEL = 3; // tamaño base de cada destello (px CSS)
  const MAX_SPARKS = 160;
  const MIN_DIST = 6; // distancia mínima recorrida entre tandas de destellos
  const WAND_RADIUS = 110; // px desde el borde de un enlace de WhatsApp para activar la varita
  const WAND_COLORS = [COLOR, "#1f9e1a", "#b6ff5c", "#fff27a"];
  const BUBBLE_EVERY = 480; // ms entre globos "Yes!"
  const MAX_BUBBLES = 4;
  const waLinks = document.querySelectorAll('a[href*="wa.me"]');

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
  let trailX = null; // última posición donde se soltó una tanda de destellos
  let trailY = null;
  let wandMode = false;
  let lastBubble = 0;
  let bubbleCount = 0;

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
        color: COLOR,
        cross: false,
      });
    }
    trim();
  }

  // Destellos de la varita: salen de la estrella en todas direcciones, con varios
  // colores y algunos en forma de cruz (destello de 4 puntas pixelado).
  function spawnMagic(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.6;
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: PIXEL,
      life: 0,
      maxLife: 28 + Math.random() * 24,
      color: WAND_COLORS[Math.floor(Math.random() * WAND_COLORS.length)],
      cross: Math.random() < 0.35,
    });
    trim();
  }

  function trim() {
    if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
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
      ctx.fillStyle = s.color;
      ctx.fillRect(px, py, s.size, s.size);
      if (s.cross) {
        ctx.fillRect(px - s.size, py, s.size, s.size);
        ctx.fillRect(px + s.size, py, s.size, s.size);
        ctx.fillRect(px, py - s.size, s.size, s.size);
        ctx.fillRect(px, py + s.size, s.size, s.size);
      }
    });
    ctx.globalAlpha = 1;
    sparks = sparks.filter((s) => s.life < s.maxLife);
    if (wandMode) {
      // La varita sigue chispeando aunque el mouse esté quieto
      if (Math.random() < 0.5) spawnMagic(lastX, lastY);
      maybeBubble(performance.now());
    }
    rafId = sparks.length || wandMode ? requestAnimationFrame(draw) : null;
  }

  function isShown(el) {
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.pointerEvents !== "none" && parseFloat(style.opacity) > 0.5;
  }

  function nearWhatsApp(x, y) {
    for (const el of waLinks) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      if (Math.hypot(dx, dy) <= WAND_RADIUS && isShown(el)) return true;
    }
    return false;
  }

  function maybeBubble(now) {
    if (now - lastBubble < BUBBLE_EVERY || bubbleCount >= MAX_BUBBLES) return;
    lastBubble = now;
    const bubble = document.createElement("div");
    bubble.className = "yes-bubble";
    bubble.setAttribute("aria-hidden", "true");
    bubble.textContent = Math.random() < 0.3 ? "Yes! Yes!" : "Yes!";
    // Aparece arriba de la varita, un poco a un lado cada vez; se mantiene dentro de la pantalla
    const x = Math.min(Math.max(lastX - 20 + (Math.random() - 0.5) * 60, 8), width - 110);
    const y = Math.max(lastY - 44 - Math.random() * 24, 8);
    bubble.style.left = x + "px";
    bubble.style.top = y + "px";
    document.body.appendChild(bubble);
    bubbleCount += 1;
    bubble.addEventListener("animationend", (e) => {
      if (e.animationName !== "yes-rise") return;
      bubble.remove();
      bubbleCount -= 1;
    });
  }

  function setWandMode(on) {
    if (on === wandMode) return;
    wandMode = on;
    document.documentElement.classList.toggle("wand-mode", on);
    if (on && !rafId) rafId = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);

  function update(x, y) {
    setWandMode(nearWhatsApp(x, y));
  }

  document.addEventListener("mousemove", (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    update(lastX, lastY);
    if (trailX !== null && Math.hypot(lastX - trailX, lastY - trailY) < MIN_DIST) return;
    trailX = lastX;
    trailY = lastY;
    if (wandMode) {
      for (let i = 0; i < 3; i++) spawnMagic(lastX, lastY);
    } else {
      // Desplazado hacia el cuerpo del cursor para que la estela salga de atrás de la punta
      spawn(lastX + 6, lastY + 10);
    }
    if (!rafId) rafId = requestAnimationFrame(draw);
  }, { passive: true });

  // El botón flotante aparece/desaparece al hacer scroll aunque el mouse no se mueva
  window.addEventListener("scroll", () => {
    if (lastX !== null) update(lastX, lastY);
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => setWandMode(false));

  resize();
})();
