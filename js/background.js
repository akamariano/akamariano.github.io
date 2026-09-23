(function () {
  "use strict";

  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const GLYPHS = "01{}<>/;=()[]#*λΣπ01010110".split("");
  const HUES = ["#0071e3", "#7b5cff", "#30d5c8"]; // azul, violeta, verde-agua
  const FLOW_DURATION = 10000; // el fondo fluye solo los primeros 10s al entrar a la página
  const pageLoadTime = performance.now();

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let columns = [];
  let fontSize = 16;
  let rafId = null;
  let sparks = [];
  let lastFrame = 0;
  let frozen = false;
  let lightWash = null; // gradiente que reemplaza el blanco plano en modo claro
  let lightWashSettled = null; // mismo gradiente opaco: el color final ya "asentado"

  function buildLightWash(opaque) {
    // Malla suave verde-ferxxo / celeste / morado en vez de un fondo blanco plano.
    // Nota: al repintarse cada frame, el color final "asentado" es el de estos stops
    // (el alpha solo controla qué tan rápido converge, no qué tan pálido queda) —
    // por eso los stops ya son tonos pastel, no el neón puro.
    const g = ctx.createRadialGradient(
      width * 0.18, height * 0.12, 0,
      width * 0.5, height * 0.55, Math.max(width, height) * 0.95
    );
    g.addColorStop(0, `rgba(228,250,176,${opaque ? 1 : 0.16})`); // verde ferxxo pastel
    g.addColorStop(0.35, `rgba(201,239,255,${opaque ? 1 : 0.15})`); // celeste pastel
    g.addColorStop(0.68, `rgba(227,217,255,${opaque ? 1 : 0.14})`); // morado pastel
    g.addColorStop(1, `rgba(242,245,239,${opaque ? 1 : 0.22})`); // base pálida (no blanco puro)
    return g;
  }

  function isDark() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lightWash = buildLightWash(false);
    lightWashSettled = buildLightWash(true);

    fontSize = width < 700 ? 19 : 25;
    const colCount = Math.floor(width / fontSize);
    columns = new Array(colCount).fill(0).map(() => ({
      y: Math.random() * -height,
      speed: 0.4 + Math.random() * 0.9,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      glyphChangeAt: 0,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    }));
  }

  function spawnSpark() {
    sparks.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0,
      maxR: 1.2 + Math.random() * 1.8,
      life: 0,
      maxLife: 60 + Math.random() * 60,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
    });
  }

  function drawFrame(timestamp) {
    if (timestamp - pageLoadTime >= FLOW_DURATION) {
      // Los primeros 10s fluye; después se congela tal cual quedó el último cuadro.
      frozen = true;
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(drawFrame);
    // Cap to ~30fps for a calmer effect and lower battery cost
    if (timestamp - lastFrame < 33) return;
    lastFrame = timestamp;

    const dark = isDark();
    ctx.fillStyle = dark ? "rgba(0,0,0,0.16)" : lightWash;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textBaseline = "top";

    columns.forEach((col) => {
      const x = columns.indexOf(col) * fontSize;
      if (timestamp > col.glyphChangeAt) {
        col.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        col.glyphChangeAt = timestamp + 120 + Math.random() * 300;
      }
      ctx.fillStyle = dark ? `${col.hue}55` : `${col.hue}33`;
      ctx.fillText(col.glyph, x, col.y);
      col.y += col.speed * fontSize * 0.35;
      if (col.y > height + fontSize) {
        col.y = -fontSize - Math.random() * height * 0.5;
        col.speed = 0.4 + Math.random() * 0.9;
        col.hue = HUES[Math.floor(Math.random() * HUES.length)];
      }
    });

    if (Math.random() < 0.05) spawnSpark();
    sparks.forEach((s) => {
      s.life += 1;
      const t = Math.min(s.life / s.maxLife, 1);
      const pulse = Math.max(Math.sin(Math.PI * t), 0);
      const alpha = pulse * (dark ? 0.85 : 0.55);
      ctx.beginPath();
      ctx.fillStyle = `${s.hue}`;
      ctx.globalAlpha = Math.max(alpha, 0);
      ctx.arc(s.x, s.y, Math.max(s.maxR * pulse, 0.01), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    sparks = sparks.filter((s) => s.life < s.maxLife);
  }

  function drawStaticFrame() {
    const dark = isDark();
    ctx.clearRect(0, 0, width, height);
    // Un solo pase del gradiente translúcido queda casi blanco; en estático se
    // pinta directo el color al que converge la animación.
    ctx.fillStyle = dark ? "#000000" : lightWashSettled;
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textBaseline = "top";
    columns.forEach((col, i) => {
      ctx.fillStyle = dark ? `${col.hue}30` : `${col.hue}22`;
      ctx.fillText(col.glyph, i * fontSize, (col.y % height + height) % height);
    });
  }

  function start() {
    cancelAnimationFrame(rafId);
    if (reduceMotionQuery.matches || frozen) {
      // Ya pasó la ventana de flujo (o el usuario prefiere menos movimiento):
      // solo repintamos un cuadro estático acorde al tema/tamaño actual.
      drawStaticFrame();
      return;
    }
    lastFrame = 0;
    rafId = requestAnimationFrame(drawFrame);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      start();
    }, 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      start();
    }
  });

  reduceMotionQuery.addEventListener?.("change", start);
  document.addEventListener("themechange", start);

  resize();
  start();
})();
