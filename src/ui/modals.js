/* Fenster, die der Spieler selbst öffnet: Schulung und Datenquellen. */

import { SKILLS, RULES, AUTOBAHNEN } from '../config.js';
import { S, findTruck, xpNeeded } from '../state.js';
import { fmt, esc, pips } from '../util.js';
import { canLearn } from '../sim/drivers.js';

export function trainingWindow(nr) {
  const truck = findTruck(nr);
  if (!truck) return '';
  const d = truck.driver;

  const rows = Object.entries(SKILLS).map(([key, s]) => {
    const level = d.skills[key];
    const maxed = level >= s.max;
    return `
    <tr>
      <td style="width:18px;font-size:14px;">${s.icon}</td>
      <td><strong>${s.name}</strong><br>
          <span class="muted" style="font-size:10px;">${s.per}</span></td>
      <td style="white-space:nowrap;">${pips(level, s.max)}</td>
      <td style="text-align:right;">
        ${maxed ? '<span class="muted">fertig</span>'
                : `<button class="btn btn-sm" onclick="App.learn(${nr},'${key}')"
                     ${canLearn(d, key) ? '' : 'disabled'}>lernen</button>`}
      </td>
    </tr>`;
  }).join('');

  return `
  <div class="overlay">
    <div class="window" style="width:410px;">
      <div class="title-bar">
        <span class="title-bar-text">🎓 Schulung — ${esc(d.name)}</span>
        <div class="title-bar-controls"><div class="tb-btn" onclick="App.closeModal()">✕</div></div>
      </div>
      <div style="padding:12px;">
        <div class="inset-box" style="margin-bottom:8px;">
          <div class="flex-row" style="justify-content:space-between;">
            <span><strong>${esc(d.name)}</strong> · LKW ${truck.nr}</span>
            <span>Stufe ${d.level} · ${d.tours} Zustellungen</span>
          </div>
          <div class="xpbar" style="margin-top:4px;">
            <div class="xpfill" style="width:${Math.min(100, d.xp / xpNeeded(d.level) * 100)}%"></div>
          </div>
          <div class="muted" style="font-size:10px;margin-top:2px;">
            ${d.xp} / ${xpNeeded(d.level)} Erfahrung bis Stufe ${d.level + 1}
          </div>
        </div>

        <div class="raised-box" style="margin-bottom:8px;">
          <div class="flex-row" style="justify-content:space-between;">
            <span>Schulungspunkte: <strong>${d.points}</strong></span>
            <span>Kursgebühr: <strong>${fmt(RULES.TRAIN_COST)}</strong></span>
          </div>
        </div>

        <table class="win-table" style="margin-bottom:10px;">${rows}</table>

        ${d.points === 0
          ? `<div class="muted" style="margin-bottom:10px;">Noch kein Punkt frei.
             Erfahrung sammelt sich mit jeder Zustellung, längere Strecken bringen mehr.</div>`
          : (S.money < RULES.TRAIN_COST
             ? '<div class="warn" style="margin-bottom:10px;">Für die Kursgebühr fehlt gerade Geld.</div>'
             : '')}

        <div class="flex-end">
          <button class="btn btn-default" onclick="App.closeModal()">Schließen</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function aboutWindow() {
  return `
  <div class="overlay">
    <div class="window" style="width:430px;">
      <div class="title-bar">
        <span class="title-bar-text">📡 Datenquellen</span>
        <div class="title-bar-controls"><div class="tb-btn" onclick="App.closeModal()">✕</div></div>
      </div>
      <div style="padding:12px;line-height:1.6;">
        <div class="inset-box" style="margin-bottom:10px;">
          <strong>Karte und Kundschaft</strong><br>
          © OpenStreetMap-Mitwirkende, Lizenz ODbL. Betriebe über die Overpass-API.<br>
          <span class="muted">${S.firms.length} Betriebe im Umkreis von
          ${RULES.FIRM_RADIUS / 1000} km um ${esc(S.depot.name)}.</span>
        </div>
        <div class="inset-box" style="margin-bottom:10px;">
          <strong>Straßenführung</strong><br>
          OSRM-Demoserver. <span class="muted">${esc(S.dataInfo.router)}</span>
        </div>
        <div class="inset-box" style="margin-bottom:10px;">
          <strong>Baustellen und Meldungen</strong><br>
          Autobahn GmbH des Bundes, offene Daten.<br>
          <span class="muted">${S.traffic.length} Einträge auf ${AUTOBAHNEN.length} Autobahnen.
          Bisher ${S.stats.jams} Stellen auf euren Strecken.</span>
        </div>
        <div class="muted" style="font-size:10px;">
          Die Demoserver von OSM und OSRM sind für kleine Nutzung gedacht. Für eine
          veröffentlichte App gehören eigene Kacheln und ein eigener Router dazu.
        </div>
        <div class="flex-end" style="margin-top:10px;">
          <button class="btn btn-default" onclick="App.closeModal()">Schließen</button>
        </div>
      </div>
    </div>
  </div>`;
}
