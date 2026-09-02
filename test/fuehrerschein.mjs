/* Prüft den Führerschein: Rangfolge, Aufstieg, Sperre bei zu
   niedriger Klasse.

   Aufruf: node test/fuehrerschein.mjs
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
const { LICENCE, LICENCE_RANG, TRUCK_MODELS } = await import('../src/config.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;

console.log('\nFührerschein\n');

/* Ein neuer Fahrer beginnt bei B */
const f = staff.neuerFahrer();
S.drivers.push(f);
ok(f.fs === 'B' || LICENCE_RANG.indexOf(f.fs) <= 2,
   `Neue Fahrer starten mit einer plausiblen Klasse (${f.fs})`);

/* Die Rangfolge */
const einfach = { ...f, fs: 'B' };
ok(staff.fsReicht(einfach, 'B'), 'Klasse B reicht für Klasse B');
ok(!staff.fsReicht(einfach, 'C1'), 'Klasse B reicht nicht für C1');
ok(staff.fsReicht({ ...f, fs: 'CE' }, 'B'), 'Klasse CE reicht für alles Niedrigere');

/* Aufstieg kostet Geld und Zeit */
S.money = 10000;
const start = S.money;
const g = { ...staff.neuerFahrer(), fs: 'B' };
S.drivers.push(g);
const kosten = LICENCE.B.kosten === 0 ? LICENCE.C1.kosten : LICENCE.B.kosten;

const erfolg = staff.fahrschuleBeginnen(g.id);
ok(erfolg, 'Die Fahrschule lässt sich beginnen');
ok(S.money < start, `Die Kosten werden sofort gebucht (${start} → ${Math.round(S.money)})`);
ok(staff.inFahrschule(g), 'Der Fahrer gilt während der Ausbildung als „in der Fahrschule"');

/* Kein zweiter Start während der laufenden Ausbildung */
const zweiterVersuch = staff.fahrschuleBeginnen(g.id);
ok(!zweiterVersuch, 'Kein zweiter Start, solange die erste Ausbildung läuft');

/* Nach Ablauf der Zeit ist die neue Klasse da */
S.minutes += 20 * 1440;
staff.fahrschuleTag();
ok(!staff.inFahrschule(g), 'Nach Ablauf der Zeit ist die Ausbildung vorbei');
ok(g.fs === 'C1', `Die neue Klasse ist eingetragen (${g.fs})`);

/* Ohne genug Geld kein Start */
S.money = 0;
const h = staff.neuerFahrer();
S.drivers.push(h);
ok(!staff.fahrschuleBeginnen(h.id), 'Ohne genug Geld startet keine Fahrschule');

/* Die Zuteilung verweigert ein zu großes Fahrzeug */
S.trucks[0].model = 'fern';   // braucht CE
const zuGross = staff.zuteilen(h.id, S.trucks[0].nr);
ok(!zuGross, 'Ein Fahrer mit Klasse B wird nicht auf einen Sattelzug zugeteilt');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
