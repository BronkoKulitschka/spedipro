/* Einstellungen: Zeitverhältnis, Geschwindigkeit, Datenquellen. */

import { TIME, AUTOBAHNEN, RULES } from '../config.js';
import { S, dateText } from '../state.js';
import { esc } from '../util.js';
import { setSpeed, setRatio, realMinutesPerGameDay } from '../sim/clock.js';
import { loadFirms } from '../data/overpass.js';
import { refillOffers } from '../sim/orders.js';
import { drawFirms } from '../ui/map.js';
import { toast } from '../ui/toast.js';
import { log } from '../state.js';
import { VERSION, BUILD, CODENAME } from '../version.js';
import { onTick } from '../ui/wm.js';

export const SettingsApp = {
  id: 'settings', icon: '⚙️', title: () => 'Einstellungen',
  width: 400, height: 430, desktop: true,

  body: () => `
    <div class="pad">
      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Betriebsuhr</div>
        <div class="inset-box" style="text-align:center;padding:8px;margin-bottom:8px;">
          <div style="font-size:17px;font-weight:bold;" id="stClock">—</div>
          <div class="muted" id="stState">—</div>
        </div>
        <div class="flex-row" style="margin-bottom:6px;">
          ${TIME.SPEEDS.map(s => `<button class="btn btn-sm" data-speed="${s}">
            ${s === 0 ? '❚❚' : s + '×'}</button>`).join('')}
        </div>
        <div class="muted" style="font-size:10px;">Leertaste hält an und lässt weiterlaufen.</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Zeitverhältnis</div>
        <div style="margin-bottom:6px;">Spielminuten je echter Minute bei 1×:</div>
        <div class="flex-row" style="flex-wrap:wrap;">
          ${TIME.RATIOS.map(r => `<button class="btn btn-sm" data-ratio="${r}">1 : ${r}</button>`).join('')}
        </div>
        <div class="muted" style="font-size:10px;margin-top:6px;" id="stRatioNote">—</div>
      </div>

      <div class="raised-box" style="margin-bottom:8px;">
        <div class="section-title">Programmstand</div>
        <table class="win-table">
          <tr><td>Version</td><td style="text-align:right"><strong>${VERSION}</strong></td></tr>
          <tr><td>Ausgabe</td><td style="text-align:right">${CODENAME}</td></tr>
          <tr><td>Stand</td><td style="text-align:right">${BUILD}</td></tr>
        </table>
        <div class="muted" style="font-size:10px;margin-top:6px;">
          Stimmt die Nummer nicht mit der erwarteten überein, hat der Browser
          noch den alten Stand. Seite mit gedrückter Umschalttaste neu laden
          oder den Verlauf für diese Seite löschen.
        </div>
      </div>

      <div class="raised-box">
        <div class="section-title">Datenquellen</div>
        <div style="line-height:1.6;">
          Karte und Kundschaft: OpenStreetMap, ODbL.<br>
          <span class="muted" id="stFirms">—</span><br>
          Straßenführung: OSRM-Demoserver.<br>
          <span class="muted" id="stRouter">—</span><br>
          Baustellen: Autobahn GmbH des Bundes.<br>
          <span class="muted" id="stTraffic">—</span>
        </div>
        <div class="flex-row" style="margin-top:8px;">
          <button class="btn btn-sm" id="stReload">Betriebe neu laden</button>
          <span class="muted" style="font-size:10px;" id="stReloadNote"></span>
        </div>
      </div>
    </div>`,

  mount(el) {
    el.addEventListener('click', e => {
      const speed = e.target.closest('button[data-speed]');
      if (speed) { setSpeed(Number(speed.dataset.speed)); onTick(); return; }
      const ratio = e.target.closest('button[data-ratio]');
      if (ratio) { setRatio(Number(ratio.dataset.ratio)); onTick(); return; }
      if (e.target.closest('#stReload')) reload(el);
    });
  },

  update(el) {
    el.querySelector('#stClock').textContent = dateText();
    el.querySelector('#stState').textContent = S.running ? 'Betrieb läuft' : 'angehalten';

    el.querySelectorAll('[data-speed]').forEach(b =>
      b.classList.toggle('pressed', Number(b.dataset.speed) === S.speed));
    el.querySelectorAll('[data-ratio]').forEach(b =>
      b.classList.toggle('pressed', Number(b.dataset.ratio) === S.ratio));

    const hours = realMinutesPerGameDay() / 60;
    el.querySelector('#stRatioNote').textContent =
      `Ein Spieltag dauert damit bei der gewählten Stufe etwa `
      + (hours >= 1 ? `${hours.toFixed(1)} Stunden` : `${Math.round(hours * 60)} Minuten`)
      + ' echter Zeit.';

    el.querySelector('#stFirms').textContent =
      `${S.firms.length} Betriebe um ${S.depot.name} · Quelle: ${S.dataInfo.firms}`;
    el.querySelector('#stRouter').textContent = esc(S.dataInfo.router);
    el.querySelector('#stTraffic').textContent =
      `${S.traffic.length} Einträge auf ${AUTOBAHNEN.length} Autobahnen, `
      + `${S.stats.jams} Stellen bisher auf euren Strecken.`;
  },
};

/* Betriebe erneut abfragen, ohne das Spiel zu unterbrechen. */
async function reload(el) {
  const button = el.querySelector('#stReload');
  const note   = el.querySelector('#stReloadNote');
  button.disabled = true;

  note.textContent = 'Abfrage läuft, das kann dauern …';
  const { firms, source } = await loadFirms(S.depot, text => { note.textContent = text.trim(); });
  S.firms = firms;
  S.dataInfo.firms = source;
  S.offers = [];
  refillOffers();
  drawFirms();

  note.textContent = `${firms.length} Betriebe · ${source}`;
  log(`Betriebe neu geladen: ${firms.length} aus ${source}.`);
  toast('🔄', `<strong>${firms.length} Betriebe</strong> geladen.`,
        `<span class="muted">Quelle: ${source}</span>`);
  button.disabled = false;
  onTick();
}
