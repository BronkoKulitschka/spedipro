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

/* ── Das Gespräch ──
   Ein zufälliges Konkurrenzangebot kann eine zusätzliche Zeile in den
   Verlauf setzen — die Prüfungen messen deshalb den Zuwachs relativ
   zur Startlänge, statt eine feste Länge anzunehmen. */
S.offers = [mach('gespraech')];
let g = H.beginne('gespraech');
ok(!!g && g.offen, 'Ein Gespräch lässt sich beginnen');
ok(g.verlauf.length >= 1 && g.verlauf.length <= 2,
   `Der Kunde eröffnet, mit Konkurrenzzeile höchstens zwei Einträge (${g.verlauf.length})`);
ok(g.runde === 1, `Runde ${g.runde} von ${H.MAX_RUNDEN}`);

const startLaenge = g.verlauf.length;
const vorGrenze = g.grenze;
const moeglich = H.offeneArgumente(g).filter(a => a.verfuegbar && !a.genutzt);
ok(moeglich.length > 0, `${moeglich.length} Argumente stehen zur Verfügung`);

H.argumentieren(g, moeglich[0].key);
ok(g.grenze > vorGrenze,
   `Ein Argument stimmt milder (×${vorGrenze.toFixed(2)} → ×${g.grenze.toFixed(2)})`);
ok(g.verlauf.length === startLaenge + 2, 'Argument und Antwort stehen im Verlauf');
ok(g.runde === 1, 'Ein Argument kostet keine Runde');

H.argumentieren(g, moeglich[0].key);
ok(g.verlauf.length === startLaenge + 2, 'Dasselbe Argument wirkt nur einmal');

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

/* ── Zu häufiges Verhandeln ── */
S.rep = 60;
S.verhandlungsZeiten = [];
S.offers = [];

/* Vier Verhandlungen kurz hintereinander — die ersten drei bleiben
   nach den Regeln folgenlos, erst die vierte kostet Ansehen. */
for (let i = 0; i < 3; i++) {
  S.offers = [mach('haeufig' + i)];
  H.beginne('haeufig' + i);
}
const repNachDrei = S.rep;
ok(repNachDrei === 60, `Die ersten drei Verhandlungen bleiben folgenlos (Ansehen ${repNachDrei})`);

S.offers = [mach('haeufig3')];
H.beginne('haeufig3');
ok(S.rep < repNachDrei, `Die vierte Verhandlung im Zeitfenster kostet Ansehen (${repNachDrei} → ${S.rep.toFixed(1)})`);

/* Nach Ablauf des Zeitfensters zählt es wieder von vorn */
S.minutes += 25 * 60;   // mehr als ein Spieltag später
S.rep = 60;
S.verhandlungsZeiten = [];
for (let i = 0; i < 3; i++) {
  S.offers = [mach('spaeter' + i)];
  H.beginne('spaeter' + i);
}
ok(S.rep === 60, 'Nach einer Pause zählt die Häufigkeit wieder neu');

/* ── Konkurrenzangebot ── */
S.rep = 60;

let mitKonkurrenz = 0, ohneKonkurrenz = 0;
const grenzenMit = [], grenzenOhne = [];

for (let i = 0; i < 200; i++) {
  S.offers = [mach('konk' + i)];
  const g = H.beginne('konk' + i);
  if (g.konkurrenz) { mitKonkurrenz++; grenzenMit.push(g.grenze); }
  else { ohneKonkurrenz++; grenzenOhne.push(g.grenze); }
}

ok(mitKonkurrenz > 20 && mitKonkurrenz < 100,
   `Konkurrenz taucht bei einem Teil der Verhandlungen auf (${mitKonkurrenz} von 200)`);

const schnitt = a => a.reduce((s,x)=>s+x,0) / a.length;
ok(schnitt(grenzenMit) < schnitt(grenzenOhne),
   `Ein Konkurrenzangebot senkt im Schnitt den Spielraum `
 + `(×${schnitt(grenzenMit).toFixed(3)} gegen ×${schnitt(grenzenOhne).toFixed(3)})`);

/* Wenn ein Konkurrenzangebot vorliegt, steht es im Gesprächsverlauf */
let gefunden = null;
for (let i = 0; i < 30 && !gefunden; i++) {
  S.offers = [mach('such' + i)];
  const g = H.beginne('such' + i);
  if (g.konkurrenz) gefunden = g;
}
ok(!!gefunden, 'Ein Konkurrenzangebot lässt sich finden (Zufallstreffer)');
if (gefunden) {
  ok(gefunden.verlauf.some(z => z.text.includes(gefunden.konkurrenz.name)),
     'Der Name der Konkurrenz steht im Gesprächsverlauf');
  const preisText = gefunden.konkurrenz.fee.toLocaleString('de-DE');
  ok(gefunden.verlauf.some(z => z.text.includes(preisText)),
     'Der Preis der Konkurrenz wird genannt');
}

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
