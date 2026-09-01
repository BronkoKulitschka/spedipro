/* Personal: eingestellte Fahrer, ihre Leistung und die Börse. */

import { S } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { TRAITS, staerkenVon, schwaechenVon } from '../sim/persons.js';
import { tagesLohn, lohnGesamt, einstellen, entlassen, zuteilen, abziehen,
         fahrzeugVon, freieFahrer, leereFahrzeuge, fuelleBoerse,
         bewertung, urteil, auffaelligkeiten, ABFINDUNG_TAGE } from '../sim/staff.js';
import { openApp, onTick } from '../ui/wm.js';
import { fahrerBild, onBildBereit } from '../ui/sprites.js';
import { kasseLeiste, kasseAktualisieren, empty } from './shared.js';

export const StaffApp = {
  id: 'staff', icon: '👤', title: () => 'Personal',
  kurz: 'Personal', desktop: true, width: 460, height: 490,

  body: () => `
    <div class="col fill">
      ${kasseLeiste()}
      <div class="reiter" id="stReiter">
        <button class="btn btn-sm" data-blatt="team">Mannschaft</button>
        <button class="btn btn-sm" data-blatt="boerse">Börse</button>
        <button class="btn btn-sm" data-blatt="urteil">Auswertung</button>
      </div>
      <div class="bar-note" id="stKopf">—</div>
      <div class="inset-box scroll fill" id="stListe" style="padding:4px;"></div>
    </div>`,

  mount(el) {
    el.dataset.blattWahl = 'team';
    fuelleBoerse();

    el.addEventListener('click', e => {
      const reiter = e.target.closest('[data-blatt]');
      if (reiter) {
        el.dataset.blattWahl = reiter.dataset.blatt;
        el.querySelector('#stListe').dataset.sig = '';
        onTick();
        return;
      }

      const ein = e.target.closest('[data-ein]');
      if (ein) { einstellen(ein.dataset.ein); neu(el); return; }

      const raus = e.target.closest('[data-raus]');
      if (raus) {
        const d = S.drivers.find(x => x.id === raus.dataset.raus);
        const kosten = tagesLohn(d) * ABFINDUNG_TAGE;
        if (confirm(`${d.name} entlassen?\n\nAbfindung: ${fmt(kosten)}`)) {
          if (!entlassen(raus.dataset.raus)) {
            alert('Geht nicht, solange das Fahrzeug unterwegs ist.');
          }
          neu(el);
        }
        return;
      }

      const schule = e.target.closest('[data-schule]');
      if (schule) { openApp('training', { id: schule.dataset.schule }); return; }
    });

    onBildBereit(() => { el.querySelector('#stListe').dataset.sig = ''; onTick(); });

    el.addEventListener('change', e => {
      const wahl = e.target.closest('select[data-zuteilen]');
      if (!wahl) return;
      const nr = Number(wahl.value);
      if (nr) zuteilen(wahl.dataset.zuteilen, nr);
      else {
        const fz = S.trucks.find(t => t.driverId === wahl.dataset.zuteilen);
        if (fz) abziehen(fz.nr);
      }
      neu(el);
    });
  },

  update(el) {
    kasseAktualisieren(el, `Löhne <strong>${fmt(lohnGesamt())}</strong> je Tag`);

    el.querySelectorAll('[data-blatt]').forEach(b =>
      b.classList.toggle('pressed', b.dataset.blatt === el.dataset.blattWahl));

    const blatt = el.dataset.blattWahl;
    const liste = el.querySelector('#stListe');

    const sig = blatt + '|' + (S.drivers || []).map(d =>
      `${d.id}:${d.level}:${d.points}:${d.tours}`).join(',')
      + '|' + (S.bewerber || []).map(b => b.id).join(',')
      + '|' + S.trucks.map(t => `${t.nr}${t.driverId || ''}`).join(',');
    if (liste.dataset.sig === sig) return;
    liste.dataset.sig = sig;

    if (blatt === 'team')   { kopfTeam(el);   liste.innerHTML = zeigeTeam(); }
    if (blatt === 'boerse') { kopfBoerse(el); liste.innerHTML = zeigeBoerse(); }
    if (blatt === 'urteil') { kopfUrteil(el); liste.innerHTML = zeigeUrteil(); }
  },
};

function neu(el) {
  el.querySelector('#stListe').dataset.sig = '';
  onTick();
}

