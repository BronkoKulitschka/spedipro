// windowmanager.js
// Stellt WindowManager.open(...) bereit, über das Programme (Fuhrpark,
// Tourenplanung, Personal, Buchhaltung, ...) ein eigenes Vollbild-
// Fenster auf dem Desktop öffnen können.
//
// Verhalten:
//  - Fenster sind Vollbild (füllen den ganzen Desktop-Bereich über der
//    Taskbar), daher kein Verschieben/Skalieren nötig.
//  - Pro App-id kann immer nur EIN Fenster offen sein. Ein erneuter
//    open()-Aufruf mit derselben id holt das bestehende Fenster nur
//    nach vorne, statt ein Duplikat zu erzeugen.
//  - Schließen nur über den X-Button in der Titelleiste.

const WindowManager = (function () {
  const windowLayer = document.getElementById("window-layer");
  let zCounter = 10;

  // id -> Fenster-Element, für das Singleton-Verhalten
  const offeneFenster = {};

  /**
   * @param {object} optionen
   * @param {string} optionen.id - eindeutige App-id (z.B. "fuhrpark").
   *   Ohne id wird jedes Mal ein neues Fenster erzeugt (kein Singleton).
   * @param {string} optionen.title - Titel in der Titelleiste
   * @param {string} optionen.content - initiales HTML des Fensterinhalts
   * @returns {{element: HTMLElement, wurdeNeuErstellt: boolean}}
   */
  function open({ id, title, content = "" }) {
    if (id && offeneFenster[id]) {
      const bestehendesFenster = offeneFenster[id];
      bringToFront(bestehendesFenster);
      return { element: bestehendesFenster, wurdeNeuErstellt: false };
    }

    const win = document.createElement("div");
    win.className = "win98-window bevel-out";
    if (id) win.dataset.appId = id;

    win.innerHTML = `
      <div class="win98-titlebar">
        <span class="win98-titlebar-title">${title}</span>
        <div class="win98-titlebar-controls">
          <button class="win98-btn-close bevel-out" title="Schließen">&times;</button>
        </div>
      </div>
      <div class="win98-window-content">${content}</div>
    `;

    windowLayer.appendChild(win);
    bringToFront(win);

    win.querySelector(".win98-btn-close").addEventListener("click", () => {
      win.remove();
      if (id) delete offeneFenster[id];
    });

    win.addEventListener("mousedown", () => bringToFront(win));

    if (id) offeneFenster[id] = win;

    return { element: win, wurdeNeuErstellt: true };
  }

  function bringToFront(win) {
    win.style.zIndex = zCounter++;
  }

  return { open };
})();
