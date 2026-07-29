/* Fuhrpark: Standort und Zustand aller LKW. */

import { SKILLS } from '../config.js';
import { S, xpNeeded, findTruck, atDepot, modelOf, resaleValue,
         driveStatus, canDrive } from '../state.js';
import { esc, pips, fmt, num } from '../util.js';
import { setAuto, returnToDepot, sellTruck } from '../sim/fleet.js';
import { openApp, onTick } from '../ui/wm.js';
import { focusTruck } from '../ui/map.js';

export const FleetApp = {
  id: 'fleet', icon: '🚛', title: () => 'Fuhrpark',
  width: 420, height: 440, desktop: true,

  body: () => `
    <div class="col fill">
      <div class="bar-note flex-row" style="justify-content:space-between;gap:6px;">
        <span id="flNote">—</span>
        <button class="btn btn-sm" id="flDealer">🏷️ Fahrzeughandel</button>
      </div>
      <div class="inset-box scroll fill" id="fleetBox" style="padding:4px;"></div>
    </div>`,

  mount(el) {
    const box = el.querySelector('#fleetBox');
    el.querySelector('#flDealer').onclick = () => openApp('dealer');

    box.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const nr = Number(btn.dataset.nr);
      if (btn.dataset.act === 'show')   focusTruck(findTruck(nr));
      if (btn.dataset.act === 'train')  openApp('training', { nr });
      if (btn.dataset.act === 'home')   returnToDepot(nr).then(onTick);
      if (btn.dataset.act === 'sell') {
        const truck = findTruck(nr);
        if (truck && confirm(`LKW ${nr} (${modelOf(truck).name}) für ${fmt(resaleValue(truck))} verkaufen?`)) {
          sellTruck(nr);
          box.dataset.sig = '';
        }
      }
      onTick();
    });

    box.addEventListener('change', e => {
      const cb = e.target.closest('input[data-nr]');
      if (!cb) return;
      setAuto(Number(cb.dataset.nr), cb.checked);
      onTick();
    });
  },

  update(el) {
    const box = el.querySelector('#fleetBox');
    const free = S.trucks.filter(t => t.phase === 'idle' && !t.shopMin).length;
    const auto = S.trucks.filter(t => t.auto).length;
    el.querySelector('#flNote').textContent =
      `${S.trucks.length} LKW · ${free} verfügbar · ${auto} auf Automatik`;

    const sig = S.trucks.map(t =>
      [t.nr, t.model, t.driver.level, t.driver.points, Object.values(t.driver.skills).join(''),
       t.phase, t.auto ? 1 : 0, t.place, t.shopMin > 0 ? 1 : 0,
       t.restMin > 0 ? 1 : 0,
       Math.floor((t.odo || 0) / 1000)].join(':')).join('|');

    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig;
      box.innerHTML = S.trucks.map(row).join('');
    }

    for (const truck of S.trucks) {
      const status = box.querySelector(`#tst${truck.nr}`);
      const bar    = box.querySelector(`#tpg${truck.nr}`);
      const xp     = box.querySelector(`#xp${truck.nr}`);
      if (!status || !bar) continue;

      if (xp) xp.style.width = Math.min(100, truck.driver.xp / xpNeeded(truck.driver.level) * 100) + '%';
      bar.className = 'prog-fill';

      if (truck.shopMin > 0) {
        status.innerHTML = `<span class="warn">🔧 Werkstatt, ${Math.ceil(truck.shopMin / 60)} h</span>`;
        bar.classList.add('shop');
        bar.style.width = '100%';
      } else if (truck.restMin > 0) {
        status.innerHTML = `<span class="warn">${esc(driveStatus(truck).text)}</span>`;
        bar.classList.add('shop');
        bar.style.width = truck.route
          ? Math.min(100, truck.progress / truck.route.km * 100) + '%' : '0';
      } else if (truck.phase === 'planning') {
        status.innerHTML = '<span class="muted">Route wird geplant …</span>';
        bar.style.width = '0';
      } else if (truck.phase === 'driving' && truck.route) {
        const ziel = truck.job?.kind === 'return' ? 'Depot' : truck.job?.firm?.name || '';
        status.innerHTML = `→ <strong>${esc(ziel.slice(0, 20))}</strong>`;
        if (truck.job?.kind === 'return') bar.classList.add('back');
        bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
      } else {
        const st = driveStatus(truck);
        status.innerHTML = st.code === 'frei'
          ? '<span class="muted">steht</span>'
          : `<span class="warn">${esc(st.text)}</span>`;
        bar.style.width = '0';
      }
    }
  },
};

function row(truck) {
  const d = truck.driver;
  const skills = Object.entries(SKILLS)
    .map(([key, s]) => `<span title="${s.name}">${s.icon}${pips(d.skills[key], s.max)}</span>`)
    .join(' ');

  const m = modelOf(truck);
  const stehtWo = truck.phase === 'idle'
    ? `<span class="muted">bei ${esc(truck.place)}</span>`
    : '<span class="muted">unterwegs</span>';

  return `
  <div class="truck-row">
    <div class="flex-row" style="justify-content:space-between;">
      <span><strong>${esc(d.name)}</strong>
        <span class="muted">· LKW ${truck.nr} · St. ${d.level}</span></span>
      <span style="font-size:10px;" id="tst${truck.nr}"></span>
    </div>
    <div style="font-size:10px;margin:2px 0;">
      ${esc(m.name)}${truck.used ? ' <span class="muted">· gebraucht</span>' : ''}
      <span class="muted">· ${num(truck.odo || 0)} km</span> · ${stehtWo}
    </div>
    <div class="xpbar" style="margin:3px 0;"><div class="xpfill" id="xp${truck.nr}"></div></div>
    <div class="prog" style="margin:3px 0;"><div class="prog-fill" id="tpg${truck.nr}"></div></div>
    <div style="font-size:10px;margin:2px 0 4px;">${skills}</div>
    <div class="flex-row" style="justify-content:space-between;font-size:10px;flex-wrap:wrap;gap:4px;">
      <label class="flex-row" style="gap:3px;" title="Sucht sich selbst den nächsten Auftrag">
        <input type="checkbox" data-nr="${truck.nr}" ${truck.auto ? 'checked' : ''}>
        Automatik
      </label>
      <span class="flex-row" style="gap:4px;">
        ${d.points ? `<span class="ok">${d.points} Pkt.</span>` : ''}
        <button class="btn btn-sm" data-act="home" data-nr="${truck.nr}"
          ${truck.phase === 'idle' && !truck.shopMin && !atDepot(truck) ? '' : 'disabled'}>ins Depot</button>
        <button class="btn btn-sm" data-act="show"  data-nr="${truck.nr}">zeigen</button>
        <button class="btn btn-sm" data-act="train" data-nr="${truck.nr}">Schulung</button>
        <button class="btn btn-sm" data-act="sell" data-nr="${truck.nr}"
          title="Wiederverkaufswert ${fmt(resaleValue(truck))}"
          ${truck.phase === 'idle' && !truck.shopMin && S.trucks.length > 1 ? '' : 'disabled'}>verkaufen</button>
      </span>
    </div>
  </div>`;
}
