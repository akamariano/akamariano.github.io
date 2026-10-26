/* Simulador del flujo de M.U.M.N.K8s (caso de estudio). No es tráfico real: es un modelo
   calibrado con las pruebas de carga del proyecto (README de Proyecto3, secciones 11 y 14):
   - req/s ≈ usuarios × 2.15 (600 usuarios → ~1 290 req/s medidos)
   - HPA de rust-api: objetivo 30 % de CPU sobre 100m, 1 a 3 réplicas; 1 réplica a ~464 req/s marcó 138 %
   - memoria por pod de rust-api ≈ 40 MiB + 0.27 MiB por req/s (pico medido: 381 MiB a ~1 250 req/s),
     porque el balanceador abre miles de conexiones keep-alive por pod
   Con el límite de 256 MiB los pods terminan en OOMKilled a alta carga, como en la primera prueba. */
(function () {
  const root = document.getElementById("k8s-sim");
  if (!root) return;

  const svg = root.querySelector("svg");
  const range = root.querySelector("#sim-users");
  const memButtons = Array.from(root.querySelectorAll("[data-mem]"));
  const out = {
    users: root.querySelector("[data-out=users]"),
    rps: root.querySelector("[data-out=rps]"),
    pods: root.querySelector("[data-out=pods]"),
    cpu: root.querySelector("[data-out=cpu]"),
    mem: root.querySelector("[data-out=mem]"),
    state: root.querySelector("[data-out=state]"),
  };
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const T = {
    es: {
      stable: "Estable",
      scaling: "Escalando",
      maxed: "HPA al máximo (3 réplicas)",
      oom: "OOMKilled: los pods de rust-api se reinician",
      oomNote: "En la prueba real: 31 % de respuestas 503 a 1 254 req/s",
      ok: "0 fallos",
      pods: (n) => `${n} de 3`,
      queue: "cola",
    },
    en: {
      stable: "Stable",
      scaling: "Scaling",
      maxed: "HPA at its maximum (3 replicas)",
      oom: "OOMKilled: rust-api pods are restarting",
      oomNote: "In the real test: 31% of responses were 503 at 1,254 req/s",
      ok: "0 failures",
      pods: (n) => `${n} of 3`,
      queue: "queue",
    },
  };
  const lang = () => (window.currentLang === "en" ? "en" : "es");

  // Nodos del flujo, en el orden en que pasa cada reporte
  const NODES = [
    { id: "locust", label: "Locust" },
    { id: "gw", label: "Gateway API" },
    { id: "rust", label: "rust-api", pods: true },
    { id: "goapi", label: "go-api" },
    { id: "grpc", label: "gRPC" },
    { id: "writer", label: "go-writer" },
    { id: "rabbit", label: "RabbitMQ", queue: true },
    { id: "consumer", label: "consumer" },
    { id: "valkey", label: "Valkey" },
    { id: "grafana", label: "Grafana" },
  ];

  let state = { users: 200, limit: 512, replicas: 1, cpu: 0, mem: 0, oom: false, rps: 0 };
  let layout = null;
  let dots = [];
  let lastSpawn = 0;
  let raf = 0;
  let visible = true;
  let podEls = [];
  let queueBar = null;
  let rustBox = null;

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  // Horizontal en pantallas anchas; en celular, dos filas en zigzag
  function computeLayout() {
    const wide = root.clientWidth >= 720;
    const W = 1000;
    const H = wide ? 170 : 560;
    const pts = [];
    if (wide) {
      const step = W / NODES.length;
      NODES.forEach((n, i) => pts.push({ x: step * i + step / 2, y: 85 }));
    } else {
      const perRow = 5;
      const step = W / perRow;
      NODES.forEach((n, i) => {
        const row = Math.floor(i / perRow);
        const col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow);
        pts.push({ x: step * col + step / 2, y: row === 0 ? 150 : 410 });
      });
    }
    return { W, H, pts, wide };
  }

  function build() {
    layout = computeLayout();
    svg.setAttribute("viewBox", `0 0 ${layout.W} ${layout.H}`);
    svg.innerHTML = "";
    const { pts, wide } = layout;
    const boxW = wide ? 86 : 150;
    const boxH = wide ? 54 : 74;
    const font = wide ? 13 : 24;

    // Cables entre nodos
    for (let i = 0; i < pts.length - 1; i++) {
      el("line", { x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y, stroke: "var(--border)", "stroke-width": wide ? 2 : 3 }, svg);
    }
    const dotLayer = el("g", { class: "sim-dots" }, svg);
    dotLayer.id = "sim-dots";

    NODES.forEach((n, i) => {
      const p = pts[i];
      const g = el("g", {}, svg);
      const box = el("rect", {
        x: p.x - boxW / 2,
        y: p.y - boxH / 2,
        width: boxW,
        height: boxH,
        rx: 12,
        fill: "var(--surface-solid)",
        stroke: n.pods ? "var(--accent-3)" : "var(--border)",
        "stroke-width": n.pods ? 2 : 1.5,
      }, g);
      if (n.pods) rustBox = box;
      const t = el("text", { x: p.x, y: p.y + (n.pods || n.queue ? -4 : 5), "text-anchor": "middle", "font-size": font, "font-weight": 700, fill: "var(--text)" }, g);
      t.textContent = n.label;
      if (n.pods) {
        // Tres réplicas posibles: cada una es un punto que se enciende
        podEls = [0, 1, 2].map((k) =>
          el("circle", { cx: p.x - (wide ? 16 : 28) + k * (wide ? 16 : 28), cy: p.y + (wide ? 14 : 22), r: wide ? 5 : 9, fill: "var(--chip-bg)", stroke: "var(--accent-3)", "stroke-width": 1.5 }, g)
        );
      }
      if (n.queue) {
        el("rect", { x: p.x - boxW / 2 + 12, y: p.y + (wide ? 9 : 14), width: boxW - 24, height: wide ? 7 : 12, rx: 3, fill: "var(--chip-bg)" }, g);
        queueBar = el("rect", { x: p.x - boxW / 2 + 12, y: p.y + (wide ? 9 : 14), width: 0, height: wide ? 7 : 12, rx: 3, fill: "#ff9f0a" }, g);
      }
    });
    dots = [];
    update();
  }

  function compute() {
    const s = state;
    s.rps = Math.round(s.users * 2.15);
    // HPA: réplicas deseadas = ceil(uso total / objetivo), recortado a 1..3
    const totalCpu = s.rps * 0.297; // % de un pod con 100m de request
    s.replicas = Math.min(3, Math.max(1, Math.ceil(totalCpu / 30)));
    s.cpu = Math.round(totalCpu / s.replicas);
    s.mem = Math.round(40 + s.rps * 0.27);
    s.oom = s.mem > s.limit;
  }

  function update() {
    compute();
    const s = state;
    const t = T[lang()];
    out.users.textContent = s.users;
    out.rps.textContent = s.oom ? "~" + s.rps : s.rps;
    out.pods.textContent = t.pods(s.replicas);
    out.cpu.textContent = s.cpu + " % / 30 %";
    out.mem.textContent = `${s.mem} MiB / ${s.limit} MiB`;
    const stateBox = out.state.parentElement;
    stateBox.classList.toggle("is-bad", s.oom);
    stateBox.classList.toggle("is-good", !s.oom);
    const calm = s.cpu > 30 ? (s.replicas < 3 ? t.scaling : t.maxed) : t.stable;
    out.state.textContent = s.oom ? t.oom : `${calm} · ${t.ok}`;
    const note = root.querySelector("[data-out=note]");
    note.textContent = s.oom ? t.oomNote : "";
    podEls.forEach((c, i) => {
      const on = i < s.replicas;
      c.setAttribute("fill", on ? (s.oom ? "#ff5f57" : "var(--accent-3)") : "var(--chip-bg)");
    });
    if (rustBox) rustBox.setAttribute("stroke", s.oom ? "#ff5f57" : "var(--accent-3)");
    if (queueBar) {
      const max = layout.wide ? 62 : 126;
      queueBar.setAttribute("width", Math.min(max, (s.rps / 1300) * max * 0.55));
    }
  }

  // Puntos que recorren el flujo: más usuarios, más puntos (con tope visual)
  function spawn(now) {
    const perSec = Math.min(26, state.rps / 45);
    if (perSec <= 0) return;
    if (now - lastSpawn < 1000 / perSec) return;
    lastSpawn = now;
    const c = el("circle", { r: layout.wide ? 4 : 7, fill: "var(--fuchsia)" }, svg.querySelector("#sim-dots"));
    dots.push({ c, t: 0, speed: 0.00042 * (layout.wide ? 1 : 0.8) });
  }

  function position(t) {
    const pts = layout.pts;
    const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const local = t * (pts.length - 1) - seg;
    return { x: pts[seg].x + (pts[seg + 1].x - pts[seg].x) * local, y: pts[seg].y + (pts[seg + 1].y - pts[seg].y) * local };
  }

  let prev = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = prev ? Math.min(64, now - prev) : 16;
    prev = now;
    spawn(now);
    const rustT = 2 / (NODES.length - 1);
    dots = dots.filter((d) => {
      d.t += d.speed * dt;
      // Con OOMKill, buena parte de los reportes se cae en rust-api (el balanceador responde 503)
      if (state.oom && !d.checked && d.t >= rustT) {
        d.checked = true;
        if (Math.random() < 0.35) {
          d.c.setAttribute("fill", "#ff5f57");
          d.dropped = true;
        }
      }
      if (d.dropped && d.t > rustT + 0.03) {
        d.c.remove();
        return false;
      }
      if (d.t >= 1) {
        d.c.remove();
        return false;
      }
      const p = position(d.t);
      d.c.setAttribute("cx", p.x);
      d.c.setAttribute("cy", p.y);
      return true;
    });
  }

  range.addEventListener("input", () => {
    state.users = Number(range.value);
    update();
  });

  memButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      state.limit = Number(btn.dataset.mem);
      memButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      update();
    })
  );

  document.addEventListener("langchange", update);

  let resizeTimer = 0;
  let lastWide = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wide = root.clientWidth >= 720;
      if (wide !== lastWide) {
        lastWide = wide;
        build();
      }
    }, 150);
  });

  // Solo anima mientras el diagrama está a la vista
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => entries.forEach((e) => (visible = e.isIntersecting))).observe(root);
  }

  state.users = Number(range.value);
  lastWide = root.clientWidth >= 720;
  build();
  if (!reduceMotion) raf = requestAnimationFrame(frame);
})();
