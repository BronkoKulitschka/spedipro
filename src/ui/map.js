/* Leaflet-Karte: OSM-Kacheln, Betriebe, Meldungen, rollende LKWs.
   Leaflet kommt als globales L aus index.html.

   Der Kartenknoten lebt außerhalb des Fensters. Wird das Fenster
   geschlossen und wieder geöffnet, wandert derselbe Knoten zurück
   ins neue Fenster und Leaflet behält Zoom und Position. */

import { S, truckPos } from '../state.js';
import { esc, haversine, fmt } from '../util.js';

let map = null;
let host = null;
const layers = { depot: null, firms: null, offers: null, traffic: null,
                 routes: null, trucks: null, preview: null };

/* Wird von der Routenplanung gesetzt, damit die Karte einen Auftrag
   annehmen kann, ohne die Simulation direkt zu kennen. */
let acceptHandler = null;
export function onOfferAccept(fn) { acceptHandler = fn; }

export function mapHost() {
  if (!host) {
    host = document.createElement('div');
    host.id = 'map';
  }
  return host;
}

export function initMap() {
  if (map) { ensureMapSize(); return; }

  map = L.map(mapHost(), { zoomControl: true }).setView([S.depot.lat, S.depot.lon], 8);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
               + ' · Routing: OSRM · Verkehr: Autobahn GmbH',
  }).addTo(map);

  for (const key of ['routes', 'preview', 'firms', 'traffic', 'offers', 'trucks', 'depot']) {
    layers[key] = L.layerGroup().addTo(map);
  }

  /* Vorschaulinie vom nächsten freien LKW zum angeklickten Auftrag */
  map.on('popupopen', e => {
    const from = e.popup._spediFrom;
    const to   = e.popup._spediTo;
    layers.preview.clearLayers();
    if (from && to) {
      L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
        color: '#800000', weight: 2, opacity: .8, dashArray: '5 5',
      }).addTo(layers.preview);
    }
  });
  map.on('popupclose', () => layers.preview.clearLayers());

  L.marker([S.depot.lat, S.depot.lon], {
    icon: L.divIcon({ className: '', html: '<div class="depot-icon">🏠</div>',
                      iconSize: [20, 20], iconAnchor: [10, 10] }),
  }).bindPopup(`<strong>Depot ${esc(S.depot.name)}</strong>`).addTo(layers.depot);

  drawFirms();
  drawTraffic();
  drawOffers();
  for (const truck of S.trucks) if (truck.route) { drawRoute(truck); updateTruckMarker(truck); }
  ensureMapSize();
}

export function ensureMapSize() {
  if (!map) return;
  setTimeout(() => map.invalidateSize(), 60);
}

export function drawFirms() {
  if (!map) return;
  layers.firms.clearLayers();
  for (const f of S.firms.slice(0, 300)) {
    L.circleMarker([f.lat, f.lon], {
      radius: 3, color: '#000080', weight: 1,
      fillColor: f.invented ? '#c8a020' : '#4a90d9', fillOpacity: .85,
    }).bindPopup(`<strong>${esc(f.name)}</strong><br>${esc(f.kind)}`
               + `${f.invented ? ' <span style="color:#806000">· erfunden</span>' : ''}`
               + `<br>${f.km.toFixed(0)} km Luftlinie`)
      .addTo(layers.firms);
  }
}

export function drawTraffic() {
  if (!map) return;
  layers.traffic.clearLayers();
  for (const t of S.traffic) {
    L.circleMarker([t.lat, t.lon], {
      radius: 4, color: '#000', weight: 1,
      fillColor: t.kind === 'roadworks' ? '#ff8c00' : '#d02020', fillOpacity: .9,
    }).bindPopup(
      `<strong>${t.kind === 'roadworks' ? '🚧 Baustelle' : '⚠️ Meldung'} ${esc(t.road)}</strong><br>`
      + `${esc(t.title)}<br><span style="color:#404040">${esc(t.text)}</span>`
    ).addTo(layers.traffic);
  }
}

export function drawRoute(truck) {
  if (!map || !truck.route) return;
  truck.line = L.polyline(truck.route.coords, {
    color: truck.route.real ? '#000080' : '#808080',
    weight: 3, opacity: .75,
    dashArray: truck.route.real ? null : '6 6',
  }).addTo(layers.routes);
}

