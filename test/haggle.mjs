/* Prüft die Preisverhandlung.

   Wichtig ist nicht nur, dass gerechnet wird, sondern dass die Kurve
   sich richtig anfühlt: Der genannte Preis muss immer durchgehen,
   maßvolles Fordern risikolos sein, und erst echte Übertreibung darf
   die Anfrage kosten.

   Aufruf: node test/haggle.mjs
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
const { inventFirms } = await import('../src/data/invent.js');
const H = await import('../src/sim/haggle.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;
S.firms = inventFirms(S.depot, 20);

const mach = (id = 'a1') => ({
  id, kind: 'spot', fee: 1000, grundpreis: 1000, klasse: 'stueckgut',
  paletten: 6, gewicht: 2400, estKm: 100,
  firm: { name: 'Testkunde ' + id, km: 100, lat: 53, lon: 10 },
});

console.log('\nPreisverhandlung\n');

/* Der genannte Preis geht immer durch — bei jeder Anfrage. */
let alleDurch = true;
for (let i = 0; i < 40; i++) {
  S.offers = [mach('probe' + i)];
  const g = H.beginne('probe' + i);
  if (!g) { alleDurch = false; continue; }
  if (g.grenze < 1.0) alleDurch = false;
}
ok(alleDurch, 'Der genannte Preis liegt immer innerhalb der Schmerzgrenze');

/* Die Grenze bewegt sich in einem vernünftigen Rahmen */
const grenzen = [];
for (let i = 0; i < 60; i++) {
  S.offers = [mach('s' + i)];
  grenzen.push(H.schmerzgrenze(S.offers[0]));
}
const min = Math.min(...grenzen), max = Math.max(...grenzen);
ok(min >= 1.02 && max <= 1.35,
   `Schmerzgrenze zwischen ×${min.toFixed(2)} und ×${max.toFixed(2)}`);

/* Ansehen und Marktlage wirken in die richtige Richtung */
S.offers = [mach('gleich')];
S.rep = 20; S.market.index = 0.85;
const schwach = H.schmerzgrenze(S.offers[0]);
S.rep = 90; S.market.index = 1.30;
const stark = H.schmerzgrenze(S.offers[0]);
ok(stark > schwach + 0.1,
   `Ansehen und knapper Markt helfen (×${schwach.toFixed(2)} → ×${stark.toFixed(2)})`);

S.rep = 50; S.market.index = 1.0;

/* ── Das Gespräch ── */
S.offers = [mach('gespraech')];
let g = H.beginne('gespraech');
ok(!!g && g.offen, 'Ein Gespräch lässt sich beginnen');
ok(g.verlauf.length === 1, 'Der Kunde eröffnet');
ok(g.runde === 1, `Runde ${g.runde} von ${H.MAX_RUNDEN}`);

const vorGrenze = g.grenze;
const moeglich = H.offeneArgumente(g).filter(a => a.verfuegbar && !a.genutzt);
ok(moeglich.length > 0, `${moeglich.length} Argumente stehen zur Verfügung`);

H.argumentieren(g, moeglich[0].key);
ok(g.grenze > vorGrenze,
   `Ein Argument stimmt milder (×${vorGrenze.toFixed(2)} → ×${g.grenze.toFixed(2)})`);
ok(g.verlauf.length === 3, 'Argument und Antwort stehen im Verlauf');
ok(g.runde === 1, 'Ein Argument kostet keine Runde');

H.argumentieren(g, moeglich[0].key);
ok(g.verlauf.length === 3, 'Dasselbe Argument wirkt nur einmal');

/* Maßvoll fordern geht durch */
S.offers = [mach('massvoll')];
g = H.beginne('massvoll');
H.fordern(g, 'wenig');
ok(g.ergebnis === 'angenommen', 'Eine maßvolle Forderung wird angenommen');
ok(g.fee > 1000, `Der Preis steigt auf ${g.fee}`);

H.annehmen(g);
ok(S.offers[0].fee === g.fee, 'Das Angebot trägt den ausgehandelten Preis');
ok(S.offers[0].verhandelt === true, 'Die Anfrage ist als verhandelt vermerkt');
ok(H.beginne('massvoll') === null, 'Kein zweites Gespräch zur selben Anfrage');

/* Überziehen bricht ab */
S.offers = [mach('zuviel')];
g = H.beginne('zuviel');
const repVorher = S.rep;
H.fordern(g, 'kuehn');
ok(g.ergebnis === 'abgebrochen', 'Eine überzogene Forderung bricht das Gespräch ab');
ok(S.offers.length === 0, 'Die Fracht ist weg');
ok(S.rep < repVorher, 'Und das Ansehen leidet ein wenig');

/* Nach drei Runden ist Schluss */
S.offers = [mach('runden')];
g = H.beginne('runden');
let schutz = 0;
while (g.offen && schutz++ < 10) H.fordern(g, 'mittel');
ok(!g.offen, `Das Gespräch endet nach höchstens ${H.MAX_RUNDEN} Runden`);

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
