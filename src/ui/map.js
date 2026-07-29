/* Leaflet-Karte: OSM-Kacheln, Betriebe, Meldungen, rollende LKWs.
   Leaflet kommt als globales L aus index.html.

   Der Kartenknoten lebt außerhalb des Fensters. Wird das Fenster
   geschlossen und wieder geöffnet, wandert derselbe Knoten zurück
   ins neue Fenster und Leaflet behält Zoom und Position. */

import { S } from '../state.js';
import { esc, haversine } from '../util.js';

let map = null;
let host = null;
const layers = { depot: null, firms: null, traffic: null, routes: null, trucks: null };

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

  for (const key of ['routes', 'firms', 'traffic', 'trucks', 'depot']) {
    layers[key] = L.layerGroup().addTo(map);
  }

  L.marker([S.depot.lat, S.depot.lon], {
    icon: L.divIcon({ className: '', html: '<div class="depot-icon">🏠</div>',
                      iconSize: [20, 20], iconAnchor: [10, 10] }),
  }).bindPopup(`<strong>Depot ${esc(S.depot.name)}</strong>`).addTo(layers.depot);

  drawFirms();
  drawTraffic();
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
      radius: 3, color: '#000080', weight: 1, fillColor: '#4a90d9', fillOpacity: .85,
    }).bindPopup(`<strong>${esc(f.name)}</strong><br>${esc(f.kind)}<br>${f.km.toFixed(0)} km Luftlinie`)
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

  const km = truck.phase === 'back' ? truck.route.km - truck.progress : truck.progress;
  const pos = positionAt(truck.route, km);

  if (!truck.marker) {
    truck.marker = L.marker(pos, {
      icon: L.divIcon({ className: '', html: '<div class="truck-icon">🚛</div>',
                        iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(layers.trucks);
  } else {
    truck.marker.setLatLng(pos);
  }

  truck.marker.bindPopup(
    `<strong>LKW ${truck.nr} · ${esc(truck.driver.name)}</strong><br>`
    + `${truck.phase === 'out' ? 'unterwegs zu' : 'Rückfahrt von'} ${esc(truck.order.firm.name)}<br>`
    + `${truck.progress.toFixed(0)} / ${truck.route.km.toFixed(0)} km`
    + (truck.order.jams ? `<br>🚧 ${truck.order.jams} gemeldete Stellen` : ''));
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
