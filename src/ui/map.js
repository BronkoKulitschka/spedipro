/* Leaflet-Karte: OSM-Kacheln, Betriebe, Meldungen, rollende LKWs.
   Leaflet kommt als globales L aus index.html.

   Der Kartenknoten lebt außerhalb des Fensters. Wird das Fenster
   geschlossen und wieder geöffnet, wandert derselbe Knoten zurück
   ins neue Fenster und Leaflet behält Zoom und Position. */

import { S, truckPos, driveStatus, modelOf, xpNeeded } from '../state.js';
import { esc, haversine, fmt, num, pips } from '../util.js';
import { HUB_ICON } from '../data/hubs.js';
import { SKILLS, EQUIPMENT } from '../config.js';
import { kapazitaet, klasseVon } from '../sim/goods.js';

let map = null;
let host = null;
const layers = { depot: null, firms: null, hubs: null, offers: null, traffic: null,
                 parking: null, routes: null, trucks: null, preview: null };

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

  for (const key of ['routes', 'preview', 'firms', 'hubs', 'parking', 'traffic', 'offers', 'trucks', 'depot']) {
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

  /* Während eines Zoomvorgangs rechnet Leaflet alle Marken um. Läuft
     dabei die Bewegungsanimation mit, schwimmen die Fahrzeuge über die
     Karte, statt an ihrem Punkt zu bleiben. */
  const halt = () => map.getContainer().classList.add('ohne-anim');
  const weiter = () => setTimeout(() => map.getContainer().classList.remove('ohne-anim'), 80);
  map.on('zoomstart movestart', halt);
  map.on('zoomend moveend', weiter);

  drawFirms();
  drawHubs();
  drawParking();
  drawTraffic();
  drawOffers();
  drawTrucks();
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

  /* Blickrichtung aus dem letzten Stück Weg ableiten */
  const vorher = truck._letzte || pos;
  const richtung = pos[1] < vorher[1] - 1e-6 ? 'links'
                 : pos[1] > vorher[1] + 1e-6 ? 'rechts'
                 : truck._richtung || 'rechts';
  truck._richtung = richtung;
  truck._letzte = pos;

  if (!truck.marker) {
    truck.marker = L.marker(pos, {
      icon: L.divIcon({ className: 'truck-marker fahrend',
        html: `<span class="ring"></span><span class="truck-icon fahrt ${richtung}">🚛</span>`,
        iconSize: [26, 26], iconAnchor: [13, 13] }),
    }).addTo(layers.trucks);
  } else {
    truck.marker.setLatLng(pos);
    const wurzel = truck.marker.getElement();
    if (wurzel) {
      wurzel.classList.add('truck-marker', 'fahrend');

      /* Der Ring entsteht beim Losfahren. Stand die Marke vorher im
         Depot, fehlt er in der Marke — also hier nachziehen. */
      if (!wurzel.querySelector('.ring')) {
        wurzel.innerHTML = '<span class="ring"></span>'
                         + `<span class="truck-icon fahrt ${richtung}">🚛</span>`;
      } else {
        const icon = wurzel.querySelector('.truck-icon');
        if (icon) icon.className = `truck-icon fahrt ${richtung}`;
      }
    }
  }

  truck.marker.bindPopup(fahrtPopup(truck), { minWidth: 210 });
}

export function removeTruckLayers(truck) {
  if (truck.line && layers.routes) layers.routes.removeLayer(truck.line);
  truck.line = null;
}

/* Beim Verkauf verschwindet auch die Marke. */
export function dropTruck(truck) {
  removeTruckLayers(truck);
  if (truck.marker && layers.trucks) layers.trucks.removeLayer(truck.marker);
  truck.marker = null;
}

/* ── Alle Fahrzeuge, auch die stehenden ──────────────────────────
   Ein Fahrzeug ist immer irgendwo. Fahrende bewegen sich entlang
   ihrer Strecke, stehende bleiben an ihrem letzten Ziel. */
