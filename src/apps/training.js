/* Schulung: ein Fenster je Fahrer. */

import { SKILLS, RULES } from '../config.js';
import { S, findTruck, xpNeeded } from '../state.js';
import { fmt, esc, pips } from '../util.js';
import { canLearn, learn } from '../sim/drivers.js';
import { onTick } from '../ui/wm.js';

export const TrainingApp = {
  id: 'training', icon: '🎓', multi: true, hidden: true,
  title: p => {
    const t = findTruck(p.nr);
    return t ? `Schulung — ${t.driver.name}` : 'Schulung';
  },
  width: 400, height: 380,

  body: () => `
    <div class="pad">
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
      <table class="win-table" id="trTable"></table>
      <div class="muted" style="margin-top:8px;font-size:10px;" id="trHint"></div>
    </div>`,

  mount(el, params) {
    el.querySelector('#trTable').addEventListener('click', e => {
      const btn = e.target.closest('button[data-skill]');
      if (!btn) return;
      learn(params.nr, btn.dataset.skill);
      onTick();
    });
  },

  update(el, params) {
    const truck = findTruck(params.nr);
    if (!truck) return;
    const d = truck.driver;

    el.querySelector('#trName').innerHTML  = `<strong>${esc(d.name)}</strong> · LKW ${truck.nr}`;
    el.querySelector('#trLevel').textContent = `Stufe ${d.level} · ${d.tours} Zustellungen`;
    el.querySelector('#trXp').style.width  = Math.min(100, d.xp / xpNeeded(d.level) * 100) + '%';
    el.querySelector('#trXpText').textContent =
      `${Math.round(d.xp)} / ${xpNeeded(d.level)} Erfahrung bis Stufe ${d.level + 1}`;
    el.querySelector('#trPts').textContent = d.points;

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

    el.querySelector('#trHint').textContent =
      d.points === 0 ? 'Noch kein Punkt frei. Erfahrung sammelt sich mit jeder Zustellung, längere Strecken bringen mehr.'
      : S.money < RULES.TRAIN_COST ? 'Für die Kursgebühr fehlt gerade Geld.'
      : '';
  },
};
