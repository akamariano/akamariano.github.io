// Apply the saved theme before first paint (shared key with the portfolio).
(function () {
  try {
    var t = localStorage.getItem("mr-theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* storage unavailable */ }
})();
