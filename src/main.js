/* Einstiegspunkt: Ablauf vom Startbildschirm über das Laden der Daten
   bis zum Desktop, auf dem die Programme in Fenstern laufen. */

import { DEPOTS, AUTOBAHNEN } from './config.js';
import { S, resetState, log } from './state.js';
import { VERSION, BUILD } from './version.js';
import { loadTraffic } from './data/autobahn.js';
import { loadFirmsFast } from './data/overpass.js';
import { refillOffers } from './sim/orders.js';
import { setSpeed, togglePause, restartTimer, stopClock } from './sim/clock.js';
import { startScreen, bootScreen, desktopShell } from './ui/screens.js';
import { openApp, onTick, renderTaskbar, toggleStartMenu, closeAll, isNarrow } from './ui/wm.js';

const root = () => document.getElementById('root');

/* ── Startbildschirm ── */
function showStart() {
  S.screen = 'start';
  root().innerHTML = startScreen();
  document.getElementById('startBtnGo').onclick = beginBoot;
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
  root().innerHTML = bootScreen();
  runBoot();
}

async function runBoot() {
  bootLine(`SpeditionsPro 95 — Version ${VERSION} (${BUILD})`);
  bootLine('');
  bootLine(`Depot: ${S.depot.name}`);
  bootLine('');

  bootLine(`Verkehrslage der Autobahn GmbH (${AUTOBAHNEN.length} Autobahnen) …`);
  bootProgress(10);
  let started = false;
  const trafficJob = loadTraffic((done, total, road) => {
    bootLine(`  ${road} … ${done}/${total}`, started);
    started = true;
  }).catch(() => []);

  /* Höchstens drei Sekunden warten, der Rest kommt im Hintergrund nach. */
  const early = await Promise.race([
    trafficJob,
    new Promise(r => setTimeout(() => r(null), 3000)),
  ]);

  if (early) {
    S.traffic = early;
    bootLine(`  ${S.traffic.length} Baustellen und Meldungen geladen.`);
  } else {
    bootLine('  Dauert länger, wird im Hintergrund weitergeladen.');
    trafficJob.then(adoptTraffic);
  }
  bootProgress(50);

  bootLine('');
  bootLine('Betriebe aus OpenStreetMap …');
  const { firms, source } = await loadFirmsFast(S.depot, bootLine, adoptFirms);
  S.firms = firms;
  S.dataInfo.firms = source;
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
    button.onclick = enterDesktop;
    button.focus();
  }
}

/* Verkehrsmeldungen treffen verspätet ein. */
async function adoptTraffic(traffic) {
  if (!traffic || !traffic.length) return;
  S.traffic = traffic;
  const { drawTraffic } = await import('./ui/map.js');
  drawTraffic();
  log(`Verkehrsmeldungen nachgeladen: ${traffic.length} Einträge.`);
  onTick();
}

/* Echte Betriebe treffen verspätet ein und lösen die erfundenen ab. */
async function adoptFirms({ firms, source }) {
  S.firms = firms;
  S.dataInfo.firms = source;
  S.offers = [];
  refillOffers();

  const { drawFirms } = await import('./ui/map.js');
  drawFirms();

  const { toast } = await import('./ui/toast.js');
  log(`Echte Betriebe nachgeladen: ${firms.length} aus ${source}.`);
  toast('🗺️', `<strong>${firms.length} echte Betriebe</strong> sind eingetroffen.`,
              '<span class="muted">Die Auftragsbörse wurde erneuert.</span>');
  onTick();
}

/* ── Desktop ── */
function enterDesktop() {
  S.screen = 'desktop';
  root().innerHTML = desktopShell();
  wireDesktop();

  log(`SpeditionsPro 95, Version ${VERSION} gestartet.`);
  log(`Betrieb aufgenommen. Depot ${S.depot.name}, ${S.firms.length} Betriebe im Umkreis.`);

  /* Auf schmalen Geräten nur ein Fenster öffnen, sonst wird es unübersichtlich. */
  if (isNarrow()) {
    openApp('dispo');
  } else {
    openApp('map');
    openApp('dispo');
    openApp('fleet');
  }

  setSpeed(1);
  renderTaskbar();
  onTick();
}

function wireDesktop() {
  const desktop = document.getElementById('desktop');

  /* Symbole auf dem Desktop */
  desktop.addEventListener('click', e => {
    const icon = e.target.closest('.desk-icon');
    if (icon) { openApp(icon.dataset.app); toggleStartMenu(false); return; }
    toggleStartMenu(false);
  });

  /* Startmenü */
  document.getElementById('startBtn').onclick = e => {
    e.stopPropagation();
    toggleStartMenu();
  };

  document.getElementById('startMenu').addEventListener('click', e => {
    const item = e.target.closest('.start-item');
    if (!item) return;
    toggleStartMenu(false);
    if (item.dataset.app === '__closeall') closeAll();
    else openApp(item.dataset.app);
  });

  document.getElementById('tbSpeedBtn').onclick = () => { togglePause(); onTick(); };

  restartTimer();
}

/* ── Tastatur ── */
document.addEventListener('keydown', e => {
  if (S.screen !== 'desktop') return;
  const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '');
  if (e.code === 'Space' && !typing) { e.preventDefault(); togglePause(); onTick(); }
  if (e.code === 'Escape') toggleStartMenu(false);
});

window.addEventListener('beforeunload', stopClock);

/* ── Los geht es ── */
resetState(DEPOTS[0]);
showStart();
