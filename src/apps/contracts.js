/* Verträge: Marktlage, Ansehen, laufende Rahmenverträge, Ausschreibungen. */

import { CONTRACTS } from '../config.js';
import { S, day } from '../state.js';
import { fmt, esc } from '../util.js';
import { marketText, repText } from '../sim/market.js';
import { signContract, currentRate } from '../sim/contracts.js';
import { onTick } from '../ui/wm.js';
import { empty } from './shared.js';

const tageBis = c => Math.max(0, Math.ceil((c.endMinutes - S.minutes) / 1440));

export const ContractsApp = {
  id: 'contracts', icon: '📜', title: () => 'Verträge', desktop: true,
  width: 450, height: 480,

  body: () => `
    <div class="col fill">
      <div class="pad" style="padding-bottom:6px;">
        <div class="flex-row" style="gap:6px;align-items:stretch;">
          <div class="raised-box" style="flex:1;">
            <div class="section-title">Marktlage</div>
            <div style="font-size:15px;font-weight:bold;" id="ctIndex">—</div>
            <div class="muted" id="ctMarket">—</div>
          </div>
          <div class="raised-box" style="flex:1;">
            <div class="section-title">Ansehen</div>
            <div class="prog" style="margin-bottom:3px;">
              <div class="prog-fill" id="ctRepBar"></div>
            </div>
            <div class="muted" id="ctRep">—</div>
          </div>
        </div>
      </div>

      <div class="bar-note">Laufende Verträge</div>
      <div class="inset-box scroll" style="flex:1;padding:4px;" id="ctRunning"></div>

      <div class="bar-note">Ausschreibungen — Preis unter Spotmarkt, dafür planbar</div>
      <div class="inset-box scroll" style="flex:1;padding:4px;" id="ctOffers"></div>
    </div>`,

  mount(el) {
    el.querySelector('#ctOffers').addEventListener('click', e => {
      const btn = e.target.closest('button[data-sign]');
      if (!btn) return;
      signContract(btn.dataset.sign);
      el.querySelector('#ctOffers').dataset.sig = '';
      el.querySelector('#ctRunning').dataset.sig = '';
      onTick();
    });
  },

  update(el) {
    const idx = S.market.index;
    const pfeil = S.market.trend > 0.005 ? '▲' : S.market.trend < -0.005 ? '▼' : '▬';
    const ci = el.querySelector('#ctIndex');
    ci.textContent = `${pfeil} ${(idx * 100).toFixed(0)} %`;
    ci.className = idx >= 1.05 ? 'money' : idx <= 0.92 ? 'debt' : '';
    el.querySelector('#ctMarket').textContent = marketText();

    el.querySelector('#ctRepBar').style.width = S.rep + '%';
    el.querySelector('#ctRep').textContent = `${Math.round(S.rep)} · ${repText()}`;

    /* Laufende Verträge */
    const run = el.querySelector('#ctRunning');
    const runSig = S.contracts.map(c => `${c.id}:${c.done}:${tageBis(c)}`).join('|');
    if (run.dataset.sig !== runSig) {
      run.dataset.sig = runSig;
      run.innerHTML = S.contracts.length ? S.contracts.map(c => {
        const anteil = Math.min(100, c.done / c.total * 100);
        const rate = currentRate(c);
        const floater = rate - c.perLoad;
        return `
        <div class="truck-row">
          <div class="flex-row" style="justify-content:space-between;">
            <strong>${esc(c.firm.name)}</strong>
            <span class="money">${fmt(rate)}<span class="muted"> je Fahrt</span></span>
          </div>
          <div class="prog" style="margin:4px 0;">
            <div class="prog-fill" style="width:${anteil}%"></div>
          </div>
          <div class="flex-row" style="justify-content:space-between;font-size:10px;">
            <span class="muted">${c.done} von ${c.total} Sendungen</span>
            <span class="muted">noch ${tageBis(c)} Tage</span>
          </div>
          <div style="font-size:10px;">
            Prämie bei Erfüllung <span class="money">${fmt(c.bonus)}</span>
            ${floater ? `· <span class="${floater > 0 ? 'ok' : 'warn'}">Dieselfloater ${floater > 0 ? '+' : ''}${fmt(floater)}</span>` : ''}
          </div>
        </div>`;
      }).join('') : empty('Kein laufender Vertrag. Unten liegen Ausschreibungen.');
    }

    /* Ausschreibungen */
    const box = el.querySelector('#ctOffers');
    const sig = S.contractOffers.map(o => o.id).join(',');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    box.innerHTML = S.contractOffers.length ? S.contractOffers.map(o => `
      <div class="offer">
        <div class="flex-row" style="justify-content:space-between;">
          <strong>${esc(o.firm.name)}</strong>
          <span class="money">${fmt(o.perLoad)}<span class="muted"> je Fahrt</span></span>
        </div>
        <div style="font-size:10px;margin:2px 0;">
          ${o.total} Sendungen über ${o.weeks} Wochen · ${o.perWeek} je Woche<br>
          <span class="muted">Gesamtwert ${fmt(o.perLoad * o.total)} ·
          Abschlussprämie <span class="money">${fmt(o.bonus)}</span></span>
        </div>
        <div class="flex-row" style="justify-content:space-between;">
          <span class="muted" style="font-size:10px;">
            ab ${Math.round(CONTRACTS.PART_OK * 100)} % Erfüllung halbe Prämie</span>
          <button class="btn btn-sm" data-sign="${o.id}">unterschreiben</button>
        </div>
      </div>`).join('')
      : empty('Zurzeit keine Ausschreibungen.');
  },
};
