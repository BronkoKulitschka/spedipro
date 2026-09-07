// startmenu.js
// Steuert das Ein-/Ausblenden des Startmenüs.
// Die Menüpunkte selbst sind aktuell Platzhalter (disabled) -
// werden gefüllt, sobald die ersten Programme existieren.

(function () {
  const startButton = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");

  function toggleStartMenu(event) {
    event.stopPropagation();
    startMenu.classList.toggle("hidden");
  }

  function closeStartMenu() {
    startMenu.classList.add("hidden");
  }

  startButton.addEventListener("click", toggleStartMenu);

  // Klick irgendwo außerhalb schließt das Menü
  document.addEventListener("click", (event) => {
    if (!startMenu.contains(event.target)) {
      closeStartMenu();
    }
  });

  document.getElementById("shutdown-item").addEventListener("click", () => {
    alert("Beenden ist im Prototyp noch nicht implementiert.");
  });
})();
