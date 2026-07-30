/* Disposition: Karte und Auftragsliste in einem Fenster.

   Links die Karte mit Fahrzeugen, Aufträgen und Umschlagpunkten, rechts
   die Liste. Beides hängt zusammen: Ein angetippter Auftrag zeigt sich
   auf der Karte, ein angetipptes Fahrzeug rückt in den Ausschnitt.
   Auf schmalen Geräten liegt die Liste unter der Karte. */

import { S, findTruck, canDrive, banReason, truckPos } from '../state.js';
import { fmt, esc } from '../util.js';
import { dispatch, distanceFrom, startTour, umwegFuer } from '../sim/fleet.js';
import { KIND_LABEL, takeOffer } from '../sim/orders.js';
import { kapazitaet, summe, passt, klasseVon } from '../sim/goods.js';
import { onTick } from '../ui/wm.js';
import { initMap, ensureMapSize, mapHost, drawOffers, drawTrucks,
         toggleLayer, onOfferAccept, focusPoint, fitAll, zeigeFahrzeug } from '../ui/map.js';
import { empty } from './shared.js';

/* Tief genug, dass Straßen und Hausnummern zu erkennen sind. */
const DETAIL_ZOOM = 14;

export const DispoApp = {
  id: 'dispo', icon: '🗺️', title: () => 'Disposition', kurz: 'Disposition\nund Karte', desktop: true,
  width: 820, height: 560, startMaximized: false,

  body: () => `
    <div class="dispo-split fill">

      <div class="dispo-map col">
        <div class="bar-note flex-row" style="justify-content:space-between;gap:6px;flex-wrap:wrap;">
          <span class="flex-row" style="gap:4px;">
            <button class="btn btn-sm" data-view="all">Deutschland</button>
            <button class="btn btn-sm" data-view="depot">Depot</button>
          </span>
          <span class="flex-row" style="gap:7px;font-size:10px;flex-wrap:wrap;">
            <label class="flex-row" style="gap:3px;"><input type="checkbox" checked data-layer="trucks">🚛</label>
            <label class="flex-row" style="gap:3px;"><input type="checkbox" checked data-layer="offers">📦</label>
            <label class="flex-row" style="gap:3px;"><input type="checkbox" checked data-layer="hubs">✈️</label>
            <label class="flex-row" style="gap:3px;"><input type="checkbox" checked data-layer="firms">Betriebe</label>
            <label class="flex-row" style="gap:3px;"><input type="checkbox" checked data-layer="traffic">🚧</label>
          </span>
        </div>
        <div class="map-frame fill" id="mapSlot"></div>
      </div>

      <div class="dispo-list col">
        <div class="bar-note col" style="gap:4px;">
          <div class="flex-row" style="gap:6px;">
            <span style="flex-shrink:0;">Fahrzeug:</span>
            <select id="dTruck" style="flex:1;"></select>
            <button class="btn btn-sm" id="dShow" title="auf der Karte zeigen">🔍</button>
          </div>
          <div id="dNote">—</div>
        </div>

        <div class="lade-box" id="ladeBox"></div>

        <div class="inset-box scroll fill" id="offerBox"></div>
      </div>

    </div>`,

  mount(el) {
    /* Die Ladeliste lebt im Fenster, nicht im Spielstand — sie ist eine
       Planung, die erst mit dem Start der Tour wirksam wird. */
    el._lade = [];

    el.querySelector('#mapSlot').appendChild(mapHost());
    initMap();
    ensureMapSize();

    onOfferAccept((offerId, truckNr) => {
      dispatch(offerId, truckNr).then(() => { drawOffers(); onTick(); });
      onTick();
    });

    el.addEventListener('change', e => {
      const cb = e.target.closest('input[data-layer]');
      if (cb) { toggleLayer(cb.dataset.layer, cb.checked); return; }
      if (e.target.closest('#dTruck')) {
        el.querySelector('#offerBox').dataset.sig = '';
        const t = findTruck(Number(el.querySelector('#dTruck').value));
        if (t) { const p = truckPos(t); focusPoint(p.lat, p.lon, DETAIL_ZOOM); }
        onTick();
      }
    });

    el.addEventListener('click', e => {
      const view = e.target.closest('button[data-view]');
      if (view) {
        if (view.dataset.view === 'all') fitAll();
        else focusPoint(S.depot.lat, S.depot.lon, 10);
        return;
      }

      if (e.target.closest('#dShow')) {
        const t = findTruck(Number(el.querySelector('#dTruck').value));
        const p = t ? truckPos(t) : S.depot;
        focusPoint(p.lat, p.lon, DETAIL_ZOOM);
        if (t) zeigeFahrzeug(t);
        return;
      }

      /* Sendung auf die Ladeliste nehmen */
      const plus = e.target.closest('button[data-add]');
      if (plus) {
        const o = S.offers.find(x => x.id === plus.dataset.add);
        if (o && !el._lade.some(x => x.id === o.id)) el._lade.push(o);
        el.querySelector('#offerBox').dataset.sig = '';
        onTick();
        return;
      }

      const minus = e.target.closest('button[data-del]');
      if (minus) {
        el._lade = el._lade.filter(x => x.id !== minus.dataset.del);
        el.querySelector('#offerBox').dataset.sig = '';
        onTick();
        return;
      }

      if (e.target.closest('#ladeClear')) {
        el._lade = [];
        el.querySelector('#offerBox').dataset.sig = '';
        onTick();
        return;
      }

      /* Tour starten */
      if (e.target.closest('#ladeGo')) {
        const nr = Number(el.querySelector('#dTruck').value);
        const sendungen = el._lade.filter(o => S.offers.some(x => x.id === o.id));
        if (!nr || !sendungen.length) return;
        for (const o of sendungen) takeOffer(o.id);
        el._lade = [];
        startTour(nr, sendungen).then(() => { drawOffers(); onTick(); });
        onTick();
        return;
      }

      /* Einzelne Sendung sofort losschicken */
      const btn = e.target.closest('button[data-offer]');
      if (btn) {
        const nr = Number(el.querySelector('#dTruck').value) || null;
        dispatch(btn.dataset.offer, nr).then(() => { drawOffers(); onTick(); });
        onTick();
        return;
      }

      /* Klick irgendwo auf die Kachel: Auftrag auf der Karte zeigen.
         Muss zuletzt stehen, sonst schluckt die Kachel die Knöpfe. */
      const zeigen = e.target.closest('[data-zeigen]');
      if (zeigen) {
        const o = S.offers.find(x => x.id === zeigen.dataset.zeigen);
        if (o) {
          focusPoint(o.firm.lat, o.firm.lon, DETAIL_ZOOM);
          markiere(el, zeigen);
        }
      }
    });
  },

  resized() { ensureMapSize(); },

  update(el) {
    drawTrucks();

    /* Auftragsmarken nur bei Änderung neu setzen */
    const slot = el.querySelector('#mapSlot');
    const markSig = S.offers.map(o => o.id).join(',') + '|'
                  + S.trucks.filter(t => t.phase === 'idle' && canDrive(t)).map(t => t.nr).join(',');
    if (slot.dataset.sig !== markSig) { slot.dataset.sig = markSig; drawOffers(); }

    /* Fahrzeugauswahl */
    const select = el.querySelector('#dTruck');
    const free = S.trucks.filter(t => t.phase === 'idle' && canDrive(t));
    const listSig = free.map(t => `${t.nr}@${t.place}`).join(',');
    if (select.dataset.sig !== listSig) {
      const keep = select.value;
      select.dataset.sig = listSig;
      select.innerHTML = free.length
        ? free.map(t => `<option value="${t.nr}">LKW ${t.nr} · ${esc(t.driver.name)} · ${esc(t.place)}</option>`).join('')
        : '<option value="">kein Fahrzeug frei</option>';
      if (free.some(t => String(t.nr) === keep)) select.value = keep;
    }

    const truck = findTruck(Number(select.value));
    const ban = banReason();
    el.querySelector('#dNote').innerHTML = truck
      ? `Steht bei ${esc(truck.place)} · ${S.offers.length} Anfragen`
      : ban
        ? `<span class="warn">Fahrverbot (${esc(ban)}) bis 22 Uhr.</span>`
        : 'Kein Fahrzeug einsatzbereit — unterwegs, in Pause oder Werkstatt.';

    /* Ladeliste */
    el._lade = el._lade.filter(o => S.offers.some(x => x.id === o.id));
    zeichneLadeliste(el, truck);

    /* Auftragsliste, sortiert nach Anfahrt ab dem gewählten Fahrzeug */
    const box = el.querySelector('#offerBox');
    const sig = S.offers.map(o => o.id).join(',') + '|' + (truck?.nr ?? '-');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    if (!S.offers.length) { box.innerHTML = empty('Keine offenen Anfragen.'); return; }

    const list = S.offers
      .map(o => ({ o, km: truck ? distanceFrom(truck, o.firm) : o.estKm }))
      .sort((a, b) => a.km - b.km);

    box.innerHTML = list.map(({ o, km }) => {
      const art = KIND_LABEL[o.kind || 'spot'];
      const g = klasseVon(o.klasse);
      const drauf = el._lade.some(x => x.id === o.id);
      const pruef = truck ? passt(truck, el._lade.filter(x => x.id !== o.id), o) : { ok: false, grund: 'kein Fahrzeug' };
      const umweg = truck && el._lade.length && !drauf ? umwegFuer(truck, el._lade, o) : null;

      return `
      <div class="offer offer-${o.kind || 'spot'} ${drauf ? 'geladen' : ''}" data-zeigen="${o.id}">
        <div class="flex-row" style="justify-content:space-between;">
          <span><span class="art-tag">${art.icon} ${art.text}</span>
            <strong>${esc(o.firm.name)}</strong></span>
          <span class="money">${fmt(o.fee)}</span>
        </div>
        <div style="font-size:10px;margin:2px 0;">
          ${g.icon} ${esc(g.name)} ·
          <strong>${o.paletten} Pal.</strong> ·
          <strong>${(o.gewicht / 1000).toFixed(1)} t</strong>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="muted">${km.toFixed(0)} km${umweg !== null ? ` · Umweg +${umweg.toFixed(0)} km` : ''}</span>
          <span class="flex-row" style="gap:4px;">
            ${drauf
              ? `<button class="btn btn-sm" data-del="${o.id}">entladen</button>`
              : pruef.ok
                ? `<button class="btn btn-sm" data-add="${o.id}">+ laden</button>
                   <button class="btn btn-sm" data-offer="${o.id}">sofort</button>`
                : `<span class="warn">${esc(pruef.grund)}</span>`}
          </span>
        </div>
      </div>`;
    }).join('');
  },
};

