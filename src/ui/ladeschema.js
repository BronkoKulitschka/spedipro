/* Schematische Ansicht der Ladefläche.

   Ein Lastwagen von oben, die Ladefläche in Stellplätze geteilt. Belegte
   Plätze sind eingefärbt — je Sendung eine eigene Farbe, damit man bei
   einer Sammelladung sieht, was wem gehört.

   Zwei Grenzen gelten gleichzeitig: der Platz und das Gewicht. Deshalb
   steht unter der Ladefläche ein zweiter Balken für die Nutzlast. Bei
   schwerem Gut ist die Fläche halb leer und der Wagen trotzdem voll —
   genau das soll man sehen. */

import { kapazitaet, summe, klasseVon } from '../sim/goods.js';
import { modelOf } from '../state.js';
import { esc } from '../util.js';

/* Farben für die einzelnen Sendungen einer Sammelladung. */
const FARBEN = ['#4a6ac0', '#2e8b57', '#a06020', '#8060b0', '#c04040', '#40a0a0'];

/* Die Ladefläche wird zweireihig dargestellt — so stehen Europaletten
   auf einem Lastwagen tatsächlich, quer nebeneinander. */
function reihen(plaetze) {
  const proReihe = Math.ceil(plaetze / 2);
  return [proReihe, plaetze - proReihe];
}

/* sendungen: was schon auf der Ladeliste liegt
   neu:       die Sendung, um die es gerade geht (wird hervorgehoben) */
