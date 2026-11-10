/* Workforce Hours Analytics: dashboard.
   Plain JS + hand-drawn SVG. Reads data.json produced by pipeline/run.py. */
(function () {
  "use strict";

  // ------------------------------------------------------------------ i18n
  const T = {
    en: {
      skip: "Skip to content", back: "← Portfolio", code: "Code", theme: "Toggle theme", filters: "Filters",
      kicker: "Case study · Cloud data analyst",
      title: "Workforce hours, cut at the right midnight",
      lede: "A contact center needs the exact hours each agent worked on each day, in whichever timezone the viewer picks. Evening shifts cross midnight, five sites sit in five zones, and the raw export has duplicates and broken rows. This dashboard runs on the output of a BigQuery-style pipeline, rebuilt locally with DuckDB.",
      synthetic: "I first built this in BigQuery and Looker Studio on a company's real data. That data is confidential, so this public version runs the same SQL on synthetic data: invented people, sites and timestamps with the same shape and the same data problems.",
      tz: "Midnight in", site: "Site", grain: "Grain", allSites: "All sites",
      day: "Day", week: "Week", month: "Month", local: "Agent local",
      k_total: "Total hours", k_total_d: "Same in every timezone",
      k_apd: "Hours per agent-day", k_apd_d: "Moves with the timezone",
      k_prod: "Productivity", k_prod_d: "Productive / total hours",
      k_util: "Utilization", k_util_d: "Productive / (total − meal − time off)",
      k_bill: "Billable", k_bill_d: "Billable / total hours",
      k_pnb: "Paid not billable", k_pnb_d: "(Paid − billable) / total",
      k_shr: "Shrinkage", k_shr_d: "(Break + meal) / total",
      k_unc: "Unclassified", k_unc_d: "Logins of 1 h or more / total",
      fixed: "fixed", moves: "moves",
      noteUtc: (u, l) => `In <b>UTC</b>, midnight lands inside evening shifts, so one shift counts as two agent-days: <b>${u} h</b> per agent-day against <b>${l} h</b> in each agent's local time. Total hours do not change.`,
      noteOther: (t, l) => `With midnight in <b>${t}</b>, agents in other zones get their shifts cut at someone else's midnight. Hours per agent-day: <b>${l} h</b>. Total hours do not change.`,
      noteLocal: (l) => `Each agent's day ends at their own site's midnight, daylight saving included: <b>${l} h</b> per agent-day.`,
      trendTitle: "Hours logged", trendSub: (g) => `Total hours per ${g}. Hover a column for the breakdown.`,
      cutTitle: "The midnight problem",
      cutSub: "Real shifts from the data. Pick where midnight falls and watch the same work land on different days.",
      cutOutside: "Midnight falls outside this shift: all of it lands on one day.",
      siteTitle: "Productivity by site", siteSub: "Productive hours / total hours. Bar length starts at zero.",
      tenureTitle: "New-hire ramp", tenureSub: "Productivity by tenure on the day worked.",
      mixTitle: "Where the hours go", mixSub: "Share of total hours by status category.",
      pnbTitle: "Paid but not billable", pnbSub: "Hours the company pays and cannot invoice, by status.",
      dqTitle: "What cleaning removed", dqSub: "Rows flagged in staging, never silently deleted.",
      heatTitle: "Productivity by site and week", heatSub: "Darker is more productive. Hover a cell for the value.",
      agentsTitle: "Agent scorecard", agentsSub: "Compare agents doing similar work: two internal-support agents sit near 0% by design.",
      search: "Search agent or lead", more: (n) => `Show all ${n}`, less: "Show fewer",
      a_name: "Agent", a_site: "Site", a_lead: "Team lead", a_hours: "Hours", a_prod: "Productivity", a_bill: "Billable", a_days: "Days", a_status: "Status",
      Active: "Active", Terminated: "Terminated",
      howTitle: "How it works",
      s1: "CSV loaded as text. A bad value can never break the load.",
      s2: "Typed, deduplicated twice (by ID and by content), every unusable row flagged with a reason.",
      s3: "Star schema with valid rows only, partitioned by day and clustered by agent and status.",
      s4: "One query with CTE phases splits each entry at local midnight with GENERATE_DATE_ARRAY + UNNEST. DST days come out as 23 or 25 hours.",
      s5: "Split hours equal unsplit hours in every timezone, and one agent-day is recomputed in plain Python.",
      foot: "Built by Mariano Rac · SQL (BigQuery, DuckDB) · Python · hand-drawn SVG charts",
      f_raw: "Raw rows", f_dedup: "After dedup", f_valid: "Valid entries",
      i_dup: "Same ID loaded twice", i_cdup: "Same event, new ID", i_miss: "Missing end time", i_neg: "End before start",
      i_16: "Lasts 16 h or more", i_ll: "Login of 1 h or more", i_ov: "Overlapping entries",
      removed: "removed", excluded: "excluded", flagged: "kept, flagged",
      hours: "h", rows: "rows", prodShort: "productive", agents: "agents", days: "days", weekOf: "Week of",
      bands: ["0–30 d", "31–90 d", "91–180 d", "181–365 d", "1–2 y", "2+ y"],
      cats: { Productive: "Productive", Break: "Break", Meal: "Meal", Training: "Training", "Time Off": "Time off", Admin: "Admin", System: "System", Downtime: "Downtime" },
    },
    es: {
      skip: "Ir al contenido", back: "← Portafolio", code: "Código", theme: "Cambiar tema", filters: "Filtros",
      kicker: "Caso de estudio · Analista de datos en la nube",
      title: "Horas de trabajo, cortadas en la medianoche correcta",
      lede: "Un contact center necesita las horas exactas que cada agente trabajó cada día, en la zona horaria que elija quien mira el reporte. Los turnos de noche cruzan la medianoche, hay cinco sedes en cinco zonas y la exportación trae duplicados y filas rotas. Este dashboard usa la salida de un pipeline estilo BigQuery, reconstruido en local con DuckDB.",
      synthetic: "Primero lo construí en BigQuery y Looker Studio con datos reales de una empresa. Esos datos son confidenciales, así que esta versión pública corre el mismo SQL sobre datos sintéticos: personas, sedes y horas inventadas, con la misma forma y los mismos problemas de calidad.",
      tz: "Medianoche en", site: "Sede", grain: "Nivel", allSites: "Todas las sedes",
      day: "Día", week: "Semana", month: "Mes", local: "Local del agente",
      k_total: "Horas totales", k_total_d: "Igual en cualquier zona",
      k_apd: "Horas por agente-día", k_apd_d: "Cambia con la zona horaria",
      k_prod: "Productividad", k_prod_d: "Horas productivas / totales",
      k_util: "Utilización", k_util_d: "Productivas / (total − comida − ausencias)",
      k_bill: "Facturable", k_bill_d: "Facturables / totales",
      k_pnb: "Pagado no facturable", k_pnb_d: "(Pagadas − facturables) / total",
      k_shr: "Shrinkage", k_shr_d: "(Descansos + comida) / total",
      k_unc: "Sin clasificar", k_unc_d: "Logins de 1 h o más / total",
      fixed: "fijo", moves: "cambia",
      noteUtc: (u, l) => `En <b>UTC</b> la medianoche cae dentro de los turnos de noche, así que un turno cuenta como dos agente-días: <b>${u} h</b> por agente-día contra <b>${l} h</b> en la hora local de cada agente. Las horas totales no cambian.`,
      noteOther: (t, l) => `Con la medianoche en <b>${t}</b>, a los agentes de otras zonas se les corta el turno con una medianoche ajena. Horas por agente-día: <b>${l} h</b>. Las horas totales no cambian.`,
      noteLocal: (l) => `El día de cada agente termina en la medianoche de su sede, con horario de verano incluido: <b>${l} h</b> por agente-día.`,
      trendTitle: "Horas registradas", trendSub: (g) => `Horas totales por ${g}. Pasa el cursor por una columna para ver el detalle.`,
      cutTitle: "El problema de la medianoche",
      cutSub: "Turnos reales de los datos. Elige dónde cae la medianoche y mira cómo el mismo trabajo cae en días distintos.",
      cutOutside: "La medianoche cae fuera de este turno: todo queda en un solo día.",
      siteTitle: "Productividad por sede", siteSub: "Horas productivas / totales. Las barras empiezan en cero.",
      tenureTitle: "Curva de nuevos ingresos", tenureSub: "Productividad según la antigüedad el día trabajado.",
      mixTitle: "En qué se van las horas", mixSub: "Porcentaje de horas por categoría de estado.",
      pnbTitle: "Pagado pero no facturable", pnbSub: "Horas que la empresa paga y no puede cobrar, por estado.",
      dqTitle: "Lo que quitó la limpieza", dqSub: "Filas marcadas en staging, nunca borradas en silencio.",
      heatTitle: "Productividad por sede y semana", heatSub: "Más oscuro es más productivo. Pasa el cursor por una celda.",
      agentsTitle: "Tabla de agentes", agentsSub: "Compara agentes con trabajo similar: dos agentes de soporte interno quedan cerca de 0% a propósito.",
      search: "Buscar agente o líder", more: (n) => `Ver los ${n}`, less: "Ver menos",
      a_name: "Agente", a_site: "Sede", a_lead: "Líder", a_hours: "Horas", a_prod: "Productividad", a_bill: "Facturable", a_days: "Días", a_status: "Estado",
      Active: "Activo", Terminated: "Baja",
      howTitle: "Cómo funciona",
      s1: "CSV cargado como texto. Un valor malo nunca rompe la carga.",
      s2: "Tipado, sin duplicados (por ID y por contenido), cada fila inutilizable marcada con un motivo.",
      s3: "Esquema estrella solo con filas válidas, particionado por día y agrupado por agente y estado.",
      s4: "Una consulta por fases (CTE) corta cada registro en la medianoche local con GENERATE_DATE_ARRAY + UNNEST. Los días con cambio de horario salen de 23 o 25 horas.",
      s5: "Las horas cortadas suman lo mismo que las originales en cada zona, y un agente-día se recalcula en Python puro.",
      foot: "Hecho por Mariano Rac · SQL (BigQuery, DuckDB) · Python · gráficas SVG a mano",
      f_raw: "Filas crudas", f_dedup: "Sin duplicados", f_valid: "Registros válidos",
      i_dup: "Mismo ID cargado dos veces", i_cdup: "Mismo evento, ID nuevo", i_miss: "Sin hora de fin", i_neg: "Fin antes del inicio",
      i_16: "Dura 16 h o más", i_ll: "Login de 1 h o más", i_ov: "Registros superpuestos",
      removed: "quitado", excluded: "excluido", flagged: "se queda, marcado",
      hours: "h", rows: "filas", prodShort: "productivas", agents: "agentes", days: "días", weekOf: "Semana del",
      bands: ["0–30 d", "31–90 d", "91–180 d", "181–365 d", "1–2 a", "2+ a"],
      cats: { Productive: "Productivo", Break: "Descanso", Meal: "Comida", Training: "Capacitación", "Time Off": "Ausencia", Admin: "Admin", System: "Sistema", Downtime: "Caída" },
    },
  };

  const CATS = ["Productive", "Break", "Meal", "Training", "Time Off", "Admin", "System", "Downtime"];
  const CAT_VAR = {};
  CATS.forEach((c, i) => (CAT_VAR[c] = `var(--s${i + 1})`));
  const TZ_SHORT = { AGENT_LOCAL: null, UTC: "UTC", "America/Guatemala": "Guatemala", "America/Denver": "Denver", "America/Halifax": "Halifax" };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = { tz: "AGENT_LOCAL", site: "ALL", grain: "week", lang: "en", agentSort: ["hours", -1], agentAll: false, ex: 0 };
  try {
    const l = localStorage.getItem("mr-lang");
    if (l === "es" || l === "en") state.lang = l;
    else if ((navigator.language || "").startsWith("es")) state.lang = "es";
  } catch (e) { /* no storage */ }
  // Coming from the Spanish portfolio page?
  if (/[?&]lang=es/.test(location.search)) state.lang = "es";
  if (/[?&]lang=en/.test(location.search)) state.lang = "en";

  const t = (k) => T[state.lang][k] ?? T.en[k] ?? k;
  const locale = () => (state.lang === "es" ? "es-GT" : "en-US");
  const nf = (v, d = 0) => v.toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (v, d = 1) => `${nf(v * 100, d)}%`;
  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, html) => {
    const n = document.createElement(tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  let D; // data.json

  // ---------------------------------------------------------------- tooltip
  const tip = $("#tip");
  function showTip(html, ev) {
    tip.innerHTML = html;
    tip.classList.add("on");
    const pad = 14;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY - h - pad;
    if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
    if (x < 8) x = 8;
    if (y < 8) y = ev.clientY + pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  const hideTip = () => tip.classList.remove("on");
  function bindTip(node, fn) {
    node.addEventListener("pointermove", (e) => showTip(fn(), e));
    node.addEventListener("pointerdown", (e) => showTip(fn(), e));
    node.addEventListener("pointerleave", hideTip);
  }
  addEventListener("scroll", hideTip, { passive: true });

  // ---------------------------------------------------------------- helpers
  function isoWeekStart(ds) {
    const d = new Date(ds + "T00:00:00Z");
    const wd = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wd);
    return d.toISOString().slice(0, 10);
  }
  function dateLabel(ds, opts) {
    return new Date(ds + "T12:00:00Z").toLocaleDateString(locale(), Object.assign({ timeZone: "UTC" }, opts));
  }
  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }
  function compact(v) {
    if (v >= 10000) return nf(v / 1000, 0) + "K";
    return nf(v, 0);
  }
  function cw(sel, fallback) {
    const n = typeof sel === "string" ? $(sel) : sel;
    return Math.round((n && n.clientWidth) || fallback);
  }
  function svg(w, h, inner) {
    return `<svg viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  }

  // ---------------------------------------------------------------- aggregate
  const F = {};
  function rows() {
    const all = D.daily[state.tz];
    return state.site === "ALL" ? all : all.filter((r) => r[F.site] === state.site);
  }
  function sum(rs) {
    const s = { total: 0, productive: 0, billable: 0, payable: 0, shrink: 0, unavailable: 0, unscheduled: 0, long_login: 0, agents: 0 };
    for (const r of rs) for (const k in s) s[k] += r[F[k]];
    return s;
  }
  function kpis(tz) {
    const all = D.daily[tz];
    const rs = state.site === "ALL" ? all : all.filter((r) => r[F.site] === state.site);
    const s = sum(rs);
    return {
      total: s.total,
      apd: s.total / s.agents,
      prod: s.productive / s.total,
      util: s.productive / (s.total - s.unavailable),
      bill: s.billable / s.total,
      pnb: (s.payable - s.billable) / s.total,
      shr: s.shrink / s.total,
      unc: s.long_login / s.total,
    };
  }

  // ---------------------------------------------------------------- KPIs
  const KPI_DEF = [
    ["total", (v) => nf(v, 0), "fixed"], ["apd", (v) => nf(v, 2), "moves"],
    ["prod", (v) => pct(v)], ["util", (v) => pct(v)], ["bill", (v) => pct(v)],
    ["pnb", (v) => pct(v)], ["shr", (v) => pct(v)], ["unc", (v) => pct(v, 2)],
  ];
  const KPI_KEY = { total: "k_total", apd: "k_apd", prod: "k_prod", util: "k_util", bill: "k_bill", pnb: "k_pnb", shr: "k_shr", unc: "k_unc" };
  let lastK = null;
  function renderKpis(flash) {
    const k = kpis(state.tz);
    const box = $("#kpis");
    if (!box.children.length) {
      for (const [id] of KPI_DEF) {
        box.appendChild(el("article", { class: "kpi", "data-k": id },
          `<div class="label"><span class="n"></span><span class="badge"></span></div><div class="value">–</div><div class="def"></div>`));
      }
    }
    for (const [id, f, badge] of KPI_DEF) {
      const card = box.querySelector(`[data-k="${id}"]`);
      card.querySelector(".n").textContent = t(KPI_KEY[id]);
      card.querySelector(".def").textContent = t(KPI_KEY[id] + "_d");
      card.querySelector(".badge").textContent = badge ? t(badge) : "";
      const v = card.querySelector(".value");
      const from = lastK ? lastK[id] : 0;
      tween(v, from, k[id], f);
      if (flash && lastK && f(lastK[id]) !== f(k[id])) {
        card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
      }
    }
    lastK = k;
    // Note under the KPIs
    const local = kpis("AGENT_LOCAL").apd;
    const note = $("#tzNote");
    if (state.tz === "AGENT_LOCAL") note.innerHTML = t("noteLocal")(nf(local, 2));
    else if (state.tz === "UTC") note.innerHTML = t("noteUtc")(nf(k.apd, 2), nf(local, 2));
    else note.innerHTML = t("noteOther")(TZ_SHORT[state.tz], nf(k.apd, 2));
  }
  function tween(node, a, b, f) {
    if (reduce || a === b) { node.textContent = f(b); return; }
    const t0 = performance.now(), dur = 700;
    cancelAnimationFrame(node._raf);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      node.textContent = f(a + (b - a) * e);
      if (p < 1) node._raf = requestAnimationFrame(step);
    };
    node._raf = requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- trend
  function renderTrend() {
    const grain = state.grain;
    const buckets = new Map();
    for (const r of rows()) {
      const d = r[F.date];
      const key = grain === "day" ? d : grain === "week" ? isoWeekStart(d) : d.slice(0, 7);
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { total: 0, productive: 0, agents: 0 }));
      b.total += r[F.total]; b.productive += r[F.productive]; b.agents += r[F.agents];
    }
    // Drop the edge buckets that only hold spill-over minutes (timezone edges).
    const peak = Math.max(...[...buckets.values()].map((b) => b.total));
    const keys = [...buckets.keys()].sort().filter((k) => buckets.get(k).total > peak * 0.05);
    const W = cw('#trend', 1100), H = W < 600 ? 220 : 300, L = 44, R = 8, Tp = 16, B = 34;
    const max = niceMax(Math.max(...keys.map((k) => buckets.get(k).total)));
    const band = (W - L - R) / keys.length;
    const bw = Math.min(24, Math.max(2, band * 0.62));
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, y = Tp + (H - Tp - B) * (1 - v / max);
      g += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/>`;
      g += `<text class="lbl" x="${L - 8}" y="${y + 4}" text-anchor="end">${compact(v)}</text>`;
    }
    const every = Math.ceil(keys.length / (innerWidth < 600 ? 5 : 10));
    keys.forEach((k, i) => {
      const b = buckets.get(k);
      const h = (H - Tp - B) * (b.total / max);
      const x = L + band * i + (band - bw) / 2;
      const y = H - B - h;
      const r = Math.min(4, bw / 2, h);
      g += `<path class="bar" style="animation-delay:${Math.min(i * 12, 500)}ms" fill="var(--s1)" d="M${x},${H - B}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${H - B}Z"/>`;
      if (i % every === 0) {
        const lab = grain === "month" ? dateLabel(k + "-01", { month: "short", year: "numeric" }) : dateLabel(k, { month: "short", day: "numeric" });
        g += `<text class="lbl" x="${L + band * i + band / 2}" y="${H - B + 18}" text-anchor="middle">${lab}</text>`;
      }
      g += `<rect class="hit" data-i="${i}" x="${L + band * i}" y="${Tp}" width="${band}" height="${H - Tp - B}"/>`;
    });
    g += `<line class="base" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
    const box = $("#trend");
    box.innerHTML = svg(W, H, g);
    box.querySelectorAll(".hit").forEach((n) => {
      const k = keys[+n.dataset.i], b = buckets.get(k);
      const title = grain === "day" ? dateLabel(k, { weekday: "short", month: "short", day: "numeric" })
        : grain === "week" ? `${t("weekOf")} ${dateLabel(k, { month: "short", day: "numeric" })}`
        : dateLabel(k + "-01", { month: "long", year: "numeric" });
      bindTip(n, () => `<div class="tt">${title}</div><div class="tv">${nf(b.total, 1)} ${t("hours")}</div>
        <div class="tr"><span>${t("k_prod")}</span><b>${pct(b.productive / b.total)}</b></div>
        <div class="tr"><span>${t("k_apd")}</span><b>${nf(b.total / b.agents, 2)}</b></div>`);
    });
    $("#trendSub").textContent = t("trendSub")(t(grain).toLowerCase());
    replay(box);
  }

  // ---------------------------------------------------------------- cutter
  function tzOffsetMs(tz, ms) {
    const p = {};
    for (const x of new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms))) p[x.type] = x.value;
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
  }
  function localDate(tz, ms) { return new Date(ms + tzOffsetMs(tz, ms)).toISOString().slice(0, 10); }
  function localMidnightUtc(tz, ds) {
    const guess = Date.parse(ds + "T00:00:00Z");
    let u = guess - tzOffsetMs(tz, guess);
    u = guess - tzOffsetMs(tz, u);
    return u;
  }
  function renderCutPick() {
    const box = $("#cutPick");
    box.innerHTML = "";
    D.midnight_examples.forEach((ex, i) => {
      const b = el("button", { class: "chip", type: "button", role: "radio", "aria-checked": String(i === state.ex) },
        `${esc(ex.agent)}<small>${esc(ex.site)} · ${dateLabel(ex.day, { month: "short", day: "numeric" })}</small>`);
      b.addEventListener("click", () => { state.ex = i; renderCutPick(); renderCutter(); });
      box.appendChild(b);
    });
  }
  function renderCutter() {
    const ex = D.midnight_examples[state.ex];
    if (!ex) return;
    const tz = state.tz === "AGENT_LOCAL" ? ex.tz : state.tz;
    const ents = ex.entries.map(([s, e, name, cat]) => ({ s: Date.parse(s), e: Date.parse(e), name, cat }));
    const s0 = ents[0].s, e0 = Math.max(...ents.map((x) => x.e));
    const pad = 45 * 60e3, a = s0 - pad, z = e0 + pad;
    const W = cw('#cutStage', 1100), H = 150, L = 8, R = 8, top = 46, bh = 44;
    const X = (ms) => L + ((ms - a) / (z - a)) * (W - L - R);
    let g = "";
    // hour ticks in the chosen zone
    const firstHour = Math.ceil(a / 3600e3) * 3600e3;
    for (let h = firstHour; h <= z; h += 3600e3) {
      const off = tzOffsetMs(tz, h);
      const lh = new Date(h + off).getUTCHours();
      if (new Date(h + off).getUTCMinutes() !== 0) continue;
      g += `<line class="gridline" x1="${X(h)}" x2="${X(h)}" y1="${top - 6}" y2="${top + bh + 6}"/>`;
      if (lh % (W < 600 ? 3 : 2) === 0) g += `<text class="lbl" x="${X(h)}" y="${top + bh + 22}" text-anchor="middle">${String(lh).padStart(2, "0")}:00</text>`;
    }
    for (const en of ents) {
      const x1 = X(en.s), x2 = X(en.e);
      g += `<rect class="seg-ent" data-n="${esc(en.name)}" x="${x1 + 1}" y="${top}" width="${Math.max(1, x2 - x1 - 2)}" height="${bh}" rx="3" fill="${CAT_VAR[en.cat] || "var(--mut-bar)"}"><title>${esc(en.name)}</title></rect>`;
    }
    // midnights inside the window
    const days = [];
    let d = localDate(tz, a);
    const lastD = localDate(tz, z);
    let mids = [];
    for (let i = 0; i < 4; i++) {
      days.push(d);
      const next = new Date(Date.parse(d + "T00:00:00Z") + 86400e3).toISOString().slice(0, 10);
      const m = localMidnightUtc(tz, next);
      if (m > a && m < z) mids.push(m);
      if (next > lastD) break;
      d = next;
    }
    for (const m of mids) {
      g += `<line class="midline" x1="${X(m)}" x2="${X(m)}" y1="10" y2="${top + bh + 8}"/>`;
      g += `<text class="midlabel" x="${X(m) + 6}" y="22">00:00 ${esc(TZ_SHORT[tz] || ex.site)}</text>`;
    }
    const present = CATS.filter((c) => ents.some((x) => x.cat === c));
    $("#cutStage").innerHTML = svg(W, H, g) + `<ul class="legend">${present.map((c) => `<li><span class="sw" style="background:${CAT_VAR[c]}"></span>${t("cats")[c]}</li>`).join("")}</ul>`;
    // hours per local day
    const perDay = new Map();
    for (const en of ents) {
      let cur = en.s;
      while (cur < en.e) {
        const ld = localDate(tz, cur);
        const next = localMidnightUtc(tz, new Date(Date.parse(ld + "T00:00:00Z") + 86400e3).toISOString().slice(0, 10));
        const stop = Math.min(en.e, next);
        perDay.set(ld, (perDay.get(ld) || 0) + (stop - cur) / 3600e3);
        cur = stop;
      }
    }
    const box = $("#cutDays");
    box.innerHTML = "";
    [...perDay.keys()].sort().forEach((k, i) => {
      box.appendChild(el("div", { class: "dayc", style: `animation-delay:${i * 90}ms` },
        `<div class="d">${dateLabel(k, { weekday: "long", month: "short", day: "numeric" })}</div><div class="h">${nf(perDay.get(k), 2)} h</div>`));
    });
    if (!mids.length) box.appendChild(el("p", { class: "sub" }, t("cutOutside")));
    $("#cutStage").querySelectorAll(".seg-ent").forEach((n) => bindTip(n, () => `<div class="tv">${n.dataset.n}</div>`));
  }

  // ---------------------------------------------------------------- bars
  function hbars(boxSel, items, fmt, max) {
    const W = cw(boxSel, 520), rowH = 34, L = 132, R = 64, H = items.length * rowH + 8;
    max = max || niceMax(Math.max(...items.map((x) => x.v)));
    let g = "";
    items.forEach((it, i) => {
      const y = 4 + i * rowH, bh = 18, w = Math.max(2, ((W - L - R) * it.v) / max);
      g += `<text class="lbl cat" x="${L - 10}" y="${y + bh / 2 + 4}" text-anchor="end">${esc(it.label)}</text>`;
      g += `<path class="hbar${it.hot ? " hot" : ""}" style="animation-delay:${i * 60}ms" fill="var(--s1)" d="M${L},${y}H${L + w - 4}Q${L + w},${y} ${L + w},${y + 4}V${y + bh - 4}Q${L + w},${y + bh} ${L + w - 4},${y + bh}H${L}Z"/>`;
      g += `<text class="lbl val" x="${L + w + 8}" y="${y + bh / 2 + 4}">${fmt(it.v)}</text>`;
      g += `<rect class="hit" data-i="${i}" x="0" y="${y - 6}" width="${W}" height="${rowH}"/>`;
    });
    g += `<line class="base" x1="${L}" x2="${L}" y1="0" y2="${H - 4}"/>`;
    const box = $(boxSel);
    box.innerHTML = svg(W, H, g);
    box.classList.toggle("dim", items.some((x) => x.hot));
    box.querySelectorAll(".hit").forEach((n) => { const it = items[+n.dataset.i]; bindTip(n, () => it.tip || `<div class="tv">${fmt(it.v)}</div>`); });
    replay(box);
  }
  function renderSites() {
    const agg = {};
    for (const [site, , prod, total, n] of D.tenure_by_site) {
      const a = (agg[site] = agg[site] || { prod: 0, total: 0 });
      a.prod += prod; a.total += total;
    }
    const items = D.sites.map((s) => ({
      label: s.name, v: agg[s.code].prod / agg[s.code].total, hot: state.site === s.code,
      tip: `<div class="tt">${esc(s.name)} · ${s.agents} ${t("agents")}</div><div class="tv">${pct(agg[s.code].prod / agg[s.code].total)}</div><div class="tr"><span>${t("hours")}</span><b>${nf(agg[s.code].total, 0)}</b></div>`,
    })).sort((a, b) => b.v - a.v);
    hbars("#sites", items, (v) => pct(v), 1);
  }
  function renderPnb() {
    const agg = {};
    for (const [site, name, cat, h] of D.paid_not_billable) {
      if (state.site !== "ALL" && site !== state.site) continue;
      agg[name] = agg[name] || { h: 0, cat }; agg[name].h += h;
    }
    const items = Object.entries(agg).map(([k, x]) => ({ label: k, v: x.h, cat: x.cat })).sort((a, b) => b.v - a.v).slice(0, 7);
    items.forEach((it) => (it.tip = `<div class="tt">${esc(it.label)} · ${t("cats")[it.cat] || it.cat}</div><div class="tv">${nf(it.v, 1)} h</div>`));
    hbars("#pnb", items, (v) => nf(v, 0) + " h");
  }
  function renderTenure() {
    const agg = {};
    for (const [site, band, prod, total] of D.tenure_by_site) {
      if (state.site !== "ALL" && site !== state.site) continue;
      const a = (agg[band] = agg[band] || { prod: 0, total: 0 });
      a.prod += prod; a.total += total;
    }
    const bands = Object.keys(agg).sort();
    const vals = bands.map((b) => agg[b].prod / agg[b].total);
    const W = cw('#tenure', 520), H = 250, L = 40, R = 8, Tp = 22, B = 30;
    const band = (W - L - R) / bands.length, bw = 24;
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const y = Tp + (H - Tp - B) * (1 - i / 4);
      g += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="lbl" x="${L - 8}" y="${y + 4}" text-anchor="end">${i * 25}%</text>`;
    }
    const maxI = vals.indexOf(Math.max(...vals));
    bands.forEach((b, i) => {
      const v = vals[i], h = (H - Tp - B) * v, x = L + band * i + (band - bw) / 2, y = H - B - h;
      g += `<path class="bar" style="animation-delay:${i * 70}ms" fill="${i === 0 ? "var(--s2)" : "var(--s1)"}" d="M${x},${H - B}V${y + 4}Q${x},${y} ${x + 4},${y}H${x + bw - 4}Q${x + bw},${y} ${x + bw},${y + 4}V${H - B}Z"/>`;
      if (i === 0 || i === maxI) g += `<text class="lbl val" x="${x + bw / 2}" y="${y - 6}" text-anchor="middle">${pct(v, 0)}</text>`;
      g += `<text class="lbl" x="${x + bw / 2}" y="${H - B + 18}" text-anchor="middle">${t("bands")[+b[0] - 1]}</text>`;
      g += `<rect class="hit" data-i="${i}" x="${L + band * i}" y="${Tp}" width="${band}" height="${H - Tp - B}"/>`;
    });
    g += `<line class="base" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
    const box = $("#tenure");
    box.innerHTML = svg(W, H, g);
    box.querySelectorAll(".hit").forEach((n) => {
      const i = +n.dataset.i, b = bands[i];
      bindTip(n, () => `<div class="tt">${t("bands")[+b[0] - 1]}</div><div class="tv">${pct(vals[i])}</div><div class="tr"><span>${t("hours")}</span><b>${nf(agg[b].total, 0)}</b></div>`);
    });
    replay(box);
  }
  function renderMix() {
    const agg = {};
    for (const [site, cat, h] of D.category_by_site) {
      if (state.site !== "ALL" && site !== state.site) continue;
      agg[cat] = (agg[cat] || 0) + h;
    }
    const total = Object.values(agg).reduce((a, b) => a + b, 0);
    const box = $("#mix");
    let bar = box.querySelector(".mixbar");
    if (!bar) {
      box.innerHTML = `<div class="mixbar"></div><ul class="legend"></ul>`;
      bar = box.querySelector(".mixbar");
      CATS.forEach((c) => bar.appendChild(el("span", { "data-c": c, style: `background:${CAT_VAR[c]};flex-grow:0` })));
    }
    const lg = box.querySelector(".legend");
    lg.innerHTML = "";
    CATS.forEach((c) => {
      const v = (agg[c] || 0) / total;
      const s = bar.querySelector(`[data-c="${c}"]`);
      requestAnimationFrame(() => (s.style.flexGrow = String(v)));
      bindTipOnce(s, () => `<div class="tt">${t("cats")[c]}</div><div class="tv">${pct(v)}</div><div class="tr"><span>${t("hours")}</span><b>${nf(agg[c] || 0, 0)}</b></div>`);
      lg.appendChild(el("li", {}, `<span class="sw" style="background:${CAT_VAR[c]}"></span>${t("cats")[c]}<b>${pct(v)}</b>`));
    });
  }
  function bindTipOnce(node, fn) { node._tip = fn; if (!node._bound) { node._bound = 1; bindTip(node, () => node._tip()); } }

  // ---------------------------------------------------------------- dq
  function renderDq() {
    const q = D.dq;
    const dedup = q.raw_rows - q.dup_id_rows - q.content_dup_rows;
    const steps = [[t("f_raw"), q.raw_rows], [t("f_dedup"), dedup], [t("f_valid"), q.core_rows]];
    const ex = q.excluded;
    const issues = [
      [t("i_dup"), q.dup_id_rows, "rm", t("removed")],
      [t("i_cdup"), q.content_dup_rows, "rm", t("removed")],
      [t("i_miss"), ex.missing_end?.rows || 0, "ex", t("excluded")],
      [t("i_neg"), ex.negative_duration?.rows || 0, "ex", t("excluded")],
      [t("i_16"), ex.over_16h?.rows || 0, "ex", t("excluded")],
      [t("i_ll"), q.long_login.rows, "fl", t("flagged")],
      [t("i_ov"), q.overlap.rows, "fl", t("flagged")],
    ];
    $("#dq").innerHTML = `<div class="funnel">${steps.map(([l, v], i) =>
      `<div class="fstep"><span class="t">${l}</span><span class="track"><span class="fill" style="display:block;width:${(v / q.raw_rows) * 100}%;animation-delay:${i * 120}ms"></span></span><b>${nf(v)}</b></div>`).join("")}</div>
      <table class="issues"><tbody>${issues.map(([l, n, c, w]) => `<tr><td>${l}</td><td>${nf(n)} ${t("rows")}</td><td><span class="tag ${c}">${w}</span></td></tr>`).join("")}</tbody></table>`;
    replay($("#dq"));
  }

  // ---------------------------------------------------------------- heatmap
  function renderHeat() {
    const wk = {};
    for (const r of D.week_by_site) wk[r[1]] = (wk[r[1]] || 0) + r[3];
    const top = Math.max(...Object.values(wk));
    const weeks = Object.keys(wk).filter((w) => wk[w] > top * 0.5).sort();
    const map = {};
    for (const [s, w, p, tot] of D.week_by_site) if (tot > 40) map[s + w] = p / tot;
    const vals = Object.values(map);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const W = Math.max(720, cw('#heat', 1100)), L = 120, colW = (W - L - 4) / weeks.length, ch = 30, Tp = 22;
    const H = Tp + D.sites.length * ch + 8;
    let g = "";
    weeks.forEach((w, i) => { if (i % 2 === 0) g += `<text class="lbl" x="${L + colW * i + colW / 2}" y="14" text-anchor="middle">${dateLabel(w, { month: "short", day: "numeric" })}</text>`; });
    D.sites.forEach((s, r) => {
      const y = Tp + r * ch;
      g += `<text class="lbl cat" x="${L - 10}" y="${y + ch / 2 + 4}" text-anchor="end" ${state.site === s.code ? 'style="font-weight:700;fill:var(--text)"' : ""}>${esc(s.name)}</text>`;
      weeks.forEach((w, i) => {
        const v = map[s.code + w];
        const step = v == null ? null : Math.min(7, 1 + Math.floor(((v - lo) / (hi - lo || 1)) * 6.999));
        const fill = step ? `var(--q${step})` : "var(--surface-2)";
        const op = state.site !== "ALL" && state.site !== s.code ? 0.35 : 1;
        g += `<rect class="cell" data-s="${s.code}" data-w="${w}" x="${L + colW * i}" y="${y}" width="${colW}" height="${ch}" rx="4" fill="${fill}" opacity="${op}"/>`;
      });
    });
    const box = $("#heat");
    box.innerHTML = svg(W, H, g) + `<div class="heat-legend"><span>${pct(lo, 0)}</span><span class="ramp">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<i style="background:var(--q${i})"></i>`).join("")}</span><span>${pct(hi, 0)}</span></div>`;
    box.querySelectorAll(".cell").forEach((n) => {
      const v = map[n.dataset.s + n.dataset.w];
      const site = D.sites.find((s) => s.code === n.dataset.s).name;
      bindTip(n, () => `<div class="tt">${esc(site)} · ${t("weekOf")} ${dateLabel(n.dataset.w, { month: "short", day: "numeric" })}</div><div class="tv">${v == null ? "–" : pct(v)}</div>`);
    });
  }

  // ---------------------------------------------------------------- agents
  function renderAgents() {
    const A = D.agent_fields;
    const ix = Object.fromEntries(A.map((k, i) => [k, i]));
    const qy = ($("#agentSearch").value || "").trim().toLowerCase();
    let list = D.agents.map((r) => ({
      name: r[ix.name], site: r[ix.site], lead: r[ix.lead], status: r[ix.status], hours: r[ix.hours],
      prod: r[ix.productive] / r[ix.hours], bill: r[ix.billable] / r[ix.hours], days: r[ix.days],
    }));
    if (state.site !== "ALL") list = list.filter((a) => a.site === state.site);
    if (qy) list = list.filter((a) => (a.name + " " + a.lead).toLowerCase().includes(qy));
    const [key, dir] = state.agentSort;
    list.sort((a, b) => (typeof a[key] === "string" ? a[key].localeCompare(b[key]) : a[key] - b[key]) * dir);
    const n = list.length;
    const shown = state.agentAll ? list : list.slice(0, 12);
    const cols = [["name", t("a_name")], ["site", t("a_site")], ["lead", t("a_lead")], ["hours", t("a_hours"), 1], ["prod", t("a_prod"), 1], ["bill", t("a_bill"), 1], ["days", t("a_days"), 1], ["status", t("a_status")]];
    const arrow = (k) => (k === key ? (dir < 0 ? "↓" : "↑") : "");
    $("#agents").innerHTML = `<thead><tr>${cols.map(([k, l, num]) => `<th class="${num ? "num" : ""}" aria-sort="${k === key ? (dir < 0 ? "descending" : "ascending") : "none"}"><button type="button" data-k="${k}">${l} ${arrow(k)}</button></th>`).join("")}</tr></thead>
      <tbody>${shown.map((a) => `<tr><td>${esc(a.name)}</td><td>${a.site}</td><td>${esc(a.lead)}</td><td class="num">${nf(a.hours, 1)}</td>
        <td class="num">${pct(a.prod)}<span class="meter" aria-hidden="true"><i style="width:${a.prod * 100}%"></i></span></td>
        <td class="num">${pct(a.bill)}</td><td class="num">${a.days}</td><td>${t(a.status)}</td></tr>`).join("")}</tbody>`;
    $("#agents").querySelectorAll("th button").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k;
      state.agentSort = [k, state.agentSort[0] === k ? -state.agentSort[1] : (["name", "site", "lead", "status"].includes(k) ? 1 : -1)];
      renderAgents();
    }));
    const more = $("#agentsMore");
    more.hidden = n <= 12;
    more.textContent = state.agentAll ? t("less") : t("more")(n);
  }

  // ---------------------------------------------------------------- controls
  function seg(boxSel, options, cur, onPick) {
    const box = $(boxSel);
    box.innerHTML = "";
    for (const [v, label] of options) {
      const b = el("button", { type: "button", role: "radio", "aria-checked": String(v === cur) }, label);
      b.addEventListener("click", () => onPick(v));
      box.appendChild(b);
    }
  }
  function renderControls() {
    seg("#tzSeg", D.tz_options.map((z) => [z, z === "AGENT_LOCAL" ? t("local") : TZ_SHORT[z]]), state.tz, (v) => {
      state.tz = v; renderControls(); renderKpis(true); renderTrend(); renderCutter();
    });
    seg("#grainSeg", [["day", t("day")], ["week", t("week")], ["month", t("month")]], state.grain, (v) => {
      state.grain = v; renderControls(); renderTrend();
    });
    const sel = $("#siteSel");
    sel.innerHTML = `<option value="ALL">${t("allSites")}</option>` + D.sites.map((s) => `<option value="${s.code}">${esc(s.name)}</option>`).join("");
    sel.value = state.site;
  }
  function applyText() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-t]").forEach((n) => { const v = t(n.dataset.t); if (typeof v === "string") n.textContent = v; });
    document.querySelectorAll("[data-t-ph]").forEach((n) => (n.placeholder = t(n.dataset.tPh)));
    document.querySelectorAll("[data-t-aria]").forEach((n) => n.setAttribute("aria-label", t(n.dataset.tAria)));
    $("#langBtn").textContent = state.lang === "es" ? "EN" : "ES";
    const back = $("#backLink");
    const root = back.getAttribute("href").replace(/(en\/)?index\.html.*$/, "");
    back.href = root + (state.lang === "en" ? "en/index.html" : "index.html") + "#proyectos";
  }
  function renderAll() {
    applyText(); renderControls(); renderKpis(false); renderTrend(); renderCutPick(); renderCutter();
    renderSites(); renderTenure(); renderMix(); renderPnb(); renderDq(); renderHeat(); renderAgents();
  }

  // ---------------------------------------------------------------- motion
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in", "grow"); io.unobserve(e.target); }
  }, { threshold: 0.12 }) : null;
  function replay(box) {
    const p = box.closest(".panel");
    if (!p || !p.classList.contains("grow")) return;
    p.classList.remove("grow"); void p.offsetWidth; p.classList.add("grow");
  }

  // ---------------------------------------------------------------- boot
  fetch("data.json").then((r) => r.json()).then((data) => {
    D = data;
    D.daily_fields.forEach((k, i) => (F[k] = i));
    renderAll();
    document.querySelectorAll(".panel, .kpis").forEach((p) => {
      if (io && !reduce) { p.classList.add("reveal"); io.observe(p); } else p.classList.add("in", "grow");
    });
    $("#siteSel").addEventListener("change", (e) => {
      state.site = e.target.value;
      renderKpis(true); renderTrend(); renderSites(); renderTenure(); renderMix(); renderPnb(); renderHeat(); renderAgents();
    });
    $("#agentSearch").addEventListener("input", renderAgents);
    $("#agentsMore").addEventListener("click", () => { state.agentAll = !state.agentAll; renderAgents(); });
    $("#langBtn").addEventListener("click", () => {
      state.lang = state.lang === "es" ? "en" : "es";
      try { localStorage.setItem("mr-lang", state.lang); } catch (e) { /* ignore */ }
      renderAll();
    });
    $("#themeBtn").addEventListener("click", () => {
      const r = document.documentElement;
      const dark = r.getAttribute("data-theme") ? r.getAttribute("data-theme") === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      const next = dark ? "light" : "dark";
      r.setAttribute("data-theme", next);
      try { localStorage.setItem("mr-theme", next); } catch (e) { /* ignore */ }
    });
    let rz;
    addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { renderTrend(); renderCutter(); renderSites(); renderTenure(); renderPnb(); renderHeat(); }, 200); });
  });
})();
