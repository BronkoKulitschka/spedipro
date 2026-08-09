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

/* Aufsummierte Streckenlängen einer Route, für Positionsrechnungen.

   Das Ergebnis wird an der Route zwischengespeichert. Die Länge muss zu
   den Koordinaten passen — sonst stammt der Zwischenspeicher von einer
   anderen Strecke und wird verworfen. Genau das passierte bei
   Mehrstopp-Touren, wenn die Etappe wechselte. */
export function routeCum(route) {
  const c = route.coords || [];
  if (route.cum && route.cum.length === c.length) return route.cum;

  const cum = [0];
  for (let i = 1; i < c.length; i++) {
    cum[i] = cum[i - 1] + haversine(
      { lat: c[i - 1][0], lon: c[i - 1][1] },
      { lat: c[i][0],     lon: c[i][1] });
  }
  route.cum = cum;
  return cum;
}

/* Punkt auf einer Route nach zurückgelegten Kilometern.

   route.km ist die gefahrene Strecke, die Geometrie kann davon
   abweichen — bei Luftlinienrouten um den Umwegfaktor. Deshalb wird
   der Anteil gerechnet und auf die Geometrie übertragen. */
export function pointOnRoute(route, km) {
  const c = route.coords || [];
  if (!c.length) return null;
  if (c.length === 1) return c[0];

  const cum = routeCum(route);
  const total = cum[cum.length - 1];
  if (!(total > 0)) return c[0];

  const anteil = route.km > 0 ? Math.max(0, Math.min(1, km / route.km)) : 0;
  const ziel = anteil * total;

  /* Erstes Segment finden, dessen Ende hinter dem Ziel liegt */
  let i = 1;
  while (i < cum.length - 1 && cum[i] < ziel) i++;

  const a = c[i - 1];
  const b = c[i];
  if (!a || !b) return c[c.length - 1];

  const laenge = cum[i] - cum[i - 1];
  const f = laenge > 0 ? (ziel - cum[i - 1]) / laenge : 0;

  return [
    a[0] + (b[0] - a[0]) * Math.max(0, Math.min(1, f)),
    a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, f)),
  ];
}

/* Kurswinkel zwischen zwei Punkten, in Grad.
   0 ist Norden, 90 Osten — wie auf dem Kompass. */
export function bearing(a, b) {
  const rad = Math.PI / 180;
  const dLon = (b.lon - a.lon) * rad;
  const lat1 = a.lat * rad, lat2 = b.lat * rad;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2)
          - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) / rad + 360) % 360;
}

/* Kurs an einer Stelle der Route: Blickrichtung des nächsten Stücks. */
export function courseOnRoute(route, km) {
  const c = route.coords || [];
  if (c.length < 2) return 0;

  const cum = routeCum(route);
  const total = cum[cum.length - 1];
  if (!(total > 0)) return 0;

  const anteil = route.km > 0 ? Math.max(0, Math.min(1, km / route.km)) : 0;
  const ziel = anteil * total;

  let i = 1;
  while (i < cum.length - 1 && cum[i] < ziel) i++;

  const a = c[i - 1], b = c[i];
  if (!a || !b) return 0;
  return bearing({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] });
}

/* Eine eigene Farbe je Fahrzeug.

   Der goldene Winkel verteilt die Farbtöne so, dass auch benachbarte
   Nummern deutlich unterscheidbar bleiben. */
export function truckFarbe(nr) {
  const ton = (nr * 137.508) % 360;
  return {
    kraeftig: `hsl(${ton.toFixed(0)}, 72%, 42%)`,
    hell:     `hsl(${ton.toFixed(0)}, 68%, 62%)`,
    ton,
  };
}

/* Fertigkeitsstufen als kleine Kästchen */
export function pips(level, max) {
  let out = '';
  for (let i = 0; i < max; i++) out += `<span class="pip ${i < level ? 'on' : ''}"></span>`;
  return out;
}
