/* Betriebsbuch: was im Betrieb passiert ist. */

import { S } from '../state.js';
import { esc } from '../util.js';
import { empty } from './shared.js';

export const LogApp = {
  id: 'log', icon: '📖', title: () => 'Betriebsbuch',
  width: 420, height: 340, desktop: true,

  body: () => '<div class="inset-box scroll fill" id="logBox"></div>',

  update(el) {
    const box = el.querySelector('#logBox');
    if (box.dataset.len === String(S.log.length)) return;
    box.dataset.len = S.log.length;
    box.innerHTML = S.log.length
      ? S.log.map(l => `<div class="log-line">${esc(l)}</div>`).join('')
      : empty('Noch keine Einträge.');
  },
};
