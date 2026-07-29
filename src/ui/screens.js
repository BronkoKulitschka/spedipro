/* Die drei Bildschirme: Start, Laden, Spiel. Reine Vorlagen ohne Logik. */

import { DEPOTS, RULES } from '../config.js';
import { S } from '../state.js';
import { esc } from '../util.js';

export function taskbar(label) {
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `
  <div class="taskbar">
    <button class="btn" style="font-weight:bold;height:22px;display:flex;align-items:center;gap:4px;padding:2px 8px;">
      <span style="font-size:14px;">🪟</span> Start
    </button>
    <div class="taskbar-sep"></div>
    <div class="taskbar-app">🚛 ${esc(label)}</div>
    <div class="clock">🕐 ${now}</div>
  </div>`;
}

export function startScreen() {
  return `
  <div style="position:absolute;inset:0 0 28px 0;display:flex;align-items:center;justify-content:center;">
    <div class="window" style="width:460px;">
      <div class="title-bar">
        <span class="title-bar-text">🚛 SpeditionsPro 95</span>
        <div class="title-bar-controls">
          <div class="tb-btn">_</div><div class="tb-btn">□</div><div class="tb-btn">✕</div>
        </div>
      </div>
      <div style="padding:12px;">
        <div class="inset-box" style="text-align:center;padding:16px;margin-bottom:10px;">
          <div style="font-size:46px;line-height:1;">🚛</div>
          <div style="font-size:16px;font-weight:bold;margin:8px 0 2px;">SpeditionsPro 95</div>
          <div>Echte Karte, echte Baustellen, echte Kundschaft</div>
        </div>

        <div class="raised-box" style="margin-bottom:10px;line-height:1.6;">
          <div class="section-title">Woher die Daten kommen</div>
          Die Karte ist <strong>OpenStreetMap</strong>. Deine Kundschaft sind echte Betriebe,
          Lager und Werke, die dort eingetragen sind.<br>
          Gefahren wird auf der wirklichen Straßenführung über <strong>OSRM</strong>.<br>
          Baustellen und Meldungen kommen von der <strong>Autobahn GmbH</strong>. Liegt etwas
          auf deiner Strecke, dauert die Tour länger.<br><br>
          Kein Zeitlimit, kein Gegner, kein Verlieren. Fahrer sammeln Erfahrung und lernen dazu.
        </div>

        <div class="raised-box" style="margin-bottom:12px;">
          <div class="section-title">Standort des Depots</div>
          <select id="depotSel">
            ${DEPOTS.map(d => `<option value="${d.key}">${d.name}</option>`).join('')}
          </select>
          <div class="section-title" style="margin-top:8px;">Firmenname</div>
          <input type="text" id="pname" value="Meine Spedition" maxlength="28">
        </div>

        <div class="flex-end">
          <button class="btn btn-default" onclick="App.beginBoot()">Betrieb aufnehmen</button>
        </div>
      </div>
    </div>
  </div>
  ${taskbar('SpeditionsPro 95')}`;
}

export function bootScreen() {
  return `
  <div style="position:absolute;inset:0 0 28px 0;display:flex;align-items:center;justify-content:center;">
    <div class="window" style="width:490px;">
      <div class="title-bar">
        <span class="title-bar-text">📡 Datenverbindung wird aufgebaut</span>
        <div class="title-bar-controls"><div class="tb-btn">✕</div></div>
      </div>
      <div style="padding:12px;">
        <div class="inset-box scroll" style="height:230px;" id="bootLog"></div>
        <div class="prog" style="margin-top:8px;"><div class="prog-fill" id="bootProg"></div></div>
        <div class="flex-end" style="margin-top:10px;">
          <button class="btn" id="bootBtn" disabled onclick="App.enterGame()">Weiter</button>
        </div>
      </div>
    </div>
  </div>
  ${taskbar('SpeditionsPro 95')}`;
}

