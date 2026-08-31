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

/* Die Kurzfassung */
const text = ladeText(t, [sendung]);
ok(/\d+\/\d+ Pal\./.test(text), `Kurzfassung lesbar: ${text}`);

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
