/* Disposition: Karte und Auftragsliste in einem Fenster.

   Links die Karte mit Fahrzeugen, Aufträgen und Umschlagpunkten, rechts
   die Liste. Beides hängt zusammen: Ein angetippter Auftrag zeigt sich
   auf der Karte, ein angetipptes Fahrzeug rückt in den Ausschnitt.
   Auf schmalen Geräten liegt die Liste unter der Karte. */

import { S, findTruck, canDrive, banReason, truckPos } from '../state.js';
import { fmt, esc } from '../util.js';
import { dispatch, distanceFrom } from '../sim/fleet.js';
import { KIND_LABEL } from '../sim/orders.js';
import { onTick } from '../ui/wm.js';
import { initMap, ensureMapSize, mapHost, drawOffers, drawTrucks,
         toggleLayer, onOfferAccept, focusPoint, fitAll } from '../ui/map.js';
import { empty } from './shared.js';

export const DispoApp = {
  id: 'dispo', icon: '🗺️', title: () => 'Disposition', desktop: true,
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
        <div class="inset-box scroll fill" id="offerBox"></div>
      </div>

    </div>`,

  mount(el) {
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
        onTick();
      }
    });

    el.addEventListener('click', e => {
      const view = e.target.closest('button[data-view]');
      if (view) {
        if (view.dataset.view === 'all') fitAll();
        else focusPoint(S.depot.lat, S.depot.lon, 9);
        return;
      }

      if (e.target.closest('#dShow')) {
        const t = findTruck(Number(el.querySelector('#dTruck').value));
        const p = t ? truckPos(t) : S.depot;
        focusPoint(p.lat, p.lon, 10);
        return;
      }

      /* Auftrag in der Liste: erst zeigen, dann annehmen */
      const zeigen = e.target.closest('[data-zeigen]');
      if (zeigen) {
        const o = S.offers.find(x => x.id === zeigen.dataset.zeigen);
        if (o) focusPoint(o.firm.lat, o.firm.lon, 9);
        return;
      }

      const btn = e.target.closest('button[data-offer]');
      if (!btn) return;
      const nr = Number(el.querySelector('#dTruck').value) || null;
      dispatch(btn.dataset.offer, nr).then(() => { drawOffers(); onTick(); });
      onTick();
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
      return `
      <div class="offer offer-${o.kind || 'spot'}" data-zeigen="${o.id}">
        <div class="flex-row" style="justify-content:space-between;">
          <span><span class="art-tag">${art.icon} ${art.text}</span>
            <strong>${esc(o.firm.name)}</strong></span>
          <span class="money">${fmt(o.fee)}</span>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="muted">${o.firm.hub ? esc(o.firm.art) + ' · ' : ''}${o.partnerName ? esc(o.partnerName) + ' · ' : ''}${km.toFixed(0)} km</span>
          <button class="btn btn-sm" data-offer="${o.id}" ${truck ? '' : 'disabled'}>annehmen</button>
        </div>
      </div>`;
    }).join('');
  },
};
