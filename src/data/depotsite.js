/* Einen realistischen Platz für das Depot finden.

   Eine Spedition steht nicht am Marktplatz, sondern im Gewerbegebiet am
   Stadtrand, möglichst mit Autobahnanschluss. Genau danach wird gesucht:
   erst nach bestehenden Speditionen und Logistikflächen, dann nach
   Gewerbe- und Industriegebieten.

   Findet sich nichts — etwa weil Overpass nicht antwortet — wird ein
   Platz am Stadtrand angenommen. Das Spiel läuft in jedem Fall. */

import { haversine } from '../util.js';

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const ZEIT_MS = 9000;

/* Alle in Frage kommenden Flächen im Umkreis, Bewertung danach. */
function abfrage(stadt) {
  const um = `(around:14000,${stadt.lat},${stadt.lon})`;
  return `[out:json][timeout:8];
(
  way["landuse"="industrial"]${um};
  way["landuse"="commercial"]${um};
  relation["landuse"="industrial"]${um};
);
out center 120;`;
}

function bewerte(el, stadt) {
  const t = el.tags || {};
  const lat = el.center?.lat ?? el.lat;
  const lon = el.center?.lon ?? el.lon;
  if (!isFinite(lat) || !isFinite(lon)) return null;

  const km = haversine(stadt, { lat, lon });

  /* Zu nah an der Stadtmitte ist unrealistisch, zu weit draußen
     unpraktisch. Der Bereich zwischen 3 und 10 km ist ideal. */
  if (km < 1.5 || km > 14) return null;
  const lage = km >= 3 && km <= 10 ? 1.0 : 0.55;

  let punkte = t.landuse === 'industrial' ? 2.0 : 1.5;
  punkte *= lage;

  const name = t.name || '';
  if (/[Ll]ogisti|[Ss]pedit|[Ff]racht|[Gg]üterverkehr|[Gg]VZ/.test(name)) punkte *= 2.2;
  if (/[Gg]ewerbegebiet|[Ii]ndustriegebiet|[Gg]ewerbepark/.test(name)) punkte *= 1.4;
  if (name) punkte *= 1.15;      // benannte Flächen sind meist die größeren

  return {
    lat, lon, km, punkte,
    name: name || (t.landuse === 'industrial' ? 'Industriegebiet' : 'Gewerbegebiet'),
    art: t.landuse === 'industrial' ? 'Industriegebiet' : 'Gewerbegebiet',
  };
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

/* Ersatz: ein Punkt am Stadtrand, in Richtung Autobahnring. */
export function ersatzPlatz(stadt) {
  const richtung = (stadt.lat * 1000 + stadt.lon * 1000) % 360;
  const km = 6;
  const rad = Math.PI / 180;
  return {
    lat: stadt.lat + (km / 111.32) * Math.cos(richtung * rad),
    lon: stadt.lon + (km / (111.32 * Math.cos(stadt.lat * rad))) * Math.sin(richtung * rad),
    name: 'Gewerbegebiet am Stadtrand',
    art: 'Gewerbegebiet',
    km,
    geschaetzt: true,
  };
}

/* Sucht den besten Platz. Liefert immer ein Ergebnis. */
export async function findeDepotplatz(stadt, onNote = () => {}) {
  const query = abfrage(stadt);

  for (const url of MIRRORS) {
    const host = new URL(url).hostname;
    onNote(`  ${host} …`);
    try {
      const json = await frage(url, query);
      const flaechen = (json.elements || [])
        .map(el => bewerte(el, stadt))
        .filter(Boolean)
        .sort((a, b) => b.punkte - a.punkte);

      if (flaechen.length) {
        const gewaehlt = flaechen[0];
        onNote(`  ${flaechen.length} Flächen geprüft, gewählt: ${gewaehlt.name}`);
        return gewaehlt;
      }
      onNote('  keine geeignete Fläche gefunden');
    } catch (err) {
      onNote(`  ${host}: ${err.name === 'AbortError' ? 'Zeitüberschreitung' : 'nicht erreichbar'}`);
    }
  }

  onNote('  Platz am Stadtrand angenommen');
  return ersatzPlatz(stadt);
}
