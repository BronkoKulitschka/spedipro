/* Kleine Ereignisse aus dem Betriebsalltag. Nichts davon ist bedrohlich. */

import { EVENTS } from '../config.js';
import { S, log } from '../state.js';
import { pick, fmt, esc } from '../util.js';
import { toast } from '../ui/toast.js';

export function fireEvent() {
  const ev = pick(EVENTS);
  S.money += ev.delta;

  const sign = ev.delta > 0 ? '+' : '';
  log(`${ev.icon} ${ev.text}${ev.delta ? ' ' + sign + fmt(ev.delta) : ''}`);

  const money = ev.delta === 0 ? ''
    : `<span class="${ev.delta > 0 ? 'ok' : 'warn'}">${sign}${fmt(ev.delta)}</span>`;
  toast(ev.icon, esc(ev.text), money);
}
