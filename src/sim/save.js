/* Spielstand im Browser sichern und zurückholen.

   Gespeichert wird in localStorage, zusammen mit einem Zeitstempel.
   Beim nächsten Start ergibt sich daraus, wie viel Zeit gefehlt hat. */

import { VERSION } from '../version.js';
import { S } from '../state.js';

const KEY = 'spedipro.save';
const FORMAT = 15;

/* Leaflet-Objekte lassen sich nicht sichern und werden neu aufgebaut. */
function serialize() {
  return {
    format: FORMAT,
    gameVersion: VERSION,
    savedAt: Date.now(),
    state: {
      name: S.name,
      spieler: S.spieler,
      depot: S.depot,
      stadt: S.stadt,
      money: S.money,
      minutes: S.minutes,
      ratio: S.ratio,
      speed: S.speed,
      running: S.running,
      firms: S.firms,
      traffic: S.traffic,
      offers: S.offers,
      market: S.market,
      rep: S.rep,
      contracts: S.contracts,
      contractOffers: S.contractOffers,
      partners: S.partners,
      kunden: S.kunden,
      ruecklage: S.ruecklage, sparziel: S.sparziel, gebaut: S.gebaut,
      rekorde: S.rekorde, woche: S.woche,
      log: S.log.slice(0, 40),
      level: S.level,
      tutorial: S.tutorial,
      stats: S.stats,
      ledger: S.ledger.slice(0, 200),
      books: S.books,
      dataInfo: S.dataInfo,
      drivers: S.drivers,
      bewerber: S.bewerber,
      trucks: S.trucks.map(t => ({
        nr: t.nr,
        model: t.model,
        used: t.used,
        equip: t.equip,
        odo: t.odo,
        driverId: t.driverId,
        job: t.job,
        route: t.route ? { km: t.route.km, coords: t.route.coords, real: t.route.real } : null,
        progress: t.progress,
        phase: t.phase === 'planning' ? 'idle' : t.phase,
        auto: t.auto,
        stint: t.stint, today: t.today,
        restMin: t.restMin, restKind: t.restKind, idleMin: t.idleMin,
        rastZiel: t.rastZiel, rastOrt: t.rastOrt,
        pos: t.pos,
        place: t.place,
        shopMin: t.shopMin,
      })),
    },
  };
}

export function saveGame() {
  if (!S || S.screen !== 'desktop') return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(serialize()));
    return true;
  } catch {
    return false;   // Speicher voll oder gesperrt
  }
}

export function readSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.format !== FORMAT) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasSave() { return !!readSave(); }

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}

export function saveInfo() {
  const data = readSave();
  if (!data) return null;
  return {
    savedAt: new Date(data.savedAt),
    gameVersion: data.gameVersion,
    name: data.state.name,
    depot: data.state.depot.name,
    day: Math.floor(data.state.minutes / 1440) + 1,
    money: data.state.money,
    trucks: data.state.trucks.length,
  };
}
