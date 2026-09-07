// startmenu.js
// Steuert das Ein-/Ausblenden des Startmenüs.
// Die Menüpunkte selbst sind aktuell Platzhalter (disabled) -
// werden gefüllt, sobald die ersten Programme existieren.

(function () {
  const startButton = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");
  const programmeItem = document.getElementById("programme-item");
  const programmeSubmenu = document.getElementById("programme-submenu");

  function toggleStartMenu(event) {
    event.stopPropagation();
    startMenu.classList.toggle("hidden");
    programmeSubmenu.classList.remove("submenu-offen");
  }

  function closeStartMenu() {
    startMenu.classList.add("hidden");
    programmeSubmenu.classList.remove("submenu-offen");
  }

  function programmeMenuBefuellen() {
    programmeSubmenu.innerHTML = "";
    AppRegistry.getAll().forEach((app) => {
      const li = document.createElement("li");
      li.textContent = app.name;
      li.addEventListener("click", (event) => {
        event.stopPropagation();
        app.open();
        closeStartMenu();
      });
      programmeSubmenu.appendChild(li);
    });

    if (programmeSubmenu.children.length === 0) {
      const li = document.createElement("li");
      li.className = "disabled";
      li.textContent = "(keine Programme installiert)";
      programmeSubmenu.appendChild(li);
    }
  }

  startButton.addEventListener("click", toggleStartMenu);

  // "Programme »" per Klick auf-/zuklappen (Hover reicht auf Touch-Geräten nicht)
  programmeItem.addEventListener("click", (event) => {
    event.stopPropagation();
    programmeSubmenu.classList.toggle("submenu-offen");
  });

  // Klick irgendwo außerhalb schließt das Menü
  document.addEventListener("click", (event) => {
    if (!startMenu.contains(event.target)) {
      closeStartMenu();
    }
  });

  document.getElementById("shutdown-item").addEventListener("click", () => {
    alert("Beenden ist im Prototyp noch nicht implementiert.");
  });

  document.addEventListener("DOMContentLoaded", programmeMenuBefuellen);
})();
