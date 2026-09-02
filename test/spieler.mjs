/* Prüft den Spielercharakter: Auswahl beim Gründen, Anzeige, Speicherung.

   Anders als bei Fahrern oder Auftraggebern ist das keine zufällige
   Zuweisung — der Spieler wählt bewusst, und die Wahl muss über einen
   Neustart der Seite hinweg erhalten bleiben.

   Aufruf: node test/spieler.mjs
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
const sprites = await import('../src/ui/sprites.js');
const { startScreen, desktopShell } = await import('../src/ui/screens.js');
const { startMenuHtml } = await import('../src/ui/wm.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };

console.log('\nSpielercharakter\n');

/* Die Auswahl beim Gründen */
const start = startScreen();
ok(start.includes('id="spGeschlW"') && start.includes('id="spGeschlM"'),
   'Geschlechtsauswahl im Gründungsbildschirm');
ok(start.includes('id="spielerWahl"'), 'Bereich für die Bildauswahl vorhanden');

/* Die Platzrechnung: 0–3 weiblich, 4–7 männlich */
ok(sprites.spielerSlot('w', 0) === 0 && sprites.spielerSlot('w', 3) === 3,
   'Weibliche Auswahl liegt auf den Plätzen 0–3');
ok(sprites.spielerSlot('m', 0) === 4 && sprites.spielerSlot('m', 3) === 7,
   'Männliche Auswahl liegt auf den Plätzen 4–7');
ok(sprites.spielerSlot('w', 9) === 3, 'Ungültige Bildnummern werden begrenzt, nicht abgeschnitten');

/* Vorgabewert im frischen Zustand */
state.resetState(CITIES[0]);
const S = state.S;
ok(S.spieler?.geschlecht === 'w' && S.spieler?.bild === 0,
   'Ein neuer Betrieb startet mit dem ersten weiblichen Bild');

/* Sichtbarkeit überall dort, wo der Betrieb genannt wird */
S.spieler = { geschlecht: 'm', bild: 2 };
ok(desktopShell().includes('desk-brand-bildnis'), 'Bildnis erscheint auf dem Desktop');
ok(startMenuHtml().includes('start-bildnis') && startMenuHtml().includes(S.name),
   'Bildnis und Firmenname erscheinen im Startmenü');

/* Wiederherstellung, auch aus einem alten Spielstand ohne das Feld */
const vollstaendig = { depot: S.depot, spieler: { geschlecht: 'm', bild: 3 }, trucks: S.trucks };
state.hydrate(vollstaendig);
ok(state.S.spieler.geschlecht === 'm' && state.S.spieler.bild === 3,
   'Ein gespeicherter Charakter wird beim Laden übernommen');

const alterStand = { depot: S.depot, trucks: S.trucks };
state.hydrate(alterStand);
ok(state.S.spieler?.geschlecht === 'w' && state.S.spieler?.bild === 0,
   'Ein alter Spielstand ohne das Feld bekommt einen Rückfall statt abzustürzen');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
