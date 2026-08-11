/* Alles, was mit LKWs passiert: fahren, disponieren, kaufen, verkaufen.

   Ein LKW fährt vom Ort, an dem er gerade steht, zum Ziel — und bleibt
   dort. Die Rückfahrt ins Depot ist eine eigene Entscheidung, keine
   Zwangsleerfahrt. Wer geschickt disponiert, kettet Aufträge aneinander. */

import { RULES, TRUCK_MODELS, USED, DRIVE, REP, EQUIPMENT } from '../config.js';
import { S, log, book, newTruck, findTruck, idleTrucks, truckPos, atDepot,
         modelOf, resaleValue, truckKmh, truckFuel,
         feeMul, calmMul, canDrive, driveStatus, bannedFor,
         faehrtLeer, verfuegbar } from '../state.js';
import { haversine, fmt, esc, routeCum, pointOnRoute } from '../util.js';
import { osrmRoute, straightRoute } from '../data/osrm.js';
import { takeOffer } from './orders.js';
import { gainXp } from './drivers.js';
import { addRep } from './market.js';
import { registerDelivery } from './contracts.js';
import { registerPartnerLoad } from './partners.js';
import { registriereFahrt } from './customers.js';
import { dieselRabatt } from './goals.js';
import { pruefeRekord } from './records.js';
import { checkLevelUp, automatikFrei, modelFrei } from './progress.js';
import { kapazitaet, summe, passt } from './goods.js';
import { toast } from '../ui/toast.js';
import { drawRoute, removeTruckLayers, dropTruck, updateTruckMarker } from '../ui/map.js';
import { tempoFaktor, dieselFaktor, rampeFaktor, ansehenFaktor, stauFaktor, xpFaktor } from './persons.js';

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

/* Wo ein Fahrzeug gerade wirklich ist. Bei einer Leerfahrt ist das der
   Punkt auf der Strecke, nicht der zuletzt angefahrene Ort. */
export function jetztPos(truck) {
  if (faehrtLeer(truck) && truck.route) {
    const p = pointOnRoute(truck.route, truck.progress);
    if (p) return { lat: p[0], lon: p[1] };
  }
  return truckPos(truck);
}

/* Luftlinie vom Standort eines LKW zu einem Ziel, für die Vorschau. */
export const distanceFrom = (truck, target) => haversine(jetztPos(truck), target);

/* ── Tour aus mehreren Sendungen ─────────────────────────────────
   Die Stopps werden nach dem Prinzip des nächsten Nachbarn geordnet:
   immer weiter zum nächstgelegenen offenen Ziel. Das ist nicht die
   mathematisch beste Route, aber die, die ein Disponent auch wählt. */
function ordneStopps(start, sendungen) {
  const offen = [...sendungen];
  const folge = [];
  let hier = start;

  while (offen.length) {
    let besterIndex = 0, beste = Infinity;
    offen.forEach((s, i) => {
      const d = haversine(hier, s.firm);
      if (d < beste) { beste = d; besterIndex = i; }
    });
    const [naechster] = offen.splice(besterIndex, 1);
    folge.push(naechster);
    hier = naechster.firm;
  }
  return folge;
}

/* Umweg, den ein zusätzlicher Stopp kostet */
export function umwegFuer(truck, bisher, neu) {
  const start = truckPos(truck);
  const ohne = strecke(start, ordneStopps(start, bisher));
  const mit  = strecke(start, ordneStopps(start, [...bisher, neu]));
  return mit - ohne;
}

function strecke(start, folge) {
  let km = 0, hier = start;
  for (const s of folge) { km += haversine(hier, s.firm); hier = s.firm; }
  return km * 1.28;
}

export function kapazitaetsPruefung(truck, bisher, neu) {
  return passt(truck, bisher, neu);
}

