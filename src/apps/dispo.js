/* Disposition: LKW auswählen, Auftrag zuweisen.

   Entfernungen beziehen sich auf den Standort des gewählten LKW, nicht
   auf das Depot. Ein Fahrzeug, das schon in der Nähe steht, fährt die
   Fracht also günstiger. */

import { S, idleTrucks, findTruck } from '../state.js';
import { fmt, esc } from '../util.js';
import { dispatch, distanceFrom } from '../sim/fleet.js';
import { onTick } from '../ui/wm.js';
import { empty } from './shared.js';

export const DispoApp = {
  id: 'dispo', icon: '📋', title: () => 'Disposition',
  width: 420, height: 420, desktop: true,

  body: () => `
    <div class="col fill">
      <div class="bar-note col" style="gap:4px;">
        <div class="flex-row" style="gap:6px;">
          <span style="flex-shrink:0;">Fahrzeug:</span>
          <select id="dTruck" style="flex:1;"></select>
        </div>
        <div id="dNote">—</div>
      </div>
      <div class="inset-box scroll fill" id="offerBox"></div>
    </div>`,

  mount(el) {
    el.querySelector('#dTruck').addEventListener('change', () => {
      el.querySelector('#offerBox').dataset.sig = '';
      onTick();
    });

    el.querySelector('#offerBox').addEventListener('click', e => {
      const btn = e.target.closest('button[data-offer]');
      if (!btn) return;
      const nr = Number(el.querySelector('#dTruck').value) || null;
      dispatch(btn.dataset.offer, nr).then(onTick);
      onTick();
    });
  },

  update(el) {
    const select = el.querySelector('#dTruck');
    const free = S.trucks.filter(t => t.phase === 'idle' && !t.shopMin);

    /* Auswahlliste nur neu aufbauen, wenn sich die freien LKW ändern */
    const listSig = free.map(t => `${t.nr}@${t.place}`).join(',');
    if (select.dataset.sig !== listSig) {
      const keep = select.value;
      select.dataset.sig = listSig;
      select.innerHTML = free.length
        ? free.map(t => `<option value="${t.nr}">LKW ${t.nr} · ${esc(t.driver.name)} · ${esc(t.place)}</option>`).join('')
        : '<option value="">kein Fahrzeug frei</option>';
      if (free.some(t => String(t.nr) === keep)) select.value = keep;
    }

    const truck = findTruck(Number(select.value));
    el.querySelector('#dNote').textContent = truck
      ? `Steht bei ${truck.place}. Entfernungen gelten ab dort.`
      : `Alle ${S.trucks.length} LKW sind unterwegs oder in der Werkstatt.`;

    const box = el.querySelector('#offerBox');
    const sig = S.offers.map(o => o.id).join(',') + '|' + (truck?.nr ?? '-');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    if (!S.offers.length) { box.innerHTML = empty('Keine offenen Anfragen.'); return; }

    /* Nach Anfahrt vom gewählten Fahrzeug sortieren */
    const list = S.offers
      .map(o => ({ o, km: truck ? distanceFrom(truck, o.firm) : o.estKm }))
      .sort((a, b) => a.km - b.km);

    box.innerHTML = list.map(({ o, km }) => `
      <div class="offer">
        <div class="flex-row" style="justify-content:space-between;">
          <strong>${esc(o.firm.name)}</strong>
          <span class="money">${fmt(o.fee)}</span>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="muted">${esc(o.firm.kind)}${o.firm.invented ? ' · erfunden' : ''}
            · ${km.toFixed(0)} km Anfahrt</span>
          <button class="btn btn-sm" data-offer="${o.id}" ${truck ? '' : 'disabled'}>annehmen</button>
        </div>
      </div>`).join('');
  },
};
