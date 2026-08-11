/* Fahrzeughandel. Klassen unterscheiden sich in Anschaffung, Verbrauch,
   Reisegeschwindigkeit und Ladefähigkeit — wie in den großen Vorbildern
   ist die Frage nicht „welcher ist der beste", sondern „welcher passt
   zu den Strecken, die ich fahre". */

import { TRUCK_MODELS, USED, RULES, EQUIPMENT, LICENCE } from '../config.js';
import { S, anzahlVon, fixGesamt } from '../state.js';
import { fmt, esc } from '../util.js';
import { buyTruck, priceOf } from '../sim/fleet.js';
import { kasseLeiste, kasseAktualisieren } from './shared.js';
import { modelFrei, stufeFuerModell, nochOffen } from '../sim/progress.js';
import { onTick, openApp } from '../ui/wm.js';

export const DealerApp = {
  id: 'dealer', icon: '🏷️', title: () => 'Fahrzeughandel',
  kurz: 'Fahrzeug-\nhandel', desktop: true,
  width: 460, height: 460,

  body: () => `
    <div class="col fill">
      ${kasseLeiste('Fixkosten steigen mit jedem Fahrzeug')}
      <div class="reiter" id="dlReiter">
        <button class="btn btn-sm" data-hof="neu">🏢 Neuwagen</button>
        <button class="btn btn-sm" data-hof="gebraucht">🔧 Gebrauchtwagen</button>
      </div>
      <div class="hof-hinweis" id="dlHof"></div>
      <div class="bar-note flex-row" style="justify-content:space-between;">
        <span class="muted" style="font-size:10px;">Preis inkl. gewählter Ausstattung</span>
        <span class="flex-row" style="gap:8px;font-size:10px;flex-wrap:wrap;">
          <label class="flex-row" style="gap:4px;"><input type="checkbox" id="eq-kuehl">
            ${EQUIPMENT.kuehl.icon} Kühlaufbau</label>
          <label class="flex-row" style="gap:4px;"><input type="checkbox" id="eq-adr">
            ${EQUIPMENT.adr.icon} ADR</label>
        </span>
      </div>
      <div class="inset-box scroll fill" id="dlList"></div>
      <div class="bar-note muted" id="dlHint">
        Gebraucht kostet ${Math.round((1 - USED.factor) * 100)} % weniger,
        geht dafür häufiger in die Werkstatt.
      </div>
    </div>`,

  mount(el) {
    el.dataset.hof = 'neu';

    el.querySelector('#dlReiter').addEventListener('click', e => {
      const knopf = e.target.closest('[data-hof]');
      if (!knopf) return;
      el.dataset.hof = knopf.dataset.hof;
      el.querySelector('#dlList').dataset.sig = '';
      onTick();
    });

    el.addEventListener('change', () => {
      el.querySelector('#dlList').dataset.sig = '';
      onTick();
    });

    el.querySelector('#dlList').addEventListener('click', e => {
      if (e.target.closest('[data-zeigestufe]')) { openApp('progress'); return; }

      const btn = e.target.closest('button[data-model]');
      if (!btn) return;
      const used = el.dataset.hof === 'gebraucht';
      const equip = [];
      if (el.querySelector('#eq-kuehl').checked) equip.push('kuehl');
      if (el.querySelector('#eq-adr').checked)   equip.push('adr');
      if (buyTruck(btn.dataset.model, used, equip)) {
        el.querySelector('#dlList').dataset.sig = '';
      }
      onTick();
    });
  },

  update(el) {
    const used = el.dataset.hof === 'gebraucht';

    /* Der Kontostand zeigt zusätzlich, was der Fuhrpark am Tag kostet —
       ein Fahrzeug mehr heißt auch jeden Tag mehr Fixkosten. */
    kasseAktualisieren(el,
      `${S.trucks.length} Fahrzeuge · ${fixGesamt().toLocaleString('de-DE')} € Fixkosten je Tag`);

    const list = el.querySelector('#dlList');
    el.querySelectorAll('[data-hof]').forEach(b =>
      b.classList.toggle('pressed', b.dataset.hof === el.dataset.hof));

    el.querySelector('#dlHof').innerHTML = el.dataset.hof === 'gebraucht'
      ? `Vorführ- und Gebrauchtwagen. Rund ${Math.round((1 - USED.price) * 100)} % `
        + `günstiger, mit ${(USED.odo / 1000).toFixed(0)}.000 km auf der Uhr und `
        + `${USED.risk.toFixed(1)}-fachem Pannenrisiko.`
      : 'Neufahrzeuge vom Hersteller, mit Werksgarantie und ohne Laufleistung.';

    const kuehl = el.querySelector('#eq-kuehl').checked;
    const adr   = el.querySelector('#eq-adr').checked;
    const sig = `${el.dataset.hof}|${kuehl}|${adr}|${S.level}|${Math.floor(S.money / 500)}`
              + '|' + S.trucks.map(t => t.model).sort().join(',');
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;

    /* Nach Führerscheinklasse gruppiert, damit die Liste übersichtlich
       bleibt — inzwischen sind es elf Fahrzeuge. */
    const gruppen = {};
    for (const m of Object.values(TRUCK_MODELS)) {
      (gruppen[m.fs] ||= []).push(m);
    }

    list.innerHTML = Object.entries(gruppen).map(([fs, modelle]) => `
      <div class="handel-gruppe">
        ${LICENCE[fs].name} <span class="muted">· ${LICENCE[fs].text}</span>
      </div>
      ${modelle.map(m => {
        const zusatz = (kuehl && m.kuehlbar ? EQUIPMENT.kuehl.preis : 0)
                     + (adr && m.adrfaehig ? EQUIPMENT.adr.preis : 0);
        const price = priceOf(m.key, used) + zusatz;
        const offen = modelFrei(m.key);
        const kann = offen && S.money >= price;
        const verbrauch = (RULES.FUEL_PER_KM * m.fuel).toFixed(2);
        const fix = Math.round(RULES.DAILY_COST * (m.fix ?? 1));

        /* Alle Gründe sammeln, die dem Kauf im Weg stehen. Ein grauer
           Knopf ohne Erklärung hilft niemandem — es soll dastehen,
           was fehlt und was dagegen zu tun ist. */
        const gruende = [];

        if (!offen) {
          const stufe = stufeFuerModell(m.key);
          const naechste = S.level + 1;
          gruende.push({
            art: 'stufe',
            text: `Erst ab Betriebsstufe ${stufe} · aktuell Stufe ${S.level}`,
            was: stufe === naechste
              ? `Für Stufe ${naechste}: ${nochOffen()}.`
              : `Noch ${stufe - S.level} Stufen entfernt. Für die nächste: ${nochOffen()}.`,
          });
        }

        if (offen && S.money < price) {
          gruende.push({
            art: 'geld',
            text: `${fmt(price - S.money)} fehlen in der Kasse`,
            was: `Preis ${fmt(price)}, vorhanden ${fmt(S.money)}.`,
          });
        }

        /* Hinweise zur Ausstattung stehen unabhängig davon, weil sie
           die Auswahl betreffen und nicht den Kauf an sich. */
        const wuensche = [];
        if (kuehl && !m.kuehlbar && !m.kuehlfest) {
          wuensche.push('Kühlaufbau für diese Bauart nicht lieferbar');
        }
        if (adr && !m.adrfaehig) {
          wuensche.push('nicht für Gefahrgut zugelassen');
        }

        return `
        <div class="offer">
          <div class="flex-row" style="justify-content:space-between;">
            <span><strong>${esc(m.name)}</strong>
              <span class="muted">· ${esc(m.klasse)}${used ? ' · gebraucht' : ''}</span>
              ${m.kuehlfest ? ' ❄️' : ''}
              ${anzahlVon(m.key) ? `<span class="im-hof">${anzahlVon(m.key)}× im Hof</span>` : ''}</span>
            <span class="${kann ? 'money' : 'debt'}">${fmt(price)}</span>
          </div>
          <div class="muted" style="font-size:10px;margin:2px 0 4px;">${esc(m.text)}</div>

          <table class="win-table" style="font-size:10px;margin-bottom:4px;">
            <tr>
              <td>zul. Gesamtgewicht</td><td style="text-align:right">${(m.zgg / 1000).toFixed(1)} t</td>
              <td>Leergewicht</td><td style="text-align:right">${(m.leer / 1000).toFixed(1)} t</td>
            </tr>
            <tr>
              <td><strong>Nutzlast</strong></td>
              <td style="text-align:right"><strong>${(m.nutzlast / 1000).toFixed(1)} t</strong></td>
              <td><strong>Stellplätze</strong></td>
              <td style="text-align:right"><strong>${m.paletten} Pal.</strong></td>
            </tr>
            <tr>
              <td>Ladevolumen</td><td style="text-align:right">${m.volumen} m³</td>
              <td>Aufbau</td><td style="text-align:right">${esc(m.aufbau)}</td>
            </tr>
            <tr>
              <td>Diesel</td><td style="text-align:right">${verbrauch} €/km</td>
              <td>Fixkosten</td><td style="text-align:right">${fmt(fix)} je Tag</td>
            </tr>
          </table>

          ${wuensche.length ? `
            <div class="kauf-hinweis">
              ${wuensche.map(w => `<div>⚠️ ${esc(w)}</div>`).join('')}
            </div>` : ''}

          ${gruende.map(g => `
            <div class="kauf-sperre kauf-${g.art}">
              <div class="flex-row" style="justify-content:space-between;gap:6px;">
                <strong>${g.art === 'geld' ? '💰' : '🔒'} ${esc(g.text)}</strong>
                ${g.art === 'stufe'
                  ? '<button class="btn btn-sm" data-zeigestufe>ansehen</button>' : ''}
              </div>
              <div class="muted">${esc(g.was)}</div>
            </div>`).join('')}

          <div class="flex-row" style="justify-content:space-between;">
            <span class="muted" style="font-size:10px;">
              ${zusatz ? `<span class="warn">inkl. Ausstattung ${fmt(zusatz)}</span>` : ''}</span>
            <button class="btn btn-sm" data-model="${m.key}" ${kann ? '' : 'disabled'}>
              ${kann ? 'kaufen' : gruende[0]?.art === 'geld' ? 'zu teuer' : 'gesperrt'}</button>
          </div>
        </div>`;
      }).join('')}
    `).join('');
  },
};
