/* Leaflet-Karte: OSM-Kacheln, Betriebe, Meldungen, rollende LKWs.
   Leaflet kommt als globales L aus index.html.

   Der Kartenknoten lebt außerhalb des Fensters. Wird das Fenster
   geschlossen und wieder geöffnet, wandert derselbe Knoten zurück
   ins neue Fenster und Leaflet behält Zoom und Position. */

import { S, truckPos, driveStatus, modelOf, xpNeeded, verfuegbar, driverOf } from '../state.js';
import { esc, haversine, fmt, num, pips, pointOnRoute,
         courseOnRoute, truckFarbe } from '../util.js';
import { HUB_ICON } from '../data/hubs.js';
import { SKILLS, EQUIPMENT } from '../config.js';
import { fahrzeugBild, onBildBereit, bildStand } from './sprites.js';
import { kapazitaet, klasseVon } from '../sim/goods.js';

let map = null;
let host = null;
const layers = { depot: null, firms: null, hubs: null, offers: null, traffic: null,
                 parking: null, routes: null, trucks: null, preview: null };

/* Welche Ebenen sichtbar sein sollen. Diese Angabe ist die Wahrheit —
   sie übersteht auch das Schließen und Wiederöffnen des Fensters.
   Was nicht sichtbar ist, wird gar nicht erst gezeichnet. */
const sichtbar = {
  depot: true, firms: true, hubs: true, offers: true,
  traffic: true, parking: false, routes: true, trucks: true, preview: true,
};

export const istSichtbar = name => !!sichtbar[name];

/* Wird von der Routenplanung gesetzt, damit die Karte einen Auftrag
   annehmen kann, ohne die Simulation direkt zu kennen. */
let acceptHandler = null;
export function onOfferAccept(fn) { acceptHandler = fn; }

/* Ring um das Fahrzeug, in seiner eigenen Farbe. Fährt es, sitzt ein
   Pfeil auf dem Ring und zeigt in Fahrtrichtung. */
function ringInhalt(truck, kurs, richtung, faehrt, ruht = false) {
  const farbe = truckFarbe(truck.nr);
  const dreh = faehrt ? `transform:rotate(${kurs.toFixed(1)}deg);` : '';

  return `
    <span class="kurs-ring" style="border-color:${farbe.kraeftig}"></span>
    ${faehrt ? `
      <span class="kurs-zeiger" style="${dreh}">
        <span class="kurs-pfeil" style="border-bottom-color:${farbe.kraeftig}"></span>
      </span>` : ''}
    <span class="truck-icon ${richtung}${faehrt ? '' : ' parked'}${ruht ? ' resting' : ''}">
      ${fahrzeugBild(truck.model)}
    </span>
    <span class="truck-nr" style="background:${farbe.kraeftig}">${truck.nr}</span>`;
}

export function mapHost() {
  if (!host) {
    host = document.createElement('div');
    host.id = 'map';
  }
  return host;
}

export function initMap() {
  if (map) { ensureMapSize(); return; }

  /* preferCanvas zeichnet Kreismarken auf eine Zeichenfläche statt als
     einzelne DOM-Elemente. Bei mehreren hundert Marken ist das der
     Unterschied zwischen flüssig und zäh. */
  map = L.map(mapHost(), {
    zoomControl: true,
    preferCanvas: true,
  }).setView([S.depot.lat, S.depot.lon], 8);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
               + ' · Routing: OSRM · Verkehr: Autobahn GmbH',
  }).addTo(map);

  for (const key of ['routes', 'preview', 'firms', 'hubs', 'parking',
                     'traffic', 'offers', 'trucks', 'depot']) {
    layers[key] = L.layerGroup();
    if (sichtbar[key]) layers[key].addTo(map);
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
  }).bindPopup(
    `<strong>Betriebshof ${esc(S.depot.name)}</strong><br>`
    + (S.depot.lage ? `${esc(S.depot.lage)}<br>` : '')
    + `<span class="muted">${esc(S.depot.art || 'Gewerbegebiet')}`
    + (S.depot.entfernung ? ` · ${S.depot.entfernung.toFixed(0)} km vom Zentrum` : '')
    + '</span>'
  ).addTo(layers.depot);

  /* Nach einem Zoomvorgang die Fahrzeuge neu setzen, damit sie
     sicher an der richtigen Stelle sitzen. */
  map.on('zoomend', () => drawTrucks());

  /* Treffen die Bilder verspätet ein, Fahrzeuge neu zeichnen. */
  onBildBereit(() => drawTrucks());

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
  if (!map || !sichtbar.firms) return;
  layers.firms.clearLayers();
  /* Nur die nächstgelegenen zeichnen. Weiter entfernte Betriebe sind
     ohnehin selten Ziel, und jede Marke kostet beim Verschieben. */
  const naechste = [...S.firms].sort((a, b) => a.km - b.km).slice(0, 150);

  for (const f of naechste) {
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
  if (!map || !sichtbar.traffic) return;
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

  /* Die Linie trägt dieselbe Farbe wie der Ring des Fahrzeugs — so ist
     bei mehreren Fahrzeugen sofort klar, welche Strecke zu wem gehört. */
  const farbe = truckFarbe(truck.nr);

  truck.line = L.polyline(truck.route.coords, {
    color: farbe.kraeftig,
    weight: 3, opacity: .8,
    dashArray: truck.route.real ? null : '6 6',
  }).addTo(layers.routes);
}

