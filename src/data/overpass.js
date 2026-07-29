/* Echte Betriebe aus OpenStreetMap über die Overpass-API.
   Daten © OpenStreetMap-Mitwirkende, Lizenz ODbL. */

import { RULES } from '../config.js';
import { haversine } from '../util.js';

const ENDPOINT = 'https://overpass-api.de/api/interpreter';

/* Welche Objekte als Kundschaft taugen */
const FILTERS = [
  '["landuse"="industrial"]',
  '["building"="warehouse"]',
  '["man_made"="works"]',
  '["industrial"]',
  '["shop"="doityourself"]',
  '["shop"="furniture"]',
];

function buildQuery(depot) {
  const around = `(around:${RULES.FIRM_RADIUS},${depot.lat},${depot.lon})`;
  const body = FILTERS.map(f => `  nwr["name"]${f}${around};`).join('\n');
  return `[out:json][timeout:40];\n(\n${body}\n);\nout center 400;`;
}

export function firmKind(tags = {}) {
  if (tags.shop === 'doityourself')  return 'Baumarkt';
  if (tags.shop === 'furniture')     return 'Möbelhaus';
  if (tags.man_made === 'works')     return 'Werk';
  if (tags.building === 'warehouse') return 'Lager';
  if (tags.industrial)               return 'Industrie';
  return 'Gewerbegebiet';
}

export async function loadFirms(depot) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(buildQuery(depot)),
  });
  if (!res.ok) throw new Error('Overpass ' + res.status);

  const json = await res.json();
  const seen = new Set();
  const firms = [];

  for (const el of json.elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (!name || !isFinite(lat) || !isFinite(lon) || seen.has(name)) continue;

    const km = haversine(depot, { lat, lon });
    if (km < 8) continue;               // direkt vor der Tür ist kein Auftrag

    seen.add(name);
    firms.push({ name, lat, lon, km, tags: el.tags, kind: firmKind(el.tags) });
  }

  return firms;
}
