/* Alles, was mit LKWs passiert: fahren, disponieren, kaufen, verkaufen.

   Ein LKW fährt vom Ort, an dem er gerade steht, zum Ziel — und bleibt
   dort. Die Rückfahrt ins Depot ist eine eigene Entscheidung, keine
   Zwangsleerfahrt. Wer geschickt disponiert, kettet Aufträge aneinander. */

import { RULES, TRUCK_MODELS, USED, DRIVE, REP } from '../config.js';
import { S, log, book, newTruck, findTruck, idleTrucks, truckPos, atDepot,
         modelOf, resaleValue, truckKmh, truckFuel, truckLoad,
         feeMul, calmMul, canDrive, driveStatus, bannedFor } from '../state.js';
import { haversine, fmt, esc } from '../util.js';
import { osrmRoute, straightRoute } from '../data/osrm.js';
import { takeOffer } from './orders.js';
import { gainXp } from './drivers.js';
import { addRep } from './market.js';
import { registerDelivery } from './contracts.js';
import { registerPartnerLoad } from './partners.js';
import { toast } from '../ui/toast.js';
import { drawRoute, removeTruckLayers, updateTruckMarker } from '../ui/map.js';

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

export function effectiveKmh(truck) {
  const jams = truck.job?.jams || 0;
  const slowdown = Math.min(0.55, 0.05 * jams * calmMul(truck.driver));
  return truckKmh(truck) * (1 - slowdown);
}

/* Luftlinie vom Standort eines LKW zu einem Ziel, für die Vorschau. */
export const distanceFrom = (truck, target) => haversine(truckPos(truck), target);

/* ── Fahrt beginnen ──────────────────────────────────────────────
   job beschreibt, was gefahren wird:
     { kind: 'delivery', firm, fee }  oder  { kind: 'return' } */
async function startDrive(truck, job, target, { sync = false } = {}) {
  truck.phase = 'planning';

  let route;
  if (sync) {
    route = straightRoute(truckPos(truck), target);
  } else {
    try {
      route = await osrmRoute(truckPos(truck), target);
      S.dataInfo.router = 'OSRM, echte Straßenführung';
    } catch {
      route = straightRoute(truckPos(truck), target);
      S.dataInfo.router = 'Luftlinie, Router nicht erreichbar';
    }
  }

  const hits = trafficOnRoute(route.coords);
  job.jams = hits.length;
  job.target = target;
  S.stats.jams += hits.length;

  truck.job = job;
  truck.route = route;
  truck.progress = 0;
  truck.phase = 'driving';

  drawRoute(truck);
  updateTruckMarker(truck);
  return { route, hits };
}

/* ── Auftrag annehmen ── */
export async function dispatch(offerId, truckNr = null, opts = {}) {
  const truck = truckNr
    ? findTruck(truckNr)
    : S.trucks.find(t => t.phase === 'idle' && canDrive(t));

  if (!truck || truck.phase !== 'idle') return;

  if (!canDrive(truck)) {
    const status = driveStatus(truck);
    if (!S.silent) {
      toast('⏳', `<strong>${esc(truck.driver.name)}</strong> kann nicht losfahren.`,
                  `<span class="muted">${esc(status.text)}</span>`);
    }
    return;
  }

  const offer = takeOffer(offerId);
  if (!offer) return;

  const { route, hits } = await startDrive(truck, {
    kind: 'delivery',
    firm: offer.firm,
    fee: offer.fee,
    art: offer.kind,
    contractId: offer.contractId || null,
    partnerKey: offer.partnerKey || null,
  }, offer.firm, opts);

  log(`${truck.driver.name} fährt von ${truck.place} nach ${offer.firm.name}`
    + ` · ${route.km.toFixed(0)} km`
    + (hits.length ? ` · ${hits.length} gemeldete Stellen` : ''));

  if (hits.length && !S.silent) {
    toast('🚧',
      `Auf der Strecke nach <strong>${esc(offer.firm.name)}</strong> liegen ${hits.length} gemeldete Stellen.`,
      `<span class="muted">${esc(hits[0].road)}: ${esc(hits[0].title)}</span>`);
  }
}