/* Was gerade für die nächste Tour zusammengestellt ist. */
function zeichneLadeliste(el, truck) {
  const box = el.querySelector('#ladeBox');
  const lade = el._lade;

  if (!lade.length || !truck) {
    box.innerHTML = truck
      ? '<div class="muted" style="padding:5px 6px;font-size:10px;">'
        + 'Sendungen mit „+ laden" sammeln und als eine Tour fahren.</div>'
      : '';
    return;
  }

  const kap = kapazitaet(truck);
  const last = summe(lade);
  const pal = Math.min(100, last.paletten / kap.paletten * 100);
  const kg  = Math.min(100, last.kg / kap.kg * 100);
  const erloes = lade.reduce((s, o) => s + o.fee, 0);

  box.innerHTML = `
    <div class="lade-kopf flex-row" style="justify-content:space-between;">
      <strong>Ladeliste · ${lade.length} Stopp${lade.length > 1 ? 's' : ''}</strong>
      <span class="money">${fmt(erloes)}</span>
    </div>

    <div style="padding:4px 6px;">
      <div class="flex-row" style="justify-content:space-between;font-size:10px;">
        <span>Stellplätze</span>
        <span>${last.paletten} / ${kap.paletten}</span>
      </div>
      <div class="prog" style="height:9px;margin-bottom:4px;">
        <div class="prog-fill" style="width:${pal}%"></div>
      </div>

      <div class="flex-row" style="justify-content:space-between;font-size:10px;">
        <span>Nutzlast</span>
        <span>${(last.kg / 1000).toFixed(1)} t / ${(kap.kg / 1000).toFixed(1)} t</span>
      </div>
      <div class="prog" style="height:9px;">
        <div class="prog-fill ${kg > 92 ? 'voll' : ''}" style="width:${kg}%"></div>
      </div>

      <div class="flex-row" style="margin-top:6px;gap:4px;">
        <button class="btn btn-sm" id="ladeGo"><strong>Tour starten</strong></button>
        <button class="btn btn-sm" id="ladeClear">leeren</button>
      </div>
    </div>`;
}

/* Kachel kurz hervorheben, damit klar ist, was gerade gezeigt wird. */
function markiere(el, kachel) {
  el.querySelectorAll('.offer.aktiv').forEach(k => k.classList.remove('aktiv'));
  kachel.classList.add('aktiv');
}
