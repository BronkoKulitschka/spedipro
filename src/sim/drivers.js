/* Erfahrung und Schulung der Fahrer. */

import { SKILLS, RULES } from '../config.js';
import { S, log, findTruck, xpNeeded } from '../state.js';
import { fmt, esc } from '../util.js';
import { toast } from '../ui/toast.js';

export function gainXp(driver, amount) {
  driver.xp += amount;
  while (driver.xp >= xpNeeded(driver.level)) {
    driver.xp -= xpNeeded(driver.level);
    driver.level++;
    driver.points++;
    log(`🎓 ${driver.name} erreicht Stufe ${driver.level} — ein Schulungspunkt frei.`);
    toast('🎓', `<strong>${esc(driver.name)}</strong> hat Stufe ${driver.level} erreicht.`,
                '<span class="muted">Ein Schulungspunkt wartet im Fuhrpark.</span>');
  }
}

export function canLearn(driver, key) {
  return driver.points > 0
      && driver.skills[key] < SKILLS[key].max
      && S.money >= RULES.TRAIN_COST;
}

export function learn(nr, key) {
  const truck = findTruck(nr);
  if (!truck) return false;
  const d = truck.driver;
  if (!canLearn(d, key)) return false;

  d.points--;
  d.skills[key]++;
  S.money -= RULES.TRAIN_COST;
  log(`🎓 ${d.name} lernt ${SKILLS[key].name} (Stufe ${d.skills[key]}) für ${fmt(RULES.TRAIN_COST)}.`);
  return true;
}
