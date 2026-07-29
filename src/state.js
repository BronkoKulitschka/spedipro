/* Der gesamte Spielzustand. Alles andere liest und schreibt hier hinein. */

import { RULES, TIME, DRIVER_NAMES } from './config.js';
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

export function newTruck(nr) {
  return {
    nr,
    driver: newDriver(),
    order: null,
    route: null,
    progress: 0,       // gefahrene km auf dem aktuellen Abschnitt
    phase: 'idle',     // idle | planning | out | back
    repeat: false,
    shopMin: 0,        // verbleibende Werkstattminuten
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

    trucks: [newTruck(1)],
    firms: [],
    traffic: [],
    offers: [],
    log: [],
    stats: { tours: 0, km: 0, revenue: 0, jams: 0 },
    dataInfo: { router: 'noch nicht benutzt' },
  };
  return S;
}

/* ── Zeit ── */
export const day    = () => Math.floor(S.minutes / 1440) + 1;
export const hour   = () => Math.floor(S.minutes % 1440 / 60);
export const minute = () => Math.floor(S.minutes % 60);
export const clockText = () => `${pad(hour())}:${pad(minute())}`;
export const dateText  = () => `Tag ${day()} · ${clockText()}`;

export function log(msg) {
  S.log.unshift(`${clockText()} · Tag ${day()} — ${msg}`);
  if (S.log.length > 120) S.log.pop();
}

/* ── Abgeleitete Werte ── */
export const idleTrucks = () => S.trucks.filter(t => t.phase === 'idle' && !t.shopMin).length;
export const freePoints = () => S.trucks.reduce((sum, t) => sum + t.driver.points, 0);
export const findTruck  = nr => S.trucks.find(t => t.nr === nr);

/* ── Wirkung der Fertigkeiten ── */
export const xpNeeded = lvl => 100 + (lvl - 1) * 70;
export const kmh      = d => RULES.BASE_KMH + 5 * d.skills.route;
export const fuelRate = d => RULES.FUEL_PER_KM * (1 - 0.07 * d.skills.eco);
export const feeMul   = d => 1 + 0.06 * d.skills.deal;
export const riskMul  = d => Math.pow(0.75, d.skills.care);
export const calmMul  = d => Math.pow(0.85, d.skills.calm);
