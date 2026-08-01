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
const { dispatch, moveTrucks, buyTruck, distanceFrom, startTour } = await import('../src/sim/fleet.js');
const { kapazitaet, summe, passt } = await import('../src/sim/goods.js');
const { takeOffer } = await import('../src/sim/orders.js');
const { driftMarket }        = await import('../src/sim/market.js');
const { DEPOTS, LEVELS }     = await import('../src/config.js');
const prog = await import('../src/sim/progress.js');

/* ── Aufbau ── */
console.log('\nAufbau');
resetState(DEPOTS[0]);
const S = state.S;
S.firms = inventFirms(S.depot, 40);
const { hubsFor } = await import('../src/data/hubs.js');
S.hubs = hubsFor(S.depot);
S.partners = initPartners();
refillContractOffers();
refillOffers();

ok(S.market && typeof S.market.index === 'number', 'Marktlage vorhanden');
ok(typeof S.rep === 'number', 'Ansehen vorhanden');
ok(Array.isArray(S.ledger), 'Kassenbuch vorhanden');
ok(S.offers.length > 0, `Auftragsbörse gefüllt (${S.offers.length})`);
ok(S.hubs.length > 20, `Umschlagpunkte geladen (${S.hubs.length})`);
ok(S.offers.every(o => o.paletten > 0 && o.gewicht > 0), 'Alle Sendungen haben Menge und Gewicht');

const kap = kapazitaet(S.trucks[0]);
ok(kap.paletten > 0 && kap.kg > 0, `Kapazität lesbar (${kap.paletten} Pal., ${kap.kg} kg)`);
/* Eine gezielt überladene Sendung muss abgelehnt werden. */
const zuGross = { klasse: 'steine', paletten: 30, gewicht: 45000 };
ok(passt(S.trucks[0], [], zuGross).ok === false,
   `Überladung wird abgelehnt (${passt(S.trucks[0], [], zuGross).grund})`);
const kuehl = { klasse: 'kuehlgut', paletten: 2, gewicht: 1100 };
ok(passt(S.trucks[0], [], kuehl).ok === false,
   'Kühlgut ohne Kühlaufbau wird abgelehnt');
ok(S.contractOffers.length > 0, `Ausschreibungen vorhanden (${S.contractOffers.length})`);
ok(S.trucks.length === 1 && S.trucks[0].pos, 'Ein LKW mit Standort');
ok(S.level === 1, 'Start auf Stufe 1');
ok(prog.automatikFrei() === false, 'Automatik anfangs gesperrt');
ok(prog.modelFrei('schwer') === false, 'Schwerlast anfangs gesperrt');
ok(prog.modelFrei('kurier') === true, 'Kurier von Anfang an verfügbar');

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
ok(buyTruck('fern', false) === false, 'Sattelzug auf Stufe 1 gesperrt');
ok(buyTruck('siebenhalb', false) === false, '7,5-Tonner auf Stufe 1 gesperrt');
ok(buyTruck('maxi', false) === true, 'Großraumtransporter gekauft');
ok(S.money < geld, 'Kaufpreis gebucht');
ok(S.ledger.some(e => e.cat === 'Fahrzeugkauf'), 'Buchung im Kassenbuch');

/* ── Mehrstopp-Tour ── */
console.log('\nTour mit mehreren Stopps');
{
  const t = S.trucks.find(x => x.model === 'maxi');
  /* Drei kleine Sendungen, damit der Test nicht vom Zufall der Börse
     abhängt. Die Kapazitätsprüfung läuft trotzdem echt. */
  const klein = [0, 1, 2].map(i => ({
    id: 'test' + i, kind: 'spot', paletten: 2, gewicht: 320, klasse: 'stueckgut',
    fee: 400, estKm: 40 + i * 20,
    firm: { name: 'Testkunde ' + i, lat: 53.4 + i * 0.2, lon: 9.8 + i * 0.3, km: 40 + i * 20, kind: 'Lager' },
  }));
  S.offers.push(...klein);

  const geladen = [];
  for (const o of klein) {
    if (passt(t, geladen, o).ok) { geladen.push(o); takeOffer(o.id); }
  }
  ok(geladen.length >= 2, `Mehrere Sendungen geladen (${geladen.length})`);
  const last = summe(geladen);
  const kapT = kapazitaet(t);
  ok(last.paletten <= kapT.paletten && last.kg <= kapT.kg,
     `Ladung im Rahmen (${last.paletten}/${kapT.paletten} Pal., ${Math.round(last.kg)}/${kapT.kg} kg)`);
  await startTour(t.nr, geladen, { sync: true });
  ok(t.tour && t.tour.etappen.length === geladen.length,
     `Tour mit ${geladen.length} Etappen gestartet`);
  ok(t.phase === 'driving', 'Fahrzeug rollt');
}

