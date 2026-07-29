/* Kasse: Kontostand, Fuhrpark kaufen und verkaufen, Statistik. */

import { RULES } from '../config.js';
import { S, idleTrucks } from '../state.js';
import { fmt, num } from '../util.js';
import { buyTruck, sellTruck } from '../sim/fleet.js';
import { onTick } from '../ui/wm.js';

export const FinanceApp = {
  id: 'finance', icon: '💰', title: () => 'Kasse',
  width: 320, height: 330, desktop: true,

  body: () => `
    <div class="pad">
      <div class="inset-box" style="text-align:center;padding:10px;margin-bottom:8px;">
        <div class="muted">Kontostand</div>
        <div style="font-size:19px;font-weight:bold;" id="fMoney">—</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Fuhrpark</div>
        <table class="win-table" style="margin-bottom:6px;">
          <tr><td>LKW gesamt</td><td style="text-align:right" id="fTrucks">—</td></tr>
          <tr><td>im Depot</td><td style="text-align:right" id="fIdle">—</td></tr>
          <tr><td>Fixkosten je Tag</td><td style="text-align:right" id="fCost">—</td></tr>
        </table>
        <div class="flex-row">
          <button class="btn" id="fBuy">LKW kaufen · ${fmt(RULES.TRUCK_BUY)}</button>
          <button class="btn" id="fSell">verkaufen · ${fmt(RULES.TRUCK_SELL)}</button>
        </div>
      </div>

      <div class="raised-box">
        <div class="section-title">Seit dem ersten Tag</div>
        <table class="win-table">
          <tr><td>Zustellungen</td><td style="text-align:right" id="fTours">—</td></tr>
          <tr><td>gefahrene km</td><td style="text-align:right" id="fKm">—</td></tr>
          <tr><td>Frachterlöse</td><td style="text-align:right" id="fRev">—</td></tr>
          <tr><td>Ø je Zustellung</td><td style="text-align:right" id="fAvg">—</td></tr>
        </table>
      </div>
    </div>`,

  mount(el) {
    el.querySelector('#fBuy').onclick  = () => { buyTruck();  onTick(); };
    el.querySelector('#fSell').onclick = () => { sellTruck(); onTick(); };
  },

  update(el) {
    const money = el.querySelector('#fMoney');
    money.textContent = fmt(S.money);
    money.className = S.money >= 0 ? 'money' : 'debt';

    el.querySelector('#fTrucks').textContent = S.trucks.length;
    el.querySelector('#fIdle').textContent   = idleTrucks();
    el.querySelector('#fCost').textContent   = fmt(S.trucks.length * RULES.DAILY_COST);
    el.querySelector('#fBuy').disabled  = S.money < RULES.TRUCK_BUY;
    el.querySelector('#fSell').disabled = S.trucks.length <= 1 || idleTrucks() === 0;

    el.querySelector('#fTours').textContent = num(S.stats.tours);
    el.querySelector('#fKm').textContent    = num(S.stats.km) + ' km';
    el.querySelector('#fRev').textContent   = fmt(S.stats.revenue);
    el.querySelector('#fAvg').textContent   = S.stats.tours ? fmt(S.stats.revenue / S.stats.tours) : '—';
  },
};
