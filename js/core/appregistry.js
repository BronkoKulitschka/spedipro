// appregistry.js
// Zentrale Anlaufstelle, über die sich Programme (Fuhrpark, später
// Tourenplanung, Personal, Buchhaltung, ...) selbst eintragen. Das
// Startmenü liest diese Liste aus, statt dass jedes neue Programm
// zusätzlich in startmenu.js/index.html verdrahtet werden muss.

const AppRegistry = (function () {
  const apps = [];

  function register(app) {
    if (!app.id || !app.name || typeof app.open !== "function") {
      throw new Error("App-Registrierung braucht mindestens id, name, open()");
    }
    apps.push(app);
  }

  function getAll() {
    return apps.slice();
  }

  return { register, getAll };
})();