/* ── Rastplatzsuche ── */
console.log('\nPausen auf Rastplätzen');
{
  const { naechsterRastplatz } = await import('../src/sim/fleet.js');
  const t = S.trucks[0];

  /* Eine gerade Strecke nach Norden, mit zwei Parkplätzen darauf. */
  const coords = [];
  for (let i = 0; i <= 40; i++) coords.push([53.5 + i * 0.02, 9.9]);
  t.route = { km: 90, coords, real: false };
  t.progress = 10;

  S.parking = [
    { lat: 53.5 + 20 * 0.02, lon: 9.9, name: 'Rastplatz Heidberg', road: 'A7' },
    { lat: 53.5 + 38 * 0.02, lon: 9.9, name: 'Rastplatz Nordheide', road: 'A7' },
  ];

  const ziel = naechsterRastplatz(t);
  ok(ziel !== null, `Parkplatz auf der Strecke gefunden (${ziel?.name})`);
  ok(ziel && ziel.km > t.progress, 'Der Parkplatz liegt voraus, nicht dahinter');
  ok(ziel && ziel.name === 'Rastplatz Heidberg', 'Der nächstgelegene wird gewählt');

  S.parking = [];
  ok(naechsterRastplatz(t) === null, 'Ohne Daten kein Parkplatz');

  t.route = null; t.progress = 0;
}

/* ── Ein paar Tage fahren ── */
console.log('\nBetrieb über zehn Tage');
S.silent = true;                       // ohne Netz und ohne Protokollflut

const SCHRITT = 15;

/* Bis zur Freischaltung der Automatik wird von Hand disponiert,
   danach übernimmt der Betrieb selbst. So spielt es sich auch. */
async function disponieren() {
  if (prog.automatikFrei()) {
    for (const t of S.trucks) t.auto = true;
    return;
  }
  for (const t of S.trucks) {
    if (t.phase !== 'idle' || driveStatus(t).code !== 'frei') continue;
    if (!S.offers.length) break;
    /* Nur Sendungen, die auch draufpassen — sonst blockiert eine zu
       große Ladung dauerhaft den besten Platz in der Liste. */
    const passend = S.offers.filter(o => passt(t, [], o).ok);
    if (!passend.length) continue;

    let best = null, score = -Infinity;
    for (const o of passend) {
      const wert = o.fee / Math.max(12, distanceFrom(t, o.firm));
      if (wert > score) { score = wert; best = o; }
    }
    if (best) await dispatch(best.id, t.nr, { sync: true });
  }
}

for (let tag = 0; tag < 10; tag++) {
  const bisher = day();
  while (day() === bisher) {
    S.minutes += SCHRITT;
    await disponieren();
    moveTrucks(SCHRITT);
  }
  driftMarket();
  refillOffers();
}
S.silent = false;

ok(S.stats.tours > 0, `Zustellungen erfolgt (${S.stats.tours})`);
ok(S.trucks.every(t => t.pos), 'Alle Fahrzeuge haben einen Standort');
ok(S.stats.km > 0, `Kilometer gefahren (${Math.round(S.stats.km)})`);
ok(S.ledger.some(e => e.cat === 'Fracht' || e.cat === 'Vertragsfracht'),
   'Frachterlöse gebucht');
