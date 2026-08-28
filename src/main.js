/* Einstiegspunkt: Ablauf vom Startbildschirm über das Laden der Daten
   bis zum Desktop, auf dem die Programme in Fenstern laufen. */

import { AUTOBAHNEN } from './config.js';
import { CITIES, cityByKey } from './data/cities.js';
import { esc } from './util.js';
import { findeDepotplatz } from './data/depotsite.js';
import { zeigeStaedteKarte, markiere, schliesseStaedteKarte,
         setzeFreienPunkt, entferneFreienPunkt, zeigeAusschnitt } from './ui/citymap.js';
import { ortAn } from './data/placelookup.js';
import { S, resetState, hydrate, log, verfuegbar } from './state.js';
import { VERSION, BUILD } from './version.js';
import { loadTraffic, loadParking } from './data/autobahn.js';
import { loadFirmsFast } from './data/overpass.js';
import { inventFirms } from './data/invent.js';
import { hubsFor } from './data/hubs.js';
import { refillOffers } from './sim/orders.js';
import { refillContractOffers } from './sim/contracts.js';
import { initPartners } from './sim/partners.js';
import { setSpeed, togglePause, restartTimer, stopClock, syncDay } from './sim/clock.js';
import { saveGame, readSave, clearSave, saveInfo } from './sim/save.js';
import { catchUp, offlineMinutes } from './sim/offline.js';
import { startScreen, bootScreen, desktopShell } from './ui/screens.js';
import { openApp, onTick, renderTaskbar, toggleStartMenu, closeAll, isNarrow } from './ui/wm.js';
import { wendeAn } from './ui/wallpaper.js';
import { starteErinnerung, setzeFreieZaehler, meldeSystemAn } from './ui/notify.js';

const root = () => document.getElementById('root');

/* ── Startbildschirm ── */
let gewaehlteStadt = 'KS';       // Kassel liegt in der Mitte
let freierOrt = null;            // frei gewählter Standort, falls vorhanden
let sucheLaeuft = false;

function showStart() {
  S.screen = 'start';
  root().innerHTML = startScreen(saveInfo());

  const liste = document.getElementById('depotSel');
  liste.value = gewaehlteStadt;

  zeigeStaedteKarte(
    document.getElementById('waehlKarte'),
    freierOrt ? null : gewaehlteStadt,

    /* Eine Stadt aus der Liste wurde angetippt */
    key => {
      freierOrt = null;
      gewaehlteStadt = key;
      liste.value = key;
      zeigeStadtInfo(key);
    },

    /* Irgendwohin auf die Karte getippt */
    (lat, lon) => waehleFreienPunkt(lat, lon),
  );

  liste.onchange = () => {
    freierOrt = null;
    gewaehlteStadt = liste.value;
    markiere(gewaehlteStadt);
    zeigeStadtInfo(gewaehlteStadt);
  };

  if (freierOrt) {
    setzeFreienPunkt(freierOrt.lat, freierOrt.lon, freierOrt.name);
    zeigeAusschnitt(freierOrt.lat, freierOrt.lon, 9);
    zeigeFreienOrt();
  } else {
    zeigeStadtInfo(gewaehlteStadt);
  }

  document.getElementById('startBtnGo').onclick = beginBoot;
  document.getElementById('continueBtn')?.addEventListener('click', continueGame);
  document.getElementById('dropSaveBtn')?.addEventListener('click', () => {
    clearSave();
    showStart();
  });
}

/* ── Gespeicherten Betrieb fortsetzen ── */
function continueGame() {
  const saved = readSave();
  if (!saved) { showStart(); return; }

  hydrate(saved.state);
  syncDay();

  const minutes = offlineMinutes(saved.savedAt, S.ratio, S.speed, S.running);
  const report = minutes > 1 ? catchUp(minutes) : null;

  enterDesktop({ resumed: true });

  if (report) {
    S.lastReport = report;
    log(`Nachgerechnet: ${report.days} Tag(e), ${report.tours} Zustellungen, ${report.balance >= 0 ? '+' : ''}${Math.round(report.balance)} Euro.`);
    openApp('report');
  }
}

/* ── Freie Standortwahl ──────────────────────────────────────────
   Der Punkt wird nachgeschlagen: Liegt eine Ortschaft in der Nähe,
   gilt sie als Standort. Sonst bleibt es bei der bisherigen Wahl. */
