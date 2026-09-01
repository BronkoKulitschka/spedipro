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
import { rahmenVon } from './sprites.js';

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
export function ladeBild(truck, sendungen = [], neu = null, rahmenTest = undefined) {
  const kap = kapazitaet(truck);
  const m = modelOf(truck);

  const belegt = summe(sendungen);
  /* Die Felder heißen wie bei summe(): paletten und kg. Zuvor hieß es
     hier gewicht, gelesen wurde kg — und die Nutzlast stand auf NaN. */
  const dazu = neu ? { paletten: neu.paletten || 0, gewicht: neu.gewicht || 0 }
                   : { paletten: 0, gewicht: 0 };

  const gesamtPal = belegt.paletten + dazu.paletten;
  const gesamtKg = belegt.kg + dazu.gewicht;

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

  const rahmen = rahmenTest !== undefined ? rahmenTest : rahmenVon(truck.model);

  const svgInhalt = rahmen
    ? mitBild(rahmen, plaetze, obenZahl, untenZahl, breite)
    : gezeichnet(plaetze, obenZahl, untenZahl, breite, rand, m);

  const nutzBreite = breite - 2 * rand - 46;
  const nutzY = svgInhalt.hoehe - 22;

  const hoehe = svgInhalt.hoehe + 6;

  return `
  <div class="ladeschema">
    <svg viewBox="0 0 ${breite} ${hoehe}" width="100%" height="${hoehe}"
         role="img" aria-label="Ladefläche von oben">

      ${svgInhalt.markup}

      <!-- Beschriftung -->
      <text x="${rand}" y="12" font-size="10" fill="#303030">${esc(m.name)}</text>
      <text x="${breite - rand}" y="12" font-size="10" fill="${passtPlatz ? '#303030' : '#a02020'}"
            text-anchor="end">${gesamtPal} von ${kap.paletten} Plätzen</text>

      <!-- Nutzlast -->
      <text x="${rand}" y="${hoehe - 2}" font-size="10" fill="#303030">Nutzlast</text>
      <rect x="${rand + 46}" y="${nutzY}" width="${nutzBreite}" height="10"
            fill="#e8e8e8" stroke="#808080" stroke-width="0.5"/>
      <rect x="${rand + 46}" y="${nutzY}"
            width="${Math.min(1, belegt.kg / kap.kg) * nutzBreite}" height="10"
            fill="#4a6ac0"/>
      ${dazu.gewicht ? `
        <rect x="${rand + 46 + Math.min(1, belegt.kg / kap.kg) * nutzBreite}"
              y="${nutzY}"
              width="${Math.min(1 - Math.min(1, belegt.kg / kap.kg), dazu.gewicht / kap.kg) * nutzBreite}"
              height="10" fill="#e0a020" stroke="#806000" stroke-width="0.8"/>` : ''}
      <text x="${breite - rand}" y="${hoehe - 2}" font-size="10"
            fill="${passtLast ? '#303030' : '#a02020'}" text-anchor="end">
        ${(gesamtKg / 1000).toFixed(1)} von ${(kap.kg / 1000).toFixed(1)} t
      </text>
    </svg>

    ${legende(sendungen, neu)}
  </div>`;
}

/* ── Zeichnung mit echtem Fahrzeugbild ─────────────────────────────
   Das Bild liefert Fahrerhaus, Kontur und Räder; die Stellplätze
   werden darüber in die freie Fläche gezeichnet, an der Stelle, die
   für dieses Bild vermessen wurde.

   Liegt das Fahrzeug als eine von mehreren Zeilen auf einem
   gemeinsamen Blatt vor, wird nur die passende Zeile sichtbar
   gemacht. Die Zeilen sind dabei nicht gleich hoch — ein von einer
   KI erzeugtes Bild hält sich nicht an ein starres Raster, jedes
   Fahrzeug bekommt so viel Platz, wie es braucht. Deshalb steht die
   Lage jeder Zeile einzeln in rahmen.grenzen, statt sie aus der
   Zeilenzahl zu errechnen. */
