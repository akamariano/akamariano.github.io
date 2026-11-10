/* Profundidad: capas del hero con scroll y puntero, botones magnéticos,
   línea de la experiencia que se dibuja al bajar y cinta 3D con parallax.
   Todo con transform/opacity y variables CSS, un solo requestAnimationFrame por frame.
   Con "reducir movimiento" no se activa nada. */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  const hero = document.querySelector(".hero");
  const timeline = document.querySelector(".timeline");
  const ribbon = document.querySelector(".ribbon");
  const stage = document.querySelector(".glass-stage");

  let ticking = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;

    // Hero: 0 arriba del todo, 1 cuando el hero ya salió por arriba
    if (hero) {
      const r = hero.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height * 0.9), 0, 1);
      hero.style.setProperty("--hp", p.toFixed(4));
    }

    // Línea de la experiencia: avanza con el centro de la pantalla
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((vh * 0.6 - r.top) / Math.max(1, r.height), 0, 1);
      timeline.style.setProperty("--tl", p.toFixed(4));
    }

    // Cinta: se desplaza un poco con el scroll además de su animación continua
    if (ribbon) {
      const r = ribbon.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (vh - r.top) / (vh + r.height);
        ribbon.style.setProperty("--rs", (p * 2 - 1).toFixed(4));
      }
    }

    // Puntero suavizado (solo mouse)
    if (finePointer) {
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      if (hero) {
        hero.style.setProperty("--px", pointer.x.toFixed(4));
        hero.style.setProperty("--py", pointer.y.toFixed(4));
      }
      if (stage) {
        stage.style.setProperty("--gx", pointer.x.toFixed(4));
        stage.style.setProperty("--gy", pointer.y.toFixed(4));
      }
      if (Math.abs(pointer.tx - pointer.x) > 0.001 || Math.abs(pointer.ty - pointer.y) > 0.001) onScroll();
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  document.addEventListener("langchange", onScroll);

  if (finePointer && (hero || stage)) {
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
        onScroll();
      },
      { passive: true }
    );
  }

  root.classList.add("has-depth");
  update();

  // Luz del bloque granulado: sigue al cursor dentro de la tarjeta
  if (finePointer) {
    document.querySelectorAll(".cta-card:not(.cta-stipple)").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.classList.add("is-lit");
        card.style.setProperty("--cx", `${e.clientX - r.left}px`);
        card.style.setProperty("--cy", `${e.clientY - r.top}px`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-lit");
        card.style.removeProperty("--cx");
        card.style.removeProperty("--cy");
      });
    });
  }

  // Botones magnéticos: se inclinan hacia el cursor y vuelven con resorte.
  // Usa la propiedad "translate" para no pisar los transform de hover existentes.
  if (finePointer) {
    const magnets = document.querySelectorAll(".hero-actions .btn, .cta-section .btn, .projects-more-btn, .projects-footer .btn");
    magnets.forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.translate = `${(x * 0.22).toFixed(1)}px ${(y * 0.3).toFixed(1)}px`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.translate = "";
      });
    });
  }
})();
