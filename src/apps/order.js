/* Ein Auftrag im Einzelnen.

   Die Auftragsliste zeigt nur so viel, dass man wählen kann. Alles
   Weitere — Ladung, Auftraggeber, Ladeschema und die Entscheidung —
   steht hier. */

import { S, findTruck, truckKmh, verfuegbar } from '../state.js';
import { fmt, esc, num } from '../util.js';
import { klasseVon, passt, kapazitaet } from '../sim/goods.js';
import { fahrtenZu, stufeVon } from '../sim/customers.js';
import { charakterVon, stimmung, zustandVon } from '../sim/clients.js';
import { KIND_LABEL, takeOffer } from '../sim/orders.js';
import { dispatch, startTour, umwegFuer, distanceFrom } from '../sim/fleet.js';
import { ladeBild } from '../ui/ladeschema.js';
import { gesichtVon, onBildBereit } from '../ui/sprites.js';
import { EQUIPMENT } from '../config.js';
import { openApp, closeWindow, onTick, fensterInhalt } from '../ui/wm.js';
import { empty } from './shared.js';

export const OrderApp = {
  id: 'auftrag', icon: '📦', multi: true, hidden: true,
  title: p => {
    const o = S.offers.find(x => x.id === p.id);
    return o ? `Auftrag — ${o.firm.name}` : 'Auftrag';
  },
  width: 400, height: 520,

  body: () => `
    <div class="col fill">
      <div class="scroll fill" id="auInhalt"></div>
      <div class="au-wahl" id="auWahl"></div>
    </div>`,

  mount(el, params) {
    el.addEventListener('click', e => {
      const o = S.offers.find(x => x.id === params.id);
      if (!o) return;

      if (e.target.closest('#auVerhandeln')) {
        openApp('haggle', { id: o.id });
        return;
      }

      if (e.target.closest('#auLaden')) {
        /* Die Ladeliste gehört dem Dispositionsfenster — dorthin
           weiterreichen. */
        const dispo = fensterInhalt('dispo');
        if (dispo && !dispo._lade.some(x => x.id === o.id)) dispo._lade.push(o);
        closeWindow(`auftrag:${o.id}`);
        openApp('dispo');
        onTick();
        return;
      }

      if (e.target.closest('#auSofort')) {
        const nr = gewaehltesFahrzeug()?.nr;
        if (!nr) return;
        dispatch(o.id, nr).then(() => onTick());
        closeWindow(`auftrag:${o.id}`);
        onTick();
      }
    });

    el.addEventListener('change', e => {
      if (e.target.closest('#auTruck')) {
        el._truckNr = Number(e.target.value);
        el.dataset.sig = '';
        onTick();
      }
    });

    onBildBereit(() => { el.dataset.sig = ''; onTick(); });
  },

  update(el, params) {
    const o = S.offers.find(x => x.id === params.id);

    if (!o) {
      el.querySelector('#auInhalt').innerHTML =
        empty('Dieser Auftrag ist nicht mehr verfügbar.');
      el.querySelector('#auWahl').innerHTML =
        `<div class="flex-row" style="padding:5px 6px;">
           <button class="btn" onclick="void 0" id="auZu">schließen</button>
         </div>`;
      return;
    }

    const truck = gewaehltesFahrzeug(el);
    const dispo = fensterInhalt('dispo');
    const lade = dispo?._lade?.filter(x => x.id !== o.id) || [];

    const sig = [o.id, o.fee, o.verhandelt ? 1 : 0, truck?.nr ?? '-',
                 lade.map(x => x.id).join(','), zustandVon(o.firm.name)?.key || ''].join('|');
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;

    el.querySelector('#auInhalt').innerHTML = inhalt(o, truck, lade);
    el.querySelector('#auWahl').innerHTML = wahl(o, truck, lade);
  },
};

function gewaehltesFahrzeug(el) {
  const frei = S.trucks.filter(verfuegbar);
  if (!frei.length) return null;

  if (el?._truckNr) {
    const t = frei.find(x => x.nr === el._truckNr);
    if (t) return t;
  }
  return frei[0];
}