export function updateTruckMarker(truck) {
  if (!map || !truck.route) return;

  const pos = pointOnRoute(truck.route, truck.progress);
  if (!pos) return;

  /* Kurs aus der Route: der Pfeil zeigt dorthin, wo es weitergeht. */
  const kurs = courseOnRoute(truck.route, truck.progress);
  const richtung = (kurs > 180) ? 'links' : 'rechts';
  truck._richtung = richtung;

  const inhalt = ringInhalt(truck, kurs, richtung, true);

  if (!truck.marker) {
    truck.marker = L.marker(pos, {
      icon: L.divIcon({ className: 'truck-marker fahrend', html: inhalt,
                        iconSize: [26, 26], iconAnchor: [13, 13] }),
    }).addTo(layers.trucks);
    const neu = truck.marker.getElement();
    if (neu) neu.dataset.bild = bildStand();
  } else {
    truck.marker.setLatLng(pos);
    const wurzel = truck.marker.getElement();
    if (wurzel) {
      wurzel.classList.add('truck-marker', 'fahrend');

      /* Nur den Pfeil drehen, statt alles neu aufzubauen — außer der
         Bildstand hat sich geändert, dann muss der Inhalt neu. */
      const zeiger = wurzel.querySelector('.kurs-zeiger');
      if (zeiger && wurzel.dataset.bild === bildStand()) {
        zeiger.style.transform = `rotate(${kurs.toFixed(1)}deg)`;
        const icon = wurzel.querySelector('.truck-icon');
        if (icon) icon.className = `truck-icon ${richtung}`;
      } else {
        wurzel.innerHTML = inhalt;
        wurzel.dataset.bild = bildStand();
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

  const inhalt = ringInhalt(truck, null, truck._richtung || 'rechts', false, ruht);

  if (!truck.marker) {
    truck.marker = L.marker([pos.lat, pos.lon], {
      icon: L.divIcon({ className: 'truck-marker', html: inhalt,
                        iconSize: [26, 26], iconAnchor: [13, 13] }),
    }).addTo(layers.trucks);
    const neu = truck.marker.getElement();
    if (neu) neu.dataset.bild = bildStand();
  } else {
    truck.marker.setLatLng([pos.lat, pos.lon]);
    const wurzel = truck.marker.getElement();
    if (wurzel) {
      wurzel.classList.remove('fahrend');
      wurzel.innerHTML = inhalt;
      wurzel.dataset.bild = bildStand();
    }
  }

  truck.marker.bindPopup(truckPopup(truck), { minWidth: 210 });
}

/* Kurzfassung der Fuhrparkdaten, wie sie im Popup erscheint. */
function truckPopup(truck) {
  const m = modelOf(truck);
  const kap = kapazitaet(truck);
  const d = driverOf(truck);
  const status = driveStatus(truck);
  const statusFarbe = status.code === 'frei' ? '#006400' : '#806000';

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

  const wagenFarbe = truckFarbe(truck.nr);

  return `
    <div style="min-width:200px;">
      <span class="popup-farbe" style="background:${wagenFarbe.kraeftig}"></span>
      <strong>LKW ${truck.nr} · ${esc(d.name)}</strong>
      <span style="color:#606060">· Stufe ${d.level}</span><br>
      <span style="color:${statusFarbe}">${esc(status.text)}</span>
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
const HUB_FARBE = {
  Flughafen: '#8060b0', Seehafen: '#2070a0',
  Binnenhafen: '#40a0a0', Güterbahnhof: '#a08040',
};

export function drawHubs() {
  if (!map || !layers.hubs || !sichtbar.hubs) return;
  layers.hubs.clearLayers();

  for (const h of S.hubs || []) {
    L.circleMarker([h.lat, h.lon], {
      radius: 5, color: '#202020', weight: 1,
      fillColor: HUB_FARBE[h.art] || '#808080', fillOpacity: .9,
    }).bindPopup(
      `<strong>${HUB_ICON[h.art] || '📍'} ${esc(h.name)}</strong><br>${esc(h.art)}<br>`
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
  sichtbar[name] = !!visible;
  if (!map || !layers[name]) return;

  if (visible) {
    map.addLayer(layers[name]);
    /* Erst jetzt zeichnen — vorher wäre es verschwendete Arbeit. */
    if (name === 'parking') drawParking();
    if (name === 'firms')   drawFirms();
    if (name === 'traffic') drawTraffic();
    if (name === 'hubs')    drawHubs();
  } else {
    map.removeLayer(layers[name]);
    layers[name].clearLayers();
  }
}


/* ── Offene Aufträge auf der Karte ──────────────────────────────
   Größere grüne Marken mit Frachtwert, Anfahrt und Annahmeknopf. */
export function nearestIdle(target) {
  let best = null, bestKm = Infinity;
  for (const t of S.trucks) {
    if (!verfuegbar(t)) continue;
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
             <span class="muted">${esc(near.driverOf(truck).name)} · LKW ${near.truck.nr}</span><br>
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
  if (!map || !layers.parking || !sichtbar.parking) return;
  layers.parking.clearLayers();

  for (const p of S.parking || []) {
    L.circleMarker([p.lat, p.lon], {
      radius: 4, color: '#405060', weight: 1,
      fillColor: '#a8c8e8', fillOpacity: .9,
    }).bindPopup(
      `<strong>🅿️ ${esc(p.name)}</strong><br>${esc(p.road)}<br>`
      + '<span class="muted">Rastanlage für Lastkraftwagen</span>'
    ).addTo(layers.parking);
  }
}
