/* Start- und Ladebildschirm sowie das Desktop-Gerüst. */

import { DEPOTS } from '../config.js';
import { DESKTOP_APPS } from '../apps/index.js';
import { S, dateText, fullDate } from '../state.js';
import { esc } from '../util.js';
import { startMenuHtml } from './wm.js';
import { VERSION, BUILD, CODENAME } from '../version.js';

export function startScreen(save = null) {
  return `
  <div class="centered">
    <div class="window static" style="width:min(460px, 94vw);">
      <div class="title-bar">
        <span class="title-bar-text">🚛 SpeditionsPro 95</span>
        <div class="title-bar-controls">
          <div class="tb-btn">_</div><div class="tb-btn">□</div><div class="tb-btn">✕</div>
        </div>
      </div>
      <div class="pad scroll" style="max-height:78vh;">
        <div class="inset-box" style="text-align:center;padding:16px;margin-bottom:10px;">
          <div style="font-size:44px;line-height:1;">🚛</div>
          <div style="font-size:16px;font-weight:bold;margin:8px 0 2px;">SpeditionsPro 95</div>
          <div>Echte Karte, echte Baustellen, echte Kundschaft</div>
          <div class="muted" style="margin-top:8px;font-size:10px;">
            Version ${VERSION} „${CODENAME}“ · Stand ${BUILD}
          </div>
        </div>

        <div class="raised-box" style="margin-bottom:10px;line-height:1.6;">
          <div class="section-title">Woher die Daten kommen</div>
          Die Karte ist <strong>OpenStreetMap</strong>, deine Kundschaft sind echte
          Betriebe daraus. Gefahren wird über <strong>OSRM</strong> auf der wirklichen
          Straßenführung. Baustellen kommen von der <strong>Autobahn GmbH</strong>.<br><br>
          Kein Zeitlimit, kein Gegner, kein Verlieren.
        </div>

        <div class="raised-box" style="margin-bottom:12px;">
          <div class="section-title">Standort des Depots</div>
          <select id="depotSel">
            ${DEPOTS.map(d => `<option value="${d.key}">${d.name}</option>`).join('')}
          </select>
          <div class="section-title" style="margin-top:8px;">Firmenname</div>
          <input type="text" id="pname" value="Meine Spedition" maxlength="28">
        </div>

        ${save ? `
        <div class="raised-box" style="margin-bottom:12px;">
          <div class="section-title">Gespeicherter Betrieb</div>
          <div style="line-height:1.6;">
            <strong>${esc(save.name)}</strong> · Depot ${esc(save.depot)}<br>
            Tag ${save.day} · ${save.trucks} LKW · Kasse ${Math.round(save.money).toLocaleString('de-DE')} €<br>
            <span class="muted">zuletzt ${save.savedAt.toLocaleString('de-DE')}</span>
          </div>
          <div class="flex-row" style="margin-top:8px;">
            <button class="btn btn-default" id="continueBtn">Fortsetzen</button>
            <button class="btn btn-sm" id="dropSaveBtn">verwerfen</button>
          </div>
        </div>` : ''}

        <div class="flex-end">
          <button class="btn ${save ? '' : 'btn-default'}" id="startBtnGo">
            ${save ? 'Neuer Betrieb' : 'Betrieb aufnehmen'}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

export function bootScreen() {
  return `
  <div class="centered">
    <div class="window static" style="width:min(500px, 94vw);">
      <div class="title-bar">
        <span class="title-bar-text">📡 Datenverbindung wird aufgebaut</span>
        <div class="title-bar-controls"><div class="tb-btn">✕</div></div>
      </div>
      <div class="pad">
        <div class="inset-box scroll" style="height:min(240px, 50vh);" id="bootLog"></div>
        <div class="prog" style="margin-top:8px;"><div class="prog-fill" id="bootProg"></div></div>
        <div class="flex-end" style="margin-top:10px;">
          <button class="btn" id="bootBtn" disabled>Weiter</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function desktopShell() {
  const icons = DESKTOP_APPS.map(app => `
    <button class="desk-icon" data-app="${app.id}">
      <span class="desk-glyph">${app.icon}</span>
      <span class="desk-label">${esc(app.title({}))}</span>
    </button>`).join('');

  return `
    <div id="desktop">
      <div class="desk-icons">${icons}</div>
      <div class="desk-brand">
        <div>${esc(S.name)}</div>
        <div class="muted">Depot ${esc(S.depot.name)}</div>
        <div class="muted">${fullDate()}</div>
        <div class="muted">Version ${VERSION}</div>
      </div>
    </div>

    <div id="windows"></div>

    <div id="startMenu" style="display:none;">${startMenuHtml()}</div>

    <div class="taskbar">
      <button class="btn start-btn" id="startBtn"><span>🪟</span> Start</button>
      <div class="taskbar-sep"></div>
      <div id="tbApps" class="tb-apps"></div>
      <button class="btn btn-sm" id="tbSpeedBtn" title="Leertaste">
        <span id="tbSpeed">▶ 1×</span>
      </button>
      <div class="clock" id="tbClock" title="SpeditionsPro 95 · Version ${VERSION}">${dateText()}</div>
    </div>`;
}
