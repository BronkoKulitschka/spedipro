/* Alles, was mit LKWs passiert: fahren, disponieren, kaufen, verkaufen. */

import { RULES } from '../config.js';
import { S, log, newTruck, findTruck, idleTrucks,
         kmh, fuelRate, feeMul, calmMul } from '../state.js';
import { haversine, fmt, esc } from '../util.js';
import { osrmRoute, straightRoute } from '../data/osrm.js';
import { takeOffer } from './orders.js';
import { gainXp } from './drivers.js';
import { toast } from '../ui/toast.js';
import { drawRoute, removeTruckLayers, updateTruckMarker } from '../ui/map.js';
import { invalidateFleet } from '../ui/fleet.js';

/* ── Baustellen und Meldungen entlang einer Strecke ── */
export function trafficOnRoute(coords) {
  const hits = [];
  const step = Math.max(1, Math.floor(coords.length / 220));

  for (const entry of S.traffic) {
    for (let i = 0; i < coords.length; i += step) {
      const point = { lat: coords[i][0], lon: coords[i][1] };
      if (haversine(point, entry) < RULES.JAM_RADIUS) { hits.push(entry); break; }
    }
  }
  return hits;
}

/* Gemeldete Stellen bremsen, Gelassenheit federt das ab. */
export function effectiveKmh(truck) {
  const d = truck.driver;
  const jams = truck.order?.jams || 0;
  const slowdown = Math.min(0.55, 0.05 * jams * calmMul(d));
  return kmh(d) * (1 - slowdown);
}

/* ── Auftrag annehmen ── */
export async function dispatch(offerId) {
  const truck = S.trucks.find(t => t.phase === 'idle' && !t.shopMin);
  if (!truck) return;

  const offer = takeOffer(offerId);
  if (!offer) return;

  truck.phase = 'planning';
  invalidateFleet();

  let route;
  try {
    route = await osrmRoute(S.depot, offer.firm);
    S.dataInfo.router = 'OSRM, echte Straßenführung';
  } catch {
    route = straightRoute(S.depot, offer.firm);
    S.dataInfo.router = 'Luftlinie, Router nicht erreichbar';
  }

  const hits = trafficOnRoute(route.coords);
  offer.jams = hits.length;
  offer.realKm = route.km;
  S.stats.jams += hits.length;

  truck.order = offer;
  truck.route = route;
  truck.progress = 0;
  truck.phase = 'out';

  drawRoute(truck);
  updateTruckMarker(truck);

  log(`${truck.driver.name} fährt zu ${offer.firm.name} · ${route.km.toFixed(0)} km`
      + (hits.length ? ` · ${hits.length} gemeldete Stellen unterwegs` : ' · freie Fahrt'));

  if (hits.length) {
    toast('🚧',
      `Auf der Strecke nach <strong>${esc(offer.firm.name)}</strong> liegen ${hits.length} gemeldete Stellen.`,
      `<span class="muted">${esc(hits[0].road)}: ${esc(hits[0].title)}</span>`);
  }
  invalidateFleet();
}

/* ── Ein Takt Bewegung ── */
export function moveTrucks() {
  for (const truck of S.trucks) {
    if (truck.shopMin > 0) {
      truck.shopMin = Math.max(0, truck.shopMin - RULES.MIN_PER_TICK);
      if (truck.shopMin === 0) invalidateFleet();
      continue;
    }
    if (truck.phase === 'idle' || truck.phase === 'planning' || !truck.route) continue;

    truck.progress += effectiveKmh(truck) * (RULES.MIN_PER_TICK / 60);
    updateTruckMarker(truck);
    if (truck.progress < truck.route.km) continue;

    truck.phase === 'out' ? arrive(truck) : comeHome(truck);
  }
}

function arrive(truck) {
  const d = truck.driver;
  const fee  = truck.order.fee * feeMul(d);
  const fuel = truck.route.km * fuelRate(d);

  S.money += fee - fuel;
  S.stats.tours++;
  S.stats.km += truck.route.km;
  S.stats.revenue += fee;
  d.tours++;

  log(`✔ ${d.name} hat bei ${truck.order.firm.name} entladen. `
    + `Fracht ${fmt(fee)}, Diesel ${fmt(-fuel)}.`);

  gainXp(d, 40 + Math.round(truck.route.km / 8));
  truck.phase = 'back';
  truck.progress = 0;
}

function comeHome(truck) {
  const d = truck.driver;
  S.money -= truck.route.km * fuelRate(d) * 0.55;   // Leerfahrt
  S.stats.km += truck.route.km;
  truck.progress = 0;

  if (truck.repeat) {
    truck.phase = 'out';
    return;
  }
  truck.phase = 'idle';
  truck.order = null;
  truck.route = null;
  removeTruckLayers(truck);
  log(`${d.name} ist zurück im Depot.`);
  invalidateFleet();
}

/* ── Kaufen und verkaufen ── */
export function buyTruck() {
  if (S.money < RULES.TRUCK_BUY) return;
  S.money -= RULES.TRUCK_BUY;

  const last = S.trucks[S.trucks.length - 1];
  const truck = newTruck((last ? last.nr : 0) + 1);
  S.trucks.push(truck);

  log(`Neuer LKW ${truck.nr} gekauft, ${truck.driver.name} übernimmt ihn: ${fmt(-RULES.TRUCK_BUY)}`);
  toast('🚛', `<strong>${esc(truck.driver.name)}</strong> fängt bei euch an und übernimmt LKW ${truck.nr}.`);
  invalidateFleet();
}

export function sellTruck() {
  if (S.trucks.length <= 1 || idleTrucks() === 0) return;

  const i = S.trucks.findIndex(t => t.phase === 'idle' && !t.shopMin);
  const [truck] = S.trucks.splice(i, 1);
  removeTruckLayers(truck);
  S.money += RULES.TRUCK_SELL;

  log(`LKW ${truck.nr} verkauft, ${truck.driver.name} verabschiedet sich: ${fmt(RULES.TRUCK_SELL)}`);
  invalidateFleet();
}

export function setRepeat(nr, value) {
  const truck = findTruck(nr);
  if (truck) truck.repeat = value;
}
