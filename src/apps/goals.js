/* Rücklage: worauf gespart wird und wie weit es ist. */

import { S } from '../state.js';
import { fmt, esc } from '../util.js';
import { ZIELE, offeneZiele, gebaut, fortschritt,
         setzeZiel, zurueckLegen, entnehmen, bauen } from '../sim/goals.js';
import { onTick } from '../ui/wm.js';
import { kasseLeiste, kasseAktualisieren, empty } from './shared.js';

export const GoalsApp = {
  id: 'goals', icon: '🎯', title: () => 'Rücklage',
  kurz: 'Rücklage', desktop: true, width: 430, height: 470,

  body: () => `
    <div class="col fill">
      ${kasseLeiste()}
      <div class="pad" style="padding-bottom:6px;" id="gzKopf"></div>
      <div class="bar-note">Anschaffungen</div>
      <div class="inset-box scroll fill" id="gzListe" style="padding:4px;"></div>
    </div>`,

  mount(el) {
    el.addEventListener('click', e => {
      const ziel = e.target.closest('[data-ziel]');
      if (ziel) { setzeZiel(ziel.dataset.ziel); el.dataset.sig = ''; onTick(); return; }

      const legen = e.target.closest('[data-legen]');
      if (legen) { zurueckLegen(Number(legen.dataset.legen)); el.dataset.sig = ''; onTick(); return; }

      const raus = e.target.closest('[data-raus]');
      if (raus) { entnehmen(Number(raus.dataset.raus)); el.dataset.sig = ''; onTick(); return; }

      if (e.target.closest('#gzBauen')) { bauen(); el.dataset.sig = ''; onTick(); }
    });
  },

  update(el) {
    kasseAktualisieren(el, `Rücklage <strong>${fmt(S.ruecklage || 0)}</strong>`);

    const f = fortschritt();
    const kopf = el.querySelector('#gzKopf');

    kopf.innerHTML = f ? `
      <div class="raised-box">
        <div class="section-title">${f.ziel.icon} ${esc(f.ziel.name)}</div>
        <div class="muted" style="font-size:10px;margin-bottom:6px;">${esc(f.ziel.wirkung)}</div>
        <div class="prog" style="height:16px;">
          <div class="prog-fill" style="width:${f.anteil}%"></div>
        </div>
        <div class="flex-row" style="justify-content:space-between;font-size:10px;margin-top:3px;">
          <span>${fmt(f.da)} von ${fmt(f.ziel.preis)}</span>
          <span class="${f.fertig ? 'ok' : 'muted'}">
            ${f.fertig ? 'vollständig angespart' : `noch ${fmt(f.fehlt)}`}</span>
        </div>

        <div class="flex-row" style="margin-top:8px;gap:4px;flex-wrap:wrap;">
          ${f.fertig
            ? '<button class="btn btn-sm btn-default" id="gzBauen">bauen lassen</button>'
            : [1000, 5000, 20000].map(b => `
                <button class="btn btn-sm" data-legen="${b}"
                  ${S.money >= b ? '' : 'disabled'}>+${fmt(b)}</button>`).join('')
              + `<button class="btn btn-sm" data-legen="${Math.min(S.money, f.fehlt)}"
                   ${S.money > 0 ? '' : 'disabled'}>Rest auffüllen</button>`}
          ${S.ruecklage > 0
            ? `<button class="btn btn-sm" data-raus="${S.ruecklage}">zurückholen</button>` : ''}
        </div>
      </div>`
      : `<div class="raised-box">
           <div class="section-title">Kein Sparziel gewählt</div>
           <div class="muted" style="font-size:10px;">
             Wähle unten eine Anschaffung. Danach kannst du Geld beiseitelegen —
             es bleibt jederzeit abrufbar.
           </div>
         </div>`;

    const liste = el.querySelector('#gzListe');
    const sig = `${S.sparziel}|${(S.gebaut || []).join(',')}|${Math.floor((S.ruecklage || 0) / 500)}|${S.level}`;
    if (liste.dataset.sig === sig) return;
    liste.dataset.sig = sig;

    liste.innerHTML = Object.values(ZIELE).map(z => {
      const fertig = gebaut(z.key);
      const aktiv = S.sparziel === z.key;
      const gesperrt = S.level < z.stufe;

      return `
      <div class="truck-row ${aktiv ? 'ziel-aktiv' : ''}">
        <div class="flex-row" style="justify-content:space-between;">
          <span>${z.icon} <strong>${esc(z.name)}</strong>
            ${fertig ? '<span class="ok">· gebaut</span>' : ''}</span>
          <span class="${fertig ? 'muted' : 'money'}">${fmt(z.preis)}</span>
        </div>
        <div class="muted" style="font-size:10px;margin:2px 0;">${esc(z.text)}</div>
        <div style="font-size:10px;" class="${fertig ? 'ok' : ''}">${esc(z.wirkung)}</div>
        <div class="flex-row" style="justify-content:flex-end;margin-top:3px;">
          ${fertig ? ''
            : gesperrt ? `<span class="muted" style="font-size:10px;">🔒 ab Betriebsstufe ${z.stufe}</span>`
            : aktiv ? '<span class="ok" style="font-size:10px;">wird angespart</span>'
            : `<button class="btn btn-sm" data-ziel="${z.key}">darauf sparen</button>`}
        </div>
      </div>`;
    }).join('');
  },
};
