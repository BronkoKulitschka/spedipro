/* Der gesamte Spielzustand. Alles andere liest und schreibt hier hinein. */

import { RULES, TIME, DRIVE, LEICHT, DRIVER_NAMES, TRUCK_MODELS, USED } from './config.js';
import { MARKET, REP } from './config.js';
import { dateOf, dateShort, dateLong, timeText, drivingBan,
         isWeekend, holidayName, weekday } from './calendar.js';
import { wuerfleTraits } from './sim/persons.js';
import { pick, pad } from './util.js';

export let S = null;

let usedNames = [];

export function newDriver() {
  const free = DRIVER_NAMES.filter(n => !usedNames.includes(n));
  const name = free.length ? pick(free) : 'Aushilfe ' + (usedNames.length + 1);
  usedNames.push(name);
  return {
    name, xp: 0, level: 1, points: 1, tours: 0,
    traits: wuerfleTraits(2),
    km: 0,                    // eigene Laufleistung, für die Bestenliste
    skills: { eco: 0, route: 0, deal: 0, care: 0, calm: 0 },
  };
}

export function newTruck(nr, pos = null, model = 'kurier', used = false, equip = []) {
  return {
    nr,
    model,
    used,
    equip,          // ['kuehl', 'adr']
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
    restKind: null,    // 'pause' | 'ruhe' | 'rampe'
    rastZiel: null,    // angesteuerter Parkplatz: { km, name, art }
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

    trucks: [newTruck(1, { lat: depot.lat, lon: depot.lon }, 'kurier', false)],
    firms: [],
    hubs: [],          // Flughäfen, Häfen, Güterbahnhöfe
    traffic: [],
    parking: [],       // LKW-Parkplätze und Rastanlagen

    /* Markt, Ruf, Verträge, Branche */
    offers: [],
    market: { index: 1.0, trend: 0 },
    rep: REP.START,
    contracts: [],
    contractOffers: [],
    partners: [],
    kunden: {},        // Stammkundschaft je Betrieb
    ruecklage: 0,      // beiseitegelegtes Geld
    sparziel: null,    // woran gerade gespart wird
    gebaut: [],        // fertiggestellte Anschaffungen
    rekorde: {},       // Bestwerte für die Chronik
    woche: null,       // letzter Wochenabschluss
    tagTouren: 0,      // Zustellungen am laufenden Tag

    log: [],
    level: 1,
    tutorial: { schritt: 0, aktiv: true },
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
  LEICHT.includes(truck.model) ? null : banReason();

/* Was ein Fahrer gerade darf. */
export function driveStatus(truck) {
  if (truck.shopMin > 0)  return { code: 'werkstatt', text: `Werkstatt, ${Math.ceil(truck.shopMin / 60)} h` };
  if (truck.restMin > 0) {
    const wo = truck.rastOrt ? ` · ${truck.rastOrt}` : '';
    return {
      code: truck.restKind,
      text: truck.restKind === 'ruhe'  ? `Ruhezeit, noch ${Math.ceil(truck.restMin / 60)} h${wo}`
          : truck.restKind === 'rampe' ? `an der Rampe, noch ${Math.ceil(truck.restMin)} min`
          : `Pause, noch ${Math.ceil(truck.restMin)} min${wo}`,
    };
  }

  if (truck.rastZiel) return {
    code: 'anfahrt',
    text: `steuert ${truck.rastZiel.name} an`,
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
export const modelOf  = t => TRUCK_MODELS[t.model] || TRUCK_MODELS.kurier;

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
export const truckRisk = t => riskMul(t.driver) * modelOf(t).risk * (t.used ? USED.risk : 1);

/* Tagesfixkosten: ein Kastenwagen kostet nicht so viel wie ein Sattelzug. */
export const truckFix = t =>
  Math.round(RULES.DAILY_COST * (modelOf(t).fix ?? 1) * (S.gebaut?.includes('halle') ? 0.92 : 1));

/* Wie viele Fahrzeuge einer Bauart im Hof stehen. */
export const anzahlVon = modelKey => S.trucks.filter(t => t.model === modelKey).length;

export function bestand() {
  const zaehler = {};
  for (const t of S.trucks) {
    const k = t.model;
    zaehler[k] ||= { gesamt: 0, gebraucht: 0 };
    zaehler[k].gesamt++;
    if (t.used) zaehler[k].gebraucht++;
  }
  return zaehler;
}
export const fixGesamt = () => S.trucks.reduce((s, t) => s + truckFix(t), 0);
export const feeMul   = d => 1 + 0.06 * d.skills.deal;
export const riskMul  = d => Math.pow(0.75, d.skills.care);
export const calmMul  = d => Math.pow(0.85, d.skills.calm);

/* Gesicherten Stand übernehmen. Leaflet-Verweise entstehen neu. */
export function hydrate(saved) {
  resetState(saved.depot);
  Object.assign(S, saved, {
    level: saved.level || 1,
    tutorial: saved.tutorial || { schritt: 0, aktiv: false },
    hubs: saved.hubs?.length ? saved.hubs : [],
    parking: saved.parking || [],
    ledger: saved.ledger || [],
    books: saved.books || { ein: 0, aus: 0 },
    market: saved.market || { index: 1, trend: 0 },
    rep: saved.rep ?? REP.START,
    contracts: saved.contracts || [],
    contractOffers: saved.contractOffers || [],
    partners: saved.partners || [],
    kunden: saved.kunden || {},
    ruecklage: saved.ruecklage || 0,
    sparziel: saved.sparziel || null,
    gebaut: saved.gebaut || [],
    rekorde: saved.rekorde || {},
    woche: saved.woche || null,
    tagTouren: 0,
    screen: 'desktop',
    silent: false,
    lastReport: null,
    trucks: saved.trucks.map(t => ({
      ...t,
      marker: null, line: null,
      pos: t.pos || { lat: saved.depot.lat, lon: saved.depot.lon },
      model: t.model || 'kurier',
      equip: t.equip || [],
      used: !!t.used,
      odo: t.odo || 0,
      stint: t.stint || 0, today: t.today || 0,
      restMin: t.restMin || 0, restKind: t.restKind || null,
      rastZiel: t.rastZiel || null,
      rastOrt: t.rastOrt || null,
      idleMin: t.idleMin || 0,
      /* Ältere Spielstände kennen noch keine Züge — nachrüsten. */
      driver: { ...t.driver,
                traits: t.driver?.traits?.length ? t.driver.traits : wuerfleTraits(2),
                km: t.driver?.km || 0 },
      place: t.place || 'Depot',
      auto: !!t.auto,
      phase: t.phase === 'out' || t.phase === 'back' ? 'idle' : t.phase,
    })),
  });
  return S;
}
