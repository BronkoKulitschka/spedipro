/* Wochenabschluss: was die vergangene Woche gebracht hat. */

import { S } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { letzterBericht } from '../sim/records.js';
import { saisonText } from '../sim/season.js';
import { empty } from './shared.js';

export const WeekApp = {
  id: 'week', icon: '📅', title: () => 'Wochenabschluss', hidden: true,
  width: 380, height: 420,

  body: () => {
    const b = letzterBericht();
    if (!b) return `<div class="pad">${empty('Noch kein Wochenabschluss.')}</div>`;

    return `
    <div class="col fill scroll">
      <div class="woche-kopf">
        <div style="font-size:13px;font-weight:bold;">Woche ${b.nr + 1} abgeschlossen</div>
        <div style="font-size:10px;">Tag ${b.tag} · ${esc(b.monat)}</div>
      </div>

      <div class="pad">
        <div class="inset-box" style="text-align:center;padding:10px;margin-bottom:8px;">
          <div class="muted">Ergebnis der Woche</div>
          <div style="font-size:20px;font-weight:bold;"
               class="${b.gewinn >= 0 ? 'money' : 'debt'}">${fmt(b.gewinn)}</div>
        </div>

        <div class="raised-box" style="margin-bottom:8px;">
          <div class="section-title">Geleistet</div>
          <table class="win-table">
            <tr><td>Zustellungen</td><td style="text-align:right">${num(b.touren)}</td></tr>
            <tr><td>gefahrene Kilometer</td><td style="text-align:right">${num(b.km)} km</td></tr>
            <tr><td>Frachterlöse</td><td style="text-align:right" class="money">${fmt(b.erloes)}</td></tr>
            <tr><td>Ø je Zustellung</td>
                <td style="text-align:right">${b.touren ? fmt(b.erloes / b.touren) : '—'}</td></tr>
          </table>
        </div>

        ${b.fahrer ? `
        <div class="raised-box" style="margin-bottom:8px;">
          <div class="section-title">🏅 Fahrer der Woche</div>
          <strong>${esc(b.fahrer.name)}</strong>
          <span class="muted">· Stufe ${b.fahrer.level}</span><br>
          <span style="font-size:10px;">${num(b.fahrer.km)} km insgesamt ·
            ${b.fahrer.tours} Zustellungen</span>
        </div>` : ''}

        ${b.kunde ? `
        <div class="raised-box" style="margin-bottom:8px;">
          <div class="section-title">🏢 Wichtigster Kunde</div>
          <strong>${esc(b.kunde.name)}</strong><br>
          <span style="font-size:10px;">${b.kunde.fahrten} Fahrten ·
            <span class="ok">${esc(b.kunde.stufe.name)}</span></span>
        </div>` : ''}

        <div class="raised-box">
          <div class="section-title">Ausblick</div>
          <div style="font-size:10px;line-height:1.6;">
            ${esc(saisonText())}<br>
            Fuhrpark: ${b.flotte} Fahrzeuge · Ansehen ${Math.round(b.ansehen)}
          </div>
        </div>
      </div>
    </div>`;
  },

  update() { /* Der Bericht steht fest, wenn er einmal erstellt ist. */ },
};
