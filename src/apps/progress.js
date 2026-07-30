/* Betriebsentwicklung: wo der Betrieb steht und was als Nächstes kommt. */

import { LEVELS } from '../config.js';
import { S } from '../state.js';
import { num, esc } from '../util.js';
import { current, next, progress } from '../sim/progress.js';

const zahl = (wert, einheit) =>
  einheit === ' km' ? num(wert) + ' km' : Math.floor(wert).toString();

export const ProgressApp = {
  id: 'progress', icon: '🏆', title: () => 'Betriebsentwicklung', desktop: true,
  width: 440, height: 470,

  body: () => `
    <div class="col fill">
      <div class="pad" style="padding-bottom:6px;">
        <div class="inset-box" style="text-align:center;padding:10px;">
          <div class="muted">Stufe <span id="pgNr">—</span> von ${LEVELS.length}</div>
          <div style="font-size:17px;font-weight:bold;" id="pgName">—</div>
          <div class="muted" id="pgDesc">—</div>
        </div>
      </div>

      <div class="bar-note" id="pgNextTitle">Nächste Stufe</div>
      <div class="pad" style="padding-top:6px;padding-bottom:6px;" id="pgNext"></div>

      <div class="bar-note">Alle Stufen</div>
      <div class="inset-box scroll fill" id="pgList" style="padding:4px;"></div>
    </div>`,

  update(el) {
    const stufe = current();
    el.querySelector('#pgNr').textContent   = stufe.nr;
    el.querySelector('#pgName').textContent = stufe.name;
    el.querySelector('#pgDesc').textContent = stufe.beschreibung;

    /* Nächste Stufe mit einzelnen Anforderungen */
    const p = progress();
    const box = el.querySelector('#pgNext');
    const sig = p
      ? p.punkte.map(x => `${x.key}:${Math.floor(x.anteil)}`).join('|')
      : 'ende';

    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig;
      el.querySelector('#pgNextTitle').textContent = p
        ? `Nächste Stufe: ${p.level.name} — noch ${p.offen} von ${p.punkte.length} offen`
        : 'Höchste Stufe erreicht';

      box.innerHTML = p ? `
        <div class="raised-box">
          ${p.punkte.map(x => `
            <div style="margin-bottom:6px;">
              <div class="flex-row" style="justify-content:space-between;font-size:10px;">
                <span>${x.erfüllt ? '<span class="ok">✔</span> ' : ''}${esc(x.label)}</span>
                <span class="${x.erfüllt ? 'ok' : 'muted'}">
                  ${zahl(x.ist, x.einheit)} / ${zahl(x.soll, x.einheit)}</span>
              </div>
              <div class="prog" style="height:9px;">
                <div class="prog-fill" style="width:${x.anteil}%"></div>
              </div>
            </div>`).join('')}
          <div style="font-size:10px;margin-top:6px;padding-top:6px;border-top:1px solid #808080;">
            Danach frei: <strong>${esc(p.level.text)}</strong>
          </div>
        </div>`
        : `<div class="raised-box">
             Alle Stufen erreicht. Der Betrieb läuft, so lange du magst.
           </div>`;
    }

    /* Übersicht aller Stufen */
    const list = el.querySelector('#pgList');
    if (list.dataset.sig === String(S.level)) return;
    list.dataset.sig = String(S.level);

    list.innerHTML = LEVELS.map(l => {
      const erreicht = l.nr <= S.level;
      const aktuell = l.nr === S.level;
      return `
      <div class="truck-row" style="${aktuell ? 'background:#ffffd0;' : ''}">
        <div class="flex-row" style="justify-content:space-between;">
          <span>${erreicht ? '<span class="ok">✔</span>' : '<span class="muted">○</span>'}
            <strong>${l.nr}. ${esc(l.name)}</strong></span>
          ${aktuell ? '<span class="muted" style="font-size:10px;">aktuell</span>' : ''}
        </div>
        <div class="muted" style="font-size:10px;margin-top:2px;">
          ${erreicht ? esc(l.text) : esc(l.beschreibung)}
        </div>
      </div>`;
    }).join('');
  },
};
