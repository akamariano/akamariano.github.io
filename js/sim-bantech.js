/* Topología interactiva de BanTech GT (caso de estudio). Versión simplificada de la red real:
   núcleo OSPF en triángulo, Occidente por EIGRP detrás de R-WAN, Norte en OSPF, Oriente en RIPv2
   con gateway redundante HSRP (MS1 prioridad 105 con seguimiento del uplink y decremento de 10,
   MS2 prioridad 100) y la Sede Central / Data Center con rutas estáticas.
   Cada enlace se corta con clic o con Enter/Espacio; la ruta del ping hacia BD1 se recalcula. */
(function () {
  const root = document.getElementById("bantech-sim");
  if (!root) return;

  const svg = root.querySelector("svg");
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lang = () => (window.currentLang === "en" ? "en" : "es");

  const T = {
    es: {
      cut: "Cortar enlace",
      restore: "Restablecer enlace",
      ok: (n) => `Ping exitoso · ${n} saltos`,
      fail: "Sin ruta: BD1 no es alcanzable",
      hsrp: (a, pa, b, pb) => `${a} activo (${pa}) · ${b} en espera (${pb})`,
      hsrpOne: (a, pa) => `${a} activo (${pa}) · el otro no responde`,
      hsrpNone: "Ningún gateway responde",
      noHsrp: "No aplica: la sede no usa HSRP",
      links: (n) => (n ? `${n} enlace${n > 1 ? "s" : ""} cortado${n > 1 ? "s" : ""}` : "Todos los enlaces arriba"),
    },
    en: {
      cut: "Cut link",
      restore: "Restore link",
      ok: (n) => `Ping succeeded · ${n} hops`,
      fail: "No route: BD1 is unreachable",
      hsrp: (a, pa, b, pb) => `${a} active (${pa}) · ${b} standby (${pb})`,
      hsrpOne: (a, pa) => `${a} active (${pa}) · the other one is not responding`,
      hsrpNone: "No gateway is responding",
      noHsrp: "Not applicable: this site does not use HSRP",
      links: (n) => (n ? `${n} link${n > 1 ? "s" : ""} down` : "All links up"),
    },
  };

  // Zonas de enrutamiento (colores como en la topología de Packet Tracer, sin violeta)
  const DOMAINS = [
    { x: 14, y: 70, w: 236, h: 300, fill: "rgba(255, 159, 10, 0.10)", stroke: "rgba(255, 159, 10, 0.55)", es: "Occidente · EIGRP 10", en: "West · EIGRP 10" },
    { x: 408, y: 14, w: 300, h: 112, fill: "rgba(0, 113, 227, 0.07)", stroke: "rgba(0, 113, 227, 0.45)", es: "Norte · OSPF", en: "North · OSPF" },
    { x: 270, y: 150, w: 470, h: 268, fill: "rgba(0, 113, 227, 0.10)", stroke: "rgba(0, 113, 227, 0.6)", es: "Backbone · OSPF área 0", en: "Backbone · OSPF area 0" },
    { x: 760, y: 150, w: 226, h: 452, fill: "rgba(61, 211, 50, 0.10)", stroke: "rgba(61, 211, 50, 0.6)", es: "Oriente · RIPv2 + HSRP", en: "East · RIPv2 + HSRP" },
    { x: 270, y: 440, w: 470, h: 180, fill: "rgba(255, 43, 214, 0.08)", stroke: "rgba(255, 43, 214, 0.5)", es: "Sede Central y Data Center · estáticas", en: "HQ & Data Center · static" },
  ];

  const NODES = {
    "PC-OCC": { x: 80, y: 320, type: "pc", host: true },
    "R-OCC": { x: 132, y: 168, type: "router" },
    "R-WAN": { x: 340, y: 210, type: "router" },
    "PC-NORTE": { x: 640, y: 72, type: "pc", host: true },
    "R-NORTE": { x: 486, y: 72, type: "router" },
    "CORE-2": { x: 510, y: 214, type: "l3" },
    "CORE-1": { x: 420, y: 360, type: "l3" },
    "CORE-3": { x: 650, y: 360, type: "l3" },
    MS1: { x: 812, y: 300, type: "l3" },
    MS2: { x: 936, y: 300, type: "l3" },
    "SW-ACC": { x: 874, y: 440, type: "switch" },
    "PC-BOV": { x: 874, y: 548, type: "pc", host: true },
    "R-CENTRAL1": { x: 360, y: 492, type: "router" },
    "R-CENTRAL2": { x: 360, y: 580, type: "router" },
    "MS-DC": { x: 520, y: 580, type: "l3" },
    BD1: { x: 664, y: 552, type: "server", host: true },
  };

  // [a, b, tipo] — tipo solo cambia el trazo
  const LINKS = [
    ["PC-OCC", "R-OCC", "access"],
    ["R-OCC", "R-WAN", "serial"],
    ["R-WAN", "CORE-2", "fiber"],
    ["PC-NORTE", "R-NORTE", "access"],
    ["R-NORTE", "CORE-2", "fiber"],
    ["CORE-1", "CORE-2", "etherchannel"],
    ["CORE-2", "CORE-3", "etherchannel"],
    ["CORE-1", "CORE-3", "etherchannel"],
    ["CORE-3", "MS1", "fiber"],
    ["CORE-3", "MS2", "fiber"],
    ["MS1", "SW-ACC", "etherchannel"],
    ["MS2", "SW-ACC", "etherchannel"],
    ["SW-ACC", "PC-BOV", "access"],
    ["CORE-1", "R-CENTRAL1", "fiber"],
    ["R-CENTRAL1", "R-CENTRAL2", "fiber"],
    ["R-CENTRAL2", "MS-DC", "fiber"],
    ["MS-DC", "BD1", "access"],
  ].map(([a, b, kind]) => ({ a, b, kind, id: `${a}|${b}`, down: false }));

  const SOURCES = { occ: "PC-OCC", norte: "PC-NORTE", oriente: "PC-BOV" };
  let source = "oriente";
  let linkEls = new Map();
  let packetTimer = 0;
  let packet = null;
  let currentPath = [];

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  const isUp = (a, b) => LINKS.some((l) => !l.down && ((l.a === a && l.b === b) || (l.a === b && l.b === a)));
  const neighbors = (n) => LINKS.filter((l) => !l.down && (l.a === n || l.b === n)).map((l) => (l.a === n ? l.b : l.a));

  // Camino más corto (en saltos) sin usar equipos finales ni el acceso de Oriente como tránsito
  function shortest(from, to, banned) {
    const prev = { [from]: null };
    const queue = [from];
    while (queue.length) {
      const n = queue.shift();
      if (n === to) break;
      for (const m of neighbors(n)) {
        if (m in prev) continue;
        if (m !== to && (NODES[m].host || banned.has(m))) continue;
        prev[m] = n;
        queue.push(m);
      }
    }
    if (!(to in prev)) return null;
    const path = [];
    for (let n = to; n; n = prev[n]) path.unshift(n);
    return path;
  }

  // HSRP de Oriente: gana la mayor prioridad entre los que siguen conectados al acceso
  function hsrp() {
    const cands = [];
    if (isUp("MS1", "SW-ACC")) cands.push({ name: "MS1", prio: isUp("CORE-3", "MS1") ? 105 : 95 });
    if (isUp("MS2", "SW-ACC")) cands.push({ name: "MS2", prio: 100 });
    cands.sort((x, y) => y.prio - x.prio);
    return cands;
  }

  function route() {
    const src = SOURCES[source];
    if (source !== "oriente") {
      return { path: shortest(src, "BD1", new Set(["SW-ACC"])), gw: null };
    }
    if (!isUp("SW-ACC", "PC-BOV")) return { path: null, gw: hsrp() };
    const gws = hsrp();
    if (!gws.length) return { path: null, gw: gws };
    const active = gws[0].name;
    const rest = shortest(active, "BD1", new Set(["SW-ACC"]));
    return { path: rest ? ["PC-BOV", "SW-ACC", ...rest] : null, gw: gws };
  }

  function icon(type, x, y, g) {
    const common = { fill: "var(--surface-solid)", stroke: "var(--text)", "stroke-width": 2 };
    if (type === "router") {
      el("circle", { cx: x, cy: y, r: 18, ...common }, g);
      el("path", { d: `M${x - 9} ${y}h18M${x} ${y - 9}v18M${x + 5} ${y - 4}l4 4-4 4M${x - 5} ${y - 4}l-4 4 4 4`, fill: "none", stroke: "var(--text)", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    } else if (type === "l3" || type === "switch") {
      el("rect", { x: x - 22, y: y - 14, width: 44, height: 28, rx: 6, ...common }, g);
      el("path", { d: `M${x - 12} ${y - 4}h20l-4 -4M${x + 12} ${y + 4}h-20l4 4`, fill: "none", stroke: "var(--text)", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      if (type === "l3") el("circle", { cx: x + 16, cy: y - 9, r: 3.5, fill: "var(--accent-3)" }, g);
    } else if (type === "pc") {
      el("rect", { x: x - 16, y: y - 14, width: 32, height: 21, rx: 3, ...common }, g);
      el("path", { d: `M${x - 7} ${y + 13}h14M${x} ${y + 7}v6`, stroke: "var(--text)", "stroke-width": 2, "stroke-linecap": "round" }, g);
    } else {
      el("rect", { x: x - 14, y: y - 18, width: 28, height: 36, rx: 4, ...common }, g);
      el("path", { d: `M${x - 8} ${y - 8}h16M${x - 8} ${y}h16M${x - 8} ${y + 8}h16`, stroke: "var(--text)", "stroke-width": 1.6, "stroke-linecap": "round" }, g);
    }
  }

  function build() {
    svg.setAttribute("viewBox", "0 0 1000 630");
    svg.innerHTML = "";
    const L = lang();
    DOMAINS.forEach((d) => {
      el("rect", { x: d.x, y: d.y, width: d.w, height: d.h, rx: 16, fill: d.fill, stroke: d.stroke, "stroke-width": 1.2, "stroke-dasharray": "5 5" }, svg);
    });

    linkEls = new Map();
    LINKS.forEach((l) => {
      const A = NODES[l.a];
      const B = NODES[l.b];
      const g = el("g", { class: "topo-link", tabindex: 0, role: "button" }, svg);
      const d = `M${A.x} ${A.y} L${B.x} ${B.y}`;
      el("path", { d, class: "hit" }, g);
      const wire = el("path", {
        d,
        class: "wire",
        stroke: l.kind === "serial" ? "#ff9f0a" : l.kind === "etherchannel" ? "var(--accent-3)" : "var(--text-secondary)",
        "stroke-dasharray": l.kind === "serial" ? "10 5" : "",
      }, g);
      if (l.kind === "etherchannel") wire.setAttribute("stroke-width", 4.5);
      g.addEventListener("click", () => toggle(l));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(l);
        }
      });
      linkEls.set(l.id, g);
    });

    Object.entries(NODES).forEach(([name, n]) => {
      const g = el("g", {}, svg);
      icon(n.type, n.x, n.y, g);
      // Halo del color de fondo para que los cables no tapen la etiqueta
      const label = el("text", { x: n.x, y: n.y + 34, "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: "var(--text)", stroke: "var(--surface-solid)", "stroke-width": 4, "stroke-linejoin": "round", "paint-order": "stroke" }, g);
      label.textContent = name;
    });

    // Las etiquetas de zona se redibujan encima de los cables
    DOMAINS.forEach((d) => {
      const t = el("text", { x: d.x + 12, y: d.y + 20, "font-size": 12.5, "font-weight": 700, fill: "var(--text-secondary)", stroke: "var(--surface-solid)", "stroke-width": 4, "stroke-linejoin": "round", "paint-order": "stroke" }, svg);
      t.textContent = d[L];
    });

    packet = el("circle", { r: 7, fill: "var(--fuchsia)", stroke: "#fff", "stroke-width": 2, opacity: 0 }, svg);
    refresh();
  }

  function toggle(l) {
    l.down = !l.down;
    refresh();
  }

  function refresh() {
    const t = T[lang()];
    LINKS.forEach((l) => {
      const g = linkEls.get(l.id);
      g.classList.toggle("is-down", l.down);
      g.setAttribute("aria-pressed", String(l.down));
      g.setAttribute("aria-label", `${l.down ? t.restore : t.cut}: ${l.a} — ${l.b}`);
    });
    const { path, gw } = route();
    currentPath = path || [];
    const onPath = new Set();
    for (let i = 0; path && i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const l = LINKS.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      onPath.add(l.id);
    }
    LINKS.forEach((l) => {
      const g = linkEls.get(l.id);
      const isPath = onPath.has(l.id);
      g.classList.toggle("is-path", isPath);
      const wire = g.querySelector(".wire");
      if (!l.down) wire.style.stroke = isPath ? "var(--fuchsia)" : "";
    });

    const res = root.querySelector("[data-out=result]");
    res.textContent = path ? t.ok(path.length - 1) : t.fail;
    res.parentElement.classList.toggle("is-good", !!path);
    res.parentElement.classList.toggle("is-bad", !path);
    let gwText = t.noHsrp;
    if (source === "oriente") {
      if (!gw.length) gwText = t.hsrpNone;
      else if (gw.length === 1) gwText = t.hsrpOne(gw[0].name, gw[0].prio);
      else gwText = t.hsrp(gw[0].name, gw[0].prio, gw[1].name, gw[1].prio);
    }
    root.querySelector("[data-out=gw]").textContent = gwText;
    root.querySelector("[data-out=links]").textContent = t.links(LINKS.filter((l) => l.down).length);
    root.querySelector("[data-out=path]").textContent = path ? path.join(" → ") : "—";
    startPacket();
  }

  // Un paquete recorre el camino una y otra vez
  function startPacket() {
    cancelAnimationFrame(packetTimer);
    if (!packet) return;
    if (!currentPath.length || reduceMotion) {
      packet.setAttribute("opacity", 0);
      return;
    }
    const pts = currentPath.map((n) => NODES[n]);
    const HOP_MS = 260;
    const total = HOP_MS * (pts.length - 1);
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      const t = ((now - start) % (total + 500)) / total;
      if (t >= 1) {
        packet.setAttribute("opacity", 0);
      } else {
        const seg = Math.floor(t * (pts.length - 1));
        const local = t * (pts.length - 1) - seg;
        packet.setAttribute("opacity", 1);
        packet.setAttribute("cx", pts[seg].x + (pts[seg + 1].x - pts[seg].x) * local);
        packet.setAttribute("cy", pts[seg].y + (pts[seg + 1].y - pts[seg].y) * local);
      }
      packetTimer = requestAnimationFrame(step);
    };
    packetTimer = requestAnimationFrame(step);
  }

  root.querySelectorAll("[data-source]").forEach((btn) =>
    btn.addEventListener("click", () => {
      source = btn.dataset.source;
      root.querySelectorAll("[data-source]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      refresh();
    })
  );

  root.querySelector("[data-action=uplink]").addEventListener("click", () => {
    const l = LINKS.find((x) => x.id === "CORE-3|MS1");
    l.down = true;
    source = "oriente";
    root.querySelectorAll("[data-source]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.source === "oriente")));
    refresh();
  });

  root.querySelector("[data-action=reset]").addEventListener("click", () => {
    LINKS.forEach((l) => (l.down = false));
    refresh();
  });

  document.addEventListener("langchange", build);
  build();
})();
