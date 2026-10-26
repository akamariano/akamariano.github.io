// Se carga en <head>, antes de pintar: decide si toca la intro de "hackeo" (solo la primera visita).
// No corre si la persona ya la vio, prefiere menos movimiento o llega directo a una sección (#ancla).
(function () {
  try {
    if (
      !localStorage.getItem("mr-intro-seen") &&
      !location.hash &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.documentElement.classList.add("intro-on");
    }
  } catch (e) {
    /* sin almacenamiento (modo privado estricto): sin intro, para no repetirla en cada carga */
  }
})();
