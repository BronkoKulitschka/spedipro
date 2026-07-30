/* Kleine Ereignisse aus dem Betriebsalltag. Nichts davon ist bedrohlich. */

import { EVENTS } from '../config.js';
import { S, log, book } from '../state.js';
import { addRep } from './market.js';
import { pick, fmt, esc } from '../util.js';
import { toast } from '../ui/toast.js';

export function fireEvent() {
  const ev = pick(EVENTS);
  const geld = ev.delta || 0;
  const ruf  = ev.rep || 0;

  if (geld) book('Sonstiges', ev.text, geld);
  if (ruf)  addRep(ruf);

  const teile = [];
  if (geld) teile.push(`${geld > 0 ? '+' : ''}${fmt(geld)}`);
  if (ruf)  teile.push(`+${ruf.toFixed(1)} Ansehen`);
  log(`${ev.icon} ${ev.text}${teile.length ? ' · ' + teile.join(', ') : ''}`);

  const anzeige = [];
  if (geld) anzeige.push(`<span class="${geld > 0 ? 'ok' : 'warn'}">${geld > 0 ? '+' : ''}${fmt(geld)}</span>`);
  if (ruf)  anzeige.push(`<span class="ok">+${ruf.toFixed(1)} Ansehen</span>`);
  toast(ev.icon, esc(ev.text), anzeige.join(' · '));
}