function positionAt(route, km) {
  const c = route.coords;
  if (c.length < 2) return c[0];

  if (!route.cum) {
    route.cum = [0];
    for (let i = 1; i < c.length; i++) {
      route.cum[i] = route.cum[i - 1] + haversine(
        { lat: c[i - 1][0], lon: c[i - 1][1] },
        { lat: c[i][0],     lon: c[i][1] });
    }
  }

  const total  = route.cum[route.cum.length - 1];
  const target = Math.max(0, Math.min(total, km / route.km * total));

  let i = 1;
  while (i < route.cum.length && route.cum[i] < target) i++;

  const a = c[i - 1], b = c[Math.min(i, c.length - 1)];
  const seg = (route.cum[Math.min(i, route.cum.length - 1)] - route.cum[i - 1]) || 1;
  const f = (target - route.cum[i - 1]) / seg;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export function updateTruckMarker(truck) {
  if (!map || !truck.route) return;

  const pos = positionAt(truck.route, truck.progress);

  if (!truck.marker) {
    truck.marker = L.marker(pos, {
      icon: L.divIcon({ className: '', html: '<div class="truck-icon">🚛</div>',
                        iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(layers.trucks);
  } else {
    truck.marker.setLatLng(pos);
  }

  const ziel = truck.job?.kind === 'return' ? 'Depot' : (truck.job?.firm?.name || 'unterwegs');
  truck.marker.bindPopup(
    `<strong>LKW ${truck.nr} · ${esc(truck.driver.name)}</strong><br>`
    + `unterwegs nach ${esc(ziel)}<br>`
    + `${truck.progress.toFixed(0)} / ${truck.route.km.toFixed(0)} km`
    + (truck.job?.jams ? `<br>🚧 ${truck.job.jams} gemeldete Stellen` : ''));
}

export function removeTruckLayers(truck) {
  if (truck.line   && layers.routes) { layers.routes.removeLayer(truck.line);   }
  if (truck.marker && layers.trucks) { layers.trucks.removeLayer(truck.marker); }
  truck.line = null;
  truck.marker = null;
}

export function focusTruck(truck) {
  if (!map) return;
  if (truck?.marker) map.setView(truck.marker.getLatLng(), 10);
  else map.setView([S.depot.lat, S.depot.lon], 9);
}

export function toggleLayer(name, visible) {
  if (!map || !layers[name]) return;
  visible ? map.addLayer(layers[name]) : map.removeLayer(layers[name]);
}


/* ── Offene Aufträge auf der Karte ──────────────────────────────
   Größere grüne Marken mit Frachtwert, Anfahrt und Annahmeknopf. */
export function nearestIdle(target) {
  let best = null, bestKm = Infinity;
  for (const t of S.trucks) {
    if (t.phase !== 'idle' || t.shopMin) continue;
    const km = haversine(truckPos(t), target);
    if (km < bestKm) { bestKm = km; best = t; }
  }
  return best ? { truck: best, km: bestKm } : null;
}

export function drawOffers() {
  if (!map || !layers.offers) return;
  layers.offers.clearLayers();

  for (const offer of S.offers) {
    const firm = offer.firm;
    const near = nearestIdle(firm);

    const marker = L.marker([firm.lat, firm.lon], {
      icon: L.divIcon({
        className: '',
        html: '<div class="offer-pin">📦</div>',
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    });

    const html = `
      <div style="min-width:190px;">
        <strong>${esc(firm.name)}</strong><br>
        <span class="muted">${esc(firm.kind)}${firm.invented ? ' · erfunden' : ''}</span><br>
        Fracht: <strong>${fmt(offer.fee)}</strong><br>
        ${near
          ? `Anfahrt ${near.km.toFixed(0)} km ab ${esc(near.truck.place)}<br>
             <span class="muted">${esc(near.truck.driver.name)} · LKW ${near.truck.nr}</span><br>
             <button class="btn btn-sm" style="margin-top:6px;"
                     data-map-offer="${offer.id}" data-map-truck="${near.truck.nr}">
               annehmen</button>`
          : '<span class="warn">Kein Fahrzeug frei</span>'}
      </div>`;

    const popup = L.popup({ closeButton: true }).setContent(html);
    popup._spediTo = { lat: firm.lat, lon: firm.lon };
    if (near) popup._spediFrom = truckPos(near.truck);

    marker.bindPopup(popup).addTo(layers.offers);
  }
}

/* Klicks im Popup abfangen. Popups liegen außerhalb der Fenster,
   deshalb wird am Dokument gelauscht. */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-map-offer]');
  if (!btn || !acceptHandler) return;
  acceptHandler(btn.dataset.mapOffer, Number(btn.dataset.mapTruck));
  map?.closePopup();
});
