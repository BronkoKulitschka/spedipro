/* Der gesamte Spielzustand. Alles andere liest und schreibt hier hinein. */

import { RULES, TIME, DRIVE, BAN_EXEMPT, DRIVER_NAMES, TRUCK_MODELS, USED } from './config.js';
import { MARKET, REP } from './config.js';
import { dateOf, dateShort, dateLong, timeText, drivingBan,
         isWeekend, holidayName, weekday } from './calendar.js';
import { pick, pad } from './util.js';

export let S = null;

let usedNames = [];

export function newDriver() {
  const free = DRIVER_NAMES.filter(n => !usedNames.includes(n));
  const name = free.length ? pick(free) : 'Aushilfe ' + (usedNames.length + 1);
  usedNames.push(name);
  return {
    name, xp: 0, level: 1, points: 1, tours: 0,
    skills: { eco: 0, route: 0, deal: 0, care: 0, calm: 0 },
  };
}

export function newTruck(nr, pos = null, model = 'verteiler', used = false) {
  return {
    nr,
    model,
    used,
    odo: used ? USED.odo : 0,      // Kilometerstand
    driver: newDriver(),
    order: null,
    route: null,
    progress: 0,       // gefahrene km auf der laufenden Fahrt
    phase: 'idle',     // idle | planning | driving
    auto: false,       // sucht sich selbst den nächsten Auftrag
    stint: 0,          // Lenkzeit seit der letzten Pause, Minuten
    today: 0,          // Lenkzeit am laufenden Tag, Minuten
    restMin: 0,        // verbleibende Pause oder Ruhezeit
    restKind: null,    // 'pause' | 'ruhe'
    idleMin: 0,        // wie lange schon nicht gefahren wurde
    shopMin: 0,        // verbleibende Werkstattminuten
    pos,               // aktueller Standort, null bedeutet Depot
    place: 'Depot',    // Klartext für die Anzeige
    marker: null,
    line: null,
  };
}

export function resetState(depot) {
  usedNames = [];
  S = {
    screen: 'start',
    name: 'Meine Spedition',
    depot,
    money: RULES.START_MONEY,

    /* Zeit wird in Minuten seit Spielbeginn geführt, als Kommazahl.
       Tag, Stunde und Minute werden daraus abgeleitet. */
    minutes: 6 * 60,
    ratio: TIME.DEFAULT_RATIO,
    speed: 1,
    running: false,
    prevSpeed: 1,

    trucks: [newTruck(1, { lat: depot.lat, lon: depot.lon }, 'verteiler', false)],
    firms: [],
    traffic: [],

    /* Markt, Ruf, Verträge, Branche */
    offers: [],
    market: { index: 1.0, trend: 0 },
    rep: REP.START,
    contracts: [],
    contractOffers: [],
    partners: [],

    log: [],
    level: 1,
    stats: { tours: 0, km: 0, revenue: 0, jams: 0, contractsDone: 0 },
    ledger: [],
    books: { ein: 0, aus: 0 },
    silent: false,
    lastReport: null,
    dataInfo: { router: 'noch nicht benutzt', firms: '—' },
  };
  return S;
}

/* ── Zeit und Kalender ── */
export const day    = () => Math.floor(S.minutes / 1440) + 1;
export const hour   = () => Math.floor(S.minutes % 1440 / 60);
export const minute = () => Math.floor(S.minutes % 60);
export const clockText = () => `${pad(hour())}:${pad(minute())}`;

export const now       = () => dateOf(S.minutes);
export const todayText = () => dateShort(now());
export const fullDate  = () => dateLong(now());
export const dateText  = () => `${dateShort(now())} · ${clockText()}`;

export const banReason  = () => drivingBan(now());
export const weekendNow = () => isWeekend(now());
export const holidayNow = () => holidayName(now());

/* Gilt das Fahrverbot für dieses Fahrzeug? Leichte Fahrzeuge sind frei. */
export const bannedFor = truck =>
  BAN_EXEMPT.includes(truck.model) ? null : banReason();

/* Was ein Fahrer gerade darf. */
export function driveStatus(truck) {
  if (truck.shopMin > 0)  return { code: 'werkstatt', text: `Werkstatt, ${Math.ceil(truck.shopMin / 60)} h` };
  if (truck.restMin > 0)  return {
    code: truck.restKind,
    text: truck.restKind === 'ruhe'  ? `Ruhezeit, noch ${Math.ceil(truck.restMin / 60)} h`
        : truck.restKind === 'rampe' ? `an der Rampe, noch ${Math.ceil(truck.restMin)} min`
        : `Pause, noch ${Math.ceil(truck.restMin)} min`,
  };
  const ban = bannedFor(truck);
  if (ban)                return { code: 'verbot', text: `Fahrverbot (${ban})` };
  if (truck.today >= DRIVE.MAX_DAY) return { code: 'ausgefahren', text: 'Tageslenkzeit erreicht' };
  return { code: 'frei', text: 'fahrbereit' };
}

export const canDrive = truck => driveStatus(truck).code === 'frei';