/* ── Mannschaft ── */
function kopfTeam(el) {
  const ohne = freieFahrer().length;
  const leer = leereFahrzeuge().length;
  el.querySelector('#stKopf').innerHTML =
    `${(S.drivers || []).length} Fahrer · ${S.trucks.length} Fahrzeuge`
    + (ohne ? ` · <span class="warn">${ohne} ohne Fahrzeug</span>` : '')
    + (leer ? ` · <span class="warn">${leer} Fahrzeug${leer > 1 ? 'e' : ''} ohne Fahrer</span>` : '');
}

function zeigeTeam() {
  if (!(S.drivers || []).length) {
    return empty('Noch niemand eingestellt. Unter „Börse" warten Bewerber.');
  }

  return S.drivers.map(d => {
    const fz = fahrzeugVon(d);
    const wert = bewertung(d);
    const frei = leereFahrzeuge();

    return `
    <div class="person person-mit-bild">
      <span class="person-bildnis">${fahrerBild(d.id)}</span>
      <div class="person-rumpf">
      <div class="flex-row" style="justify-content:space-between;">
        <span><strong>${esc(d.name)}</strong>
          <span class="muted">· Stufe ${d.level}</span>
          ${d.points ? `<span class="ok">· ${d.points} Pkt.</span>` : ''}</span>
        <span class="muted">${fmt(tagesLohn(d))} je Tag</span>
      </div>

      ${eigenheiten(d)}

      <div class="flex-row" style="justify-content:space-between;font-size:10px;margin:3px 0;">
        <span class="muted">${num(d.tours)} Fahrten · ${num(d.km)} km</span>
        ${wert !== null
          ? `<span class="${wert >= 65 ? 'ok' : wert >= 40 ? 'warn' : 'bad'}">${wert} Punkte · ${urteil(wert)}</span>`
          : '<span class="muted">noch kein Urteil</span>'}
      </div>

      <div class="flex-row" style="justify-content:space-between;gap:4px;flex-wrap:wrap;">
        <select data-zuteilen="${d.id}" style="flex:1;min-width:120px;">
          <option value="">— kein Fahrzeug —</option>
          ${fz ? `<option value="${fz.nr}" selected>LKW ${fz.nr}</option>` : ''}
          ${frei.map(t => `<option value="${t.nr}">LKW ${t.nr} frei</option>`).join('')}
        </select>
        <span class="flex-row" style="gap:4px;">
          <button class="btn btn-sm" data-schule="${d.id}">Schulung</button>
          <button class="btn btn-sm" data-raus="${d.id}">entlassen</button>
        </span>
      </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Börse ── */
function kopfBoerse(el) {
  el.querySelector('#stKopf').innerHTML =
    'Bewerber. Der Lohn läuft ab dem ersten Tag, ob gefahren wird oder nicht.';
}

function zeigeBoerse() {
  if (!(S.bewerber || []).length) return empty('Zurzeit keine Bewerber.');

  return S.bewerber.map(b => {
    const staerken = staerkenVon(b);
    const schwaechen = schwaechenVon(b);

    return `
    <div class="person person-mit-bild">
      <span class="person-bildnis">${fahrerBild(b.id)}</span>
      <div class="person-rumpf">
      <div class="flex-row" style="justify-content:space-between;">
        <span><strong>${esc(b.name)}</strong>
          <span class="muted">· Stufe ${b.level}${b.level > 1 ? ', erfahren' : ''}</span></span>
        <span class="money">${fmt(tagesLohn(b))} je Tag</span>
      </div>

      <div class="muted" style="font-size:10px;margin:3px 0;">
        ${staerken.length} Stärke${staerken.length === 1 ? '' : 'n'},
        ${schwaechen.length} Schwäche${schwaechen.length === 1 ? '' : 'n'}
        ${b.points ? `· ${b.points} Schulungspunkt${b.points > 1 ? 'e' : ''}` : ''}
      </div>

      ${eigenheiten(b)}

      <div class="flex-end">
        <button class="btn btn-sm" data-ein="${b.id}">einstellen</button>
      </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Auswertung ── */
function kopfUrteil(el) {
  el.querySelector('#stKopf').innerHTML =
    'Nach Leistung geordnet. Das Urteil entsteht aus Erlös je Fahrt, '
    + 'Spritanteil und Pannen.';
}

function zeigeUrteil() {
  const mit = (S.drivers || []).filter(d => d.tours > 0);
  if (!mit.length) return empty('Noch keine Fahrten. Die Auswertung braucht Zahlen.');

  const sortiert = [...mit].sort((a, b) => (bewertung(b) || 0) - (bewertung(a) || 0));

  return sortiert.map((d, i) => {
    const wert = bewertung(d);
    const s = d.stats || {};
    const proFahrt = d.tours ? s.erloes / d.tours : 0;
    const spritAnteil = s.erloes > 0 ? s.diesel / s.erloes * 100 : 0;
    const auffaellig = auffaelligkeiten(d);

    return `
    <div class="person person-mit-bild">
      <span class="person-bildnis">${fahrerBild(d.id)}</span>
      <div class="person-rumpf">
      <div class="flex-row" style="justify-content:space-between;">
        <span><strong>${i + 1}. ${esc(d.name)}</strong>
          <span class="muted">· Stufe ${d.level}</span></span>
        <span class="${wert >= 65 ? 'ok' : wert >= 40 ? 'warn' : 'bad'}">
          <strong>${wert}</strong> · ${urteil(wert)}</span>
      </div>

      <div class="prog" style="height:9px;margin:4px 0;">
        <div class="prog-fill ${wert < 40 ? 'shop' : ''}" style="width:${wert}%"></div>
      </div>

      <table class="win-table" style="font-size:10px;">
        <tr>
          <td>Erlös je Fahrt</td><td style="text-align:right">${fmt(proFahrt)}</td>
          <td>Spritanteil</td><td style="text-align:right">${spritAnteil.toFixed(0)} %</td>
        </tr>
        <tr>
          <td>Fahrten</td><td style="text-align:right">${num(d.tours)}</td>
          <td>Pannen</td><td style="text-align:right">${s.pannen || 0}</td>
        </tr>
      </table>

      ${auffaellig.length ? `
        <div class="auffaellig">
          ${auffaellig.map(a => `<span>${a.icon} ${esc(a.text)}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* Eigenheiten mit ausgeschriebener Wirkung.

   Ein Tooltip nützt auf einem Handy nichts — deshalb steht die
   Beschreibung sichtbar unter jedem Zug. */
function eigenheiten(d) {
  const staerken = staerkenVon(d);
  const schwaechen = schwaechenVon(d);
  if (!staerken.length && !schwaechen.length) {
    return '<div class="muted" style="font-size:10px;">Keine Besonderheiten.</div>';
  }

  const zeile = (t, schwach) => `
    <div class="eigenheit ${schwach ? 'schwach' : ''}">
      <span class="eig-kopf">${t.icon} ${esc(t.name)}</span>
      <span class="eig-text">${esc(t.text)}</span>
      ${wirkungText(t) ? `<span class="eig-wirkung">${esc(wirkungText(t))}</span>` : ''}
    </div>`;

  return `<div class="eigenheiten">
    ${staerken.map(t => zeile(t, false)).join('')}
    ${schwaechen.map(t => zeile(t, true)).join('')}
  </div>`;
}

/* Die Zahlen hinter einem Zug, in Worte gefasst.

   Ausgeschrieben statt mit Vorzeichen: „6 % weniger Diesel" ist
   eindeutig, „−6 % Diesel" lässt offen, ob das gut oder schlecht ist. */
function wirkungText(t) {
  const teile = [];

  /* wert > 1 bedeutet mehr davon. mehrIstGut sagt, ob das erfreulich ist. */
  const sag = (wert, mehr, weniger) => {
    if (typeof wert !== 'number') return;
    const ab = Math.round(Math.abs(1 - wert) * 100);
    if (ab < 1) return;
    teile.push(`${ab} % ${wert > 1 ? mehr : weniger}`);
  };

  sag(t.tempoAllg, 'schneller unterwegs', 'langsamer unterwegs');
  sag(t.diesel,    'mehr Diesel',         'weniger Diesel');
  sag(t.panne,     'mehr Pannen',         'weniger Pannen');
  sag(t.rampe,     'länger an der Rampe', 'schneller an der Rampe');
  sag(t.ansehen,   'mehr Ansehen',        'weniger Ansehen');
  sag(t.stau,      'mehr Stauverlust',    'weniger Stauverlust');
  sag(t.xp,        'schnellere Erfahrung','langsamere Erfahrung');
  sag(t.lohn,      'höherer Lohn',        'geringerer Lohn');

  /* Züge, die von Uhrzeit oder Strecke abhängen */
  if (typeof t.tempo === 'function')   teile.push('Tempo je nach Tageszeit');
  if (typeof t.tempoKm === 'function') teile.push('Tempo je nach Streckenlänge');

  return teile.join(' · ');
}
