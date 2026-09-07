// clock.js
// Zeigt die reale Systemzeit in der Taskbar an.
// Hinweis: Das ist die UI-Uhr des Windows-98-Rechners, NICHT die
// Spielzeit von SpediPro (Europa in den 90ern) - die kommt später
// aus dem gameState (core/state.js).

(function () {
  const clockEl = document.getElementById("clock");

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${hh}:${mm}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
})();
