/* Nachschlagen, was an einem angetippten Punkt liegt.

   Für die freie Standortwahl: Der Spieler tippt irgendwohin auf die
   Karte, und es muss geklärt werden, ob dort überhaupt jemand wohnt.
   Mitten in der Nordsee lässt sich keine Spedition gründen.

   Gesucht wird der nächstgelegene bewohnte Ort über Overpass. */

import { haversine } from '../util.js';

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const ZEIT_MS = 8000;
const UMKREIS = 25000;      // Meter, in denen ein Ort liegen muss

/* Einwohnerzahl aus den Angaben, wenn vorhanden. */
function einwohner(tags) {
  const roh = parseInt(tags.population, 10);
  if (Number.isFinite(roh)) return Math.round(roh / 1000);

  /* Ohne Angabe nach Ortsart schätzen. */
  return { city: 150, town: 25, village: 3, suburb: 20, hamlet: 1 }[tags.place] || 5;
}

const ART_NAME = {
  city: 'Großstadt', town: 'Stadt', village: 'Gemeinde',
  suburb: 'Stadtteil', hamlet: 'Weiler', municipality: 'Gemeinde',
};

function abfrage(lat, lon) {
  return `[out:json][timeout:7];
(
  node["place"~"^(city|town|village|suburb|municipality)$"]["name"](around:${UMKREIS},${lat},${lon});
);
out 40;`;
}

async function frage(url, query) {
  const abbruch = new AbortController();
  const wecker = setTimeout(() => abbruch.abort(), ZEIT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: abbruch.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(wecker);
  }
}

/* Der passendste Ort: nah und möglichst groß.
   Ein Dorf direkt am Punkt schlägt eine Großstadt in 20 km. */
function beste(orte, punkt) {
  return orte
    .map(o => {
      const km = haversine(punkt, { lat: o.lat, lon: o.lon });
      const ew = einwohner(o.tags);
      /* Nähe zählt stark, Größe mildernd. */
      const wert = (ew ** 0.35) / Math.max(1.5, km);
      return {
        name: o.tags.name,
        lat: o.lat, lon: o.lon,
        km, einwohner: ew,
        art: ART_NAME[o.tags.place] || 'Ort',
        wert,
      };
    })
    .sort((a, b) => b.wert - a.wert)[0] || null;
}

/* Liefert { ok, ort } oder { ok: false, grund }. */
export async function ortAn(lat, lon, onNote = () => {}) {
  const query = abfrage(lat, lon);

  for (const url of MIRRORS) {
    try {
      const json = await frage(url, query);
      const orte = (json.elements || []).filter(e => e.tags?.name && isFinite(e.lat));

      if (!orte.length) {
        return {
          ok: false,
          grund: 'Hier wohnt niemand in der Nähe. Bitte einen Punkt näher an einer Ortschaft wählen.',
        };
      }

      const ort = beste(orte, { lat, lon });
      return { ok: true, ort };
    } catch {
      /* nächsten Server versuchen */
    }
  }

  return {
    ok: false,
    grund: 'Der Ort ließ sich nicht nachschlagen. Bitte eine Stadt aus der Liste wählen.',
    serverfehler: true,
  };
}
