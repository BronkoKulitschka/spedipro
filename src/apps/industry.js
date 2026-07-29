/* Branche: die anderen Speditionen.

   Sie treten nicht gegen den Spieler an. Sie geben Fracht weiter, und wer
   für sie fährt, steigt in ihrer Gunst — mehr Anfragen, bessere Sätze. */

import { S } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { levelOf, nextLevel } from '../sim/partners.js';
import { empty } from './shared.js';

export const IndustryApp = {
  id: 'industry', icon: '🏢', title: () => 'Branche', desktop: true,
  width: 430, height: 400,

  body: () => `
    <div class="col fill">
      <div class="bar-note">
        Diese Häuser vergeben Fracht an Subunternehmer. Je öfter ihr für sie
        fahrt, desto häufiger und besser kommen ihre Anfragen.
      </div>
      <div class="inset-box scroll fill" id="inList" style="padding:4px;"></div>
    </div>`,

  update(el) {
    const box = el.querySelector('#inList');
    const sig = S.partners.map(p => `${p.key}:${p.delivered}:${p.trucks}`).join('|');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    if (!S.partners.length) { box.innerHTML = empty('Noch keine Kontakte.'); return; }

    box.innerHTML = S.partners.map(p => {
      const stufe = levelOf(p);
      const nächste = nextLevel(p);
      const anteil = nächste
        ? Math.min(100, (p.delivered - stufe.ab) / (nächste.ab - stufe.ab) * 100)
        : 100;

      return `
      <div class="truck-row">
        <div class="flex-row" style="justify-content:space-between;">
          <strong>${esc(p.name)}</strong>
          <span class="muted" style="font-size:10px;">${esc(p.ort)}</span>
        </div>
        <div style="font-size:10px;margin:2px 0;">
          ${p.trucks} Fahrzeuge · Umsatz ${fmt(p.umsatz)} im Jahr
        </div>
        <div class="prog" style="margin:3px 0;">
          <div class="prog-fill" style="width:${anteil}%"></div>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;">
          <span class="ok">${esc(stufe.name)} · +${Math.round((stufe.rate - 1) * 100)} % auf Partnerfracht</span>
          <span class="muted">${nächste
            ? `${num(p.delivered)} / ${nächste.ab} bis ${esc(nächste.name)}`
            : `${num(p.delivered)} Fahrten`}</span>
        </div>
      </div>`;
    }).join('');
  },
};
