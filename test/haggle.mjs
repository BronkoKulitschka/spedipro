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
  id, kind: 'spot', fee: 1000, grundpreis: 1000,
  firm: { name: 'Testkunde ' + id, km: 100 },
});

console.log('\nPreisverhandlung\n');

/* Der genannte Preis geht immer durch — bei jeder Anfrage. */
let alleDurch = true;
for (let i = 0; i < 40; i++) {
  if (H.reaktion(mach('probe' + i), 1.0).art !== 'angenommen') alleDurch = false;
}
ok(alleDurch, 'Der genannte Preis wird immer angenommen');

/* Die Grenze bewegt sich in einem vernünftigen Rahmen */
const grenzen = [];
for (let i = 0; i < 60; i++) grenzen.push(H.schmerzgrenze(mach('s' + i)));
const min = Math.min(...grenzen), max = Math.max(...grenzen);
ok(min >= 1.02 && max <= 1.35,
   `Schmerzgrenze zwischen ×${min.toFixed(2)} und ×${max.toFixed(2)}`);

/* Übertreibung wird abgelehnt */
ok(H.reaktion(mach(), 1.45).art === 'abgelehnt', 'Maßlose Forderung wird abgelehnt');

/* Ansehen und Marktlage wirken in die richtige Richtung */
S.rep = 20; S.market.index = 0.85;
const schwach = H.schmerzgrenze(mach('gleich'));
S.rep = 90; S.market.index = 1.30;
const stark = H.schmerzgrenze(mach('gleich'));
ok(stark > schwach + 0.1,
   `Ansehen und knapper Markt helfen (×${schwach.toFixed(2)} → ×${stark.toFixed(2)})`);

/* Die Einschätzung passt zur Reaktion */
S.rep = 50; S.market.index = 1.0;
const probe = mach('einschaetzung');
let stimmig = true;
for (let f = 1.0; f <= 1.45; f += 0.01) {
  const a = H.aussicht(probe, f).stufe;
  const r = H.reaktion(probe, f).art;
  if (a === 'sicher' && r !== 'angenommen') stimmig = false;
  if (a === 'zuviel' && r !== 'abgelehnt') stimmig = false;
}
ok(stimmig, 'Die Einschätzung sagt die Reaktion richtig voraus');

/* Verhandeln verändert das Angebot */
S.offers = [mach('echt')];
const vorher = S.offers[0].fee;
H.verhandle('echt', 1.05);
ok(S.offers[0]?.fee >= vorher, `Erfolgreiche Verhandlung erhöht den Preis (${vorher} → ${S.offers[0]?.fee})`);
ok(S.offers[0]?.verhandelt === true, 'Die Anfrage ist als verhandelt vermerkt');

/* Zweiter Versuch wird abgelehnt */
ok(H.verhandle('echt', 1.2) === null, 'Kein zweites Verhandeln an derselben Anfrage');

/* Übertreibung kostet die Anfrage */
S.offers = [mach('weg')];
const repVorher = S.rep;
H.verhandle('weg', 1.45);
ok(S.offers.length === 0, 'Nach einer Ablehnung ist die Anfrage weg');
ok(S.rep < repVorher, 'Und das Ansehen leidet ein wenig');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
