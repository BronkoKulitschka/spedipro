/* Hilfe im Stil der alten Windows-Hilfe: links das Inhaltsverzeichnis,
   rechts der Artikel, oben eine Leiste mit Zurück und Inhalt. */

import { TOPICS, GRUPPEN } from '../help/topics.js';
import { esc } from '../util.js';
import { openApp, onTick } from '../ui/wm.js';

/* Verlauf, damit „Zurück" etwas zu tun hat */
let verlauf = [];
let aktuell = 'start';

export function oeffneHilfe(themaId) {
  if (TOPICS[themaId]) {
    if (aktuell !== themaId) verlauf.push(aktuell);
    aktuell = themaId;
  }
  openApp('help');
  onTick();
}

function block(b) {
  if (b.h)    return `<h3 class="hilfe-h">${esc(b.h)}</h3>`;
  if (b.p)    return `<p class="hilfe-p">${esc(b.p)}</p>`;
  if (b.list) return `<ul class="hilfe-liste">${b.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (b.tipp) return `<div class="hilfe-tipp"><strong>💡 Hinweis</strong><br>${esc(b.tipp)}</div>`;

  if (b.tab) return `
    <table class="win-table hilfe-tab">
      <thead><tr>${b.tab.kopf.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
      <tbody>${b.tab.zeilen.map(z =>
        `<tr>${z.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  if (b.ref && TOPICS[b.ref]) return `
    <div class="hilfe-ref">
      Siehe auch:
      <a href="#" data-thema="${b.ref}">${TOPICS[b.ref].icon} ${esc(TOPICS[b.ref].titel)}</a>
    </div>`;

  return '';
}

export const HelpApp = {
  id: 'help', icon: '❓', title: () => 'Hilfe', desktop: true,
  width: 620, height: 500,

  body: () => `
    <div class="col fill">
      <div class="hilfe-leiste flex-row">
        <button class="btn btn-sm" data-nav="zurueck">◀ Zurück</button>
        <button class="btn btn-sm" data-nav="inhalt">📚 Inhalt</button>
        <button class="btn btn-sm" data-nav="tutorial">🎓 Tutorial starten</button>
        <span class="muted" style="margin-left:auto;font-size:10px;" id="hilfePfad"></span>
      </div>
      <div class="hilfe-split fill">
        <div class="hilfe-baum scroll" id="hilfeBaum"></div>
        <div class="hilfe-text scroll" id="hilfeText"></div>
      </div>
    </div>`,

  mount(el) {
    el.addEventListener('click', e => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        if (nav.dataset.nav === 'zurueck' && verlauf.length) aktuell = verlauf.pop();
        if (nav.dataset.nav === 'inhalt') { verlauf.push(aktuell); aktuell = '__inhalt'; }
        if (nav.dataset.nav === 'tutorial') { openApp('tutorial', { neustart: true }); }
        el.dataset.sig = '';
        onTick();
        return;
      }

      const thema = e.target.closest('[data-thema]');
      if (thema) {
        e.preventDefault();
        if (aktuell !== thema.dataset.thema) verlauf.push(aktuell);
        aktuell = thema.dataset.thema;
        el.dataset.sig = '';
        el.querySelector('#hilfeText').scrollTop = 0;
        onTick();
      }
    });
  },

  update(el) {
    if (el.dataset.sig === aktuell) return;
    el.dataset.sig = aktuell;

    /* Inhaltsverzeichnis */
    el.querySelector('#hilfeBaum').innerHTML = GRUPPEN.map(gruppe => `
      <div class="baum-gruppe">📁 ${esc(gruppe)}</div>
      ${Object.entries(TOPICS)
        .filter(([, t]) => t.gruppe === gruppe)
        .map(([id, t]) => `
          <div class="baum-eintrag ${id === aktuell ? 'aktiv' : ''}" data-thema="${id}">
            ${t.icon} ${esc(t.titel)}
          </div>`).join('')}
    `).join('');

    /* Artikel */
    const text = el.querySelector('#hilfeText');

    if (aktuell === '__inhalt') {
      el.querySelector('#hilfePfad').textContent = 'Inhalt';
      text.innerHTML = `
        <h2 class="hilfe-titel">📚 Inhalt</h2>
        ${GRUPPEN.map(g => `
          <h3 class="hilfe-h">${esc(g)}</h3>
          <ul class="hilfe-liste">
            ${Object.entries(TOPICS).filter(([, t]) => t.gruppe === g).map(([id, t]) =>
              `<li><a href="#" data-thema="${id}">${t.icon} ${esc(t.titel)}</a></li>`).join('')}
          </ul>`).join('')}`;
      return;
    }

    const thema = TOPICS[aktuell] || TOPICS.start;
    el.querySelector('#hilfePfad').textContent = `${thema.gruppe} · ${thema.titel}`;
    text.innerHTML = `
      <h2 class="hilfe-titel">${thema.icon} ${esc(thema.titel)}</h2>
      ${thema.inhalt.map(block).join('')}`;
  },
};
