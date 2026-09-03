/* Fuhrpark: Standort und Zustand aller LKW. */

import { SKILLS } from '../config.js';
import { S, xpNeeded, findTruck, atDepot, modelOf, resaleValue,
         driveStatus, canDrive, bestand, truckFix, fixGesamt,
         faehrtLeer, verfuegbar, driverOf, fahrerOderErsatz } from '../state.js';
import { esc, pips, fmt, num, truckFarbe } from '../util.js';
import { kapazitaet, klasseVon } from '../sim/goods.js';
import { EQUIPMENT } from '../config.js';
import { setAuto, returnToDepot, sellTruck } from '../sim/fleet.js';
import { openApp, onTick } from '../ui/wm.js';
import { automatikFrei, stufeFuerAutomatik } from '../sim/progress.js';
import { kasseLeiste, kasseAktualisieren } from './shared.js';
import { fahrerBild, onBildBereit } from '../ui/sprites.js';
import { geschlechtVon } from '../sim/staff.js';
import { traitsVon } from '../sim/persons.js';
import { focusTruck } from '../ui/map.js';

export const FleetApp = {
  id: 'fleet', icon: '🚛', title: () => 'Fuhrpark',
  width: 420, height: 440, desktop: true,

  body: () => `
    <div class="col fill sc2000">
      ${kasseLeiste()}
      <div class="col" style="gap:0;">
        <div class="sc-fuss-reihe" style="padding:6px 10px 0;">
          <span id="flNote">—</span>
        </div>
        <div class="sc-bestand" id="flBestand"></div>
      </div>
      <div class="scroll fill" id="fleetBox" style="padding:8px;background:var(--sc-hintergrund);"></div>
    </div>`,

  mount(el) {
    const box = el.querySelector('#fleetBox');

    onBildBereit(() => { box.dataset.sig = ''; onTick(); });

    box.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const nr = Number(btn.dataset.nr);
      if (btn.dataset.act === 'show') { openApp('dispo'); focusTruck(findTruck(nr)); }
      if (btn.dataset.act === 'personal') { openApp('staff'); return; }
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
    kasseAktualisieren(el, `${fixGesamt().toLocaleString('de-DE')} € Fixkosten je Tag`);

    const box = el.querySelector('#fleetBox');
    const free = S.trucks.filter(t => t.phase === 'idle' && !t.shopMin).length;
    const auto = S.trucks.filter(t => t.auto).length;
    el.querySelector('#flNote').textContent =
      `${S.trucks.length} Fahrzeuge · ${free} verfügbar · ${auto} auf Automatik`;

    /* Bestand nach Bauart, damit man die Zusammensetzung sieht,
       ohne die ganze Liste durchzugehen. */
    const zaehler = bestand();
    const bestandSig = Object.entries(zaehler).map(([k, v]) => `${k}:${v.gesamt}`).join(',');
    const bestandBox = el.querySelector('#flBestand');

    if (bestandBox.dataset.sig !== bestandSig) {
      bestandBox.dataset.sig = bestandSig;
      bestandBox.innerHTML = Object.entries(zaehler)
        .sort((a, b) => b[1].gesamt - a[1].gesamt)
        .map(([key, v]) => {
          const m = modelOf({ model: key });
          return `<span title="${esc(m.klasse)} · Führerschein ${m.fs}">
            <strong>${v.gesamt}×</strong> ${esc(m.name)}${v.gebraucht ? `
            (${v.gebraucht} gebr.)` : ''}
          </span>`;
        }).join('');
    }

    const sig = S.trucks.map(t =>
      [t.nr, t.model, fahrerOderErsatz(t).level, fahrerOderErsatz(t).points, Object.values(fahrerOderErsatz(t).skills).join(''),
       t.phase, t.auto ? 1 : 0, t.place, t.shopMin > 0 ? 1 : 0, S.level,
       t.restMin > 0 ? 1 : 0, t.job?.klasse || '', t.job?.stopp || 0,
       t.rastZiel ? 1 : 0, t.rastOrt || '', faehrtLeer(t) ? 1 : 0,
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

      if (xp) xp.style.width = Math.min(100, fahrerOderErsatz(truck).xp / xpNeeded(fahrerOderErsatz(truck).level) * 100) + '%';
      bar.className = 'sc-balken-fuellung';

      if (truck.shopMin > 0) {
        status.innerHTML = `<span class="sc-wert-schlecht">🔧 Werkstatt, ${Math.ceil(truck.shopMin / 60)} h</span>`;
        bar.classList.add('sc-warnung');
        bar.style.width = '100%';
      } else if (truck.restMin > 0 && truck.restKind === 'rampe') {
        status.innerHTML = `<span class="sc-dim">📦 ${esc(driveStatus(truck).text)}</span>`;
        bar.style.width = '100%';
      } else if (truck.restMin > 0) {
        status.innerHTML = `<span class="sc-wert-schlecht">🅿️ ${esc(driveStatus(truck).text)}</span>`;
        bar.classList.add('sc-warnung');
        bar.style.width = truck.route
          ? Math.min(100, truck.progress / truck.route.km * 100) + '%' : '0';
      } else if (truck.phase === 'planning') {
        status.innerHTML = '<span class="sc-dim">Route wird geplant …</span>';
        bar.style.width = '0';
      } else if (truck.phase === 'driving' && truck.rastZiel) {
        status.innerHTML = `<span class="sc-wert-schlecht">🅿️ ${esc(truck.rastZiel.name.slice(0, 22))}</span>`;
        bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
      } else if (faehrtLeer(truck)) {
        status.innerHTML = '<span class="sc-wert-gut">↩ Leerfahrt · verfügbar</span>';
        bar.classList.add('sc-zurueck');
        bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
      } else if (truck.phase === 'driving' && truck.route) {
        const ziel = truck.job?.kind === 'return' ? 'Depot' : truck.job?.firm?.name || '';
        status.innerHTML = `→ <strong>${esc(ziel.slice(0, 20))}</strong>`;
        if (truck.job?.kind === 'return') bar.classList.add('sc-zurueck');
        bar.style.width = Math.min(100, truck.progress / truck.route.km * 100) + '%';
      } else {
        const st = driveStatus(truck);
        status.innerHTML = st.code === 'frei'
          ? '<span class="sc-dim">steht</span>'
          : `<span class="sc-wert-schlecht">${esc(st.text)}</span>`;
        bar.style.width = '0';
      }
    }
  },
};

function row(truck) {
  const d = driverOf(truck);
  const m = modelOf(truck);
  const kap = kapazitaet(truck);

  const stehtWo = truck.phase === 'idle' ? `bei ${esc(truck.place)}` : 'unterwegs';

  return `
  <div class="sc-lkw-karte sc-pixelrand">
    <div class="sc-lkw-karte-innen">
      <div class="sc-lkw-kopf">
        <span class="sc-lkw-titel">
          <span class="sc-farb-punkt" style="background:${truckFarbe(truck.nr).kraeftig}"></span>
          LKW ${truck.nr} <span class="sc-dim">· ${esc(m.name)}</span>
          ${(truck.equip || []).map(k => EQUIPMENT[k]?.icon || '').join('')}
        </span>
        <span class="sc-lkw-status" id="tst${truck.nr}"></span>
      </div>

      <div class="sc-dim">
        ${truck.used ? 'gebraucht · ' : ''}${num(truck.odo || 0)} km · ${stehtWo}
      </div>

      <div class="sc-daten-reihe">
        <span class="sc-datum"><span class="sc-dl">Nutzlast</span><span class="sc-dw">${(kap.kg / 1000).toFixed(1)} t</span></span>
        <span class="sc-datum"><span class="sc-dl">Plätze</span><span class="sc-dw">${kap.paletten}</span></span>
        <span class="sc-datum"><span class="sc-dl">zGG</span><span class="sc-dw">${(m.zgg / 1000).toFixed(1)} t</span></span>
        <span class="sc-datum"><span class="sc-dl">Fix/Tag</span><span class="sc-dw">${truckFix(truck)} €</span></span>
      </div>

      <div class="sc-fahrer-zeile">
        ${d
          ? `<span class="sc-fahrer-bildnis">${fahrerBild(d.id, geschlechtVon(d))}</span>
             <strong>${esc(d.name)}</strong>
             <span class="sc-dim">· Stufe ${d.level}</span>
             ${d.points ? `<span class="sc-wert-gut">· ${d.points} Pkt. frei</span>` : ''}`
          : '<span class="sc-wert-schlecht">👤 kein Fahrer — das Fahrzeug steht</span>'}
        <button class="sc-btn sc-pixelrand-klein" style="margin-left:auto;" data-act="personal">Personal</button>
      </div>

      ${ladeZeile(truck, kap)}
      <div class="sc-balken"><div class="sc-balken-fuellung" id="tpg${truck.nr}"></div></div>

      <div class="sc-fuss-reihe">
        ${automatikFrei()
          ? `<label style="display:flex;align-items:center;gap:4px;" title="Sucht sich selbst den nächsten Auftrag">
               <input type="checkbox" data-nr="${truck.nr}" ${truck.auto ? 'checked' : ''}>
               Automatik
             </label>`
          : `<span class="sc-dim" title="Wird mit der Betriebsstufe frei">
               🔒 Automatik ab Stufe ${stufeFuerAutomatik()}</span>`}
        <span style="display:flex;gap:4px;">
          <button class="sc-btn sc-pixelrand-klein" data-act="home" data-nr="${truck.nr}"
            ${truck.phase === 'idle' && !truck.shopMin && !atDepot(truck) ? '' : 'disabled'}>ins Depot</button>
          <button class="sc-btn sc-pixelrand-klein" data-act="show"  data-nr="${truck.nr}">zeigen</button>
          <button class="sc-btn sc-pixelrand-klein" data-act="sell" data-nr="${truck.nr}"
            title="Wiederverkaufswert ${fmt(resaleValue(truck))}"
            ${truck.phase === 'idle' && !truck.shopMin && S.trucks.length > 1 ? '' : 'disabled'}>verkaufen</button>
        </span>
      </div>
    </div>
  </div>`;
}

/* Was gerade auf dem Fahrzeug liegt, mit Auslastung. */
function ladeZeile(truck, kap) {
  const job = truck.job;
  if (!job || job.kind !== 'delivery') return '';

  const g = klasseVon(job.klasse);
  const pal = Math.min(100, (job.paletten || 0) / kap.paletten * 100);
  const kg  = Math.min(100, (job.gewicht || 0) / kap.kg * 100);
  const voll = Math.max(pal, kg);

  return `
    <div class="sc-dim" style="margin:2px 0;">
      geladen: ${g.icon} ${esc(g.name)} ·
      ${job.paletten} Pal. · ${((job.gewicht || 0) / 1000).toFixed(1)} t
      (${Math.round(voll)} % ausgelastet)
      ${job.stopps > 1 ? `<span class="sc-wert-gut">· Stopp ${job.stopp} von ${job.stopps}</span>` : ''}
    </div>
    <div class="sc-balken" style="height:6px;">
      <div class="sc-balken-fuellung ${voll > 92 ? 'sc-voll' : ''}" style="width:${voll}%"></div>
    </div>`;
}