/* ── Leerfahrt zurück ins Depot ── */
export async function returnToDepot(nr, opts = {}) {
  const truck = findTruck(nr);
  if (!truck || truck.phase !== 'idle' || atDepot(truck)) return;
  if (!canDrive(truck)) return;

  const { route } = await startDrive(
    truck, { kind: 'return' }, { lat: S.depot.lat, lon: S.depot.lon }, opts);

  log(`${truck.driver.name} fährt leer zurück ins Depot · ${route.km.toFixed(0)} km`);
}

/* ── Ein Takt Bewegung ── */
export function moveTrucks(minutes) {
  for (const truck of S.trucks) {
    if (truck.shopMin > 0) {
      truck.shopMin = Math.max(0, truck.shopMin - minutes);
      continue;
    }

    /* Wer lange genug steht, hat seine Ruhezeit ohnehin genommen. */
    const faehrt = truck.phase === 'driving' && truck.route && !bannedFor(truck) && truck.restMin <= 0;
    if (!faehrt) {
      truck.idleMin = (truck.idleMin || 0) + minutes;
      if (truck.idleMin >= DRIVE.DAILY_REST && truck.today > 0) {
        truck.today = 0;
        truck.stint = 0;
      }
    } else {
      truck.idleMin = 0;
    }

    /* Pause oder Ruhezeit läuft ab */
    if (truck.restMin > 0) {
      truck.restMin -= minutes;
      if (truck.restMin <= 0) {
        truck.restMin = 0;
        if (truck.restKind === 'ruhe') { truck.today = 0; truck.stint = 0; }
        else truck.stint = 0;
        truck.restKind = null;
      }
      continue;
    }

    if (truck.phase === 'idle') { maybeAuto(truck); continue; }
    if (truck.phase === 'planning' || !truck.route) continue;

    /* Sonn- und Feiertagsfahrverbot: der Zug steht, wo er steht. */
    if (bannedFor(truck)) continue;

    truck.progress += effectiveKmh(truck) * (minutes / 60);
    truck.stint += minutes;
    truck.today += minutes;
    updateTruckMarker(truck);

    if (truck.progress >= truck.route.km) { finish(truck); continue; }

    /* Vorgeschriebene Unterbrechungen */
    if (truck.today >= DRIVE.MAX_DAY) {
      truck.restMin = DRIVE.DAILY_REST;
      truck.restKind = 'ruhe';
      log(`🛏️ ${truck.driver.name} hat die Tageslenkzeit erreicht und legt die Ruhezeit ein.`);
    } else if (truck.stint >= DRIVE.MAX_STINT) {
      truck.restMin = DRIVE.BREAK;
      truck.restKind = 'pause';
      log(`☕ ${truck.driver.name} macht die vorgeschriebene Pause.`);
    }
  }
}

function finish(truck) {
  const d = truck.driver;
  const km = truck.route.km;
  const fuel = km * truckFuel(truck);

  if (truck.job.kind === 'delivery') {
    const fee = truck.job.fee * feeMul(d) * truckLoad(truck);
    const art = truck.job.art || 'spot';
    const label = art === 'vertrag' ? 'Vertragsfracht'
                : art === 'partner' ? 'Partnerfracht' : 'Fracht';
    book(label, `${truck.job.firm.name} · ${d.name}`, fee);

    if (truck.job.contractId) registerDelivery(truck.job.contractId);
    if (truck.job.partnerKey) registerPartnerLoad(truck.job.partnerKey);
    addRep(REP.PER_LOAD);
    book('Diesel', `${km.toFixed(0)} km · LKW ${truck.nr}`, -fuel);
    S.stats.tours++;
    S.stats.revenue += fee;
    d.tours++;
    log(`✔ ${d.name} hat bei ${truck.job.firm.name} entladen. `
      + `Fracht ${fmt(fee)}, Diesel ${fmt(-fuel)}.`);
    gainXp(d, 40 + Math.round(km / 8));
    truck.place = truck.job.firm.name;

    /* Be- und Entladen kostet Zeit. Ohne Rampenzeit ließe sich ein
       Fahrzeug beliebig oft am Tag einsetzen. */
    truck.restMin = RULES.LOAD_MIN;
    truck.restKind = 'rampe';
  } else {
    book('Diesel', `Leerfahrt ins Depot · LKW ${truck.nr}`, -fuel);
    log(`${d.name} ist zurück im Depot. Diesel ${fmt(-fuel)}.`);
    truck.place = 'Depot';
  }

  truck.odo = (truck.odo || 0) + km;
  S.stats.km += km;
  truck.pos = { lat: truck.job.target.lat, lon: truck.job.target.lon };
  truck.progress = 0;
  truck.phase = 'idle';
  truck.job = null;
  truck.route = null;
  removeTruckLayers(truck);
}

