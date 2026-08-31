/* Prüft die Abwicklung von Rahmenverträgen.

   Der Fehler, den dieser Prüfstein abdeckt: Lieferte ein Vertrag immer
   an dieselbe Firma, stand das Fahrzeug nach der ersten Fahrt am Ziel —
   und lieferte dort alle weiteren Sendungen ohne einen einzigen
   Kilometer ab. Ein Rahmenvertrag ist deshalb eine Relation mit zwei
   Enden: Beim Verlader wird geladen, beim Empfänger entladen.

   Aufruf: node test/contracts.mjs
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
const { refillContractOffers, signContract } = await import('../src/sim/contracts.js');
const { dispatch, moveTrucks } = await import('../src/sim/fleet.js');
const { passt } = await import('../src/sim/goods.js');
const { haversine } = await import('../src/util.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;
S.firms = inventFirms(S.depot, 50);
S.hubs = hubsFor(S.depot);
S.partners = initPartners();

const fahrer = staff.neuerFahrer(true);
S.drivers.push(fahrer);
S.trucks[0].driverId = fahrer.id;

console.log('\nRahmenverträge\n');

refillContractOffers();
ok(S.contractOffers.length > 0, `${S.contractOffers.length} Ausschreibungen`);

/* Jede Ausschreibung hat zwei Enden */
ok(S.contractOffers.every(o => o.empfaenger && o.empfaenger.name !== o.firm.name),
   'Jede Ausschreibung nennt Verlader und Empfänger');

const abstaende = S.contractOffers.map(o => haversine(o.firm, o.empfaenger));
ok(abstaende.every(km => km > 20),
   `Verlader und Empfänger liegen auseinander (${Math.round(Math.min(...abstaende))}–`
   + `${Math.round(Math.max(...abstaende))} km)`);

/* Einen fahrbaren Vertrag unterschreiben */
const t = S.trucks[0];

/* Die Ausschreibungen richten sich am Fuhrpark aus, treffen ihn aber
   nicht immer. Ein paarmal auffrischen, bis etwas Fahrbares dabei ist —
   sonst hinge der Prüfstein am Zufall. */
let passend = null;
for (let versuch = 0; versuch < 12 && !passend; versuch++) {
  passend = S.contractOffers.find(o =>
    passt(t, [], { klasse: o.klasse, paletten: o.paletten, gewicht: o.gewicht }).ok);
  if (!passend) { S.contractOffers = []; refillContractOffers(); }
}

if (!passend) {
  ok(false, 'Kein fahrbarer Vertrag in der Ausschreibung');
} else {
  signContract(passend.id);
  const c = S.contracts[0];
  ok(!!c, `Vertrag mit ${c.firm.name} unterschrieben`);

  /* Fünf Sendungen abwickeln */
  const kmVorher = S.stats.km;
  let gefahren = 0;

  for (let n = 1; n <= 5; n++) {
    refillOffers();
    const sendung = S.offers.find(o => o.contractId === c.id);
    if (!sendung) break;

    if (n === 1) {
      ok(!!sendung.abholung && sendung.abholung.name !== sendung.firm.name,
         'Die Sendung hat einen eigenen Abholort');
    }

    const vorher = S.stats.km;
    await dispatch(sendung.id, t.nr, { sync: true });

    let schutz = 0;
    while ((t.phase !== 'idle' || t.restMin > 0) && schutz++ < 8000) moveTrucks(5);
    gefahren += S.stats.km - vorher;
  }

  ok(c.done >= 4, `${c.done} von ${c.total} Sendungen erledigt`);
  ok(gefahren > 100,
     `Dafür wurden ${Math.round(gefahren)} km gefahren — nicht null`);
  ok(S.stats.km > kmVorher, 'Die Kilometer zählen mit');
}

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
