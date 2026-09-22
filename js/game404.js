(function () {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("game-overlay-title");
  const overlayText = document.getElementById("game-overlay-text");
  const startBtn = document.getElementById("game-start-btn");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");
  const dpad = document.getElementById("game-dpad");

  const BEST_KEY = "mr-snake-best";
  const COLS = 18;
  const ROWS = 18;
  const START_INTERVAL = 150;
  const MIN_INTERVAL = 70;

  let cellSize = 20;
  let snake = [];
  let dir = { x: 1, y: 0 };
  let pendingDir = { x: 1, y: 0 };
  let food = { x: 5, y: 5 };
  let score = 0;
  let best = 0;
  let interval = START_INTERVAL;
  let timer = null;
  let state = "idle"; // idle | playing | paused | over

  function isDark() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function t(key) {
    const lang = window.currentLang || "es";
    return (window.translations?.[lang] || window.translations?.es || {})[key] || key;
  }

  function loadBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      /* almacenamiento no disponible — se ignora */
    }
  }

  function resize() {
    const wrap = canvas.parentElement;
    const size = Math.min(wrap.clientWidth, 440);
    cellSize = Math.floor(size / COLS);
    const boardSize = cellSize * COLS;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = boardSize * dpr;
    canvas.height = boardSize * dpr;
    canvas.style.width = boardSize + "px";
    canvas.style.height = boardSize + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function randomFood() {
    let cell;
    do {
      cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === cell.x && s.y === cell.y));
    return cell;
  }

  function resetGame() {
    snake = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    dir = { x: 1, y: 0 };
    pendingDir = { x: 1, y: 0 };
    food = randomFood();
    score = 0;
    interval = START_INTERVAL;
    scoreEl.textContent = "0";
  }

  function draw() {
    const dark = isDark();
    const boardSize = cellSize * COLS;

    ctx.clearRect(0, 0, boardSize, boardSize);
    ctx.fillStyle = dark ? "#0a0a0c" : "#eef1ec";
    ctx.fillRect(0, 0, boardSize, boardSize);

    ctx.strokeStyle = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, boardSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(boardSize, i * cellSize);
      ctx.stroke();
    }

    // comida: punto y coma pulsante
    const accent2 = cssVar("--accent-2", "#7b5cff");
    ctx.font = `${Math.floor(cellSize * 0.9)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = accent2;
    ctx.fillText(";", food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2 + 1);

    // serpiente: llaves de código alternadas
    const accent = cssVar("--accent", "#0071e3");
    const accent3 = cssVar("--accent-3", "#0c6e86");
    snake.forEach((seg, i) => {
      const glyph = i === 0 ? "0" : i % 2 === 0 ? "{" : "}";
      ctx.fillStyle = i === 0 ? accent : accent3;
      const r = cellSize * 0.28;
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, r);
      ctx.fill();
      ctx.fillStyle = dark ? "#0a0a0c" : "#eef1ec";
      ctx.fillText(glyph, x + cellSize / 2, y + cellSize / 2 + 1);
    });
  }

  function step() {
    dir = pendingDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitsWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
    const hitsSelf = snake.some((s) => s.x === head.x && s.y === head.y);

    if (hitsWall || hitsSelf) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score);
      food = randomFood();
      interval = Math.max(MIN_INTERVAL, interval - 3);
      restartTimer();
    } else {
      snake.pop();
    }

    draw();
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(step, interval);
  }

  function showOverlay(titleKey, textKey, btnKey) {
    overlayTitle.setAttribute("data-i18n", titleKey);
    overlayTitle.textContent = t(titleKey);
    overlayText.setAttribute("data-i18n", textKey);
    overlayText.textContent = t(textKey);
    startBtn.setAttribute("data-i18n", btnKey);
    startBtn.textContent = t(btnKey);
    overlay.hidden = false;
  }

  function gameOver() {
    state = "over";
    clearInterval(timer);
    const isNewBest = score > best;
    if (isNewBest) {
      best = score;
      saveBest(best);
      bestEl.textContent = String(best);
    }
    showOverlay("game.overTitle", isNewBest ? "game.newBest" : "game.overText", "game.again");
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    clearInterval(timer);
    showOverlay("game.pausedTitle", "game.pausedText", "game.play");
  }

  function startGame() {
    if (state === "idle" || state === "over") resetGame();
    state = "playing";
    overlay.hidden = true;
    restartTimer();
    draw();
  }

  function setDirection(x, y) {
    if (state !== "playing") return;
    // evita que la serpiente se coma a sí misma yendo en reversa directa
    if (snake.length > 1 && x === -dir.x && y === -dir.y) return;
    pendingDir = { x, y };
  }

  const KEY_MAP = {
    ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
  };

  document.addEventListener("keydown", (e) => {
    if (KEY_MAP[e.key]) {
      e.preventDefault();
      const [x, y] = KEY_MAP[e.key];
      if (state === "idle" || state === "over" || state === "paused") startGame();
      setDirection(x, y);
    }
  });

  startBtn.addEventListener("click", startGame);

  if (dpad) {
    dpad.querySelectorAll(".dpad-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dirName = btn.dataset.dir;
        const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const [x, y] = map[dirName];
        if (state === "idle" || state === "over" || state === "paused") startGame();
        setDirection(x, y);
      });
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
  });

  document.addEventListener("themechange", draw);
  document.addEventListener("langchange", () => {
    if (!overlay.hidden) {
      const titleKey = overlayTitle.getAttribute("data-i18n");
      const textKey = overlayText.getAttribute("data-i18n");
      const btnKey = startBtn.getAttribute("data-i18n");
      if (titleKey) showOverlay(titleKey, textKey, btnKey);
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  best = loadBest();
  bestEl.textContent = String(best);
  resetGame();
  resize();
})();
