/* Routenplanung: die Karte. Der Kartenknoten bleibt beim Schließen
   erhalten, damit Leaflet nicht bei jedem Öffnen neu aufsetzen muss. */

import { S } from '../state.js';
import { initMap, ensureMapSize, mapHost } from '../ui/map.js';

export const MapApp = {
  id: 'map', icon: '🗺️', title: () => 'Routenplanung',
  width: 720, height: 520, desktop: true, startMaximized: false,

  body: () => `
    <div class="col fill">
      <div class="bar-note flex-row" style="justify-content:space-between;">
        <span id="mapNote">—</span>
        <span class="flex-row" style="gap:8px;font-size:10px;">
          <label class="flex-row" style="gap:3px;">
            <input type="checkbox" checked data-layer="firms">Firmen</label>
          <label class="flex-row" style="gap:3px;">
            <input type="checkbox" checked data-layer="traffic">🚧</label>
          <label class="flex-row" style="gap:3px;">
            <input type="checkbox" checked data-layer="routes">Strecken</label>
        </span>
      </div>
      <div class="map-frame fill" id="mapSlot"></div>
    </div>`,

  mount(el) {
    el.querySelector('#mapSlot').appendChild(mapHost());
    initMap();
    ensureMapSize();

    el.addEventListener('change', async e => {
      const cb = e.target.closest('input[data-layer]');
      if (!cb) return;
      const { toggleLayer } = await import('../ui/map.js');
      toggleLayer(cb.dataset.layer, cb.checked);
    });
  },

  resized() { ensureMapSize(); },

  update(el) {
    el.querySelector('#mapNote').textContent =
      `${S.firms.length} Betriebe · ${S.traffic.length} Meldungen · `
      + `${S.trucks.filter(t => t.phase === 'driving').length} unterwegs`;
  },

  unmount() { /* Kartenknoten bleibt im Speicher, siehe mapHost() */ },
};