export function log(msg) {
  if (S.silent) return;          // während des Nachrechnens
  S.log.unshift(`${clockText()} · Tag ${day()} — ${msg}`);
  if (S.log.length > 120) S.log.pop();
}

/* ── Kassenbuch ─────────────────────────────────────────────────
   Jede Geldbewegung läuft hierdurch. So lässt sich später jede Zahl
   in der Kasse belegen. */
export const LEDGER_MAX = 300;

export function book(cat, text, amount) {
  S.money += amount;
  if (amount >= 0) S.books.ein += amount; else S.books.aus += amount;
  S.ledger.unshift({
    day: day(), time: clockText(),
    cat, text, amount,
  });
  if (S.ledger.length > LEDGER_MAX) S.ledger.pop();
  return amount;
}

export function ledgerSums(sinceDay = null) {
  const rows = sinceDay ? S.ledger.filter(e => e.day >= sinceDay) : S.ledger;
  const cats = {};
  let ein = 0, aus = 0;
  for (const e of rows) {
    if (e.amount >= 0) ein += e.amount; else aus += e.amount;
    cats[e.cat] = (cats[e.cat] || 0) + e.amount;
  }

  /* Für einen Zeitraum zählen die Zeilen, für das Ganze die laufenden
     Summen — die Liste selbst ist auf die letzten Buchungen begrenzt. */
  if (sinceDay) return { ein, aus, saldo: ein + aus, cats, count: rows.length, teil: true };
  return {
    ein: S.books.ein, aus: S.books.aus, saldo: S.books.ein + S.books.aus,
    cats, count: rows.length, teil: S.ledger.length >= LEDGER_MAX,
  };
}

/* ── Abgeleitete Werte ── */
export const idleTrucks = () => S.trucks.filter(t => t.phase === 'idle' && !t.shopMin).length;
export const freePoints = () => S.trucks.reduce((sum, t) => sum + t.driver.points, 0);
export const findTruck  = nr => S.trucks.find(t => t.nr === nr);

/* Wo ein LKW gerade steht. Ohne Angabe gilt das Depot. */
export const truckPos = t => t.pos || { lat: S.depot.lat, lon: S.depot.lon };
export const modelOf  = t => TRUCK_MODELS[t.model] || TRUCK_MODELS.verteiler;

/* Wiederverkaufswert: Zustand und Laufleistung drücken den Preis. */
export function resaleValue(truck) {
  const m = modelOf(truck);
  const base = m.price * (truck.used ? RULES.RESALE_USED : RULES.RESALE_NEW);
  const wear = Math.max(0.35, 1 - (truck.odo || 0) / 500000);
  return Math.round(base * wear / 100) * 100;
}
export const atDepot  = t => !t.pos
  || (Math.abs(t.pos.lat - S.depot.lat) < 1e-6 && Math.abs(t.pos.lon - S.depot.lon) < 1e-6);

/* ── Wirkung der Fertigkeiten ── */
export const xpNeeded = lvl => 100 + (lvl - 1) * 70;
export const kmh      = d => RULES.BASE_KMH + 5 * d.skills.route;
export const fuelRate = d => RULES.FUEL_PER_KM * (1 - 0.07 * d.skills.eco);

/* Dieselben Werte, aber mit dem Fahrzeug verrechnet. */
export const truckKmh  = t => Math.max(35, kmh(t.driver) + modelOf(t).speed);
export const truckFuel = t => fuelRate(t.driver) * modelOf(t).fuel;
export const truckLoad = t => modelOf(t).load;
export const truckRisk = t => riskMul(t.driver) * modelOf(t).risk * (t.used ? USED.risk : 1);
export const feeMul   = d => 1 + 0.06 * d.skills.deal;
export const riskMul  = d => Math.pow(0.75, d.skills.care);
export const calmMul  = d => Math.pow(0.85, d.skills.calm);

/* Gesicherten Stand übernehmen. Leaflet-Verweise entstehen neu. */
export function hydrate(saved) {
  resetState(saved.depot);
  Object.assign(S, saved, {
    level: saved.level || 1,
    ledger: saved.ledger || [],
    books: saved.books || { ein: 0, aus: 0 },
    market: saved.market || { index: 1, trend: 0 },
    rep: saved.rep ?? REP.START,
    contracts: saved.contracts || [],
    contractOffers: saved.contractOffers || [],
    partners: saved.partners || [],
    screen: 'desktop',
    silent: false,
    lastReport: null,
    trucks: saved.trucks.map(t => ({
      ...t,
      marker: null, line: null,
      pos: t.pos || { lat: saved.depot.lat, lon: saved.depot.lon },
      model: t.model || 'verteiler',
      used: !!t.used,
      odo: t.odo || 0,
      stint: t.stint || 0, today: t.today || 0,
      restMin: t.restMin || 0, restKind: t.restKind || null,
      idleMin: t.idleMin || 0,
      place: t.place || 'Depot',
      auto: !!t.auto,
      phase: t.phase === 'out' || t.phase === 'back' ? 'idle' : t.phase,
    })),
  });
  return S;
}
