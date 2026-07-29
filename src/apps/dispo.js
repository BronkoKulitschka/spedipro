/* Disposition: offene Anfragen annehmen. */

import { S, idleTrucks } from '../state.js';
import { fmt, esc } from '../util.js';
import { dispatch } from '../sim/fleet.js';
import { onTick } from '../ui/wm.js';
import { empty } from './shared.js';

export const DispoApp = {
  id: 'dispo', icon: '📋', title: () => 'Disposition',
  width: 400, height: 400, desktop: true,

  body: () => `
    <div class="col fill">
      <div class="bar-note" id="dNote">—</div>
      <div class="inset-box scroll fill" id="offerBox"></div>
    </div>`,

  mount(el) {
    /* Ein Klickempfänger für die ganze Liste, damit das Neuzeichnen
       keine Ereignisbindungen verliert. */
    el.querySelector('#offerBox').addEventListener('click', e => {
      const btn = e.target.closest('button[data-offer]');
      if (!btn) return;
      dispatch(btn.dataset.offer).then(onTick);
      onTick();
    });
  },

  update(el) {
    const free = idleTrucks();
    el.querySelector('#dNote').textContent = free
      ? `${free} LKW im Depot — Anfragen können angenommen werden.`
      : 'Alle LKW sind unterwegs. Anfragen bleiben stehen.';

    const box = el.querySelector('#offerBox');
    const sig = S.offers.map(o => o.id).join(',') + '|' + free;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    box.innerHTML = S.offers.length ? S.offers.map(o => `
      <div class="offer">
        <div class="flex-row" style="justify-content:space-between;">
          <strong>${esc(o.firm.name)}</strong>
          <span class="money">${fmt(o.fee)}</span>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="muted">${esc(o.firm.kind)}${o.firm.invented ? ' · erfunden' : ''}
            · ca. ${o.estKm.toFixed(0)} km</span>
          <button class="btn btn-sm" data-offer="${o.id}" ${free ? '' : 'disabled'}>annehmen</button>
        </div>
      </div>`).join('')
      : empty('Keine offenen Anfragen.');
  },
};
