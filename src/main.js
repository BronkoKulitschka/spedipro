/* Einstiegspunkt. Verdrahtet Module, steuert den Ablauf und stellt die
   Handler bereit, die in den HTML-Vorlagen als App.… angesprochen werden. */

import { DEPOTS, AUTOBAHNEN } from './config.js';
import { S, resetState, log, findTruck } from './state.js';
import { loadTraffic } from './data/autobahn.js';
import { loadFirms } from './data/overpass.js';
import { refillOffers } from './sim/orders.js';
import { dispatch, buyTruck, sellTruck, setRepeat } from './sim/fleet.js';
import { learn } from './sim/drivers.js';
import { setSpeed, togglePause, restartTimer, stopClock } from './sim/clock.js';
import { startScreen, bootScreen, gameScreen } from './ui/screens.js';
import { paint, resetPaintCache } from './ui/paint.js';
import { invalidateFleet } from './ui/fleet.js';
import { initMap, drawFirms, drawTraffic, focusTruck, toggleLayer } from './ui/map.js';

/* ── Bildschirmwechsel ── */
function render() {
  const root = document.getElementById('root');
  if (S.screen === 'start')     root.innerHTML = startScreen();
  else if (S.screen === 'boot') root.innerHTML = bootScreen();
  else { root.innerHTML = gameScreen(); paint(); }
  restartTimer();
}

/* ── Ladebildschirm ── */
function bootLine(text, replaceLast = false) {
  const box = document.getElementById('bootLog');
  if (!box) return;
  if (replaceLast && box.lastChild) {
    box.lastChild.textContent = text;
  } else {
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.textContent = text;
    box.appendChild(line);
  }
  box.scrollTop = box.scrollHeight;
}

function bootProgress(percent) {
  const bar = document.getElementById('bootProg');
  if (bar) bar.style.width = percent + '%';
}

function beginBoot() {
  const key  = document.getElementById('depotSel').value;
  const name = document.getElementById('pname').value.trim();

  resetState(DEPOTS.find(d => d.key === key) || DEPOTS[0]);
  if (name) S.name = name;
  S.screen = 'boot';

  render();
  runBoot();
}

async function runBoot() {
  bootLine('SpeditionsPro 95 — Datendienst');
  bootLine('');
  bootLine(`Depot: ${S.depot.name}`);
  bootLine('');

  bootLine(`Verkehrslage der Autobahn GmbH (${AUTOBAHNEN.length} Autobahnen) …`);
  bootProgress(10);
  let started = false;
  try {
    S.traffic = await loadTraffic((done, total, road) => {
      bootLine(`  ${road} … ${done}/${total}`, started);
      started = true;
    });
    bootLine(`  ${S.traffic.length} Baustellen und Meldungen geladen.`);
  } catch {
    bootLine('  nicht erreichbar — es wird ohne Meldungen gefahren.');
  }
  bootProgress(50);

  bootLine('');
  bootLine('Betriebe aus OpenStreetMap …');
  bootLine('  Overpass-Abfrage läuft, das dauert einen Moment.');
  try {
    S.firms = await loadFirms(S.depot);
    bootLine(`  ${S.firms.length} Betriebe im Umkreis gefunden.`);
  } catch {
    bootLine('  Overpass nicht erreichbar.');
    bootLine('  Ohne Kundschaft geht es nicht — bitte später erneut versuchen.');
  }
  bootProgress(90);

  refillOffers();
  bootLine('');
  bootLine(`Auftragsbörse: ${S.offers.length} Anfragen.`);
  bootLine('Bereit.');
  bootProgress(100);

  const button = document.getElementById('bootBtn');
  if (button) {
    button.disabled = false;
    button.classList.add('btn-default');
    button.focus();
  }
}

function enterGame() {
  S.screen = 'game';
  invalidateFleet();
  resetPaintCache();
  render();

  initMap();
  drawFirms();
  drawTraffic();

  log(`Betrieb aufgenommen. Depot ${S.depot.name}, ${S.firms.length} Betriebe im Umkreis.`);
  setSpeed(1);
}

/* ── Handler für die HTML-Vorlagen ── */
window.App = {
  beginBoot,
  enterGame,
  setSpeed,
  buyTruck:  () => { buyTruck();  paint(); },
  sellTruck: () => { sellTruck(); paint(); },
  dispatch:  id => { dispatch(id).then(paint); paint(); },
  setRepeat,
  learn:     (nr, key) => { learn(nr, key); paint(); },
  focusTruck: nr => focusTruck(findTruck(nr)),
  toggleLayer,
  openTraining: nr => { S.modal = { type: 'training', nr }; paint(); },
  openAbout:    ()  => { S.modal = { type: 'about' };       paint(); },
  closeModal:   ()  => { S.modal = null;                    paint(); },
};

/* ── Tastatur ── */
document.addEventListener('keydown', e => {
  if (S.screen !== 'game') return;
  if (e.code === 'Space' && !S.modal) { e.preventDefault(); togglePause(); }
  if (e.code === 'Escape' && S.modal) { S.modal = null; paint(); }
});

window.addEventListener('beforeunload', stopClock);

/* ── Los geht es ── */
resetState(DEPOTS[0]);
render();
