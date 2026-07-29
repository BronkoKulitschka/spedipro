/* Routenplanung: die Karte mit offenen Aufträgen.

   Die Auftragsmarken tragen Frachtwert und Anfahrt ab dem nächsten freien
   Fahrzeug. Angenommen wird direkt aus dem Popup heraus. Der Kartenknoten
   bleibt beim Schließen erhalten, damit Leaflet nicht neu aufsetzen muss. */

import { S } from '../state.js';
import { fmt } from '../util.js';
import { initMap, ensureMapSize, mapHost, drawOffers, toggleLayer,
         onOfferAccept, nearestIdle } from '../ui/map.js';
import { dispatch } from '../sim/fleet.js';
import { onTick } from '../ui/wm.js';

export const MapApp = {
  id: 'map', icon: '🗺️', title: () => 'Routenplanung',
  width: 740, height: 540, desktop: true,

  body: () => `
    <div class="col fill">
      <div class="bar-note col" style="gap:3px;">
        <div class="flex-row" style="justify-content:space-between;flex-wrap:wrap;gap:6px;">
          <span id="mapNote">—</span>
          <span class="flex-row" style="gap:8px;font-size:10px;flex-wrap:wrap;">
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked data-layer="offers">📦 Aufträge</label>
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked data-layer="firms">Betriebe</label>
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked data-layer="traffic">🚧</label>
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked data-layer="routes">Strecken</label>
          </span>
        </div>
        <div class="muted" id="mapHint">
          Auf eine Auftragsmarke tippen zeigt Fracht, Anfahrt und den passenden LKW.
        </div>
      </div>
      <div class="map-frame fill" id="mapSlot"></div>
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
      if (cb) toggleLayer(cb.dataset.layer, cb.checked);
    });
  },

  resized() { ensureMapSize(); },

  update(el) {
    /* Marken nur neu setzen, wenn sich Aufträge oder freie LKW ändern */
    const slot = el.querySelector('#mapSlot');
    const sig = S.offers.map(o => o.id).join(',')
              + '|' + S.trucks.filter(t => t.phase === 'idle' && !t.shopMin).map(t => t.nr).join(',');
    if (slot.dataset.sig !== sig) {
      slot.dataset.sig = sig;
      drawOffers();
    }

    const best = S.offers.length
      ? S.offers.reduce((a, b) => (a.fee > b.fee ? a : b))
      : null;

    el.querySelector('#mapNote').textContent =
      `${S.offers.length} Aufträge · ${S.firms.length} Betriebe · `
      + `${S.trucks.filter(t => t.phase === 'driving').length} unterwegs`;

    el.querySelector('#mapHint').textContent = best
      ? `Beste Fracht gerade: ${best.firm.name} für ${fmt(best.fee)}.`
      : 'Zurzeit keine offenen Aufträge.';
  },

  unmount() { /* Kartenknoten bleibt erhalten, siehe mapHost() */ },
};
