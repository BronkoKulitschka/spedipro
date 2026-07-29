/* Aktualisiert das laufende Spielfenster. Wird nach jedem Takt aufgerufen,
   fasst also nur an, was sich wirklich ändert. */

import { RULES } from '../config.js';
import { S, idleTrucks, freePoints } from '../state.js';
import { fmt, num, pad, esc } from '../util.js';
import { renderFleet } from './fleet.js';
import { trainingWindow, aboutWindow } from './modals.js';

const $ = id => document.getElementById(id);

function paintSpeedButtons() {
  for (const sp of [0, 1, 2, 4]) {
    $('sp' + sp)?.classList.toggle('pressed', S.speed === sp);
  }
}

function paintOffers() {
  const box = $('offerBox');
  if (!box) return;
  const ready = idleTrucks() > 0;

  box.innerHTML = S.offers.length ? S.offers.map(o => `
    <div style="padding:4px 2px;border-bottom:1px solid #eee;">
      <div class="flex-row" style="justify-content:space-between;">
        <strong>${esc(o.firm.name.slice(0, 34))}</strong>
        <span class="money">${fmt(o.fee)}</span>
      </div>
      <div class="flex-row" style="justify-content:space-between;font-size:10px;">
        <span class="muted">${esc(o.firm.kind)} · ca. ${o.estKm.toFixed(0)} km</span>
        <button class="btn btn-sm" onclick="App.dispatch('${o.id}')"
                ${ready ? '' : 'disabled'}>annehmen</button>
      </div>
    </div>`).join('')
    : '<div class="muted">Keine Aufträge geladen.</div>';
}

let lastLogLength = -1;

function paintLog() {
  if (S.log.length === lastLogLength) return;
  lastLogLength = S.log.length;
  const box = $('logBox');
  if (!box) return;
  box.innerHTML = S.log.length
    ? S.log.map(l => `<div style="border-bottom:1px solid #eee;padding:1px 0;font-size:10px;">${esc(l)}</div>`).join('')
    : '<div class="muted">Noch keine Einträge.</div>';
}

export function resetPaintCache() { lastLogLength = -1; }

export function paint() {
  if (S.screen !== 'game') return;

  $('clockBig').textContent = `Tag ${S.day} · ${pad(S.hour)}:${pad(S.minute)}`;
  $('clockSub').textContent = S.running ? 'Betrieb läuft' : 'angehalten';

  const money = $('kMoney');
  money.textContent = fmt(S.money);
  money.className = S.money >= 0 ? 'money' : 'debt';

  $('kTrucks').textContent = S.trucks.length;
  $('kIdle').textContent   = idleTrucks();
  $('kCost').textContent   = fmt(S.trucks.length * RULES.DAILY_COST);
  $('bBuy').disabled  = S.money < RULES.TRUCK_BUY;
  $('bSell').disabled = S.trucks.length <= 1 || idleTrucks() === 0;

  const points = freePoints();
  $('fleetTitle').textContent =
    `Fuhrpark — ${idleTrucks()} im Depot${points ? ` · ${points} Schulungspunkte frei` : ''}`;

  renderFleet();
  paintOffers();
  paintLog();

  $('sbClock').textContent = `Tag ${S.day}, ${pad(S.hour)}:${pad(S.minute)}`;
  $('sbMoney').textContent = `Kasse ${fmt(S.money)}`;
  $('sbFleet').textContent = `${S.trucks.length - idleTrucks()} von ${S.trucks.length} unterwegs`;
  $('sbHint').textContent  =
    `${num(S.stats.tours)} Zustellungen · ${num(S.stats.km)} km · `
    + `${S.firms.length} Betriebe · ${S.traffic.length} Meldungen`;

  $('modalHost').innerHTML =
      S.modal?.type === 'training' ? trainingWindow(S.modal.nr)
    : S.modal?.type === 'about'    ? aboutWindow()
    : '';

  paintSpeedButtons();
}