export async function startTour(truckNr, sendungen, opts = {}) {
  const truck = findTruck(truckNr);
  if (!truck || !verfuegbar(truck) || !sendungen.length) return false;

  /* Eine laufende Leerfahrt wird abgebrochen — das Fahrzeug übernimmt
     die Fracht von dort aus, wo es gerade steht. */
  if (faehrtLeer(truck)) brichLeerfahrtAb(truck);

  const folge = ordneStopps(truckPos(truck), sendungen);

  /* Alle Teilstrecken vorab berechnen, damit die Tour als Ganzes steht. */
  const etappen = [];
  let von = truckPos(truck);

  for (const sendung of folge) {
    let route;
    if (opts.sync) {
      route = straightRoute(von, sendung.firm);
    } else {
      try { route = await osrmRoute(von, sendung.firm); }
      catch { route = straightRoute(von, sendung.firm); }
    }
    etappen.push({ route, sendung });
    von = sendung.firm;
  }

  const alleHits = etappen.flatMap(e => trafficOnRoute(e.route.coords));
  S.stats.jams += alleHits.length;

  truck.tour = { etappen, index: 0 };
  starteEtappe(truck);

  const gesamt = etappen.reduce((s, e) => s + e.route.km, 0);
  const erloes = folge.reduce((s, o) => s + o.fee, 0);
  const last = summe(folge);

  log(`${truck.driver.name} startet Tour mit ${folge.length} Stopp${folge.length > 1 ? 's' : ''}: `
    + `${gesamt.toFixed(0)} km, ${last.paletten} Paletten, ${(last.kg / 1000).toFixed(1)} t, ${fmt(erloes)}`);

  if (alleHits.length && !S.silent) {
    toast('🚧', `${alleHits.length} gemeldete Stellen auf der Tour.`,
                `<span class="muted">${esc(alleHits[0].road)}: ${esc(alleHits[0].title)}</span>`);
  }
  return true;
}

function starteEtappe(truck) {
  const e = truck.tour.etappen[truck.tour.index];
  const sendung = e.sendung;

  truck.route = e.route;
  truck.progress = 0;
  truck.phase = 'driving';
  truck.job = {
    kind: 'delivery',
    firm: sendung.firm,
    fee: sendung.fee,
    art: sendung.kind,
    klasse: sendung.klasse,
    paletten: sendung.paletten,
    gewicht: sendung.gewicht,
    contractId: sendung.contractId || null,
    partnerKey: sendung.partnerKey || null,
    jams: trafficOnRoute(e.route.coords).length,
    target: sendung.firm,
    stopp: truck.tour.index + 1,
    stopps: truck.tour.etappen.length,
  };

  drawRoute(truck);
  updateTruckMarker(truck);
}

/* Eine Leerfahrt beenden und dort halten, wo das Fahrzeug gerade ist.
   Die bis dahin gefahrenen Kilometer werden abgerechnet. */
function brichLeerfahrtAb(truck) {
  const hier = jetztPos(truck);
  const gefahren = truck.progress;

  if (gefahren > 0) {
    const d = truck.driver;
    const sprit = gefahren * truckFuel(truck) * dieselFaktor(d) * dieselRabatt();
    book('Diesel', `Leerfahrt abgebrochen · LKW ${truck.nr}`, -sprit);
    truck.odo = (truck.odo || 0) + gefahren;
    S.stats.km += gefahren;
    d.km = (d.km || 0) + gefahren;
  }

  truck.pos = { lat: hier.lat, lon: hier.lon };
  truck.place = 'auf der Strecke';
  truck.route = null;
  truck.job = null;
  truck.progress = 0;
  truck.phase = 'idle';
  removeTruckLayers(truck);

  log(`${truck.driver.name} bricht die Leerfahrt ab und nimmt Fracht auf.`);
}

/* ── Auftrag annehmen ── */
export async function dispatch(offerId, truckNr = null, opts = {}) {
  const truck = truckNr
    ? findTruck(truckNr)
    : S.trucks.find(verfuegbar);

  if (!truck) return;

  if (!verfuegbar(truck)) {
    const status = driveStatus(truck);
    if (!S.silent) {
      toast('⏳', `<strong>${esc(truck.driver.name)}</strong> kann nicht losfahren.`,
                  `<span class="muted">${esc(status.text)}</span>`);
    }
    return;
  }

  const offer = takeOffer(offerId);
  if (!offer) return;

  const p = passt(truck, [], offer);
  if (!p.ok) {
    S.offers.unshift(offer);          // zurück in die Börse
    if (!S.silent) {
      toast('📏', `Passt nicht auf LKW ${truck.nr}.`, `<span class="muted">${esc(p.grund)}</span>`);
    }
    return;
  }

  await startTour(truck.nr, [offer], opts);
}

/* ── Leerfahrt zurück ins Depot ── */
export async function returnToDepot(nr, opts = {}) {
  const truck = findTruck(nr);
  if (!truck || truck.phase !== 'idle' || atDepot(truck)) return;
  if (!canDrive(truck)) return;

  const ziel = { lat: S.depot.lat, lon: S.depot.lon, name: 'Depot' };
  let route;
  if (opts.sync) route = straightRoute(truckPos(truck), ziel);
  else {
    try { route = await osrmRoute(truckPos(truck), ziel); }
    catch { route = straightRoute(truckPos(truck), ziel); }
  }

  truck.tour = null;
  truck.route = route;
  truck.progress = 0;
  truck.phase = 'driving';
  truck.job = { kind: 'return', target: ziel, jams: trafficOnRoute(route.coords).length };

  drawRoute(truck);
  updateTruckMarker(truck);
  log(`${truck.driver.name} fährt leer zurück ins Depot · ${route.km.toFixed(0)} km`);
}