async function waehleFreienPunkt(lat, lon) {
  if (sucheLaeuft) return;
  sucheLaeuft = true;

  setzeFreienPunkt(lat, lon, 'wird nachgeschlagen …', 'suche');
  const kasten = document.getElementById('stadtInfo');
  if (kasten) kasten.innerHTML = '<span class="muted">Ort wird nachgeschlagen …</span>';

  const ergebnis = await ortAn(lat, lon);
  sucheLaeuft = false;

  if (!ergebnis.ok) {
    setzeFreienPunkt(lat, lon, 'kein Ort in der Nähe', 'fehler');
    if (kasten) {
      kasten.innerHTML = `<span class="warn">${esc(ergebnis.grund)}</span>`;
    }
    setTimeout(() => {
      entferneFreienPunkt();
      if (freierOrt) setzeFreienPunkt(freierOrt.lat, freierOrt.lon, freierOrt.name);
      else markiere(gewaehlteStadt);
      freierOrt ? zeigeFreienOrt() : zeigeStadtInfo(gewaehlteStadt);
    }, 3500);
    return;
  }

  const ort = ergebnis.ort;
  freierOrt = {
    key: 'frei',
    name: ort.name,
    lat: ort.lat,
    lon: ort.lon,
    land: ort.art,
    einwohner: ort.einwohner,
    text: `Frei gewählter Standort, ${ort.art}.`,
  };

  setzeFreienPunkt(ort.lat, ort.lon, ort.name);
  zeigeFreienOrt();
}

function zeigeFreienOrt() {
  const kasten = document.getElementById('stadtInfo');
  if (!kasten || !freierOrt) return;

  kasten.innerHTML = `
    <strong>${esc(freierOrt.name)}</strong>
    <span class="muted">· ${esc(freierOrt.land)}</span>
    <span class="frei-hinweis">frei gewählt</span><br>
    <span style="font-size:10px;">Der Betriebshof entsteht in einem
      Gewerbegebiet in der Nähe.</span><br>
    <span class="muted" style="font-size:10px;">
      rund ${freierOrt.einwohner.toLocaleString('de-DE')} Tausend Einwohner</span>`;
}

/* Kurzbeschreibung der gewählten Stadt im Startbildschirm */
function zeigeStadtInfo(key) {
  const stadt = cityByKey(key);
  const kasten = document.getElementById('stadtInfo');
  if (!stadt || !kasten) return;

  kasten.innerHTML = `
    <strong>${stadt.name}</strong>
    <span class="muted">· ${stadt.land}</span><br>
    <span style="font-size:10px;">${stadt.text}</span><br>
    <span class="muted" style="font-size:10px;">
      rund ${stadt.einwohner.toLocaleString('de-DE')} Tausend Einwohner</span>`;
}

/* ── Ladebildschirm ── */
let bootOffen = true;
function quiet() { bootOffen = false; }

function bootLine(text, replaceLast = false) {
  if (!bootOffen) return;
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
  bootOffen = true;
  const name = document.getElementById('pname').value.trim();
  const key  = document.getElementById('depotSel').value || gewaehlteStadt;

  /* Ein frei gewählter Punkt hat Vorrang vor der Liste. */
  const stadt = freierOrt || cityByKey(key) || CITIES[0];

  schliesseStaedteKarte();

  /* Vorläufig die Stadtmitte; der genaue Platz wird beim Laden gesucht. */
  resetState({ key: stadt.key, name: stadt.name, lat: stadt.lat, lon: stadt.lon });
  S.stadt = stadt;
  if (name) S.name = name;

  S.screen = 'boot';
  root().innerHTML = bootScreen();

  /* Notausgang: führt immer ins Spiel, egal was die Server treiben. */
  document.getElementById('bootSkip').onclick = () => {
    quiet();
    if (!S.firms.length) {
      S.firms = inventFirms(S.depot);
      S.dataInfo.firms = 'erfunden';
    }
    if (!S.hubs.length) S.hubs = hubsFor(S.depot);
    if (!S.partners.length) S.partners = initPartners();
    refillContractOffers();
    refillOffers();
    enterDesktop();
  };

  runBoot();
}

async function runBoot() {
  try {
    await bootSteps();
  } catch (err) {
    bootLine('');
    bootLine('Ein Fehler ist aufgetreten: ' + (err?.message || err));
    bootLine('Es wird mit dem gestartet, was da ist.');
  }
  finishBoot();
}

