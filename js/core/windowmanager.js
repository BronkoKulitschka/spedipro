// windowmanager.js
// Stellt WindowManager.open(...) bereit, über das Programme (Fuhrpark,
// Tourenplanung, Personal, Buchhaltung, ...) ein eigenes Vollbild-
// Fenster auf dem Desktop öffnen können.
//
// Verhalten:
//  - Fenster sind Vollbild, daher kein Verschieben/Skalieren nötig.
//  - Pro App-id kann immer nur EIN Fenster offen sein (Singleton).
//  - Minimieren-Button legt das Fenster in die Taskleiste; ein Klick
//    auf den Taskleisten-Eintrag holt es wieder in den Vordergrund.
//  - Schließen (X) entfernt Fenster UND Taskleisten-Eintrag komplett.

const WindowManager = (function () {
  const windowLayer = document.getElementById("window-layer");
  const taskbarWindows = document.getElementById("taskbar-windows");
  let zCounter = 10;

  // id -> { element, taskbarButton, minimiert }
  const offeneFenster = {};

  function open({ id, title, content = "" }) {
    if (id && offeneFenster[id]) {
      restoreFenster(id);
      return { element: offeneFenster[id].element, wurdeNeuErstellt: false };
    }

    const win = document.createElement("div");
    win.className = "win98-window bevel-out";
    if (id) win.dataset.appId = id;

    win.innerHTML = `
      <div class="win98-titlebar">
        <span class="win98-titlebar-title">${title}</span>
        <div class="win98-titlebar-controls">
          <button class="win98-btn-minimize bevel-out" title="Minimieren">_</button>
          <button class="win98-btn-close bevel-out" title="Schließen">&times;</button>
        </div>
      </div>
      <div class="win98-window-content">${content}</div>
    `;

    windowLayer.appendChild(win);
    bringToFront(win);

    win.addEventListener("mousedown", () => bringToFront(win));

    win.querySelector(".win98-btn-close").addEventListener("click", () => {
      schliesseFenster(id);
    });

    let taskbarButton = null;
    if (id) {
      taskbarButton = document.createElement("button");
      taskbarButton.className = "taskbar-fenster-button win98-button bevel-out";
      taskbarButton.textContent = title;
      taskbarButton.addEventListener("click", () => restoreFenster(id));
      taskbarWindows.appendChild(taskbarButton);

      win.querySelector(".win98-btn-minimize").addEventListener("click", () => {
        minimiereFenster(id);
      });

      offeneFenster[id] = { element: win, taskbarButton, minimiert: false };
    } else {
      // Fenster ohne id: kein Singleton, kein Taskleisten-Eintrag,
      // Minimieren-Button entfernen wir dann besser gleich, da es ohne
      // Taskleisten-Eintrag nicht wieder auffindbar wäre.
      win.querySelector(".win98-btn-minimize").remove();
    }

    return { element: win, wurdeNeuErstellt: true };
  }

  function minimiereFenster(id) {
    const eintrag = offeneFenster[id];
    if (!eintrag) return;
    eintrag.element.classList.add("minimiert");
    eintrag.minimiert = true;
    eintrag.taskbarButton.classList.add("taskbar-fenster-minimiert");
  }

  function restoreFenster(id) {
    const eintrag = offeneFenster[id];
    if (!eintrag) return;
    eintrag.element.classList.remove("minimiert");
    eintrag.minimiert = false;
    eintrag.taskbarButton.classList.remove("taskbar-fenster-minimiert");
    bringToFront(eintrag.element);
  }

  function schliesseFenster(id) {
    if (id && offeneFenster[id]) {
      offeneFenster[id].element.remove();
      offeneFenster[id].taskbarButton.remove();
      delete offeneFenster[id];
    }
  }

  function bringToFront(win) {
    win.style.zIndex = zCounter++;
  }

  /** Schließt ein Fenster von außen, z.B. über einen Zurück-Button. */
  function schliessen(id) {
    schliesseFenster(id);
  }

  /** Ist ein Fenster mit dieser id gerade offen? */
  function istOffen(id) {
    return Boolean(offeneFenster[id]);
  }

  return { open, schliessen, istOffen };
})();
