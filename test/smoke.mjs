/* Rauchtest ohne Browser.

   Spielt einige Tage durch und prüft, dass die tragenden Teile
   zusammenpassen: Zustand, Auftragsbörse, Verträge, Fahrten, Kassenbuch.

   Aufruf:  node test/smoke.mjs
*/

/* ── Minimaler Ersatz für die Browserumgebung ── */
const stub = () => ({
  style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){} },
  querySelector: () => stub(), querySelectorAll: () => [],
  appendChild(){}, remove(){}, addEventListener(){}, focus(){},
  innerHTML: '', textContent: '',
});
globalThis.document = {
  getElementById: () => null, createElement: stub,
  addEventListener(){}, activeElement: null,
};
globalThis.window = { addEventListener(){}, innerWidth: 1200, innerHeight: 800 };

/* ── Prüfhilfen ── */
let fehler = 0;
const ok = (bedingung, text) => {
  console.log(`${bedingung ? '  ✓' : '  ✗'} ${text}`);
  if (!bedingung) fehler++;
};

/* ── Module laden ── */
/* Namensraum statt Destrukturierung: S wird in resetState neu gesetzt,
   eine kopierte Referenz würde auf den alten Wert zeigen. */
const state = await import('../src/state.js');
const { resetState, day, ledgerSums, driveStatus } = state;
const { inventFirms }        = await import('../src/data/invent.js');
const { refillOffers }       = await import('../src/sim/orders.js');
const { initPartners }       = await import('../src/sim/partners.js');
const { refillContractOffers, signContract } = await import('../src/sim/contracts.js');
const { dispatch, moveTrucks, buyTruck } = await import('../src/sim/fleet.js');
const { driftMarket }        = await import('../src/sim/market.js');
const { DEPOTS }             = await import('../src/config.js');

/* ── Aufbau ── */
console.log('\nAufbau');
resetState(DEPOTS[0]);
const S = state.S;
S.firms = inventFirms(S.depot, 40);
S.partners = initPartners();
refillContractOffers();
refillOffers();

ok(S.market && typeof S.market.index === 'number', 'Marktlage vorhanden');
ok(typeof S.rep === 'number', 'Ansehen vorhanden');
ok(Array.isArray(S.ledger), 'Kassenbuch vorhanden');
ok(S.offers.length > 0, `Auftragsbörse gefüllt (${S.offers.length})`);
ok(S.contractOffers.length > 0, `Ausschreibungen vorhanden (${S.contractOffers.length})`);
ok(S.trucks.length === 1 && S.trucks[0].pos, 'Ein LKW mit Standort');

/* ── Vertrag unterschreiben ── */
console.log('\nVertrag');
const vorher = S.contracts.length;
signContract(S.contractOffers[0].id);
ok(S.contracts.length === vorher + 1, 'Vertrag angenommen');
refillOffers();
ok(S.offers.some(o => o.kind === 'vertrag'), 'Vertragssendung in der Börse');

/* ── Fahrzeug kaufen ── */
console.log('\nFuhrpark');
const geld = S.money;
ok(buyTruck('fern', false) === true, 'Fernverkehr gekauft');
ok(S.money < geld, 'Kaufpreis gebucht');
ok(S.ledger.some(e => e.cat === 'Fahrzeugkauf'), 'Buchung im Kassenbuch');

/* ── Ein paar Tage fahren ── */
console.log('\nBetrieb über zehn Tage');
S.silent = true;                       // ohne Netz und ohne Protokollflut
for (const t of S.trucks) t.auto = true;

const SCHRITT = 15;
for (let tag = 0; tag < 10; tag++) {
  const bisher = day();
  while (day() === bisher) {
    S.minutes += SCHRITT;
    moveTrucks(SCHRITT);
  }
  driftMarket();
  refillOffers();
}
S.silent = false;

ok(S.stats.tours > 0, `Zustellungen erfolgt (${S.stats.tours})`);
ok(S.stats.km > 0, `Kilometer gefahren (${Math.round(S.stats.km)})`);
ok(S.ledger.some(e => e.cat === 'Fracht' || e.cat === 'Vertragsfracht'),
   'Frachterlöse gebucht');
ok(S.ledger.some(e => e.cat === 'Diesel'), 'Dieselkosten gebucht');
ok(S.rep > 50, `Ansehen gestiegen (${S.rep.toFixed(1)})`);
ok(S.trucks.every(t => t.today <= 9 * 60 + SCHRITT),
   'Tageslenkzeit nirgends überschritten');
ok(S.trucks.every(t => driveStatus(t).code), 'Fahrerstatus lesbar');

const summe = ledgerSums();
ok(Math.abs(summe.saldo - (S.money - 50000)) < 1,
   'Kassenbuch stimmt mit dem Kontostand überein');
/* Obergrenze zur Plausibilität, keine Balancevorgabe: mit neun Stunden
   Lenkzeit und einer Stunde Rampenzeit je Sendung sind mehr als ein
   Dutzend Zustellungen am Tag rechnerisch nicht möglich. */
ok(S.stats.tours / 10 / S.trucks.length < 12,
   `Zustellungen je LKW und Tag plausibel (${(S.stats.tours / 10 / S.trucks.length).toFixed(1)})`);

console.log('\nStand nach zehn Tagen');
console.log(`  Kasse      ${Math.round(S.money)} €`);
console.log(`  Einnahmen  ${Math.round(summe.ein)} €`);
console.log(`  Ausgaben   ${Math.round(summe.aus)} €`);
console.log(`  Fahrten    ${S.stats.tours}`);
console.log(`  Kilometer  ${Math.round(S.stats.km)}`);
console.log(`  Ansehen    ${S.rep.toFixed(1)}`);

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.\n` : '\nAlles in Ordnung.\n');
process.exit(fehler ? 1 : 0);