/* ── Rastplatzsuche ──────────────────────────────────────────────
   Sucht den nächsten Parkplatz, der vor dem Fahrzeug auf der Strecke
   liegt. Zurückgegeben wird die Kilometermarke auf der Route. */
export function naechsterRastplatz(truck) {
  if (!truck.route || !S.parking?.length) return null;

  const cum = routeCum(truck.route);
  const c = truck.route.coords;
  const gesamt = cum[cum.length - 1];
  if (!(gesamt > 0)) return null;

  /* Position des Fahrzeugs auf der Route, in Kartenkilometern */
  const anteil = truck.route.km > 0 ? truck.progress / truck.route.km : 0;
  const hier = Math.max(0, Math.min(1, anteil)) * gesamt;
  const bis = Math.min(gesamt, hier + DRIVE.RAST_SUCHE);

  const schritt = Math.max(1, Math.floor(c.length / 400));

  for (let i = 0; i < c.length; i += schritt) {
    if (cum[i] <= hier + 1) continue;      // schon vorbei
    if (cum[i] > bis) break;               // zu weit

    const punkt = { lat: c[i][0], lon: c[i][1] };
    for (const p of S.parking) {
      if (haversine(punkt, p) < DRIVE.RAST_NAEHE) {
        return {
          km: cum[i] / gesamt * truck.route.km,   // zurück in Fahrkilometer
          name: p.name,
          road: p.road,
        };
      }
    }
  }
  return null;
}

/* Pause oder Ruhezeit beginnen, an Ort und Stelle. */
function halteAn(truck, art, ort) {
  truck.restMin = art === 'ruhe' ? DRIVE.DAILY_REST : DRIVE.BREAK;
  truck.restKind = art;
  truck.rastZiel = null;

  const wo = ort ? `auf ${ort}` : 'am Straßenrand';
  if (art === 'ruhe') {
    log(`🛏️ ${truck.driver.name} legt die Ruhezeit ${wo} ein.`);
  } else {
    log(`☕ ${truck.driver.name} macht Pause ${wo}.`);
  }
  truck.rastOrt = ort || null;
}

/* Steht eine Unterbrechung an? Dann Parkplatz ansteuern. */
function pruefeRast(truck) {
  if (truck.restMin > 0 || truck.rastZiel) return;

  const art = truck.today >= DRIVE.MAX_DAY ? 'ruhe'
            : truck.stint >= DRIVE.MAX_STINT ? 'pause' : null;
  if (!art) return;

  const ziel = naechsterRastplatz(truck);

  if (ziel) {
    truck.rastZiel = { ...ziel, art };
    log(`${truck.driver.name} steuert ${ziel.name} an (${ziel.road}), `
      + `noch ${Math.max(0, ziel.km - truck.progress).toFixed(0)} km.`);
  } else {
    /* Kein Parkplatz in Reichweite: notgedrungen hier halten. */
    halteAn(truck, art, null);
  }
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

    /* Angesteuerten Parkplatz erreicht? */
    if (truck.rastZiel && truck.progress >= truck.rastZiel.km) {
      halteAn(truck, truck.rastZiel.art, truck.rastZiel.name);
      continue;
    }

    /* Steht eine Unterbrechung an? */
    pruefeRast(truck);
  }
}

