/* Nachrechnen der Zeit, die während der Abwesenheit vergangen ist.

   Der Browser kann nicht im Hintergrund weiterrechnen. Stattdessen wird
   beim Öffnen die Lücke in Schritten nachsimuliert. Für den Spieler sieht
   es aus, als sei der Betrieb weitergelaufen. */

import { S, day } from '../state.js';
import { advance, syncDay } from './clock.js';

const STEP_MIN = 15;              // Schrittweite beim Nachrechnen
const MAX_GAME_MINUTES = 5 * 1440; // höchstens fünf Spieltage aufholen

export function offlineMinutes(savedAt, ratio, speed, wasRunning) {
  if (!wasRunning) return 0;
  const realMinutes = (Date.now() - savedAt) / 60000;
  return Math.max(0, realMinutes * ratio * (speed || 1));
}

/* Rechnet die Lücke nach und liefert einen Bericht. */
export function catchUp(gameMinutes) {
  const wanted = gameMinutes;
  const capped = Math.min(gameMinutes, MAX_GAME_MINUTES);

  const before = {
    money: S.money,
    tours: S.stats.tours,
    km: S.stats.km,
    revenue: S.stats.revenue,
    day: day(),
  };

  S.silent = true;
  syncDay();

  let left = capped;
  while (left > 0) {
    const step = Math.min(STEP_MIN, left);
    advance(step);
    left -= step;
  }

  S.silent = false;
  syncDay();

  return {
    wantedMinutes: wanted,
    appliedMinutes: capped,
    truncated: wanted > capped,
    days: day() - before.day,
    tours: S.stats.tours - before.tours,
    km: S.stats.km - before.km,
    revenue: S.stats.revenue - before.revenue,
    balance: S.money - before.money,
    moneyNow: S.money,
    inWorkshop: S.trucks.filter(t => t.shopMin > 0).length,
    rolling: S.trucks.filter(t => t.phase === 'out' || t.phase === 'back').length,
  };
}
