/* Prüft die drei Meldungsarten für fertige Touren.

   sofort      — jede fertige Tour
   stuendlich  — nur die stündliche Erinnerung, keine Einzelmeldungen
   aus         — gar nichts

   Aufruf: node test/notify.mjs
*/

let sichtbarkeit = 'hidden';
let gesendet = [];

globalThis.document = { get visibilityState() { return sichtbarkeit; } };
globalThis.Notification = class {
  static permission = 'granted';
  constructor(titel, opt) { gesendet.push({ titel, body: opt?.body }); }
};

const speicher = {};
globalThis.localStorage = {
  getItem: k => speicher[k] ?? null,
  setItem: (k, v) => { speicher[k] = v; },
  removeItem: k => { delete speicher[k]; },
};

const N = await import('../src/ui/notify.js');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };
const warte = () => new Promise(r => setTimeout(r, 1400));
const modus = m => N.speichereEinstellung({ ...N.ladeEinstellung(), modus: m });

console.log('\nBenachrichtigungen\n');

ok(Object.keys(N.MODI).length === 3, `Drei Modi: ${Object.keys(N.MODI).join(', ')}`);
ok(N.ladeEinstellung().modus === 'stuendlich', 'Voreinstellung ist stündlich');

modus('sofort');
gesendet = [];
N.melde('zustellung', 'Fertig', 'LKW 1 steht frei.');
await warte();
ok(gesendet.length === 1, 'sofort: fertige Tour wird gemeldet');

modus('aus');
gesendet = [];
N.melde('zustellung', 'Fertig', 'x');
N.melde('panne', 'Panne', 'x');
await warte();
ok(gesendet.length === 0, 'aus: gar keine Meldung');

modus('stuendlich');
gesendet = [];
N.melde('zustellung', 'Fertig', 'x');
await warte();
ok(gesendet.length === 0, 'stündlich: einzelne Touren werden nicht gemeldet');

gesendet = [];
N.melde('panne', 'Panne', 'LKW 2 in der Werkstatt.');
await warte();
ok(gesendet.length === 1, 'Pannen laufen unabhängig vom Modus');

modus('sofort');
gesendet = [];
for (let i = 0; i < 5; i++) N.melde('zustellung', `Fahrer ${i}`, 'fertig');
await warte();
ok(gesendet.length === 1 && /5 Meldungen/.test(gesendet[0].titel),
   'Mehrere Meldungen werden zusammengefasst');

sichtbarkeit = 'visible';
gesendet = [];
N.melde('zustellung', 'Fertig', 'x');
await warte();
ok(gesendet.length === 0, 'Im Vordergrund wird nicht gemeldet');

/* Die stündliche Erinnerung: erst nach einer Stunde ohne Disposition */
sichtbarkeit = 'hidden';
modus('stuendlich');
N.setzeFreieZaehler(() => 3);
N.merkeDisposition();
gesendet = [];
ok(gesendet.length === 0, 'Direkt nach einer Disposition keine Erinnerung');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
