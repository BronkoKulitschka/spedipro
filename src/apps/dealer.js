/* Fahrzeughandel. Klassen unterscheiden sich in Anschaffung, Verbrauch,
   Reisegeschwindigkeit und Ladefähigkeit — wie in den großen Vorbildern
   ist die Frage nicht „welcher ist der beste", sondern „welcher passt
   zu den Strecken, die ich fahre". */

import { TRUCK_MODELS, USED, RULES } from '../config.js';
import { S } from '../state.js';
import { fmt, esc } from '../util.js';
import { buyTruck, priceOf } from '../sim/fleet.js';
import { onTick } from '../ui/wm.js';

export const DealerApp = {
  id: 'dealer', icon: '🏷️', title: () => 'Fahrzeughandel',
  width: 460, height: 460,

  body: () => `
    <div class="col fill">
      <div class="bar-note flex-row" style="justify-content:space-between;">
        <span id="dlMoney">—</span>
        <label class="flex-row" style="gap:4px;font-size:10px;">
          <input type="checkbox" id="dlUsed"> Gebrauchtfahrzeuge
        </label>
      </div>
      <div class="inset-box scroll fill" id="dlList"></div>
      <div class="bar-note muted" id="dlHint">
        Gebraucht kostet ${Math.round((1 - USED.factor) * 100)} % weniger,
        geht dafür häufiger in die Werkstatt.
      </div>
    </div>`,

  mount(el) {
    el.querySelector('#dlUsed').addEventListener('change', () => {
      el.querySelector('#dlList').dataset.sig = '';
      onTick();
    });

    el.querySelector('#dlList').addEventListener('click', e => {
      const btn = e.target.closest('button[data-model]');
      if (!btn) return;
      const used = el.querySelector('#dlUsed').checked;
      if (buyTruck(btn.dataset.model, used)) {
        el.querySelector('#dlList').dataset.sig = '';
      }
      onTick();
    });
  },

  update(el) {
    const used = el.querySelector('#dlUsed').checked;
    el.querySelector('#dlMoney').innerHTML =
      `Kasse: <span class="${S.money >= 0 ? 'money' : 'debt'}">${fmt(S.money)}</span>`;

    const list = el.querySelector('#dlList');
    const sig = `${used}|${Math.floor(S.money / 500)}`;
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;

    list.innerHTML = Object.values(TRUCK_MODELS).map(m => {
      const price = priceOf(m.key, used);
      const kann = S.money >= price;
      const verbrauch = (RULES.FUEL_PER_KM * m.fuel).toFixed(2);

      return `
      <div class="offer">
        <div class="flex-row" style="justify-content:space-between;">
          <span><strong>${esc(m.name)}</strong>
            <span class="muted">· ${esc(m.klasse)}${used ? ' · gebraucht' : ''}</span></span>
          <span class="${kann ? 'money' : 'debt'}">${fmt(price)}</span>
        </div>
        <div class="muted" style="font-size:10px;margin:2px 0 4px;">${esc(m.text)}</div>
        <table class="win-table" style="font-size:10px;margin-bottom:4px;">
          <tr>
            <td>Ladefähigkeit</td><td style="text-align:right">×${m.load.toFixed(2)} Fracht</td>
            <td>Diesel</td><td style="text-align:right">${verbrauch} €/km</td>
          </tr>
          <tr>
            <td>Schnitt</td>
            <td style="text-align:right">${m.speed >= 0 ? '+' : ''}${m.speed} km/h</td>
            <td>Pannen</td>
            <td style="text-align:right">×${(m.risk * (used ? USED.risk : 1)).toFixed(1)}</td>
          </tr>
        </table>
        <div class="flex-end">
          <button class="btn btn-sm" data-model="${m.key}" ${kann ? '' : 'disabled'}>kaufen</button>
        </div>
      </div>`;
    }).join('');
  },
};