export function ladeBild(truck, sendungen = [], neu = null) {
  const kap = kapazitaet(truck);
  const m = modelOf(truck);

  const belegt = summe(sendungen);
  const dazu = neu ? { paletten: neu.paletten || 0, gewicht: neu.gewicht || 0 }
                   : { paletten: 0, gewicht: 0 };

  const gesamtPal = belegt.paletten + dazu.paletten;
  const gesamtKg = belegt.kg + dazu.kg;

  const passtPlatz = gesamtPal <= kap.paletten;
  const passtLast = gesamtKg <= kap.kg;

  /* ── Die Plätze einfärben ── */
  const plaetze = [];
  sendungen.forEach((s, i) => {
    for (let n = 0; n < (s.paletten || 0); n++) {
      plaetze.push({ farbe: FARBEN[i % FARBEN.length], klasse: s.klasse, neu: false });
    }
  });
  if (neu) {
    for (let n = 0; n < (neu.paletten || 0); n++) {
      plaetze.push({ farbe: '#e0a020', klasse: neu.klasse, neu: true });
    }
  }

  const [obenZahl, untenZahl] = reihen(kap.paletten);
  const breite = 320;
  const rand = 10;

  /* Die Zeichnung passt sich der Platzzahl an: viele Plätze werden
     schmaler, wenige bleiben gut greifbar. */
  const feldBreite = Math.max(5, (breite - 2 * rand - 46) / Math.max(1, obenZahl));
  const feldHoehe = Math.min(20, Math.max(9, feldBreite * 1.15));

  const kasten = (i, reihe) => {
    const p = plaetze[reihe === 0 ? i : obenZahl + i];
    const x = rand + 44 + i * feldBreite;
    const y = 22 + reihe * (feldHoehe + 2);

    if (!p) {
      return `<rect x="${x}" y="${y}" width="${feldBreite - 1}" height="${feldHoehe}"
                    fill="#e8e8e8" stroke="#a0a0a0" stroke-width="0.5"/>`;
    }
    return `<rect x="${x}" y="${y}" width="${feldBreite - 1}" height="${feldHoehe}"
                  fill="${p.farbe}" stroke="${p.neu ? '#806000' : '#303030'}"
                  stroke-width="${p.neu ? 1.2 : 0.5}"/>`;
  };

  const hoehe = 22 + 2 * (feldHoehe + 2) + 30;

  return `
  <div class="ladeschema">
    <svg viewBox="0 0 ${breite} ${hoehe}" width="100%" height="${hoehe}"
         role="img" aria-label="Ladefläche von oben">

      <!-- Fahrerhaus -->
      <rect x="${rand}" y="22" width="30" height="${2 * feldHoehe + 2}"
            fill="#b0b8c8" stroke="#404040" stroke-width="1"/>
      <rect x="${rand + 5}" y="26" width="20" height="8"
            fill="#8098b8" stroke="#404040" stroke-width="0.5"/>

      <!-- Ladefläche -->
      <rect x="${rand + 42}" y="20" width="${obenZahl * feldBreite + 3}"
            height="${2 * (feldHoehe + 2) + 2}"
            fill="none" stroke="#404040" stroke-width="1.5"/>

      ${Array.from({ length: obenZahl }, (_, i) => kasten(i, 0)).join('')}
      ${Array.from({ length: untenZahl }, (_, i) => kasten(i, 1)).join('')}

      <!-- Beschriftung -->
      <text x="${rand}" y="14" font-size="10" fill="#303030">${esc(m.name)}</text>
      <text x="${breite - rand}" y="14" font-size="10" fill="${passtPlatz ? '#303030' : '#a02020'}"
            text-anchor="end">${gesamtPal} von ${kap.paletten} Plätzen</text>

      <!-- Nutzlast -->
      <text x="${rand}" y="${hoehe - 14}" font-size="10" fill="#303030">Nutzlast</text>
      <rect x="${rand + 46}" y="${hoehe - 22}" width="${breite - 2 * rand - 46}" height="10"
            fill="#e8e8e8" stroke="#808080" stroke-width="0.5"/>
      <rect x="${rand + 46}" y="${hoehe - 22}"
            width="${Math.min(1, belegt.kg / kap.kg) * (breite - 2 * rand - 46)}" height="10"
            fill="#4a6ac0"/>
      ${dazu.kg ? `
        <rect x="${rand + 46 + Math.min(1, belegt.kg / kap.kg) * (breite - 2 * rand - 46)}"
              y="${hoehe - 22}"
              width="${Math.min(1 - Math.min(1, belegt.kg / kap.kg), dazu.kg / kap.kg)
                       * (breite - 2 * rand - 46)}"
              height="10" fill="#e0a020" stroke="#806000" stroke-width="0.8"/>` : ''}
      <text x="${breite - rand}" y="${hoehe - 14}" font-size="10"
            fill="${passtLast ? '#303030' : '#a02020'}" text-anchor="end">
        ${(gesamtKg / 1000).toFixed(1)} von ${(kap.kg / 1000).toFixed(1)} t
      </text>
    </svg>

    ${legende(sendungen, neu)}
  </div>`;
}

function legende(sendungen, neu) {
  if (!sendungen.length && !neu) return '';

  const eintrag = (farbe, text, paletten) => `
    <span class="lade-legende-punkt">
      <span class="lade-farbe" style="background:${farbe}"></span>
      ${esc(text)} <span class="muted">${paletten} Pal.</span>
    </span>`;

  return `
    <div class="lade-legende">
      ${sendungen.map((s, i) => eintrag(
        FARBEN[i % FARBEN.length],
        s.firm?.name?.slice(0, 18) || klasseVon(s.klasse).name,
        s.paletten)).join('')}
      ${neu ? eintrag('#e0a020',
        (neu.firm?.name?.slice(0, 18) || 'diese Sendung'), neu.paletten) : ''}
    </div>`;
}

/* Kurzfassung ohne Zeichnung — für Listen. */
export function ladeText(truck, sendungen = [], neu = null) {
  const kap = kapazitaet(truck);
  const s = summe([...sendungen, ...(neu ? [neu] : [])]);
  return `${s.paletten}/${kap.paletten} Pal. · ${(s.kg / 1000).toFixed(1)}/${(kap.kg / 1000).toFixed(1)} t`;
}
