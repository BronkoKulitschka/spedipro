/* Schulung: ein Fenster je Fahrer. */

import { SKILLS, RULES } from '../config.js';
import { S, xpNeeded } from '../state.js';
import { fmt, esc, pips } from '../util.js';
import { canLearn, learn } from '../sim/drivers.js';
import { kasseLeiste, kasseAktualisieren } from './shared.js';
import { traitsVon } from '../sim/persons.js';
import { onTick, openApp, closeWindow } from '../ui/wm.js';

export const TrainingApp = {
  id: 'training', icon: '🎓', multi: true, hidden: true,
  title: p => {
    const d = fahrer(p);
    return d ? `Schulung — ${d.name}` : 'Schulung';
  },
  width: 400, height: 430,

  body: () => `
    <div class="col fill">
      ${kasseLeiste()}
      <div class="pad scroll fill">
      <div class="inset-box" style="margin-bottom:8px;">
        <div class="flex-row" style="justify-content:space-between;">
          <span id="trName">—</span><span id="trLevel">—</span>
        </div>
        <div class="xpbar" style="margin-top:4px;"><div class="xpfill" id="trXp"></div></div>
        <div class="muted" style="font-size:10px;margin-top:2px;" id="trXpText">—</div>
      </div>
      <div class="raised-box" style="margin-bottom:8px;">
        <div class="flex-row" style="justify-content:space-between;">
          <span>Schulungspunkte: <strong id="trPts">—</strong></span>
          <span>Kursgebühr: <strong>${fmt(RULES.TRAIN_COST)}</strong></span>
        </div>
      </div>
      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Eigenheiten</div>
        <div id="trZuege"></div>
      </div>
      <table class="win-table" id="trTable"></table>
      <div class="muted" style="margin-top:8px;font-size:10px;" id="trHint"></div>
      </div>

      <div class="tr-fuss flex-row" style="justify-content:flex-end;gap:4px;">
        <button class="btn btn-sm" id="trNaechster" title="nächster Fahrer mit freiem Punkt">
          nächster ▶</button>
        <button class="btn btn-sm" id="trFertig">schließen</button>
      </div>
    </div>`,

  mount(el, params) {
    el.querySelector('#trTable').addEventListener('click', e => {
      const btn = e.target.closest('button[data-skill]');
      if (!btn) return;
      learn(params.id, btn.dataset.skill);
      onTick();
    });

    el.querySelector('#trFertig').onclick = () => {
      closeWindow(`training:${params.id}`);
    };

    /* Weiter zum nächsten Fahrer, der einen Punkt frei hat — beim
       Schulen mehrerer Fahrer spart das den Umweg über den Fuhrpark. */
    el.querySelector('#trNaechster').onclick = () => {
      const offen = (S.drivers || []).filter(x => x.points > 0 && x.id !== params.id);
      if (!offen.length) {
        openApp('fleet');
        closeWindow(`training:${params.id}`);
        return;
      }
      const herkunft = params.herkunft;
      closeWindow(`training:${params.id}`);
      openApp('training', { id: offen[0].id, herkunft });
    };
  },

  update(el, params) {
    const d = fahrer(params);
    if (!d) return;

    kasseAktualisieren(el);

    const fz = S.trucks.find(t => t.driverId === d.id);
    el.querySelector('#trName').innerHTML = `<strong>${esc(d.name)}</strong>`
      + (fz ? ` <span class="muted">· LKW ${fz.nr}</span>`
            : ' <span class="warn">· ohne Fahrzeug</span>');
    el.querySelector('#trLevel').textContent = `Stufe ${d.level} · ${d.tours} Zustellungen`;
    el.querySelector('#trXp').style.width  = Math.min(100, d.xp / xpNeeded(d.level) * 100) + '%';
    el.querySelector('#trXpText').textContent =
      `${Math.round(d.xp)} / ${xpNeeded(d.level)} Erfahrung bis Stufe ${d.level + 1}`;
    el.querySelector('#trPts').textContent = d.points;

    el.querySelector('#trZuege').innerHTML = traitsVon(d).map(t => `
      <div style="margin-bottom:4px;">
        <strong>${t.icon} ${esc(t.name)}</strong><br>
        <span class="muted" style="font-size:10px;">${esc(t.text)}</span>
      </div>`).join('') || '<span class="muted">Keine besonderen Eigenheiten.</span>';

    el.querySelector('#trTable').innerHTML = Object.entries(SKILLS).map(([key, s]) => {
      const maxed = d.skills[key] >= s.max;
      return `<tr>
        <td style="width:18px;font-size:14px;">${s.icon}</td>
        <td><strong>${s.name}</strong><br>
            <span class="muted" style="font-size:10px;">${s.per}</span></td>
        <td style="white-space:nowrap;">${pips(d.skills[key], s.max)}</td>
        <td style="text-align:right;">${maxed ? '<span class="muted">fertig</span>'
          : `<button class="btn btn-sm" data-skill="${key}"
               ${canLearn(d, key) ? '' : 'disabled'}>lernen</button>`}</td>
      </tr>`;
    }).join('');

    const weitere = (S.drivers || []).filter(x => x.points > 0 && x.id !== params.id).length;
    const weiter = el.querySelector('#trNaechster');
    weiter.style.display = weitere ? '' : 'none';
    weiter.textContent = `nächster (${weitere}) ▶`;

    el.querySelector('#trHint').innerHTML =
      d.points === 0 ? 'Noch kein Punkt frei. Erfahrung sammelt sich mit jeder Zustellung, längere Strecken bringen mehr.'
      : S.money < RULES.TRAIN_COST
        ? `<span class="debt">${fmt(RULES.TRAIN_COST - S.money)} fehlen für die Kursgebühr.</span>`
        : '';
  },
};

/* Der Fahrer, um den es in diesem Fenster geht. */
function fahrer(params) {
  return (S.drivers || []).find(d => d.id === params.id) || null;
}