/* ── Selbstdisposition ──────────────────────────────────────────
   Ein LKW auf Automatik sucht sich den Auftrag mit dem besten
   Verhältnis von Fracht zu Anfahrt und fährt sonst heim. */
function maybeAuto(truck) {
  if (!truck.auto || truck.phase !== 'idle') return;
  if (!canDrive(truck)) return;
  if (!S.offers.length) return;

  let best = null, bestScore = -Infinity;
  for (const offer of S.offers) {
    const anfahrt = distanceFrom(truck, offer.firm);
    const score = offer.fee / Math.max(12, anfahrt);
    if (score > bestScore) { bestScore = score; best = offer; }
  }
  if (!best) return;

  /* Beim Nachrechnen ohne Netz die Luftlinie nehmen. */
  dispatch(best.id, truck.nr, { sync: !!S.silent });
}

/* ── Kaufen und verkaufen ── */
/* ── Fahrzeughandel ── */
export const priceOf = (modelKey, used) => {
  const m = TRUCK_MODELS[modelKey];
  if (!m) return 0;
  return Math.round(m.price * (used ? USED.factor : 1) / 100) * 100;
};

export function buyTruck(modelKey = 'verteiler', used = false) {
  const model = TRUCK_MODELS[modelKey];
  if (!model) return false;

  const price = priceOf(modelKey, used);
  if (S.money < price) return false;

  const last = S.trucks[S.trucks.length - 1];
  const truck = newTruck((last ? last.nr : 0) + 1,
                         { lat: S.depot.lat, lon: S.depot.lon }, modelKey, used);
  S.trucks.push(truck);

  book('Fahrzeugkauf', `${model.name}${used ? ', gebraucht' : ''} · LKW ${truck.nr}`, -price);
  log(`${model.name}${used ? ' (gebraucht)' : ''} gekauft, ${truck.driver.name} übernimmt LKW ${truck.nr}: ${fmt(-price)}`);
  toast('🚛', `<strong>${esc(truck.driver.name)}</strong> übernimmt den ${esc(model.name)}.`,
              `<span class="muted">LKW ${truck.nr} steht im Depot bereit.</span>`);
  return true;
}

export function sellTruck(nr = null) {
  if (S.trucks.length <= 1) return false;

  const i = nr
    ? S.trucks.findIndex(t => t.nr === nr && t.phase === 'idle' && !t.shopMin && !t.restMin)
    : S.trucks.findIndex(t => t.phase === 'idle' && !t.shopMin && !t.restMin);
  if (i === -1) return false;

  const [truck] = S.trucks.splice(i, 1);
  removeTruckLayers(truck);

  const value = resaleValue(truck);
  book('Fahrzeugverkauf', `${modelOf(truck).name} · LKW ${truck.nr}`, value);
  log(`LKW ${truck.nr} verkauft, ${truck.driver.name} verabschiedet sich: ${fmt(value)}`);
  toast('🤝', `LKW ${truck.nr} verkauft.`, `<span class="money">${fmt(value)}</span>`);
  return true;
}

export function setAuto(nr, value) {
  const truck = findTruck(nr);
  if (truck) truck.auto = value;
}
