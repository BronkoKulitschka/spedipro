/* Start- und Ladebildschirm sowie das Desktop-Gerüst. */

import { CITIES, REGIONEN } from '../data/cities.js';
import { DESKTOP_APPS } from '../apps/index.js';
import { S, dateText, fullDate } from '../state.js';
import { esc } from '../util.js';
import { startMenuHtml } from './wm.js';
import { VERSION, BUILD, CODENAME } from '../version.js';
import { spielerBild } from './sprites.js';

export function startScreen(save = null) {
  return `
  <div class="centered">
    <div class="window static" style="width:min(760px, 96vw);">
      <div class="title-bar">
        <span class="title-bar-text">🚛 SpeditionsPro 95</span>
        <div class="title-bar-controls">
          <div class="tb-btn">_</div><div class="tb-btn">□</div><div class="tb-btn">✕</div>
        </div>
      </div>

      <div class="start-split">

        <div class="start-links scroll">
          <div class="inset-box" style="text-align:center;padding:12px;margin-bottom:8px;">
            <div style="font-size:36px;line-height:1;">🚛</div>
            <div style="font-size:15px;font-weight:bold;margin:6px 0 2px;">SpeditionsPro 95</div>
            <div style="font-size:10px;">Echte Karte, echte Baustellen, echte Kundschaft</div>
            <div class="muted" style="margin-top:6px;font-size:10px;">
              Version ${VERSION} „${CODENAME}" · Stand ${BUILD}
            </div>
          </div>

          ${save ? `
          <div class="raised-box" style="margin-bottom:8px;">
            <div class="section-title">Gespeicherter Betrieb</div>
            <div style="line-height:1.5;font-size:11px;">
              <strong>${esc(save.name)}</strong> · Depot ${esc(save.depot)}<br>
              Tag ${save.day} · ${save.trucks} LKW ·
              ${Math.round(save.money).toLocaleString('de-DE')} €<br>
              <span class="muted">zuletzt ${save.savedAt.toLocaleString('de-DE')}</span>
            </div>
            <div class="flex-row" style="margin-top:6px;">
              <button class="btn btn-default" id="continueBtn">Fortsetzen</button>
              <button class="btn btn-sm" id="dropSaveBtn">verwerfen</button>
            </div>
          </div>` : ''}

          <div class="raised-box" style="margin-bottom:8px;">
            <div class="section-title">Standort</div>
            <div class="inset-box" id="stadtInfo" style="padding:6px;min-height:52px;">
              <span class="muted">Stadt auf der Karte oder in der Liste wählen.</span>
            </div>
            <select id="depotSel" style="margin-top:6px;">
              ${Object.entries(REGIONEN).map(([region, keys]) => `
                <optgroup label="${region}">
                  ${keys.map(k => {
                    const c = CITIES.find(x => x.key === k);
                    return c ? `<option value="${c.key}">${esc(c.name)}</option>` : '';
                  }).join('')}
                </optgroup>`).join('')}
            </select>
          </div>

          <div class="raised-box" style="margin-bottom:8px;">
            <div class="section-title">Firmenname</div>
            <input type="text" id="pname" value="Meine Spedition" maxlength="28">
          </div>

          <div class="raised-box" style="margin-bottom:8px;">
            <div class="section-title">Ihr Charakter</div>
            <div class="flex-row" style="gap:5px;margin-bottom:6px;">
              <button class="btn btn-sm pressed" id="spGeschlW" data-geschlecht="w">weiblich</button>
              <button class="btn btn-sm" id="spGeschlM" data-geschlecht="m">männlich</button>
            </div>
            <div class="spieler-wahl" id="spielerWahl"></div>
          </div>

          <div class="muted" style="font-size:10px;line-height:1.5;margin-bottom:8px;">
            Der Betriebshof wird in einem echten Gewerbegebiet am Rand des
            gewählten Ortes angelegt — dort, wo eine Spedition wirklich steht.
          </div>

          <div class="flex-end">
            <button class="btn ${save ? '' : 'btn-default'}" id="startBtnGo">
              ${save ? 'Neuer Betrieb' : 'Betrieb aufnehmen'}
            </button>
          </div>
        </div>

        <div class="start-rechts">
          <div class="bar-note">
            Eine Stadt antippen — oder irgendwohin auf die Karte, wenn eine
            Ortschaft in der Nähe liegt.
          </div>
          <div class="karte-wahl" id="waehlKarte"></div>
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
        <div class="flex-row" style="margin-top:10px;justify-content:space-between;">
          <button class="btn btn-sm" id="bootSkip">überspringen</button>
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
        <span class="desk-brand-bildnis">${spielerBild(S.spieler?.geschlecht, S.spieler?.bild)}</span>
        <div class="desk-brand-text">
          <div>${esc(S.name)}</div>
          <div class="muted">Depot ${esc(S.depot.name)}</div>
          <div class="muted">${fullDate()}</div>
          <div class="muted">Version ${VERSION}</div>
        </div>
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