function finish(truck) {
  const d = truck.driver;
  const km = truck.route.km;
  const fuel = km * truckFuel(truck) * dieselFaktor(d) * dieselRabatt();

  if (truck.job.kind === 'delivery') {
    const fee = truck.job.fee * feeMul(d);
    const art = truck.job.art || 'spot';
    const label = art === 'vertrag' ? 'Vertragsfracht'
                : art === 'partner' ? 'Partnerfracht' : 'Fracht';
    book(label, `${truck.job.firm.name} · ${d.name}`, fee);

    if (truck.job.contractId) registerDelivery(truck.job.contractId);
    if (truck.job.partnerKey) registerPartnerLoad(truck.job.partnerKey);
    registriereFahrt(truck.job.firm);
    addRep(REP.PER_LOAD);
    checkLevelUp();
    book('Diesel', `${km.toFixed(0)} km · LKW ${truck.nr}`, -fuel);
    S.stats.tours++;
    S.stats.revenue += fee;
    S.tagTouren = (S.tagTouren || 0) + 1;
    d.tours++;

    pruefeRekord('tourGeld', fee, `${truck.job.firm.name} · ${d.name}`);
    pruefeRekord('paletten', truck.job.paletten || 0, truck.job.firm.name);
    if (truck.tour) {
      const gesamt = truck.tour.etappen.reduce((s, e) => s + e.route.km, 0);
      pruefeRekord('tourKm', Math.round(gesamt), `${d.name}, ${truck.tour.etappen.length} Stopps`);
    }
    log(`✔ ${d.name} hat bei ${truck.job.firm.name} entladen. `
      + `Fracht ${fmt(fee)}, Diesel ${fmt(-fuel)}.`);
    gainXp(d, 40 + Math.round(km / 8));
    truck.place = truck.job.firm.name;

    /* Be- und Entladen kostet Zeit. Ohne Rampenzeit ließe sich ein
       Fahrzeug beliebig oft am Tag einsetzen. */
    /* Be- und Entladen kostet Zeit, aber nach Menge: zwei Paletten
       sind schneller abgeladen als eine Komplettladung. Bei Touren mit
       mehreren Stopps entfällt der Papierkram je Stopp teilweise. */
    const stopps = truck.job.stopps || 1;
    const zeit = RULES.LOAD_BASE + (truck.job.paletten || 1) * RULES.LOAD_JE_PAL;
    truck.restMin = Math.min(RULES.LOAD_MAX, Math.round(zeit * (stopps > 1 ? 0.7 : 1)));
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
  truck.route = null;
  removeTruckLayers(truck);

  /* Weiter zur nächsten Entladestelle, falls die Tour noch läuft. */
  if (truck.tour && truck.tour.index + 1 < truck.tour.etappen.length) {
    truck.tour.index++;
    truck.job = null;
    starteEtappe(truck);
    return;
  }

  truck.tour = null;
  truck.job = null;
  truck.phase = 'idle';
}

/* ── Selbstdisposition ──────────────────────────────────────────
   Ein LKW auf Automatik sucht sich den Auftrag mit dem besten
   Verhältnis von Fracht zu Anfahrt und fährt sonst heim. */
function maybeAuto(truck) {
  if (!truck.auto || !automatikFrei() || truck.phase !== 'idle') return;
  if (!canDrive(truck)) return;
  if (!S.offers.length) return;

  /* Die beste Sendung suchen und danach auffüllen, was noch dazupasst
     und keinen großen Umweg bedeutet — so, wie ein Disponent lädt. */
  const bewertet = S.offers
    .map(o => ({ o, wert: o.fee / Math.max(12, distanceFrom(truck, o.firm)) }))
    .sort((a, b) => b.wert - a.wert);

  const geladen = [];
  for (const { o } of bewertet) {
    if (!passt(truck, geladen, o).ok) continue;
    if (geladen.length) {
      const umweg = umwegFuer(truck, geladen, o);
      if (umweg > 120) continue;              // zu weit ab vom Weg
    }
    geladen.push(o);
    if (geladen.length >= 4) break;
  }
  if (!geladen.length) return;

  for (const o of geladen) takeOffer(o.id);
  startTour(truck.nr, geladen, { sync: !!S.silent });
}

/* ── Kaufen und verkaufen ── */
/* ── Fahrzeughandel ── */
export const priceOf = (modelKey, used) => {
  const m = TRUCK_MODELS[modelKey];
  if (!m) return 0;
  return Math.round(m.price * (used ? USED.factor : 1) / 100) * 100;
};

export function buyTruck(modelKey = 'verteiler', used = false, equip = []) {
  const model = TRUCK_MODELS[modelKey];
  if (!model) return false;
  if (!modelFrei(modelKey)) return false;

  const brauchbar = equip.filter(k =>
    (k === 'kuehl' && model.kuehlbar) || (k === 'adr' && model.adrfaehig));
  const zusatz = brauchbar.reduce((s, k) => s + EQUIPMENT[k].preis, 0);

  const price = priceOf(modelKey, used) + zusatz;
  if (S.money < price) return false;

  const last = S.trucks[S.trucks.length - 1];
  const truck = newTruck((last ? last.nr : 0) + 1,
                         { lat: S.depot.lat, lon: S.depot.lon }, modelKey, used, brauchbar);
  S.trucks.push(truck);
  checkLevelUp();

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
  dropTruck(truck);

  const value = resaleValue(truck);
  book('Fahrzeugverkauf', `${modelOf(truck).name} · LKW ${truck.nr}`, value);
  log(`LKW ${truck.nr} verkauft, ${truck.driver.name} verabschiedet sich: ${fmt(value)}`);
  toast('🤝', `LKW ${truck.nr} verkauft.`, `<span class="money">${fmt(value)}</span>`);
  return true;
}

export function setAuto(nr, value) {
  if (value && !automatikFrei()) return false;
  const truck = findTruck(nr);
  if (truck) truck.auto = value;
  return true;
}
