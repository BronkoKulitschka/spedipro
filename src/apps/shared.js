/* Kleine Bausteine, die mehrere Programme benutzen. */

import { S } from '../state.js';
import { fmt } from '../util.js';

export function empty(text) {
  return `<div class="muted" style="padding:6px;">${text}</div>`;
}

/* ── Kontostand ──────────────────────────────────────────────────
   Überall dort, wo Geld ausgegeben werden kann, steht der Kontostand
   sichtbar am oberen Rand. Der Aufbau ist immer derselbe:

     kasseLeiste()          in body() einsetzen
     kasseAktualisieren(el) in update() aufrufen                     */

export function kasseLeiste(zusatz = '') {
  return `
    <div class="kasse-leiste">
      <span class="kasse-text">Kontostand</span>
      <span class="kasse-wert" data-kasse>—</span>
      ${zusatz ? `<span class="kasse-zusatz" data-kasse-zusatz>${zusatz}</span>` : ''}
    </div>`;
}

export function kasseAktualisieren(el, zusatz = null) {
  const wert = el.querySelector('[data-kasse]');
  if (wert) {
    wert.textContent = fmt(S.money);
    wert.className = 'kasse-wert ' + (S.money >= 0 ? 'money' : 'debt');
  }
  if (zusatz !== null) {
    const z = el.querySelector('[data-kasse-zusatz]');
    if (z) z.innerHTML = zusatz;
  }
}

/* Reicht das Geld? Für Knöpfe und Hinweise. */
export const reicht = betrag => S.money >= betrag;
