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