function mitBild(rahmen, plaetze, obenZahl, untenZahl, breite) {
  const bildOben = 16;                              // Platz für die Beschriftung

  const reihenZahl = rahmen.reihen || 1;
  const zeilenIndex = rahmen.index || 0;
  const grenzen = rahmen.grenzen || [0, 1];

  /* Höhe des ganzen Blatts, wäre es auf die Zielbreite skaliert. Eine
     einzelne Zeile ist der Anteil davon zwischen ihren beiden Grenzen. */
  const ganzeHoeheSkaliert = breite / rahmen.seitenverhaeltnis;
  const rowY0 = grenzen[zeilenIndex];
  const rowY1 = grenzen[zeilenIndex + 1];
  const bildHoehe = (rowY1 - rowY0) * ganzeHoeheSkaliert;

  const f = rahmen.flaeche;
  const flX1 = f.x1 * breite, flX2 = f.x2 * breite;
  const flY1 = bildOben + f.y1 * bildHoehe, flY2 = bildOben + f.y2 * bildHoehe;

  const spalten = Math.max(1, obenZahl);
  const zellBreite = (flX2 - flX1) / spalten;
  const zellHoehe = (flY2 - flY1) / 2;

  const kasten = (i, reihe) => {
    const p = plaetze[reihe === 0 ? i : obenZahl + i];
    const x = flX1 + i * zellBreite;
    const y = flY1 + reihe * zellHoehe;
    const pad = Math.min(1.5, zellBreite * 0.06);

    if (!p) {
      return `<rect x="${x + pad}" y="${y + pad}" width="${zellBreite - 2 * pad}"
                    height="${zellHoehe - 2 * pad}"
                    fill="#ffffff" fill-opacity="0.35" stroke="#808080" stroke-width="0.4"/>`;
    }
    return `<rect x="${x + pad}" y="${y + pad}" width="${zellBreite - 2 * pad}"
                  height="${zellHoehe - 2 * pad}"
                  fill="${p.farbe}" fill-opacity="0.88"
                  stroke="${p.neu ? '#806000' : '#303030'}"
                  stroke-width="${p.neu ? 1.2 : 0.6}"/>`;
  };

  const bildMarkup = reihenZahl > 1
    ? bildAusschnitt(rahmen.url, bildOben, bildHoehe, breite, ganzeHoeheSkaliert, rowY0)
    : `<image href="${rahmen.url}" x="0" y="${bildOben}" width="${breite}" height="${bildHoehe}"
              preserveAspectRatio="none"/>`;

  const markup = `
      ${bildMarkup}
      ${Array.from({ length: obenZahl }, (_, i) => kasten(i, 0)).join('')}
      ${Array.from({ length: untenZahl }, (_, i) => kasten(i, 1)).join('')}`;

  return { markup, hoehe: bildOben + bildHoehe + 26 };
}

/* Zähler für eindeutige Kennungen der Beschnittpfade — mehrere
   Ladeschemata können gleichzeitig auf der Seite stehen. */
let beschnittZaehler = 0;

/* Eine Zeile aus einem gemeinsamen Blatt herausschneiden.

   Das ganze Blatt wird auf die Zielbreite skaliert gezeichnet — bei
   dieser Skalierung landet die gewünschte Zeile an einer bestimmten
   Stelle, die sich aus ihrer Startgrenze (rowY0) ergibt. Ein
   Beschnittpfad blendet alles außerhalb der Zeile aus — ohne ihn
   wären Nachbarzeilen oberhalb oder unterhalb sichtbar, denn die
   Zeilen sind unterschiedlich hoch und ein einfacher Ausschnitt nach
   Index träfe die falsche Stelle. */
function bildAusschnitt(url, bildOben, bildHoehe, breite, ganzeHoeheSkaliert, rowY0) {
  const yVersatz = bildOben - rowY0 * ganzeHoeheSkaliert;
  const id = `rahmenAusschnitt${++beschnittZaehler}`;

  return `
      <clipPath id="${id}">
        <rect x="0" y="${bildOben}" width="${breite}" height="${bildHoehe}"/>
      </clipPath>
      <g clip-path="url(#${id})">
        <image href="${url}" x="0" y="${yVersatz}" width="${breite}" height="${ganzeHoeheSkaliert}"
               preserveAspectRatio="none"/>
      </g>`;
}

/* ── Gezeichnete Fassung, wenn kein Bild vorliegt ── */
function gezeichnet(plaetze, obenZahl, untenZahl, breite, rand, m) {
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

  const markup = `
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
      ${Array.from({ length: untenZahl }, (_, i) => kasten(i, 1)).join('')}`;

  return { markup, hoehe: 22 + 2 * (feldHoehe + 2) + 30 };
}

function legende(sendungen, neu) {
  if (!sendungen.length && !neu) return '';

  const eintrag = (farbe, text, paletten) => `
    <span class="lade-legende-punkt">
      <span class="lade-farbe" style="background:${farbe}"></span>
      <span class="lade-name">${esc(text)}</span>
      <span class="muted">${paletten} Pal.</span>
    </span>`;

  /* Namen werden nicht mehr abgeschnitten — die Zeile bricht lieber um.
     „Petersen Verpackun" sah aus wie ein Fehler und war einer. */
  return `
    <div class="lade-legende">
      ${sendungen.map((s, i) => eintrag(
        FARBEN[i % FARBEN.length],
        s.firm?.name || klasseVon(s.klasse).name,
        s.paletten)).join('')}
      ${neu ? eintrag('#e0a020',
        (neu.firm?.name || 'diese Sendung'), neu.paletten) : ''}
    </div>`;
}

/* Kurzfassung ohne Zeichnung — für Listen. */
export function ladeText(truck, sendungen = [], neu = null) {
  const kap = kapazitaet(truck);
  const s = summe([...sendungen, ...(neu ? [neu] : [])]);
  return `${s.paletten}/${kap.paletten} Pal. · ${(s.kg / 1000).toFixed(1)}/${(kap.kg / 1000).toFixed(1)} t`;
}
