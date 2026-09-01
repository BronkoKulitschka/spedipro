/* Prüft die schematische Ladeansicht.

   Zwei Grenzen gelten gleichzeitig — Platz und Gewicht. Bei schwerem
   Gut ist die Fläche halb leer und der Wagen trotzdem voll. Genau das
   soll das Bild zeigen, deshalb wird hier nachgerechnet.

   Aufruf: node test/ladeschema.mjs
*/

const stub = () => ({
  style: { setProperty() {} }, dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  querySelector: () => null, querySelectorAll: () => [],
  appendChild() {}, remove() {}, addEventListener() {}, focus() {},
  closest: () => null, innerHTML: '', textContent: '',
});
globalThis.document = {
  getElementById: () => null, createElement: stub, querySelector: () => null,
  querySelectorAll: () => [], addEventListener() {}, body: stub(),
  documentElement: { style: { setProperty() {} },
                     classList: { add() {}, remove() {}, toggle() {} } },
  activeElement: null, visibilityState: 'visible',
};
globalThis.window = { addEventListener() {}, innerWidth: 1200, isSecureContext: true };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.Image = class { set src(v) {} };
globalThis.L = new Proxy(function () {}, {
  get: () => globalThis.L, apply: () => globalThis.L, construct: () => globalThis.L,
});

