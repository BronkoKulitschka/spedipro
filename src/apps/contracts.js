/* Verträge: Marktlage, Ansehen, laufende Rahmenverträge, Ausschreibungen. */

import { CONTRACTS } from '../config.js';
import { S, day } from '../state.js';
import { fmt, esc } from '../util.js';
import { marketText, repText } from '../sim/market.js';
import { signContract, currentRate, vertraegeFrei } from '../sim/contracts.js';
import { maxVertraege } from '../sim/progress.js';
import { onTick } from '../ui/wm.js';
import { empty, kasseLeiste, kasseAktualisieren } from './shared.js';
import { klasseVon, passendeFahrzeuge, noetigeKlasse, warumNicht } from '../sim/goods.js';
import { EQUIPMENT } from '../config.js';
import { haversine } from '../util.js';

const tageBis = c => Math.max(0, Math.ceil((c.endMinutes - S.minutes) / 1440));

export const ContractsApp = {
  id: 'contracts', icon: '📜', title: () => 'Verträge', kurz: 'Verträge', desktop: true,
  width: 450, height: 480,

  body: () => `
    <div class="col fill">
      ${kasseLeiste()}
      <div class="pad" style="padding-bottom:6px;">
        <div class="flex-row" style="gap:6px;align-items:stretch;">
          <div class="raised-box" style="flex:1;">
            <div class="section-title">Marktlage</div>
            <div style="font-size:15px;font-weight:bold;" id="ctIndex">—</div>
            <div class="muted" id="ctMarket">—</div>
          </div>
          <div class="raised-box" style="flex:1;">
            <div class="section-title">Ansehen</div>
            <div class="prog" style="margin-bottom:3px;">
              <div class="prog-fill" id="ctRepBar"></div>
            </div>
            <div class="muted" id="ctRep">—</div>
          </div>
        </div>
      </div>

      <div class="bar-note" id="ctRunTitle">Laufende Verträge</div>
      <div class="inset-box scroll" style="flex:1;padding:4px;" id="ctRunning"></div>

      <div class="bar-note">Ausschreibungen — Preis unter Spotmarkt, dafür planbar</div>
      <div class="inset-box scroll" style="flex:1;padding:4px;" id="ctOffers"></div>
    </div>`,

  mount(el) {
    el.querySelector('#ctOffers').addEventListener('click', e => {
      const btn = e.target.closest('button[data-sign]');
      if (!btn) return;
      signContract(btn.dataset.sign);
      el.querySelector('#ctOffers').dataset.sig = '';
      el.querySelector('#ctRunning').dataset.sig = '';
      onTick();
    });
  },

  update(el) {
    /* Ein Vertrag kostet zwar nichts, bindet aber Fahrzeuge — der
       Kontostand hilft bei der Einschätzung, ob man sich das leisten
       kann oder erst einen weiteren Lkw braucht. */
    kasseAktualisieren(el);

    const idx = S.market.index;
    const pfeil = S.market.trend > 0.005 ? '▲' : S.market.trend < -0.005 ? '▼' : '▬';
    const ci = el.querySelector('#ctIndex');
    ci.textContent = `${pfeil} ${(idx * 100).toFixed(0)} %`;
    ci.className = idx >= 1.05 ? 'money' : idx <= 0.92 ? 'debt' : '';
    el.querySelector('#ctMarket').textContent = marketText();

    el.querySelector('#ctRepBar').style.width = S.rep + '%';
    el.querySelector('#ctRep').textContent = `${Math.round(S.rep)} · ${repText()}`;

    el.querySelector('#ctRunTitle').textContent =
      `Laufende Verträge — ${S.contracts.length} von ${maxVertraege()} Plätzen belegt`;

    /* Laufende Verträge */
    const run = el.querySelector('#ctRunning');
    const runSig = S.contracts.map(c => `${c.id}:${c.done}:${tageBis(c)}`).join('|')
                 + '|' + S.trucks.map(t => `${t.nr}${t.model}`).join(',');
    if (run.dataset.sig !== runSig) {
      run.dataset.sig = runSig;
      run.innerHTML = S.contracts.length ? S.contracts.map(c => {
        const anteil = Math.min(100, c.done / c.total * 100);
        const rate = currentRate(c);
        const floater = rate - c.perLoad;
        return `
        <div class="truck-row">
          <div class="flex-row" style="justify-content:space-between;">
            <strong>${esc(c.firm.name)}</strong>
            <span class="money">${fmt(rate)}<span class="muted"> je Fahrt</span></span>
          </div>
          ${c.empfaenger ? `
            <div class="relation">
              📍 ${esc(c.firm.name.slice(0, 22))}
              <span class="pfeil">→</span>
              ${esc(c.empfaenger.name.slice(0, 22))}
            </div>` : ''}
          ${c.klasse ? `
            <div class="ladung-zeile">
              ${klasseVon(c.klasse).icon} ${esc(klasseVon(c.klasse).name)} ·
              ${c.paletten} Pal. · ${(c.gewicht / 1000).toFixed(1)} t
              ${passendeFahrzeuge(c, S.trucks).length
                ? `<span class="ok">· ${passendeFahrzeuge(c, S.trucks).length} passende Fahrzeuge</span>`
                : '<span class="bad">· kein passendes Fahrzeug mehr!</span>'}
            </div>` : ''}
          <div class="prog" style="margin:4px 0;">
            <div class="prog-fill" style="width:${anteil}%"></div>
          </div>
          <div class="flex-row" style="justify-content:space-between;font-size:10px;">
            <span class="muted">${c.done} von ${c.total} Sendungen</span>
            <span class="muted">noch ${tageBis(c)} Tage</span>
          </div>
          <div style="font-size:10px;">
            Prämie bei Erfüllung <span class="money">${fmt(c.bonus)}</span>
            ${floater ? `· <span class="${floater > 0 ? 'ok' : 'warn'}">Dieselfloater ${floater > 0 ? '+' : ''}${fmt(floater)}</span>` : ''}
          </div>
        </div>`;
      }).join('') : empty('Kein laufender Vertrag. Unten liegen Ausschreibungen.');
    }

    /* Ausschreibungen */
    const box = el.querySelector('#ctOffers');
    const platzFrei = vertraegeFrei() > 0;
    /* Der Fuhrpark gehört in die Signatur: Kauft man ein Fahrzeug,
       ändert sich, welche Ausschreibungen fahrbar sind. */
    const sig = S.contractOffers.map(o => o.id).join(',') + '|' + platzFrei
              + '|' + S.trucks.map(t => `${t.nr}${t.model}${(t.equip || []).join('')}`).join(',');
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;

    box.innerHTML = S.contractOffers.length
      ? S.contractOffers.map(o => zeigeAusschreibung(o, platzFrei)).join('')
      : empty('Zurzeit keine Ausschreibungen.');
  },
};

