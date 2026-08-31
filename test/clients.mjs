/* Prüft die Auftraggeber als Personen.

   Charakter ist fest, Tagesform schwankt, Groll bleibt haften. Wichtig
   ist die Balance: Es soll fordern, aber nicht schikanieren — wer
   maßvoll handelt, darf nie in eine Sackgasse geraten.

   Aufruf: node test/clients.mjs
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
const C = await import('../src/sim/clients.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

state.resetState(CITIES[0]);
const S = state.S;
S.silent = true;
S.firms = inventFirms(S.depot, 40);

console.log('\nAuftraggeber\n');

/* Charakter ist fest */
const name = S.firms[0].name;
const c1 = C.charakterVon(name);
const c2 = C.charakterVon(name);
ok(c1 === c2, `Derselbe Betrieb hat immer denselben Charakter (${c1.name})`);

const charaktere = new Set(S.firms.map(f => C.charakterVon(f.name).key));
ok(charaktere.size >= 4,
   `Die Charaktere verteilen sich (${charaktere.size} von ${Object.keys(C.CHARAKTERE).length})`);

/* Zustände kommen und gehen */
ok(C.zustandVon(name) === null, 'Zu Beginn ist kein Zustand gesetzt');

C.setzeZustand(name, 'betriebsurlaub', 5);
ok(C.zustandVon(name)?.key === 'betriebsurlaub', 'Betriebsferien lassen sich setzen');
ok(C.vergibtFracht(name) === false, 'Während der Ferien kommt keine Fracht');
ok(C.anfrageFaktor(name) === 0, 'Und keine Anfragen');

S.minutes += 6 * 1440;
ok(C.zustandVon(name) === null, 'Nach fünf Tagen ist der Zustand vorbei');
ok(C.vergibtFracht(name) === true, 'Danach wird wieder verschickt');

/* Zustände wirken auf die Verhandlung */
C.setzeZustand(name, 'hochbetrieb', 5);
const imHoch = C.grenzenBonus(name);
C.setzeZustand(name, 'krank', 5);
const beiKrankheit = C.grenzenBonus(name);
ok(imHoch > beiKrankheit,
   `Im Hochbetrieb mehr Spielraum als bei krankem Disponenten `
   + `(${imHoch.toFixed(2)} gegen ${beiKrankheit.toFixed(2)})`);

/* Groll häuft sich und führt irgendwann zur Sperre */
const opfer = S.firms[1].name;
S.kunden[opfer] = { fahrten: 0, groll: 0, zustand: null, laune: 0 };

const folge1 = C.verstimmen(opfer);
ok(C.kunde(opfer).groll > 0, `Ein Abbruch hinterlässt Groll (${Math.round(C.kunde(opfer).groll)})`);
ok(folge1 !== 'gesperrt', 'Beim ersten Mal noch keine Sperre');

let runden = 1;
let letzte = folge1;
while (letzte !== 'gesperrt' && runden < 10) {
  C.kunde(opfer).zustand = null;
  letzte = C.verstimmen(opfer);
  runden++;
}
ok(letzte === 'gesperrt', `Nach ${runden} Abbrüchen ist Schluss`);
ok(C.vergibtFracht(opfer) === false, 'Ein gesperrter Betrieb vergibt keine Fracht');

/* Aber es ist keine Sackgasse */
const vorher = C.kunde(opfer).groll;
for (let i = 0; i < 12; i++) C.beruhigen(opfer, 2.5);
ok(C.kunde(opfer).groll < vorher,
   `Zusammenarbeit besänftigt (${Math.round(vorher)} → ${Math.round(C.kunde(opfer).groll)})`);

S.minutes += 40 * 1440;
ok(C.zustandVon(opfer) === null, 'Auch eine Sperre läuft irgendwann ab');

/* Der Tageswechsel bewegt die Launen */
for (const f of S.firms.slice(0, 10)) C.kunde(f.name);
C.neuerTag();
const launen = S.firms.slice(0, 10).map(f => C.kunde(f.name).laune);
ok(launen.some(l => l !== 0), 'Nach einem Tageswechsel haben die Kunden eine Tagesform');
ok(launen.every(l => l >= -1 && l <= 1), 'Die Laune bleibt im Rahmen');

/* Der Charakter bestimmt, wie nachtragend jemand ist */
const kleinlich = Object.values(C.CHARAKTERE).find(x => x.key === 'kleinlich');
const grosszuegig = Object.values(C.CHARAKTERE).find(x => x.key === 'grosszuegig');
ok(kleinlich.nachtragend > grosszuegig.nachtragend,
   'Der Kleinliche nimmt es persönlicher als der Großzügige');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