const state = await import('../src/state.js');
const { CITIES } = await import('../src/data/cities.js');
const { kapazitaet } = await import('../src/sim/goods.js');
const { ladeBild, ladeText } = await import('../src/ui/ladeschema.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
const t = S.trucks[0];
const kap = kapazitaet(t);

console.log('\nLadeschema\n');
console.log(`  Fahrzeug: ${state.modelOf(t).name}, ${kap.paletten} Plätze, `
          + `${(kap.kg / 1000).toFixed(1)} t\n`);

/* Leer */
const leer = ladeBild(t, [], null);
ok(leer.includes('<svg'), 'Das Bild entsteht');
const felder = (leer.match(/<rect/g) || []).length;
ok(felder >= kap.paletten, `Mindestens ${kap.paletten} Flächen gezeichnet (${felder})`);
ok(leer.includes(`0 von ${kap.paletten} Plätzen`), 'Leer werden null Plätze gemeldet');

/* Eine Sendung */
const sendung = { klasse: 'stueckgut', paletten: 2, gewicht: 800,
                  firm: { name: 'Testkunde' } };
const eins = ladeBild(t, [], sendung);
ok(eins.includes(`2 von ${kap.paletten} Plätzen`), 'Die neue Sendung wird mitgezählt');
ok(eins.includes('#e0a020'), 'Die neue Sendung ist hervorgehoben');
ok(eins.includes('Testkunde'), 'Die Legende nennt den Kunden');

/* Mehrere Sendungen bekommen verschiedene Farben */
const zwei = ladeBild(t, [sendung], { ...sendung, firm: { name: 'Zweiter' } });
ok(zwei.includes('#4a6ac0') && zwei.includes('#e0a020'),
   'Sendungen werden unterschieden');

/* Überladung nach Platz */
const zuviel = ladeBild(t, [], { klasse: 'moebel', paletten: kap.paletten + 5,
                                 gewicht: 500, firm: { name: 'Zuviel' } });
ok(zuviel.includes('#a02020'), 'Zu viele Paletten werden rot gemeldet');

/* Überladung nach Gewicht — bei halb leerer Fläche */
const schwer = ladeBild(t, [], { klasse: 'steine', paletten: 2,
                                 gewicht: kap.kg * 2, firm: { name: 'Schwer' } });
ok(schwer.includes('#a02020'), 'Zu viel Gewicht wird rot gemeldet');
ok(schwer.includes(`2 von ${kap.paletten} Plätzen`),
   'Dabei ist die Fläche noch fast leer — genau der Punkt');

/* Keine Rechenfehler im Bild — das ist der häufigste stille Fehler:
   Ein Feld heißt anders als gelesen, und es steht NaN im Bild. */
const proben = [
  ladeBild(t, [], null),
  ladeBild(t, [], sendung),
  ladeBild(t, [sendung], { ...sendung, firm: { name: 'Zweiter' } }),
  ladeBild(t, [sendung, sendung], null),
];
ok(proben.every(p => !/NaN|undefined|Infinity/.test(p)),
   'Keine Rechenfehler in der Zeichnung');

/* Lange Namen werden nicht abgeschnitten */
const langerName = 'Petersen Verpackungen & Söhne KG';
const lang = ladeBild(t, [], { ...sendung, firm: { name: langerName } });
ok(lang.includes('Petersen Verpackungen'),
   'Lange Kundennamen bleiben vollständig');

/* Ein NaN-Fehler: das 'dazu'-Objekt wurde mit dem Schlüssel 'kg'
   erzeugt, aber unter 'gewicht' gelesen — belegt.kg + undefined ergab
   NaN in der Nutzlastanzeige. */
const probe = ladeBild(t, [], { klasse: 'papier', paletten: 1, gewicht: 800,
                                 firm: { name: 'Petersen Verpackungen & Söhne' } });
ok(!probe.includes('NaN'), 'Keine NaN-Anzeige bei der Nutzlast');
ok(probe.includes('0.8 von'), 'Die Nutzlast wird richtig berechnet');

/* Die Kurzfassung */
const text = ladeText(t, [sendung]);
ok(/\d+\/\d+ Pal\./.test(text), `Kurzfassung lesbar: ${text}`);

/* ── Echtes Fahrzeugbild ─────────────────────────────────────────
   Ein Bild je Klasse ersetzt die gezeichnete Fassung, sobald es
   vorliegt. Die Stellplätze müssen weiterhin über das Bild gezeichnet
   werden — nicht das Bild ersetzt sie, es liegt nur darunter. */
console.log('\nEchtes Fahrzeugbild\n');

globalThis.Image = class {
  set src(v) {
    setTimeout(() => {
      if (v.includes('rahmen-fern.png')) this.onload?.();
      else this.onerror?.();
    }, 0);
  }
};

const fernTruck = { ...t, model: 'fern' };
ladeBild(fernTruck, [], null);           // löst das Laden an
await new Promise(r => setTimeout(r, 20));

const mitRahmen = ladeBild(fernTruck, [],
  { klasse: 'stueckgut', paletten: 3, gewicht: 1200, firm: { name: 'Testkunde' } });
ok(mitRahmen.includes('<image'), 'Ein echtes Bild wird eingebunden, sobald vorhanden');
ok(mitRahmen.includes('rahmen-fern.png'), 'Die richtige Datei für diese Klasse');
ok((mitRahmen.match(/<rect/g) || []).length >= 3, 'Die Stellplätze bleiben über dem Bild sichtbar');

/* Alle elf Klassen haben inzwischen eigene Zeilen; jumbo braucht daher
   keinen Ersatz mehr — es zeigt jetzt sein eigenes Sattelzug-Blatt. */
const jumboTruck = { ...t, model: 'jumbo' };
globalThis.Image = class {
  set src(v) { setTimeout(() => { if (v.includes('rahmen-sattelzug')) this.onload?.(); else this.onerror?.(); }, 0); }
};
ladeBild(jumboTruck, [], null);
await new Promise(r => setTimeout(r, 20));
const eigenesBild = ladeBild(jumboTruck, [], { klasse: 'stueckgut', paletten: 2, gewicht: 800, firm: { name: 'X' } });
ok(eigenesBild.includes('rahmen-sattelzug.png'),
   'jumbo zeigt inzwischen sein eigenes Blatt (sattelzug)');

const kompaktTruck = { ...t, model: 'kompakt' };
const ohneRahmen = ladeBild(kompaktTruck, [], { klasse: 'stueckgut', paletten: 2, gewicht: 500, firm: { name: 'Y' } });
ok(!ohneRahmen.includes('<image'), 'Ganz ohne Bild und ohne Ersatz bleibt es bei der Zeichnung');

/* ── Mehrere Klassen auf einem gemeinsamen Blatt ────────────────
   Statt vieler Einzelbilder teilen sich ähnliche Klassen ein Blatt,
   in Zeilen. Der Beschnitt muss dafür sorgen, dass nur die passende
   Zeile sichtbar wird — nicht die Nachbarn darüber oder darunter. */
console.log('\nMehrere Klassen auf einem Blatt\n');

const blattFake = {
  url: './assets/rahmen-probe.png',
  reihen: 4,
  index: 2,
  seitenverhaeltnis: 2.2,
  grenzen: [0, 0.25, 0.5, 0.75, 1],      // gleich hohe Zeilen, zu Testzwecken
  flaeche: { x1: 0.3, x2: 0.9, y1: 0.2, y2: 0.7 },
};

const geschnitten = ladeBild(t, [],
  { klasse: 'stueckgut', paletten: 2, gewicht: 500, firm: { name: 'Z' } },
  blattFake);

ok(geschnitten.includes('<clipPath'), 'Ein Beschnittpfad wird erzeugt');
ok(geschnitten.includes('rahmen-probe.png'), 'Die Blattdatei wird verwendet');
ok(geschnitten.includes('clip-path="url(#'), 'Der Beschnitt wird auf das Bild angewendet');

/* Zwei verschiedene Zeilenindizes müssen zu unterschiedlichem
   senkrechten Versatz führen — sonst zeigten sie dieselbe Zeile. */
const zeile0 = ladeBild(t, [], null, { ...blattFake, index: 0 });
const zeile3 = ladeBild(t, [], null, { ...blattFake, index: 3 });
const yWert = html => html.match(/<image[^>]*\sy="(-?[\d.]+)"/)?.[1];
ok(yWert(zeile0) !== yWert(zeile3),
   `Unterschiedliche Zeilen ergeben unterschiedlichen Versatz (${yWert(zeile0)} ≠ ${yWert(zeile3)})`);

/* Ein einzeiliges Blatt (reihen: 1, wie bisher der Sattelzug) braucht
   keinen Beschnitt — das wäre unnötiger Aufwand. */
const einzeilig = ladeBild(t, [], null,
  { url: './assets/rahmen-fern.png', reihen: 1, index: 0,
    seitenverhaeltnis: 3, grenzen: [0, 1], flaeche: blattFake.flaeche });
ok(!einzeilig.includes('<clipPath'), 'Bei nur einer Zeile entfällt der Beschnitt');

/* ── Ungleich hohe Zeilen ──────────────────────────────────────
   Ein von einer KI erzeugtes Blatt hält keine gleichmäßigen
   Zeilenhöhen ein. Der erste Ansatz (Bildhöhe geteilt durch
   Zeilenzahl) schnitt mitten durch die nächste Fahrerkabine —
   dieser Fall bildet genau das nach: eine kurze erste Zeile, eine
   deutlich höhere zweite. */
console.log('\nUngleich hohe Zeilen\n');

const ungleich = {
  url: './assets/rahmen-probe2.png',
  reihen: 2,
  seitenverhaeltnis: 2,           // Breite/Gesamthöhe des ganzen Blatts
  grenzen: [0, 0.2, 1],            // erste Zeile schmal, zweite breit
  flaeche: { x1: 0.3, x2: 0.9, y1: 0.1, y2: 0.9 },
};

const zeileSchmal = ladeBild(t, [], null, { ...ungleich, index: 0, flaeche: ungleich.flaeche });
const zeileBreit = ladeBild(t, [], null, { ...ungleich, index: 1, flaeche: ungleich.flaeche });

const versatzWert = html => Number(html.match(/<image[^>]*\sy="(-?[\d.]+)"/)?.[1]);
const hoeheWert = html => Number(html.match(/<clipPath[^>]*>\s*<rect[^>]*height="([\d.]+)"/)?.[1]);

ok(hoeheWert(zeileSchmal) < hoeheWert(zeileBreit),
   `Die schmale Zeile bekommt weniger Höhe als die breite (${hoeheWert(zeileSchmal).toFixed(1)} < ${hoeheWert(zeileBreit).toFixed(1)})`);

/* Bei einer naiven Gleichverteilung (Höhe / Zeilenzahl) läge der
   Versatz der zweiten Zeile bei der Hälfte der Bildhöhe. Mit der
   echten 20/80-Aufteilung muss er stattdessen bei einem Fünftel
   liegen — das ist der Fehler, der beim ersten Versuch auftrat. */
const bildOben = 16;
const ganzeHoehe = 320 / ungleich.seitenverhaeltnis;
const erwarteterVersatzZeile1 = bildOben - 0.2 * ganzeHoehe;
ok(Math.abs(versatzWert(zeileBreit) - erwarteterVersatzZeile1) < 0.1,
   `Der Versatz der zweiten Zeile berücksichtigt ihre echte Startgrenze (${versatzWert(zeileBreit).toFixed(1)})`);

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
