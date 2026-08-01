/* Baustellen und Verkehrsmeldungen der Autobahn GmbH des Bundes.
   Offene Daten, kein Schlüssel nötig, CORS erlaubt.
   https://verkehr.autobahn.de/o/autobahn/{road}/services/{roadworks|warning} */

import { AUTOBAHNEN } from '../config.js';

const BASE = 'https://verkehr.autobahn.de/o/autobahn';

async function fetchService(road, kind) {
  const res = await fetch(`${BASE}/${road}/services/${kind}`);
  if (!res.ok) throw new Error(`${road}/${kind}: ${res.status}`);
  const json = await res.json();
  const items = json.roadworks || json.warning || [];

  return items.map(it => {
    const lat = parseFloat(it.coordinate?.lat);
    const lon = parseFloat(it.coordinate?.long);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return {
      lat, lon, road, kind,
      title: it.title || it.subtitle || (kind === 'roadworks' ? 'Baustelle' : 'Verkehrsmeldung'),
      text: (it.description || []).filter(Boolean).slice(0, 4).join(' · '),
    };
  }).filter(Boolean);
}

/* LKW-Parkplätze und Rastanlagen.
   Eigener Dienst derselben Schnittstelle: parking_lorry. */
export async function loadParking(onProgress = () => {}) {
  const out = [];
  let done = 0;

  await Promise.all(AUTOBAHNEN.map(async road => {
    try {
      const res = await fetch(`${BASE}/${road}/services/parking_lorry`);
      if (res.ok) {
        const json = await res.json();
        for (const p of json.parking_lorry || []) {
          const lat = parseFloat(p.coordinate?.lat);
          const lon = parseFloat(p.coordinate?.long);
          if (!isFinite(lat) || !isFinite(lon)) continue;

          out.push({
            lat, lon, road,
            name: p.title || p.subtitle || 'Rastplatz',
            plaetze: Number(p.lorryParkingFeatureIcons?.length) || null,
          });
        }
      }
    } catch { /* eine Autobahn ohne Daten ist kein Grund abzubrechen */ }
    onProgress(++done, AUTOBAHNEN.length, road);
  }));

  return out;
}

/* Lädt alle konfigurierten Autobahnen parallel.
   onProgress bekommt (fertig, gesamt) für den Ladebildschirm. */
export async function loadTraffic(onProgress = () => {}) {
  const out = [];
  let done = 0;

  await Promise.all(AUTOBAHNEN.map(async road => {
    for (const kind of ['roadworks', 'warning']) {
      try {
        out.push(...await fetchService(road, kind));
      } catch {
        /* einzelne Autobahn ohne Daten ist kein Grund abzubrechen */
      }
    }
    onProgress(++done, AUTOBAHNEN.length, road);
  }));

  return out;
}
