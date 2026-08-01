/* Kassenbuch: jede Geldbewegung, Einnahmen grün, Ausgaben rot,
   darunter die Bilanz nach Bereichen. */

import { S, ledgerSums, day, fixGesamt } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { empty } from './shared.js';

const FILTERS = {
  alle:  { label: 'alle',      test: () => true },
  ein:   { label: 'Einnahmen', test: e => e.amount >= 0 },
  aus:   { label: 'Ausgaben',  test: e => e.amount < 0 },
  heute: { label: 'heute',     test: e => e.day === day() },
};

export const FinanceApp = {
  id: 'finance', icon: '💰', title: () => 'Kasse', desktop: true,
  width: 440, height: 470,

  body: () => `
    <div class="col fill">
      <div class="pad" style="padding-bottom:0;">
        <div class="inset-box" style="text-align:center;padding:8px;margin-bottom:6px;">
          <div class="muted">Kontostand</div>
          <div style="font-size:19px;font-weight:bold;" id="fMoney">—</div>
        </div>

        <div class="raised-box" style="margin-bottom:6px;">
          <div class="section-title">Bilanz</div>
          <table class="win-table">
            <tr><td>Einnahmen</td><td style="text-align:right" class="money" id="fIn">—</td></tr>
            <tr><td>Ausgaben</td><td style="text-align:right" class="debt" id="fOut">—</td></tr>
            <tr><td><strong>Saldo</strong></td>
                <td style="text-align:right" id="fSaldo"><strong>—</strong></td></tr>
          </table>
          <div class="muted" style="font-size:10px;margin-top:4px;" id="fScope">—</div>
        </div>

        <div class="raised-box" style="margin-bottom:6px;">
          <div class="section-title">Nach Bereichen</div>
          <table class="win-table" id="fCats"></table>
        </div>
      </div>

      <div class="bar-note flex-row" style="gap:4px;flex-wrap:wrap;" id="fFilters">
        ${Object.entries(FILTERS).map(([k, f]) =>
          `<button class="btn btn-sm" data-filter="${k}">${f.label}</button>`).join('')}
      </div>
      <div class="inset-box scroll fill" id="fList"></div>
    </div>`,

  mount(el) {
    el.dataset.filter = 'alle';
    el.querySelector('#fFilters').addEventListener('click', e => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      el.dataset.filter = btn.dataset.filter;
      el.querySelector('#fList').dataset.sig = '';
      paint(el);
    });
    paint(el);
  },

  update(el) { paint(el); },
};

function paint(el) {
  const money = el.querySelector('#fMoney');
  money.textContent = fmt(S.money);
  money.className = S.money >= 0 ? 'money' : 'debt';

  const sums = ledgerSums();
  el.querySelector('#fIn').textContent  = fmt(sums.ein);
  el.querySelector('#fOut').textContent = fmt(sums.aus);

  const saldo = el.querySelector('#fSaldo');
  saldo.innerHTML = `<strong>${fmt(sums.saldo)}</strong>`;
  saldo.className = sums.saldo >= 0 ? 'money' : 'debt';

  el.querySelector('#fScope').textContent = sums.teil
    ? `Bilanz über alle Buchungen · Liste zeigt die letzten ${num(sums.count)}`
    : `${num(sums.count)} Buchungen · Startkapital nicht enthalten`;

  /* Bereiche nach Betrag sortiert, Einnahmen zuerst */
  const cats = Object.entries(sums.cats).sort((a, b) => b[1] - a[1]);
  el.querySelector('#fCats').innerHTML = cats.length
    ? cats.map(([cat, sum]) => `
      <tr><td>${esc(cat)}</td>
          <td style="text-align:right" class="${sum >= 0 ? 'money' : 'debt'}">${fmt(sum)}</td></tr>`).join('')
    : '<tr><td class="muted">Noch keine Buchungen.</td></tr>';

  /* Filterknöpfe */
  const active = el.dataset.filter || 'alle';
  el.querySelectorAll('[data-filter]').forEach(b =>
    b.classList.toggle('pressed', b.dataset.filter === active));

  /* Buchungsliste */
  const list = el.querySelector('#fList');
  const rows = S.ledger.filter(FILTERS[active].test);
  const sig = `${active}|${S.ledger.length}`;
  if (list.dataset.sig === sig) return;
  list.dataset.sig = sig;

  list.innerHTML = rows.length ? rows.map(e => `
    <div class="book-line">
      <div class="book-main">
        <span class="book-cat">${esc(e.cat)}</span>
        <span class="book-text">${esc(e.text)}</span>
      </div>
      <div class="book-side">
        <span class="${e.amount >= 0 ? 'money' : 'debt'}">${e.amount >= 0 ? '+' : ''}${fmt(e.amount)}</span>
        <span class="muted book-time">Tag ${e.day} · ${e.time}</span>
      </div>
    </div>`).join('')
    : empty('Keine Buchungen in dieser Auswahl.');
}
