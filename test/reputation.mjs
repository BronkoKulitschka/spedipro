/* Prüft, dass das Ansehen in beide Richtungen geht.

   Lange konnte es nur steigen — damit war es eine Frage der Zeit statt
   eine Frage der Leistung. Jetzt lässt es sich auch verspielen.

   Aufruf: node test/reputation.mjs
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
const { REP } = await import('../src/config.js');
const { addRep, repMul, repText } = await import('../src/sim/market.js');
const { inventFirms } = await import('../src/data/invent.js');
const H = await import('../src/sim/haggle.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;
S.firms = inventFirms(S.depot, 20);

console.log('\nAnsehen\n');

/* Grundverhalten */
S.rep = 50;
addRep(5);
ok(S.rep === 55, 'Ansehen steigt');
addRep(-10);
ok(S.rep === 45, 'Ansehen sinkt');

S.rep = REP.MAX;
addRep(20);
ok(S.rep === REP.MAX, `Nach oben bei ${REP.MAX} begrenzt`);

S.rep = REP.MIN;
addRep(-50);
ok(S.rep === REP.MIN, `Nach unten bei ${REP.MIN} begrenzt — niemand fällt ins Bodenlose`);

/* Die Wirkung auf die Preise folgt mit */
S.rep = REP.MIN;
const schlecht = repMul();
S.rep = REP.MAX;
const gut = repMul();
ok(gut > schlecht,
   `Der Preisfaktor folgt (×${schlecht.toFixed(2)} bis ×${gut.toFixed(2)})`);

/* Alle Rückgänge sind negativ und maßvoll */
const rueckgaenge = {
  CONTRACT_FAIL: REP.CONTRACT_FAIL,
  CONTRACT_WEAK: REP.CONTRACT_WEAK,
  HAGGLE_BREAK: REP.HAGGLE_BREAK,
  BREAKDOWN: REP.BREAKDOWN,
  IDLE_DAY: REP.IDLE_DAY,
};
ok(Object.values(rueckgaenge).every(v => v < 0),
   'Alle Rückgänge sind negativ');
ok(Object.values(rueckgaenge).every(v => v > -6),
   'Kein Einzelereignis reißt den Ruf ein');

for (const [name, wert] of Object.entries(rueckgaenge)) {
  console.log(`      ${name.padEnd(14)} ${wert}`);
}

/* Ein abgebrochenes Gespräch kostet Ansehen */
S.rep = 60;
S.offers = [{
  id: 'x', kind: 'spot', fee: 1000, grundpreis: 1000, klasse: 'stueckgut',
  paletten: 4, gewicht: 1600, estKm: 80,
  firm: { name: 'Testkunde', km: 80, lat: 53, lon: 10 },
}];
const g = H.beginne('x');
H.fordern(g, 'kuehn');
ok(S.rep < 60, `Ein abgebrochenes Gespräch kostet Ansehen (60 → ${S.rep.toFixed(1)})`);

/* Wie lange dauert Erholung? */
S.rep = 40;
let tage = 0;
while (S.rep < 50 && tage < 400) { addRep(REP.PER_LOAD * 6); tage++; }
ok(tage < 30,
   `Bei sechs Zustellungen am Tag ist ein Rückgang von zehn Punkten in ${tage} Tagen aufgeholt`);

/* Und wie schnell verfällt er bei Untätigkeit? */
S.rep = 50;
tage = 0;
while (S.rep > 40 && tage < 400) { addRep(REP.IDLE_DAY); tage++; }
ok(tage > 20,
   `Untätigkeit zehrt langsam: ${tage} Tage für zehn Punkte`);

console.log(`\n  Beispiel: bei ${Math.round(S.rep)} Punkten gilt der Betrieb als „${repText()}"`);
console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
