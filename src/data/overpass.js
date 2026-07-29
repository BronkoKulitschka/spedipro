/* Echte Betriebe aus OpenStreetMap über die Overpass-API.
   Daten © OpenStreetMap-Mitwirkende, Lizenz ODbL.

   Der öffentliche Dienst ist oft ausgelastet. Deshalb werden mehrere
   Spiegelserver nacheinander probiert, danach eine kleinere Abfrage,
   und ganz zuletzt greift die mitgelieferte Ersatzliste. */

import { RULES } from '../config.js';
import { haversine } from '../util.js';
import { fallbackFirms } from './fallback.js';
import { inventFirms } from './invent.js';

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
];

/* Große Abfrage zuerst, danach immer sparsamer. */
const ATTEMPTS = [
  { radius: RULES.FIRM_RADIUS, timeout: 12, full: true  },
  { radius: 25000,             timeout: 10, full: false },
  { radius: 15000,             timeout:  8, full: false },
];

/* Nach dieser Zeit wird die Suche endgültig aufgegeben. Ohne diese
   Grenze klappert der Hintergrund alle Spiegelserver stundenlang ab. */
const TOTAL_BUDGET_MS = 45000;

/* So lange wartet der Start höchstens auf Overpass. Danach wird mit
   erfundenen Betrieben weitergespielt und im Hintergrund nachgeladen. */
const QUICK_MS = 1000;

const FULL_FILTERS = [
  '["landuse"="industrial"]',
  '["building"="warehouse"]',
  '["man_made"="works"]',
  '["industrial"]',
  '["shop"="doityourself"]',
  '["shop"="furniture"]',
];

const CORE_FILTERS = [
  '["landuse"="industrial"]',
  '["man_made"="works"]',
];

function buildQuery(depot, { radius, timeout, full }) {
  const around = `(around:${radius},${depot.lat},${depot.lon})`;
  const filters = full ? FULL_FILTERS : CORE_FILTERS;
  const body = filters.map(f => `  nwr["name"]${f}${around};`).join('\n');
  return `[out:json][timeout:${timeout}];\n(\n${body}\n);\nout center 300;`;
}

export function firmKind(tags = {}) {
  if (tags.shop === 'doityourself')  return 'Baumarkt';
  if (tags.shop === 'furniture')     return 'Möbelhaus';
  if (tags.man_made === 'works')     return 'Werk';
  if (tags.building === 'warehouse') return 'Lager';
  if (tags.industrial)               return 'Industrie';
  return 'Gewerbegebiet';
}

async function askServer(url, query, timeoutSec) {
  const controller = new AbortController();
  const bail = setTimeout(() => controller.abort(), (timeoutSec + 3) * 1000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(bail);
  }
}

function toFirms(json, depot) {
  const seen = new Set();
  const firms = [];

  for (const el of json.elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (!name || !isFinite(lat) || !isFinite(lon) || seen.has(name)) continue;

    const km = haversine(depot, { lat, lon });
    if (km < 5) continue;

    seen.add(name);
    firms.push({ name, lat, lon, km, tags: el.tags, kind: firmKind(el.tags) });
  }
  return firms;
}

/* onNote meldet den Fortschritt an den Ladebildschirm.
   Liefert immer eine brauchbare Liste, notfalls die Reserve. */
export async function loadFirms(depot, onNote = () => {}) {
  const bis = Date.now() + TOTAL_BUDGET_MS;

  for (const attempt of ATTEMPTS) {
    const query = buildQuery(depot, attempt);

    for (const url of MIRRORS) {
      if (Date.now() > bis) {
        onNote('  Zeitbudget aufgebraucht, Suche beendet.');
        const firms = fallbackFirms(depot);
        return { firms, source: 'Ersatzliste' };
      }
      const host = new URL(url).hostname;
      onNote(`  ${host}, Radius ${attempt.radius / 1000} km …`);
      try {
        const json = await askServer(url, query, attempt.timeout);
        const firms = toFirms(json, depot);
        if (firms.length >= 5) {
          onNote(`  ${firms.length} Betriebe von ${host}.`);
          return { firms, source: host };
        }
        onNote(`  ${host}: nur ${firms.length} Treffer, weiter.`);
      } catch (err) {
        onNote(`  ${host}: ${err.name === 'AbortError' ? 'Zeitüberschreitung' : 'nicht erreichbar'}.`);
      }
    }
  }

  const firms = fallbackFirms(depot);
  onNote(`  Kein Server erreichbar. Ersatzliste mit ${firms.length} Betrieben.`);
  return { firms, source: 'Ersatzliste' };
}

/* ── Schneller Start ──────────────────────────────────────────────
   Gibt spätestens nach QUICK_MS eine Liste zurück. Kommt Overpass
   danach doch noch durch, meldet onLate die echten Betriebe nach. */
export function loadFirmsFast(depot, onNote = () => {}, onLate = () => {}) {
  let settled = false;

  /* Sobald der Start durch ist, schweigt die Hintergrundsuche.
     Sonst schreibt sie weiter in einen Bildschirm, den niemand mehr sieht. */
  const note = text => { if (!settled) onNote(text); };

  const background = loadFirms(depot, note)
    .then(result => {
      if (settled && result.firms.length >= 5) onLate(result);
      return result;
    })
    .catch(() => null);

  return new Promise(resolve => {
    const timer = setTimeout(() => {
      settled = true;
      const firms = inventFirms(depot);
      onNote(`  Dauert zu lange. Start mit ${firms.length} erfundenen Betrieben.`);
      onNote('  Die echten Daten werden im Hintergrund nachgeladen.');
      resolve({ firms, source: 'erfunden', pending: background });
    }, QUICK_MS);

    background.then(result => {
      if (settled || !result || result.firms.length < 5) return;
      clearTimeout(timer);
      settled = true;
      resolve(result);
    });
  });
}
