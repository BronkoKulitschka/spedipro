/* Spielstand im Browser sichern und zurückholen.

   Gespeichert wird in localStorage, zusammen mit einem Zeitstempel.
   Beim nächsten Start ergibt sich daraus, wie viel Zeit gefehlt hat. */

import { VERSION } from '../version.js';
import { S } from '../state.js';

const KEY = 'spedipro.save';
const FORMAT = 2;

/* Leaflet-Objekte lassen sich nicht sichern und werden neu aufgebaut. */
function serialize() {
  return {
    format: FORMAT,
    gameVersion: VERSION,
    savedAt: Date.now(),
    state: {
      name: S.name,
      depot: S.depot,
      money: S.money,
      minutes: S.minutes,
      ratio: S.ratio,
      speed: S.speed,
      running: S.running,
      firms: S.firms,
      traffic: S.traffic,
      offers: S.offers,
      log: S.log.slice(0, 40),
      stats: S.stats,
      dataInfo: S.dataInfo,
      trucks: S.trucks.map(t => ({
        nr: t.nr,
        driver: t.driver,
        order: t.order,
        route: t.route ? { km: t.route.km, coords: t.route.coords, real: t.route.real } : null,
        progress: t.progress,
        phase: t.phase === 'planning' ? 'idle' : t.phase,
        repeat: t.repeat,
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
