/* Marktlage und Ansehen.

   Der Spotpreis schwankt von Tag zu Tag. Das Ansehen wächst mit jeder
   Zustellung und hebt sowohl die Preise als auch die Qualität der
   Ausschreibungen. Es sinkt nie — Druck soll hier nicht entstehen. */

import { MARKET, REP } from '../config.js';
import { S, now } from '../state.js';

export function driftMarket() {
  const step = (Math.random() - 0.5) * 2 * MARKET.DRIFT;
  S.market.index = Math.min(MARKET.MAX, Math.max(MARKET.MIN, S.market.index + step));
  S.market.trend = step;
}

/* Wie viele Anfragen heute hereinkommen: am Wochenende deutlich weniger. */
export const supplyToday = () => MARKET.WEEKDAY[now().getUTCDay()] ?? 1;

export const marketText = () => {
  const i = S.market.index;
  if (i >= 1.20) return 'Laderaum knapp, Preise ziehen an';
  if (i >= 1.05) return 'freundlich';
  if (i >= 0.95) return 'ausgeglichen';
  if (i >= 0.85) return 'ruhig';
  return 'Überkapazität, Preise unter Druck';
};

/* Ansehen wirkt als Faktor auf alle Erlöse. */
export const repMul = () =>
  REP.MIN_MUL + (S.rep / REP.MAX) * (REP.MAX_MUL - REP.MIN_MUL);

/* Ansehen ändern. Es kann steigen und fallen, verlässt aber nie den
   Bereich zwischen MIN und MAX — ein eingeführter Betrieb wird nicht
   über Nacht wieder namenlos, und ganz auf Null fällt niemand. */
export function addRep(amount) {
  S.rep = Math.max(REP.MIN, Math.min(REP.MAX, S.rep + amount));
}

export const repText = () => {
  const r = S.rep;
  if (r >= 90) return 'erste Adresse am Platz';
  if (r >= 75) return 'gut beleumundet';
  if (r >= 60) return 'bekannt und geschätzt';
  if (r >= 45) return 'solide';
  if (r >= 30) return 'noch im Aufbau';
  return 'neu am Markt';
};
