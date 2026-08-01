/* Chronik: Bestwerte, Stammkundschaft und die Marktlage im Jahreslauf. */

import { S } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { rekordListe } from '../sim/records.js';
import { topKunden, STUFEN, naechsteStufe } from '../sim/customers.js';
import { MONATE, saison, saisonText } from '../sim/season.js';
import { now } from '../state.js';
import { empty } from './shared.js';

export const ChronikApp = {
  id: 'chronik', icon: '🏅', title: () => 'Chronik', desktop: true,
  width: 440, height: 470,

  body: () => `
    <div class="col fill scroll">
      <div class="pad">
        <div class="raised-box" style="margin-bottom:8px;">
          <div class="section-title">Marktlage im Jahreslauf</div>
          <div style="font-size:10px;margin-bottom:5px;" id="chSaison">—</div>
          <div class="jahr-balken" id="chJahr"></div>
        </div>

        <div class="raised-box" style="margin-bottom:8px;">
          <div class="section-title">🏅 Bestwerte</div>
          <table class="win-table" id="chRekorde"></table>
        </div>

        <div class="raised-box">
          <div class="section-title">🏢 Stammkundschaft</div>
          <div class="muted" style="font-size:10px;margin-bottom:5px;">
            Wer oft beliefert wird, zahlt besser. Die Beziehung kann nicht abkühlen.
          </div>
          <div id="chKunden"></div>
        </div>
      </div>
    </div>`,

  update(el) {
    /* Jahreslauf */
    el.querySelector('#chSaison').textContent = saisonText();
    const jetzt = now().getUTCMonth();
    const jahr = el.querySelector('#chJahr');

    if (jahr.dataset.sig !== String(jetzt)) {
      jahr.dataset.sig = String(jetzt);
      jahr.innerHTML = MONATE.map((m, i) => {
        const hoehe = Math.round((m.preis - 0.8) / 0.5 * 100);
        return `<span class="jahr-monat ${i === jetzt ? 'jetzt' : ''}" title="${esc(m.name)}: ${esc(m.text)}">
          <span class="jahr-saeule" style="height:${Math.max(8, hoehe)}%"></span>
          <span class="jahr-name">${esc(m.name.slice(0, 3))}</span>
        </span>`;
      }).join('');
    }

    /* Bestwerte */
    el.querySelector('#chRekorde').innerHTML = rekordListe().map(r => `
      <tr>
        <td style="width:16px">${r.icon}</td>
        <td>${esc(r.name)}
          ${r.eintrag?.zusatz
            ? `<br><span class="muted" style="font-size:9px;">${esc(r.eintrag.zusatz)}</span>` : ''}</td>
        <td style="text-align:right">
          ${r.eintrag
            ? `<strong>${r.format(r.eintrag.wert)}</strong>
               <br><span class="muted" style="font-size:9px;">Tag ${r.eintrag.tag}</span>`
            : '<span class="muted">—</span>'}
        </td>
      </tr>`).join('');

    /* Kundschaft */
    const kunden = topKunden(10);
    const box = el.querySelector('#chKunden');
    const sig = kunden.map(k => `${k.name}:${k.fahrten}`).join('|');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    box.innerHTML = kunden.length ? kunden.map(k => {
      const naechste = naechsteStufe(k.fahrten);
      return `
      <div class="kunde-zeile">
        <div class="flex-row" style="justify-content:space-between;">
          <span>${esc(k.name.slice(0, 30))}</span>
          <span class="ok" style="font-size:10px;">${esc(k.stufe.name)}
            ${k.stufe.rate > 1 ? `+${Math.round((k.stufe.rate - 1) * 100)} %` : ''}</span>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:9px;">
          <span class="muted">${k.fahrten} Fahrten</span>
          <span class="muted">${naechste ? `${naechste.ab - k.fahrten} bis ${naechste.name}` : 'höchste Stufe'}</span>
        </div>
      </div>`;
    }).join('') : empty('Noch keine Kundschaft beliefert.');
  },
};
