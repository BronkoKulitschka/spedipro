/* Das Verhandlungsgespräch.

   Zwei Seiten am Tisch: der Disponent und der Auftraggeber. Man kann
   Argumente vorbringen — die kosten keine Runde und stimmen den
   Verlader milder — und dann fordern. Drei Runden, danach ist Schluss.

   Wer gleich das Höchste verlangt, verschenkt die Argumente. Das ist
   der Kern: erst reden, dann fordern. */

import { S } from '../state.js';
import { fmt, esc } from '../util.js';
import { beginne, fordern, argumentieren, annehmen, verlassen,
         offeneArgumente, aussicht, STUFEN, MAX_RUNDEN } from '../sim/haggle.js';
import { klasseVon } from '../sim/goods.js';
import { fahrtenZu, stufeVon } from '../sim/customers.js';
import { charakterVon, stimmung, zustandVon } from '../sim/clients.js';
import { closeWindow, onTick } from '../ui/wm.js';
import { gesichtVon, onBildBereit } from '../ui/sprites.js';

export const HaggleApp = {
  id: 'haggle', icon: '💬', multi: true, hidden: true,
  title: p => {
    const o = S.offers.find(x => x.id === p.id);
    return o ? `Verhandlung — ${o.firm.name}` : 'Verhandlung';
  },
  width: 420, height: 480,

  body: () => `
    <div class="col fill">
      <div class="verh-kopf" id="vhKopf">—</div>
      <div class="verh-verlauf scroll fill" id="vhVerlauf"></div>
      <div class="verh-wahl" id="vhWahl"></div>
    </div>`,

  mount(el, params) {
    el._g = beginne(params.id);

    el.addEventListener('click', e => {
      const g = el._g;
      if (!g) return;

      const arg = e.target.closest('[data-arg]');
      if (arg) { argumentieren(g, arg.dataset.arg); zeichne(el); return; }

      const ford = e.target.closest('[data-stufe]');
      if (ford) { fordern(g, ford.dataset.stufe); zeichne(el); onTick(); return; }

      if (e.target.closest('#vhJa')) {
        annehmen(g);
        schliessen(params.id);
        return;
      }

      if (e.target.closest('#vhWeg')) {
        verlassen(g);
        schliessen(params.id);
      }
    });

    /* Treffen die Bilder verspätet ein, das Fenster neu zeichnen. */
    onBildBereit(() => zeichne(el));

    zeichne(el);
  },

  update(el) {
    /* Der Verlauf ändert sich nur durch Klicks, nicht mit der Uhr —
       neu gezeichnet wird deshalb dort, nicht hier. */
  },
};