export function gameScreen() {
  return `
  <div id="modalHost"></div>
  <div class="window app-window">
    <div class="title-bar">
      <span class="title-bar-text">🚛 SpeditionsPro 95 — ${esc(S.name)} · Depot ${esc(S.depot.name)}</span>
      <div class="title-bar-controls">
        <div class="tb-btn">_</div><div class="tb-btn">□</div><div class="tb-btn">✕</div>
      </div>
    </div>
    <div class="menu-bar">
      <span class="menu-item">Datei</span>
      <span class="menu-item">Fuhrpark</span>
      <span class="menu-item">Aufträge</span>
      <span class="menu-item" onclick="App.openAbout()">Datenquellen</span>
    </div>

    <div class="app-body">

      <div class="raised-box panel-fill" style="flex:1.6;">
        <div class="flex-row" style="justify-content:space-between;margin-bottom:6px;">
          <strong>Karte</strong>
          <span class="flex-row" style="font-size:10px;gap:8px;">
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked onchange="App.toggleLayer('firms',this.checked)">Firmen</label>
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked onchange="App.toggleLayer('traffic',this.checked)">🚧 Meldungen</label>
            <label class="flex-row" style="gap:3px;">
              <input type="checkbox" checked onchange="App.toggleLayer('routes',this.checked)">Strecken</label>
          </span>
        </div>
        <div class="map-frame"><div id="map"></div></div>
      </div>

      <div class="app-side">
        <div class="flex-row" style="gap:6px;align-items:stretch;">
          <div class="raised-box" style="flex:1;">
            <div class="section-title">Betriebsuhr</div>
            <div class="inset-box" style="text-align:center;padding:6px;margin-bottom:6px;">
              <div style="font-size:17px;font-weight:bold;" id="clockBig">Tag 1 · 06:00</div>
              <div class="muted" id="clockSub">Betrieb läuft</div>
            </div>
            <div class="flex-row">
              <button class="btn btn-sm" id="sp0" onclick="App.setSpeed(0)">❚❚</button>
              <button class="btn btn-sm" id="sp1" onclick="App.setSpeed(1)">1×</button>
              <button class="btn btn-sm" id="sp2" onclick="App.setSpeed(2)">2×</button>
              <button class="btn btn-sm" id="sp4" onclick="App.setSpeed(4)">4×</button>
            </div>
          </div>

          <div class="raised-box" style="flex:1;">
            <div class="section-title">Kasse</div>
            <table class="win-table" style="margin-bottom:6px;">
              <tr><td>Konto</td><td style="text-align:right" id="kMoney">—</td></tr>
              <tr><td>LKW</td><td style="text-align:right" id="kTrucks">—</td></tr>
              <tr><td>im Depot</td><td style="text-align:right" id="kIdle">—</td></tr>
              <tr><td>Fix/Tag</td><td style="text-align:right" id="kCost">—</td></tr>
            </table>
            <div class="flex-row">
              <button class="btn btn-sm" id="bBuy"  onclick="App.buyTruck()">kaufen</button>
              <button class="btn btn-sm" id="bSell" onclick="App.sellTruck()">verkaufen</button>
            </div>
          </div>
        </div>

        <div class="raised-box panel-fill" style="flex:1.1;">
          <div class="section-title" id="fleetTitle">Fuhrpark</div>
          <div class="inset-box scroll" style="flex:1;padding:4px;" id="fleetBox"></div>
        </div>

        <div class="raised-box panel-fill" style="flex:1;">
          <div class="section-title">Auftragsbörse — Betriebe aus OpenStreetMap</div>
          <div class="inset-box scroll" style="flex:1;" id="offerBox"></div>
        </div>

        <div class="raised-box panel-fill" style="flex:.8;">
          <div class="section-title">Betriebsbuch</div>
          <div class="inset-box scroll" style="flex:1;" id="logBox"></div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-panel" id="sbClock">—</div>
      <div class="status-panel" id="sbMoney">—</div>
      <div class="status-panel" id="sbFleet">—</div>
      <div class="status-panel" style="flex:1;" id="sbHint">—</div>
    </div>
  </div>
  ${taskbar(S.name)}`;
}
