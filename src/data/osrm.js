/* Straßenführung über den OSRM-Demoserver.

   Achtung: nur für kleine Nutzung gedacht. Für eine eigenständige
   Fassung gehört hier ein eigener Router hin — oder es bleibt bei der
   Luftlinie, die als Rückfall ohnehin eingebaut ist. */

import { haversine } from '../util.js';

const BASE = 'https://router.project-osrm.org/route/v1/driving';

/* Wie lange auf eine Antwort gewartet wird. Ohne Grenze hängt ein
   Fahrzeug ohne Netz endlos in der Planung fest. */
const ZEIT_MS = 6000;

/* Liefert { km, coords: [[lat, lon], …], real }.

   Diese Funktion wirft nicht: Kommt keine Antwort, liefert sie die
   Luftlinie mit Umwegfaktor. Das ist für eine eigenständige Fassung
   wichtig — dort gibt es den Router womöglich gar nicht, und das Spiel
   muss trotzdem laufen. */
export async function osrmRoute(from, to) {
  const abbruch = new AbortController();
  const wecker = setTimeout(() => abbruch.abort(), ZEIT_MS);

  try {
    const url = `${BASE}/${from.lon},${from.lat};${to.lon},${to.lat}`
              + '?overview=full&geometries=geojson';

    const res = await fetch(url, { signal: abbruch.signal });
    if (!res.ok) throw new Error('OSRM ' + res.status);

    const route = (await res.json()).routes?.[0];
    if (!route) throw new Error('keine Route gefunden');

    return {
      km: route.distance / 1000,
      coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      real: true,
    };
  } catch {
    return straightRoute(from, to);
  } finally {
    clearTimeout(wecker);
  }
}

/* Rückfallebene, wenn der Router nicht antwortet:
   Luftlinie mit Umwegfaktor. */
export function straightRoute(from, to) {
  return {
    km: haversine(from, to) * 1.28,
    coords: [[from.lat, from.lon], [to.lat, to.lon]],
    real: false,
  };
}