function inhalt(o, truck, lade) {
  const g = klasseVon(o.klasse);
  const art = KIND_LABEL[o.kind || 'spot'];
  const c = charakterVon(o.firm.name);
  const st = stimmung(o.firm.name);
  const z = zustandVon(o.firm.name);
  const beziehung = stufeVon(fahrtenZu(o.firm.name));

  const km = truck ? distanceFrom(truck, o.firm) * 1.28 : o.estKm;
  const tempo = truck ? truckKmh(truck) : 62;
  const minuten = km / tempo * 60;
  const zeit = minuten < 60
    ? `${Math.round(minuten)} min`
    : `${Math.floor(minuten / 60)}:${String(Math.round(minuten % 60)).padStart(2, '0')} h`;

  const pruef = truck ? passt(truck, lade, o) : { ok: false, grund: 'kein Fahrzeug frei' };
  const umweg = truck && lade.length ? umwegFuer(truck, lade, o) : null;

  const frei = S.trucks.filter(verfuegbar);

  return `
    <div class="au-kopf">
      <div class="flex-row" style="justify-content:space-between;align-items:flex-start;">
        <span>
          <span class="art-tag">${art.icon} ${art.text}</span><br>
          <strong>${esc(o.firm.name)}</strong>
        </span>
        <span class="au-preis">${fmt(o.fee)}</span>
      </div>
      ${o.verhandelt && o.grundpreis && o.fee !== o.grundpreis
        ? `<div class="verhandelt">💬 verhandelt: ${fmt(o.grundpreis)} → ${fmt(o.fee)}</div>`
        : ''}
    </div>

    <div class="pad">
      ${o.abholung ? `
        <div class="relation">
          📦 laden bei ${esc(o.abholung.name.slice(0, 24))}
          <span class="pfeil">→</span> ${esc(o.firm.name.slice(0, 24))}
        </div>` : ''}

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Ladung</div>
        <div class="daten-reihe">
          <span class="datum"><span class="dl">Gut</span><span class="dw">${g.icon} ${esc(g.name)}</span></span>
        </div>
        <div class="daten-reihe">
          <span class="datum"><span class="dl">Menge</span><span class="dw">${o.paletten} Paletten</span></span>
          <span class="datum"><span class="dl">Gewicht</span><span class="dw">${(o.gewicht / 1000).toFixed(1)} t</span></span>
        </div>
        ${g.braucht ? `
          <div class="warn" style="font-size:10px;margin-top:3px;">
            ${EQUIPMENT[g.braucht].icon} ${esc(EQUIPMENT[g.braucht].name)} erforderlich
          </div>` : ''}
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Strecke</div>
        <div class="daten-reihe">
          <span class="datum"><span class="dl">Entfernung</span><span class="dw">${Math.round(km)} km</span></span>
          <span class="datum"><span class="dl">Fahrzeit</span><span class="dw">ca. ${zeit}</span></span>
          ${umweg !== null
            ? `<span class="datum"><span class="dl">Umweg</span><span class="dw">+${umweg.toFixed(0)} km</span></span>`
            : ''}
        </div>
        <div class="daten-reihe">
          <span class="datum"><span class="dl">Erlös je km</span>
            <span class="dw">${km > 0 ? (o.fee / km).toFixed(2) : '—'} €</span></span>
        </div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Auftraggeber</div>
        <div class="verh-person">
          <span class="verh-portraet">${gesichtVon(c.key) || c.icon}</span>
          <span>
            ${esc(c.name)} ·
            <span class="stimmung-${st.stufe}">${esc(st.text)}</span><br>
            <span class="muted">${esc(c.text)}</span>
            ${beziehung.rate > 1
              ? `<br><span class="ok">${esc(beziehung.name)} · +${Math.round((beziehung.rate - 1) * 100)} %</span>`
              : ''}
            ${z ? `<br>${z.icon} <strong>${esc(z.name)}</strong>` : ''}
          </span>
        </div>
      </div>

      <div class="raised-box">
        <div class="section-title">Beladung</div>
        <div class="flex-row" style="gap:6px;margin-bottom:6px;">
          <span style="font-size:10px;">Fahrzeug:</span>
          <select id="auTruck" style="flex:1;">
            ${frei.length
              ? frei.map(t => `<option value="${t.nr}" ${truck?.nr === t.nr ? 'selected' : ''}>
                   LKW ${t.nr} · ${esc(t.place)}</option>`).join('')
              : '<option value="">kein Fahrzeug frei</option>'}
          </select>
        </div>

        ${truck ? ladeBild(truck, lade, o) : ''}

        <div class="${pruef.ok ? 'fahrbar' : 'unfahrbar'}" style="margin-top:6px;">
          ${pruef.ok
            ? '✔ Passt auf dieses Fahrzeug.'
            : `✘ <strong>${esc(pruef.grund)}</strong>`}
        </div>
      </div>
    </div>`;
}

function wahl(o, truck, lade) {
  const pruef = truck ? passt(truck, lade, o) : { ok: false };

  return `
    <div class="flex-row" style="gap:4px;padding:5px 6px;flex-wrap:wrap;">
      ${o.kind === 'spot' && !o.verhandelt
        ? '<button class="btn btn-sm" id="auVerhandeln">💬 verhandeln</button>' : ''}
      <span class="flex-row" style="gap:4px;margin-left:auto;">
        <button class="btn btn-sm" id="auLaden" ${pruef.ok ? '' : 'disabled'}>
          + auf die Ladeliste</button>
        <button class="btn btn-default btn-sm" id="auSofort" ${pruef.ok ? '' : 'disabled'}>
          sofort starten</button>
      </span>
    </div>`;
}
