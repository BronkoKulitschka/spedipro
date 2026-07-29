/* Die Betriebsuhr. Sie treibt alles andere an. */

import { RULES, TICK_MS } from '../config.js';
import { S, log, riskMul } from '../state.js';
import { fmt } from '../util.js';
import { moveTrucks } from './fleet.js';
import { fireEvent } from './events.js';
import { refillOffers } from './orders.js';
import { paint } from '../ui/paint.js';
import { invalidateFleet } from '../ui/fleet.js';

let timer = null;

export function setSpeed(speed) {
  if (speed > 0) S.prevSpeed = speed;
  S.speed = speed;
  S.running = speed > 0;
  restartTimer();
  paint();
}

export function togglePause() {
  setSpeed(S.speed > 0 ? 0 : (S.prevSpeed || 1));
}

export function restartTimer() {
  clearInterval(timer);
  timer = null;
  if (S.running && S.screen === 'game') {
    timer = setInterval(tick, TICK_MS[S.speed]);
  }
}

export function stopClock() {
  clearInterval(timer);
  timer = null;
}

function tick() {
  S.minute += RULES.MIN_PER_TICK;
  while (S.minute >= 60) { S.minute -= 60; S.hour++; }
  if (S.hour >= 24) { S.hour -= 24; S.day++; newDay(); }

  moveTrucks();
  if (Math.random() < RULES.EVENT_CHANCE) fireEvent();
  paint();
}

/* Mitternacht: Fixkosten, Pannenwurf, frische Aufträge. */
function newDay() {
  const cost = S.trucks.length * RULES.DAILY_COST;
  S.money -= cost;
  log(`Tagesfixkosten für ${S.trucks.length} LKW: ${fmt(-cost)}`);

  for (const truck of S.trucks) {
    const rolling = truck.phase === 'out' || truck.phase === 'back';
    if (!rolling || truck.shopMin) continue;
    if (Math.random() >= RULES.BREAKDOWN * riskMul(truck.driver)) continue;

    const bill = 800 + Math.floor(Math.random() * 2200);
    S.money -= bill;
    truck.shopMin = 180 + Math.floor(Math.random() * 300);
    log(`🔧 LKW ${truck.nr} (${truck.driver.name}) steht in der Werkstatt: ${fmt(-bill)}.`);
    invalidateFleet();
  }

  refillOffers();
}