/* Eine Ausschreibung mit allem, was für die Entscheidung nötig ist:
   was gefahren wird, womit — und ob man das hat. */
function zeigeAusschreibung(o, platzFrei) {
  const g = klasseVon(o.klasse);
  const sendung = { klasse: o.klasse, paletten: o.paletten, gewicht: o.gewicht };

  const geeignet = passendeFahrzeuge(sendung, S.trucks);
  const kannFahren = geeignet.length > 0;

  /* Ohne passendes Fahrzeug: sagen, was fehlt und was nötig wäre. */
  const noetig = kannFahren ? null : noetigeKlasse(sendung);
  const grund = kannFahren ? null : warumNicht(sendung, S.trucks);

  return `
  <div class="offer ${kannFahren ? '' : 'nicht-fahrbar'}">
    <div class="flex-row" style="justify-content:space-between;">
      <strong>${esc(o.firm.name)}</strong>
      <span class="money">${fmt(o.perLoad)}<span class="muted"> je Fahrt</span></span>
    </div>

    ${o.empfaenger ? `
      <div class="relation">
        📍 ${esc(o.firm.name.slice(0, 24))}
        <span class="pfeil">→</span>
        ${esc(o.empfaenger.name.slice(0, 24))}
        <span class="muted">· ${Math.round(haversine(o.firm, o.empfaenger) * 1.28)} km je Fahrt</span>
      </div>` : ''}

    <div class="ladung-zeile">
      ${g.icon} ${esc(g.name)} ·
      <strong>${o.paletten} Pal.</strong> ·
      <strong>${(o.gewicht / 1000).toFixed(1)} t</strong>
      ${g.braucht ? `<span class="warn">· ${EQUIPMENT[g.braucht].icon} ${esc(EQUIPMENT[g.braucht].name)} nötig</span>` : ''}
    </div>

    ${kannFahren
      ? `<div class="fahrbar">
           ✔ ${geeignet.length} passende${geeignet.length === 1 ? 's' : ''} Fahrzeug${geeignet.length === 1 ? '' : 'e'}:
           ${geeignet.slice(0, 4).map(t => `LKW ${t.nr}`).join(', ')}${geeignet.length > 4 ? ' …' : ''}
         </div>`
      : `<div class="unfahrbar">
           <strong>✘ ${esc(grund)}</strong>
           ${noetig
             ? `<br>Nötig wäre mindestens ein <strong>${esc(noetig.name)}</strong>
                ${noetig.ausstattung ? `mit ${esc(EQUIPMENT[noetig.ausstattung].name)}` : ''}
                <span class="muted">(${fmt(noetig.price)}${
                  noetig.ausstattung ? ` + ${fmt(EQUIPMENT[noetig.ausstattung].preis)}` : ''})</span>`
             : '<br>Diese Ladung übersteigt jede Fahrzeugklasse.'}
         </div>`}

    <div style="font-size:10px;margin:3px 0;">
      ${o.total} Sendungen über ${o.weeks} Wochen · ${o.perWeek} je Woche<br>
      <span class="muted">Gesamtwert ${fmt(o.perLoad * o.total)} ·
      Abschlussprämie <span class="money">${fmt(o.bonus)}</span></span>
    </div>

    <div class="flex-row" style="justify-content:space-between;">
      <span class="muted" style="font-size:10px;">
        ab ${Math.round(CONTRACTS.PART_OK * 100)} % Erfüllung halbe Prämie</span>
      <button class="btn btn-sm" data-sign="${o.id}" ${platzFrei ? '' : 'disabled'}>
        ${platzFrei ? 'unterschreiben' : 'kein Platz frei'}</button>
    </div>
  </div>`;
}
