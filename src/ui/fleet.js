/* Die Fuhrparkliste. Der Aufbau wird nur neu gezeichnet, wenn sich
   etwas an der Struktur ändert; laufende Balken werden gezielt aktualisiert. */

import { SKILLS } from '../config.js';
import { S, xpNeeded } from '../state.js';
import { esc, pips } from '../util.js';

let signature = null;

export function invalidateFleet() { signature = null; }

function currentSignature() {
  return S.trucks.map(t =>
    [t.nr, t.driver.level, t.driver.points, Object.values(t.driver.skills).join(''),
     t.phase, t.shopMin > 0 ? 1 : 0].join(':')).join('|');
}

function row(truck) {
  const d = truck.driver;
  const skills = Object.entries(SKILLS)
    .map(([key, s]) => `<span title="${s.name}">${s.icon}${pips(d.skills[key], s.max)}</span>`)
    .join(' ');

  return `
  <div style="padding:5px 3px;border-bottom:1px solid #e8e8e8;">
    <div class="flex-row" style="justify-content:space-between;">
      <span><strong>${esc(d.name)}</strong>
        <span class="muted">· LKW ${truck.nr} · St. ${d.level}</span></span>
      <span style="font-size:10px;" id="tst${truck.nr}"></span>
    </div>
    <div class="xpbar" style="margin:3px 0;"><div class="xpfill" id="xp${truck.nr}"></div></div>
    <div class="prog" style="margin:3px 0;"><div class="prog-fill" id="tpg${truck.nr}"></div></div>
    <div style="font-size:10px;margin:2px 0 3px;">${skills}</div>
    <div class="flex-row" style="justify-content:space-between;font-size:10px;">
      <label class="flex-row" style="gap:3px;">
        <input type="checkbox" ${truck.repeat ? 'checked' : ''}
               onchange="App.setRepeat(${truck.nr}, this.checked)">
        Dauerauftrag
      </label>
      <span class="flex-row" style="gap:4px;">
        ${d.points ? `<span class="ok">${d.points} Pkt.</span>` : ''}
        <button class="btn btn-sm" onclick="App.focusTruck(${truck.nr})">zeigen</button>
        <button class="btn btn-sm" onclick="App.openTraining(${truck.nr})">Schulung</button>
      </span>
    </div>
  </div>`;
}

export function renderFleet() {
  const box = document.getElementById('fleetBox');
  if (!box) return;

  const sig = currentSignature();
  if (sig !== signature) {
    signature = sig;
    box.innerHTML = S.trucks.map(row).join('');
  }

  for (const truck of S.trucks) {
    const status = document.getElementById('tst' + truck.nr);
    const bar    = document.getElementById('tpg' + truck.nr);
    const xp     = document.getElementById('xp'  + truck.nr);
    if (!status || !bar) continue;

    if (xp) xp.style.width = Math.min(100, truck.driver.xp / xpNeeded(truck.driver.level) * 100) + '%';
    bar.className = 'prog-fill';

    if (truck.shopMin > 0) {
      status.innerHTML = `<span class="warn">🔧 Werkstatt, ${Math.ceil(truck.shopMin / 60)} h</span>`;
      bar.classList.add('shop');
      bar.style.width = '100%';
    } else if (truck.phase === 'planning') {
      status.innerHTML = '<span class="muted">Route wird geplant …</span>';
      bar.style.width = '0';
    } else if (truck.phase === 'out' && truck.route) {
      status.innerHTML = `→ <strong>${esc(truck.order.firm.name.slice(0, 22))}</strong>`;
      bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
    } else if (truck.phase === 'back' && truck.route) {
      status.innerHTML = '<span class="warn">Rückfahrt</span>';
      bar.classList.add('back');
      bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
    } else {
      status.innerHTML = '<span class="muted">im Depot</span>';
      bar.style.width = '0';
    }
  }
}
