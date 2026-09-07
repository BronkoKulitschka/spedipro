// windowmanager.js
// Stellt WindowManager.open(...) bereit, über das spätere Programme
// (Fuhrpark, Tourenplanung, Personal, Buchhaltung) ein eigenes
// Win98-Fenster auf dem Desktop öffnen können.
//
// Bewusst noch ohne Speicherung/Minimieren-Logik in der Taskbar -
// das kommt, sobald das erste echte Programm existiert und die
// Anforderungen klarer sind.

const WindowManager = (function () {
  const windowLayer = document.getElementById("window-layer");
  let zCounter = 10;
  let openCount = 0;

  function open({ title, width = 400, height = 300, content = "" }) {
    openCount++;
    const id = `window-${openCount}`;

    const win = document.createElement("div");
    win.className = "win98-window bevel-out";
    win.id = id;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${40 + openCount * 20}px`;
    win.style.top = `${40 + openCount * 20}px`;
    win.style.zIndex = zCounter++;

    win.innerHTML = `
      <div class="win98-titlebar">
        <span class="win98-titlebar-title">${title}</span>
        <div class="win98-titlebar-controls">
          <button class="win98-btn-minimize bevel-out" title="Minimieren">_</button>
          <button class="win98-btn-maximize bevel-out" title="Maximieren">&#9633;</button>
          <button class="win98-btn-close bevel-out" title="Schließen">&times;</button>
        </div>
      </div>
      <div class="win98-window-content">${content}</div>
    `;

    windowLayer.appendChild(win);
    bringToFront(win);
    makeDraggable(win);

    win.querySelector(".win98-btn-close").addEventListener("click", () => {
      win.remove();
    });

    win.addEventListener("mousedown", () => bringToFront(win));

    return win;
  }

  function bringToFront(win) {
    win.style.zIndex = zCounter++;
  }

  function makeDraggable(win) {
    const titlebar = win.querySelector(".win98-titlebar");
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    titlebar.addEventListener("mousedown", (event) => {
      dragging = true;
      offsetX = event.clientX - win.offsetLeft;
      offsetY = event.clientY - win.offsetTop;
    });

    document.addEventListener("mousemove", (event) => {
      if (!dragging) return;
      win.style.left = `${event.clientX - offsetX}px`;
      win.style.top = `${event.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  return { open };
})();