ok(S.ledger.some(e => e.cat === 'Diesel'), 'Dieselkosten gebucht');
ok(S.rep > 50, `Ansehen gestiegen (${S.rep.toFixed(1)})`);
ok(S.level > 1, `Betriebsstufe gestiegen (${S.level}: ${prog.current().name})`);
ok(prog.progress() === null || prog.progress().punkte.length > 0,
   'Fortschritt zur nächsten Stufe ablesbar');
ok(S.trucks.every(t => t.today <= 9 * 60 + SCHRITT),
   'Tageslenkzeit nirgends überschritten');
ok(S.trucks.every(t => driveStatus(t).code), 'Fahrerstatus lesbar');

/* ── Die sechs Ausbaustufen ── */
console.log('\nAusbau');
{
  const { TRAITS, traitsVon } = await import('../src/sim/persons.js');
  const { topKunden, fahrtenZu } = await import('../src/sim/customers.js');
  const { saison, saisonPreis } = await import('../src/sim/season.js');
  const { fortschritt, setzeZiel, zurueckLegen, bauen, gebaut } = await import('../src/sim/goals.js');
  const { rekordListe, wochenAbschluss } = await import('../src/sim/records.js');

  ok(S.trucks.every(t => t.driver.traits?.length === 2),
     'Jeder Fahrer hat zwei Eigenheiten');
  ok(traitsVon(S.trucks[0].driver).every(t => t.name),
     `Eigenheiten lesbar (${traitsVon(S.trucks[0].driver).map(t => t.name).join(', ')})`);

  const kunden = topKunden(3);
  ok(kunden.length > 0, `Stammkundschaft erfasst (${kunden.length} Betriebe)`);
  ok(kunden[0].fahrten > 0, `Meistbelieferter: ${kunden[0].name}, ${kunden[0].fahrten} Fahrten`);

  ok(saison().name && saisonPreis() > 0, `Saison wirkt (${saison().name}, Faktor ${saisonPreis()})`);

  setzeZiel('tankstelle');
  const vorher = S.money;
  zurueckLegen(20000);
  ok(S.ruecklage === 20000 && S.money === vorher - 20000, 'Rücklage gebildet');
  const f = fortschritt();
  ok(f && f.anteil > 0, `Sparfortschritt ablesbar (${Math.round(f.anteil)} %)`);
  ok(bauen() === false, 'Bauen erst bei voller Rücklage');

  S.ruecklage = 45000;
  ok(bauen() === true && gebaut('tankstelle'), 'Anschaffung fertiggestellt');

  const rek = rekordListe().filter(r => r.eintrag);
  ok(rek.length > 0, `Bestwerte erfasst (${rek.length} von ${rekordListe().length})`);

  S.woche = null;
  const bericht = wochenAbschluss();
  ok(bericht && bericht.touren >= 0, `Wochenabschluss erstellt (${bericht?.touren} Zustellungen)`);
  ok(bericht?.fahrer?.name, `Fahrer der Woche: ${bericht?.fahrer?.name}`);
}

const bilanz = ledgerSums();
ok(Math.abs(bilanz.saldo - (S.money - 50000)) < 1,
   'Kassenbuch stimmt mit dem Kontostand überein');
/* Obergrenze zur Plausibilität, keine Balancevorgabe: mit neun Stunden
   Lenkzeit und einer Stunde Rampenzeit je Sendung sind mehr als ein
   Dutzend Zustellungen am Tag rechnerisch nicht möglich. */
ok(S.stats.tours / 10 / S.trucks.length < 12,
   `Zustellungen je LKW und Tag plausibel (${(S.stats.tours / 10 / S.trucks.length).toFixed(1)})`);

console.log('\nStand nach zehn Tagen');
console.log(`  Kasse      ${Math.round(S.money)} €`);
console.log(`  Einnahmen  ${Math.round(bilanz.ein)} €`);
console.log(`  Ausgaben   ${Math.round(bilanz.aus)} €`);
console.log(`  Fahrten    ${S.stats.tours}`);
console.log(`  Kilometer  ${Math.round(S.stats.km)}`);
console.log(`  Ansehen    ${S.rep.toFixed(1)}`);

console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.\n` : '\nAlles in Ordnung.\n');
process.exit(fehler ? 1 : 0);
