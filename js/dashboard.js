/* ================================================================
   DASHBOARD.JS
   Seiten-Logik nur für die Startseite. Braucht ICONS (icons.js)
   und NAV (nav-data.js) -- deshalb müssen die beiden vorher im
   HTML eingebunden sein.
   ================================================================ */

function startClock(){
  const el = document.getElementById('clock');
  if(!el) return;
  function tick(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    el.textContent = hh + ':' + mm;
  }
  tick();
  setInterval(tick, 15000);
}

function renderNavGrid(){
  const grid = document.getElementById('navGrid');
  if(!grid) return;

  NAV.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.innerHTML = `
      ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
      <span class="icon-wrap"><svg width="38" height="34" viewBox="0 0 40 38">${ICONS[item.key]}</svg></span>
      <span class="lbl">${item.label}</span>
    `;
    grid.appendChild(btn);
  });
}

startClock();
renderNavGrid();
