/* Prüft, dass die Auftragsbörse zum Fuhrpark passt.

   Der Fehler, den dieser Prüfstein abdeckt: Richten sich alle Sendungen
   nach dem größten Fahrzeug, bekommt der Sattelzug jeden Auftrag und
   alles Kleinere steht still. Das fällt beim Spielen erst nach Stunden
   auf — hier in Sekunden.

   Aufruf: node test/market.mjs
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
const staff = await import('../src/sim/staff.js');
const { inventFirms } = await import('../src/data/invent.js');
const { hubsFor } = await import('../src/data/hubs.js');
const { refillOffers } = await import('../src/sim/orders.js');
const { initPartners } = await import('../src/sim/partners.js');
const { passt } = await import('../src/sim/goods.js');
const { buyTruck } = await import('../src/sim/fleet.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;
S.firms = inventFirms(S.depot, 60);
S.hubs = hubsFor(S.depot);
S.partners = initPartners();

const ersterFahrer = staff.neuerFahrer(true);
S.drivers.push(ersterFahrer);
S.trucks[0].driverId = ersterFahrer.id;

console.log('\nAuftragsbörse und Fuhrpark\n');

/* Ein Fahrzeug: fast alles muss fahrbar sein */
refillOffers();
let fahrbar = S.offers.filter(o => passt(S.trucks[0], [], o).ok).length;
ok(fahrbar / S.offers.length >= 0.6,
   `Mit einem Fahrzeug sind ${fahrbar} von ${S.offers.length} Sendungen fahrbar`);

/* Gemischter Fuhrpark */
S.money = 500000;
S.level = 6;
for (const modell of ['fern', 'verteiler', 'siebenhalb']) {
  buyTruck(modell, false);
  const d = staff.neuerFahrer(true);
  S.drivers.push(d);
  const ohne = S.trucks.find(t => !t.driverId);
  if (ohne) ohne.driverId = d.id;
}

/* Mehrfach auffüllen, damit sich die Mischung zeigt */
S.offers = [];
for (let i = 0; i < 20; i++) refillOffers();

ok(S.offers.length >= 12,
   `Die Börse wächst mit dem Fuhrpark (${S.offers.length} Angebote bei ${S.trucks.length} Fahrzeugen)`);

const jeLkw = S.trucks.map(t => ({
  nr: t.nr,
  name: state.modelOf(t).name,
  zahl: S.offers.filter(o => passt(t, [], o).ok).length,
}));

for (const e of jeLkw) {
  console.log(`      LKW ${e.nr} ${e.name.padEnd(16)} ${e.zahl} Sendungen`);
}

ok(jeLkw.every(e => e.zahl > 0),
   'Jedes Fahrzeug findet Arbeit');

const kleinstes = jeLkw.reduce((a, b) => (a.zahl < b.zahl ? a : b));
ok(kleinstes.zahl >= 1,
   `Auch das schlechtest bediente Fahrzeug hat genug (${kleinstes.name}: ${kleinstes.zahl})`);

/* Unfahrbares wird ausgesondert */
S.offers.push({
  id: 'zugross', kind: 'spot', klasse: 'steine',
  paletten: 30, gewicht: 45000, fee: 9999, estKm: 100,
  firm: { name: 'Unmöglich GmbH', lat: S.depot.lat + 1, lon: S.depot.lon, km: 100 },
});
for (let i = 0; i < 4; i++) refillOffers();
ok(!S.offers.some(o => o.id === 'zugross'),
   'Dauerhaft unfahrbare Sendungen werden ausgesondert');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
