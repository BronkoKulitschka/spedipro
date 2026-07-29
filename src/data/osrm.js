/* Straßenführung über den OSRM-Demoserver.
   Achtung: nur für kleine Nutzung gedacht. Für eine echte App
   gehört ein eigener Router oder ein bezahlter Dienst dazu. */

import { haversine } from '../util.js';

const BASE = 'https://router.project-osrm.org/route/v1/driving';

/* Liefert { km, coords: [[lat, lon], …], real: true } */
export async function osrmRoute(from, to) {
  const url = `${BASE}/${from.lon},${from.lat};${to.lon},${to.lat}`
            + '?overview=full&geometries=geojson';
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM ' + res.status);

  const route = (await res.json()).routes?.[0];
  if (!route) throw new Error('keine Route gefunden');

  return {
    km: route.distance / 1000,
    coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    real: true,
  };
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