async function bootSteps() {
  bootLine(`SpeditionsPro 95 — Version ${VERSION} (${BUILD})`);
  bootLine('');
  bootLine(`Standort: ${S.depot.name}`);
  bootLine('');

  /* Einen echten Gewerbestandort für den Betriebshof suchen. */
  bootLine('Betriebshof wird gesucht …');
  const platz = await findeDepotplatz(S.stadt || S.depot, bootLine);
  S.depot = {
    key: S.stadt?.key || S.depot.key,
    name: S.stadt?.name || S.depot.name,
    lat: platz.lat,
    lon: platz.lon,
    lage: platz.name,
    art: platz.art,
    geschaetzt: !!platz.geschaetzt,
    entfernung: platz.km,
  };
  S.trucks.forEach(t => { t.pos = { lat: platz.lat, lon: platz.lon }; });

  bootLine(`  Betriebshof: ${platz.name}, ${platz.km.toFixed(0)} km vom Zentrum.`);
  bootLine('');
  /* Der erste Fahrer gehört zum Betrieb, alles Weitere kommt über
     die Personalbörse. */
  const { neuerFahrer, fuelleBoerse } = await import('./sim/staff.js');
  if (!S.drivers.length) {
    const erster = neuerFahrer(true);
    S.drivers.push(erster);
    if (S.trucks[0]) S.trucks[0].driverId = erster.id;
    bootLine(`  Fahrer: ${erster.name}`);
  }
  fuelleBoerse();

  bootProgress(20);

  bootLine(`Verkehrslage der Autobahn GmbH (${AUTOBAHNEN.length} Autobahnen) …`);
  bootProgress(10);
  let started = false;
  const trafficJob = loadTraffic((done, total, road) => {
    if (!bootOffen) return;
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
  /* Rastanlagen kommen im Hintergrund nach; bis dahin wird notfalls
     am Straßenrand gehalten. */
  loadParking().then(liste => {
    S.parking = liste;
    if (liste.length) log(`${liste.length} Rastanlagen für Lastkraftwagen geladen.`);
    import('./ui/map.js').then(m => m.drawParking());   // zeichnet nur, wenn sichtbar
  }).catch(() => {});

  bootProgress(50);

  bootLine('');
  bootLine('Betriebe aus OpenStreetMap …');
  const { firms, source } = await loadFirmsFast(S.depot, bootLine, adoptFirms);
  S.firms = firms;
  S.dataInfo.firms = source;
  bootProgress(90);

  S.hubs = hubsFor(S.depot);
  bootLine(`  ${S.hubs.length} Umschlagpunkte im Bundesgebiet.`);
  S.partners = initPartners();
  refillContractOffers();
  refillOffers();
  bootLine('');
  bootLine(`Auftragsbörse: ${S.offers.length} Anfragen, `
         + `${S.contractOffers.length} Ausschreibungen.`);
  bootLine('Bereit.');
  bootProgress(100);
}

/* Immer erreichbar, auch wenn oben etwas schiefgeht. */
function finishBoot() {
  quiet();
  bootProgress(100);

  /* Von selbst weitergehen. Wer schneller ist, drückt den Knopf. */
  const autoStart = setTimeout(() => {
    if (S.screen === 'boot') enterDesktop();
  }, 1200);

  const button = document.getElementById('bootBtn');
  if (button) {
    button.disabled = false;
    button.classList.add('btn-default');
    button.textContent = 'Los geht es';
    button.onclick = () => { clearTimeout(autoStart); enterDesktop(); };
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
function enterDesktop({ resumed = false } = {}) {
  S.screen = 'desktop';
  root().innerHTML = desktopShell();
  wendeAn();

  /* Die stündliche Erinnerung braucht zwei Dinge: einen Takt und die
     Auskunft, wie viele Fahrzeuge gerade unbeschäftigt sind. */
  setzeFreieZaehler(() => S.trucks.filter(verfuegbar).length);
  starteErinnerung();

  /* Ohne Servicearbeiter lehnt Android jede Benachrichtigung ab.
     Die Anmeldung selbst braucht keine Erlaubnis. */
  meldeSystemAn();
  wireDesktop();

  if (resumed) {
    log(`Betrieb fortgesetzt. Version ${VERSION}.`);
  } else {
    log(`SpeditionsPro 95, Version ${VERSION} gestartet.`);
    log(`Betrieb aufgenommen. Betriebshof ${S.depot.lage || S.depot.name} `
    + `bei ${S.depot.name}, ${S.firms.length} Betriebe im Umkreis.`);
  }

  /* Auf schmalen Geräten nur ein Fenster öffnen, sonst wird es unübersichtlich. */
  if (isNarrow()) {
    openApp('dispo');
  } else {
    openApp('dispo');
    openApp('fleet');
  }

  /* Beim ersten Betrieb führt die Einführung durch die ersten Schritte. */
  if (!resumed && S.tutorial?.aktiv) openApp('tutorial');

  setSpeed(S.speed || 1);
  renderTaskbar();
  onTick();
  saveGame();
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

  /* F1 öffnet die Hilfe, wie man es gewohnt ist. */
  document.addEventListener('keydown', async e => {
    if (e.key !== 'F1') return;
    e.preventDefault();
    const { oeffneHilfe } = await import('./apps/help.js');
    oeffneHilfe('start');
  });

  restartTimer();
}

/* ── Tastatur ── */
document.addEventListener('keydown', e => {
  if (S.screen !== 'desktop') return;
  const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '');
  if (e.code === 'Space' && !typing) { e.preventDefault(); togglePause(); onTick(); }
  if (e.code === 'Escape') toggleStartMenu(false);
});

/* Beim Verlassen und beim Wegschalten sichern. 'pagehide' ist auf
   Android die verlässlichste Stelle, 'beforeunload' feuert dort oft nicht. */
window.addEventListener('pagehide', () => { saveGame(); stopClock(); });
window.addEventListener('beforeunload', () => { saveGame(); stopClock(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveGame();
});

/* ── Los geht es ── */
resetState(cityByKey(gewaehlteStadt) || CITIES[0]);
showStart();