export function drawTrucks() {
  if (!map) return;
  for (const truck of S.trucks) {
    if (truck.phase === 'driving' && truck.route) updateTruckMarker(truck);
    else parkTruck(truck);
  }
}

function parkTruck(truck) {
  const pos = truckPos(truck);
  const status = driveStatus(truck);
  const ruht = status.code !== 'frei';

  if (!truck.marker) {
    truck.marker = L.marker([pos.lat, pos.lon], {
      icon: L.divIcon({ className: 'truck-marker', iconSize: [26, 26], iconAnchor: [13, 13],
        html: `<span class="truck-icon parked${ruht ? ' resting' : ''}">🚛</span>` }),
    }).addTo(layers.trucks);
  } else {
    truck.marker.setLatLng([pos.lat, pos.lon]);
    const wurzel = truck.marker.getElement();
    if (wurzel) {
      wurzel.classList.remove('fahrend');
      wurzel.innerHTML = `<span class="truck-icon parked${ruht ? ' resting' : ''}">🚛</span>`;
    }
  }

  truck.marker.bindPopup(truckPopup(truck), { minWidth: 210 });
}

/* Kurzfassung der Fuhrparkdaten, wie sie im Popup erscheint. */
function truckPopup(truck) {
  const m = modelOf(truck);
  const kap = kapazitaet(truck);
  const d = truck.driver;
  const status = driveStatus(truck);
  const farbe = status.code === 'frei' ? '#006400' : '#806000';

  const skills = Object.entries(SKILLS)
    .map(([key, s]) => `${s.icon}${pips(d.skills[key], s.max)}`).join(' ');

  const job = truck.job;
  const ladung = job && job.kind === 'delivery'
    ? (() => {
        const g = klasseVon(job.klasse);
        const voll = Math.max(
          (job.paletten || 0) / kap.paletten,
          (job.gewicht || 0) / kap.kg) * 100;
        return `<tr><td>geladen</td><td>${g.icon} ${esc(g.name)}</td></tr>
                <tr><td>Ladung</td><td>${job.paletten} Pal. · ${((job.gewicht || 0) / 1000).toFixed(1)} t
                    <span style="color:#606060">(${Math.round(voll)} %)</span></td></tr>
                <tr><td>Ziel</td><td>${esc(job.firm?.name || '')}
                    ${job.stopps > 1 ? `<br><span style="color:#006400">Stopp ${job.stopp} von ${job.stopps}</span>` : ''}</td></tr>`;
      })()
    : `<tr><td>Standort</td><td>${esc(truck.place)}</td></tr>`;

  return `
    <div style="min-width:200px;">
      <strong>LKW ${truck.nr} · ${esc(d.name)}</strong>
      <span style="color:#606060">· Stufe ${d.level}</span><br>
      <span style="color:${farbe}">${esc(status.text)}</span>
      <table class="popup-table">
        <tr><td>Fahrzeug</td><td>${esc(m.name)}${truck.used ? ' · gebraucht' : ''}
            ${(truck.equip || []).map(k => EQUIPMENT[k]?.icon || '').join('')}</td></tr>
        <tr><td>Nutzlast</td><td>${(kap.kg / 1000).toFixed(1)} t · ${kap.paletten} Stellplätze</td></tr>
        ${ladung}
        <tr><td>Laufleistung</td><td>${num(truck.odo || 0)} km</td></tr>
        <tr><td>Erfahrung</td><td>${Math.round(d.xp)} / ${xpNeeded(d.level)}
            ${d.points ? `<span style="color:#006400">· ${d.points} Pkt. frei</span>` : ''}</td></tr>
      </table>
      <div style="margin-top:3px;font-size:10px;">${skills}</div>
    </div>`;
}