function zeichne(el) {
  const g = el._g;
  const offer = S.offers.find(o => o.id === g?.offerId);

  if (!g || !offer) {
    el.querySelector('#vhKopf').textContent = 'Die Anfrage ist nicht mehr da.';
    el.querySelector('#vhWahl').innerHTML =
      '<button class="btn" id="vhWeg">schließen</button>';
    return;
  }

  const kl = klasseVon(offer.klasse);
  const beziehung = stufeVon(fahrtenZu(offer.firm.name));

  const c = charakterVon(offer.firm.name);
  const st = stimmung(offer.firm.name);
  const z = zustandVon(offer.firm.name);

  el.querySelector('#vhKopf').innerHTML = `
    <div class="flex-row" style="justify-content:space-between;">
      <strong>${esc(offer.firm.name)}</strong>
      <span>${g.offen ? `Runde ${g.runde} von ${MAX_RUNDEN}` : 'beendet'}</span>
    </div>
    <div style="font-size:10px;margin-top:2px;">
      ${kl.icon} ${esc(kl.name)} · ${offer.paletten} Pal. ·
      ${Math.round(offer.estKm)} km
      ${beziehung.rate > 1 ? `· <span class="ok">${esc(beziehung.name)}</span>` : ''}
    </div>
    <div class="verh-person">
      <span class="verh-portraet">${gesichtVon(c.key) || c.icon}</span>
      <span>
        ${esc(c.name)} ·
        <span class="stimmung-${st.stufe}">${esc(st.text)}</span>
        ${z ? `<br>${z.icon} <strong>${esc(z.name)}</strong> — ${esc(z.text)}` : ''}
      </span>
    </div>
    ${g.konkurrenz ? `
      <div class="konkurrenz-zeile">
        ⚖️ ${esc(g.konkurrenz.name)} bietet ${fmt(g.konkurrenz.fee)} — das drückt den eigenen Spielraum.
      </div>` : ''}`;

  /* Der Gesprächsverlauf */
  el.querySelector('#vhVerlauf').innerHTML = g.verlauf.map(z => `
    <div class="rede ${z.wer}">
      <span class="rede-wer">${z.wer === 'ich' ? 'Sie' : esc(offer.firm.name.slice(0, 18))}</span>
      <span class="rede-text">${esc(z.text)}</span>
    </div>`).join('')
    + `<div class="rede-stand">
         Auf dem Tisch: <strong>${fmt(g.fee)}</strong>
         ${g.fee > offer.grundpreis
           ? `<span class="ok">(+${Math.round((g.fee / offer.grundpreis - 1) * 100)} %)</span>`
           : '<span class="muted">(unverändert)</span>'}
       </div>`;

  el.querySelector('#vhVerlauf').scrollTop = 99999;

  /* Was jetzt möglich ist */
  el.querySelector('#vhWahl').innerHTML = g.offen
    ? waehleOffen(g, offer)
    : waehleEnde(g, offer);
}

function waehleOffen(g, offer) {
  const argumente = offeneArgumente(g)
    .filter(a => a.verfuegbar && !a.genutzt);

  return `
    ${argumente.length ? `
      <div class="verh-gruppe">
        <div class="verh-titel">Anführen</div>
        ${argumente.map(a => `
          <button class="btn btn-sm verh-arg" data-arg="${a.key}">
            ${esc(a.text)}
          </button>`).join('')}
      </div>` : ''}

    <div class="verh-gruppe">
      <div class="verh-titel">Fordern <span class="muted">— kostet eine Runde</span></div>
      ${STUFEN.map(s => {
        const a = aussicht(g, s.faktor);
        return `
        <button class="btn btn-sm verh-stufe" data-stufe="${s.key}">
          <span>${fmt(offer.grundpreis * s.faktor)}
            <span class="muted">+${Math.round((s.faktor - 1) * 100)} %</span></span>
          <span class="aussicht ${a.stufe}">${a.text}</span>
        </button>`;
      }).join('')}
    </div>

    <div class="flex-row" style="gap:4px;padding:5px 6px;">
      <button class="btn btn-sm" id="vhJa">${fmt(g.fee)} annehmen</button>
      <button class="btn btn-sm" id="vhWeg">abbrechen</button>
    </div>`;
}

function waehleEnde(g, offer) {
  if (g.ergebnis === 'abgebrochen') {
    return `
      <div class="verh-ende bad">
        Die Fracht ist vergeben. Das kommt vor, wenn man überzieht.
      </div>
      <div class="flex-row" style="padding:5px 6px;">
        <button class="btn" id="vhWeg">schließen</button>
      </div>`;
  }

  const mehr = g.fee - offer.grundpreis;
  return `
    <div class="verh-ende ${mehr > 0 ? 'ok' : ''}">
      ${mehr > 0
        ? `${fmt(mehr)} mehr als zuerst genannt.`
        : 'Kein Aufschlag herausgeholt.'}
    </div>
    <div class="flex-row" style="gap:4px;padding:5px 6px;">
      <button class="btn btn-default" id="vhJa">${fmt(g.fee)} annehmen</button>
      <button class="btn btn-sm" id="vhWeg">ablehnen</button>
    </div>`;
}

/* Fenster schließen und die Auftragsliste zum Neuzeichnen bewegen —
   sie zeigt sonst den Stand vor der Verhandlung. */
function schliessen(id) {
  closeWindow(`haggle:${id}`);
  onTick();
}
