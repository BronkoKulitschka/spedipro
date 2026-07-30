/* Fahrzeughandel. Klassen unterscheiden sich in Anschaffung, Verbrauch,
   Reisegeschwindigkeit und Ladefähigkeit — wie in den großen Vorbildern
   ist die Frage nicht „welcher ist der beste", sondern „welcher passt
   zu den Strecken, die ich fahre". */

import { TRUCK_MODELS, USED, RULES, EQUIPMENT } from '../config.js';
import { S } from '../state.js';
import { fmt, esc } from '../util.js';
import { buyTruck, priceOf } from '../sim/fleet.js';
import { modelFrei, stufeFuerModell } from '../sim/progress.js';
import { onTick } from '../ui/wm.js';

export const DealerApp = {
  id: 'dealer', icon: '🏷️', title: () => 'Fahrzeughandel',
  width: 460, height: 460,

  body: () => `
    <div class="col fill">
      <div class="bar-note flex-row" style="justify-content:space-between;">
        <span id="dlMoney">—</span>
        <span class="flex-row" style="gap:8px;font-size:10px;flex-wrap:wrap;">
          <label class="flex-row" style="gap:4px;"><input type="checkbox" id="dlUsed"> gebraucht</label>
          <label class="flex-row" style="gap:4px;"><input type="checkbox" id="eq-kuehl">
            ${EQUIPMENT.kuehl.icon} Kühlaufbau</label>
          <label class="flex-row" style="gap:4px;"><input type="checkbox" id="eq-adr">
            ${EQUIPMENT.adr.icon} ADR</label>
        </span>
      </div>
      <div class="inset-box scroll fill" id="dlList"></div>
      <div class="bar-note muted" id="dlHint">
        Gebraucht kostet ${Math.round((1 - USED.factor) * 100)} % weniger,
        geht dafür häufiger in die Werkstatt.
      </div>
    </div>`,

  mount(el) {
    el.addEventListener('change', () => {
      el.querySelector('#dlList').dataset.sig = '';
      onTick();
    });

    el.querySelector('#dlList').addEventListener('click', e => {
      const btn = e.target.closest('button[data-model]');
      if (!btn) return;
      const used = el.querySelector('#dlUsed').checked;
      const equip = [];
      if (el.querySelector('#eq-kuehl').checked) equip.push('kuehl');
      if (el.querySelector('#eq-adr').checked)   equip.push('adr');
      if (buyTruck(btn.dataset.model, used, equip)) {
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
    const kuehl = el.querySelector('#eq-kuehl').checked;
    const adr   = el.querySelector('#eq-adr').checked;
    const sig = `${used}|${kuehl}|${adr}|${S.level}|${Math.floor(S.money / 500)}`;
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;

    list.innerHTML = Object.values(TRUCK_MODELS).map(m => {
      const zusatz = (kuehl && m.kuehlbar ? EQUIPMENT.kuehl.preis : 0)
                   + (adr && m.adrfaehig ? EQUIPMENT.adr.preis : 0);
      const price = priceOf(m.key, used) + zusatz;
      const offen = modelFrei(m.key);
      const kann = offen && S.money >= price;
      const hinweis = [
        kuehl && !m.kuehlbar ? 'kein Kühlaufbau möglich' : '',
        adr && !m.adrfaehig ? 'nicht ADR-fähig' : '',
      ].filter(Boolean).join(' · ');
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
            <td>zul. Gesamtgewicht</td><td style="text-align:right">${(m.zgg / 1000).toFixed(1)} t</td>
            <td>Leergewicht</td><td style="text-align:right">${(m.leer / 1000).toFixed(1)} t</td>
          </tr>
          <tr>
            <td><strong>Nutzlast</strong></td>
            <td style="text-align:right"><strong>${(m.nutzlast / 1000).toFixed(1)} t</strong></td>
            <td><strong>Stellplätze</strong></td>
            <td style="text-align:right"><strong>${m.paletten} Pal.</strong></td>
          </tr>
          <tr>
            <td>Ladevolumen</td><td style="text-align:right">${m.volumen} m³</td>
            <td>Aufbau</td><td style="text-align:right">${esc(m.aufbau)}</td>
          </tr>
          <tr>
            <td>Diesel</td><td style="text-align:right">${verbrauch} €/km</td>
            <td>Schnitt</td>
            <td style="text-align:right">${m.speed >= 0 ? '+' : ''}${m.speed} km/h</td>
          </tr>
        </table>
        <div class="flex-row" style="justify-content:space-between;">
          <span class="muted" style="font-size:10px;">
            ${offen ? esc(hinweis) : `🔒 ab Stufe ${stufeFuerModell(m.key)}`}
            ${zusatz ? `<span class="warn">inkl. Ausstattung ${fmt(zusatz)}</span>` : ''}</span>
          <button class="btn btn-sm" data-model="${m.key}" ${kann ? '' : 'disabled'}>kaufen</button>
        </div>
      </div>`;
    }).join('');
  },
};