/* ── Umschlagpunkte ── */
export function drawHubs() {
  if (!map || !layers.hubs) return;
  layers.hubs.clearLayers();

  for (const h of S.hubs || []) {
    L.marker([h.lat, h.lon], {
      icon: L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9],
        html: `<div class="hub-pin">${HUB_ICON[h.art] || '📍'}</div>` }),
    }).bindPopup(
      `<strong>${esc(h.name)}</strong><br>${esc(h.art)}<br>`
      + `${h.km.toFixed(0)} km vom Depot<br>`
      + `<span class="muted">Umschlagzuschlag +${Math.round((h.bonus - 1) * 100)} %</span>`
    ).addTo(layers.hubs);
  }
}

/* Kartenausschnitt auf alles Wesentliche legen */
export function fitAll() {
  if (!map) return;
  const punkte = [[S.depot.lat, S.depot.lon]];
  for (const o of S.offers) punkte.push([o.firm.lat, o.firm.lon]);
  for (const t of S.trucks) { const p = truckPos(t); punkte.push([p.lat, p.lon]); }
  if (punkte.length > 1) map.fitBounds(punkte, { padding: [30, 30] });
}

export function focusPoint(lat, lon, zoom = 10) {
  if (map) map.setView([lat, lon], zoom);
}

/* Aus dem Fuhrpark heraus: hinzoomen und die Kurzfassung aufklappen. */
export function focusTruck(truck) {
  if (!map) return;
  if (truck?.marker) {
    map.setView(truck.marker.getLatLng(), 14);
    truck.marker.openPopup();
  } else {
    map.setView([S.depot.lat, S.depot.lon], 10);
  }
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
        html: `<div class="offer-pin pin-${offer.kind || 'spot'}">`
            + `${offer.kind === 'vertrag' ? '📜' : offer.kind === 'partner' ? '🤝' : '📦'}</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      }),
    });

    const html = `
      <div style="min-width:190px;">
        <strong>${esc(firm.name)}</strong><br>
        <span class="muted">${
          offer.kind === 'vertrag' ? '📜 Vertragssendung'
          : offer.kind === 'partner' ? '🤝 ' + esc(offer.partnerName || 'Partnerfracht')
          : '🏷️ Spotmarkt'}</span><br>
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

/* Dasselbe für ein Fahrzeug in Fahrt, ergänzt um den Streckenstand. */
function fahrtPopup(truck) {
  const ziel = truck.job?.kind === 'return' ? 'Depot' : (truck.job?.firm?.name || 'unterwegs');
  const anteil = truck.route ? Math.round(truck.progress / truck.route.km * 100) : 0;

  return truckPopup(truck).replace('</table>',
    `<tr><td>unterwegs</td><td>nach ${esc(ziel)}</td></tr>
     <tr><td>Strecke</td><td>${truck.progress.toFixed(0)} von ${truck.route?.km.toFixed(0) || '?'} km
         <span style="color:#606060">(${anteil} %)</span></td></tr>
     ${truck.job?.jams ? `<tr><td>Meldungen</td><td>🚧 ${truck.job.jams} Stellen</td></tr>` : ''}
     </table>`);
}

/* Fahrzeug auf der Karte zeigen und die Kurzfassung aufklappen. */
export function zeigeFahrzeug(truck) {
  if (!map || !truck?.marker) return;
  truck.marker.openPopup();
}

/* ── LKW-Parkplätze und Rastanlagen ── */
export function drawParking() {
  if (!map || !layers.parking) return;
  layers.parking.clearLayers();

  for (const p of S.parking || []) {
    L.marker([p.lat, p.lon], {
      icon: L.divIcon({ className: '', iconSize: [16, 16], iconAnchor: [8, 8],
        html: '<div class="park-pin">🅿️</div>' }),
    }).bindPopup(
      `<strong>${esc(p.name)}</strong><br>${esc(p.road)}<br>`
      + '<span class="muted">Rastanlage für Lastkraftwagen</span>'
    ).addTo(layers.parking);
  }
}
