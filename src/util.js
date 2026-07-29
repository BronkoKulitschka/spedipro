/* Formatierung, Zufall, Geometrie. Keine Abhängigkeiten. */

export const fmt = n => (n < 0 ? '−€' : '€') + Math.abs(Math.round(n)).toLocaleString('de-DE');
export const num = n => Math.round(n).toLocaleString('de-DE');
export const pad = n => String(n).padStart(2, '0');
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const esc = s => String(s == null ? '' : s)
  .replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* Entfernung zweier Punkte in Kilometern. Beide brauchen lat und lon. */
export function haversine(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2
          + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* Fertigkeitsstufen als kleine Kästchen */
export function pips(level, max) {
  let out = '';
  for (let i = 0; i < max; i++) out += `<span class="pip ${i < level ? 'on' : ''}"></span>`;
  return out;
}
