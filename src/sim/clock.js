/* Die Betriebsuhr. Sie treibt alles andere an.

   Der Takt kommt in fester Realzeit (TIME.TICK_MS). Wie viel Spielzeit
   dabei vergeht, ergibt sich aus dem eingestellten Verhältnis und der
   Geschwindigkeitsstufe. Bei Verhältnis 3 und Stufe 1× sind das drei
   Spielminuten je echter Minute. */

import { RULES, TIME } from '../config.js';
import { S, log, book, day, truckRisk, fixGesamt, todayText, holidayNow, weekendNow } from '../state.js';
import { fmt } from '../util.js';
import { moveTrucks } from './fleet.js';
import { fireEvent } from './events.js';
import { refillOffers, refreshSpot } from './orders.js';
import { driftMarket } from './market.js';
import { settleContracts, refillContractOffers } from './contracts.js';
import { growIndustry } from './partners.js';
import { onTick } from '../ui/wm.js';
import { saveGame } from './save.js';

let timer = null;
let lastDay = 1;
let lastTickAt = 0;
let lastSaveAt = 0;

export function syncDay() { lastDay = day(); lastTickAt = Date.now(); }

/* Spielminuten je Takt */
export function minutesPerTick() {
  return S.ratio * S.speed * (TIME.TICK_MS / 60000);
}

/* Wie viele echte Minuten ein Spieltag dauert */
export function realMinutesPerGameDay() {
  const perRealMinute = S.ratio * (S.speed || 1);
  return 1440 / perRealMinute;
}

export function setSpeed(speed) {
  if (speed > 0) S.prevSpeed = speed;
  S.speed = speed;
  S.running = speed > 0;
  restartTimer();
  onTick();
}

export function setRatio(ratio) {
  S.ratio = ratio;
  onTick();
}

export function togglePause() {
  setSpeed(S.speed > 0 ? 0 : (S.prevSpeed || 1));
}

export function restartTimer() {
  clearInterval(timer);
  timer = null;
  lastTickAt = Date.now();
  if (S.running && S.screen === 'desktop') {
    timer = setInterval(tick, TIME.TICK_MS);
  }
}

export function stopClock() {
  clearInterval(timer);
  timer = null;
}

/* Ein Abschnitt Spielzeit. Wird sowohl vom Takt als auch beim
   Nachrechnen nach einer Pause benutzt. */
export function advance(mins) {
  if (mins <= 0) return;
  S.minutes += mins;

  if (day() !== lastDay) { lastDay = day(); newDay(); }

  moveTrucks(mins);

  /* Ereignisse hängen an der Spielzeit, nicht am Takt.
     So bleibt die Häufigkeit gleich, egal wie schnell die Uhr läuft. */
  if (Math.random() < RULES.EVENT_PER_DAY * mins / 1440) fireEvent();
}

function tick() {
  const now = Date.now();

  /* Vergangene Realzeit messen statt feste Schritte anzunehmen.
     Gedrosselte Tabs holen so von selbst auf. */
  const elapsed = Math.min(now - (lastTickAt || now), 120000);
  lastTickAt = now;

  advance(S.ratio * S.speed * (elapsed / 60000));

  if (now - lastSaveAt > 20000) { lastSaveAt = now; saveGame(); }

  onTick();
}

/* Mitternacht: Fixkosten, Pannenwurf, frische Aufträge. */
function newDay() {
  const feiertag = holidayNow();
  if (feiertag) log(`📅 ${todayText()} — ${feiertag}. Für schwere Fahrzeuge gilt Fahrverbot bis 22 Uhr.`);
  else if (weekendNow()) log(`📅 ${todayText()} — Wochenende.`);
  else log(`📅 ${todayText()}`);

  const cost = fixGesamt();
  book('Fixkosten', `${S.trucks.length} Fahrzeuge · Fahrer, Versicherung, Wartung`, -cost);
  log(`Tagesfixkosten für ${S.trucks.length} LKW: ${fmt(-cost)}`);

  for (const truck of S.trucks) {
    const rolling = truck.phase === 'driving';
    if (!rolling || truck.shopMin) continue;
    if (Math.random() >= RULES.BREAKDOWN * truckRisk(truck)) continue;

    const bill = 800 + Math.floor(Math.random() * 2200);
    book('Werkstatt', `LKW ${truck.nr} · ${truck.driver.name}`, -bill);
    truck.shopMin = 180 + Math.floor(Math.random() * 300);
    log(`🔧 LKW ${truck.nr} (${truck.driver.name}) steht in der Werkstatt: ${fmt(-bill)}.`);
  }

  driftMarket();
  settleContracts();
  refillContractOffers();
  growIndustry();
  refreshSpot();

  /* Neue Anfragen auch auf der Karte sichtbar machen */
  if (!S.silent) import('../ui/map.js').then(m => m.drawOffers());
}
