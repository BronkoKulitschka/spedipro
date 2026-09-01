/* Prüft, dass jedes Fahrzeug im Sammelbild sein Feld trifft.

   Die Ausschnitte entstehen über background-size und -position in
   Prozent. Diese Rechnung ist unanschaulich genug, dass ein Prüfstein
   sich lohnt — verschiebt sich ein Feld, sieht man auf der Karte das
   falsche Fahrzeug.

   Aufruf: node test/sprites.mjs
*/

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const hier = dirname(fileURLToPath(import.meta.url));
const { RASTER, SPALTEN, ZEILEN } = await import('../src/ui/sprites.js');

let fehler = 0;
const ok = (bedingung, text) => {
  console.log(`  ${bedingung ? '✓' : '✗'} ${text}`);
  if (!bedingung) fehler++;
};

console.log('\nSammelbild und Rasteraufteilung\n');

/* Belegung vollständig? */
const felder = Object.values(RASTER);
ok(felder.length === 11, `${felder.length} Fahrzeuge im Raster`);

const doppelt = felder.filter((f, i) =>
  felder.findIndex(g => g[0] === f[0] && g[1] === f[1]) !== i);
ok(doppelt.length === 0, 'Kein Feld doppelt belegt');

const ausserhalb = felder.filter(([sp, ze]) => sp >= SPALTEN || ze >= ZEILEN);
ok(ausserhalb.length === 0, `Alle Felder innerhalb von ${SPALTEN} × ${ZEILEN}`);

/* Die Ausschnittsrechnung nachvollziehen */
const ANZEIGE = 18;
let versetzt = 0;

for (const [name, [sp, ze]] of Object.entries(RASTER)) {
  const x = SPALTEN > 1 ? (sp / (SPALTEN - 1)) * 100 : 0;
  const y = ZEILEN  > 1 ? (ze / (ZEILEN  - 1)) * 100 : 0;

  /* So rechnet der Browser: die Prozentangabe verteilt den Überhang */
  const ueberhangX = ANZEIGE * SPALTEN - ANZEIGE;
  const ueberhangY = ANZEIGE * ZEILEN  - ANZEIGE;
  const px = Math.round(ueberhangX * x / 100);
  const py = Math.round(ueberhangY * y / 100);

  if (px !== sp * ANZEIGE || py !== ze * ANZEIGE) {
    console.log(`    ${name}: Versatz ${px},${py} statt ${sp * ANZEIGE},${ze * ANZEIGE}`);
    versetzt++;
  }
}
ok(versetzt === 0, 'Jeder Ausschnitt trifft sein Feld genau');

/* Liegt eine Vorlage bei, muss sie zum Raster passen */
const blatt = join(hier, '..', 'assets', 'trucks.png');
if (existsSync(blatt)) {
  const daten = readFileSync(blatt);

  /* Bildgröße aus dem PNG-Kopf lesen, ohne Zusatzpaket */
  const breite = daten.readUInt32BE(16);
  const hoehe  = daten.readUInt32BE(20);

  ok(breite % SPALTEN === 0,
     `Breite ${breite} ist durch ${SPALTEN} Spalten teilbar`);
  ok(hoehe % ZEILEN === 0,
     `Höhe ${hoehe} ist durch ${ZEILEN} Zeilen teilbar`);
  ok(breite >= SPALTEN * 16 && hoehe >= ZEILEN * 16,
     `Auflösung ausreichend (${breite} × ${hoehe})`);
} else {
  console.log('  · keine assets/trucks.png vorhanden, Prüfung übersprungen');
}

/* ── Gesichter der Auftraggeber ── */
console.log('\nGesichter\n');

const { GESICHTER } = await import('../src/ui/sprites.js');
const G_SP = 3, G_ZE = 2;

const gFelder = Object.values(GESICHTER);
ok(gFelder.length === 6, `${gFelder.length} Charaktere im Raster`);

const gDoppelt = gFelder.filter((f, i) =>
  gFelder.findIndex(g => g[0] === f[0] && g[1] === f[1]) !== i);
ok(gDoppelt.length === 0, 'Kein Feld doppelt belegt');

const G_ANZEIGE = 44;
let gVersetzt = 0;
for (const [name, [sp, ze]] of Object.entries(GESICHTER)) {
  const x = G_SP > 1 ? (sp / (G_SP - 1)) * 100 : 0;
  const y = G_ZE > 1 ? (ze / (G_ZE - 1)) * 100 : 0;
  const px = Math.round((G_ANZEIGE * G_SP - G_ANZEIGE) * x / 100);
  const py = Math.round((G_ANZEIGE * G_ZE - G_ANZEIGE) * y / 100);
  if (px !== sp * G_ANZEIGE || py !== ze * G_ANZEIGE) {
    console.log(`    ${name}: Versatz ${px},${py} statt ${sp * G_ANZEIGE},${ze * G_ANZEIGE}`);
    gVersetzt++;
  }
}
ok(gVersetzt === 0, 'Jedes Gesicht trifft sein Feld genau');

const gBlatt = join(hier, '..', 'assets', 'gesichter.png');
if (existsSync(gBlatt)) {
  const daten = readFileSync(gBlatt);
  const breite = daten.readUInt32BE(16);
  const hoehe = daten.readUInt32BE(20);

  ok(breite % G_SP === 0, `Breite ${breite} durch ${G_SP} Spalten teilbar`);
  ok(hoehe % G_ZE === 0, `Höhe ${hoehe} durch ${G_ZE} Zeilen teilbar`);
  ok(Math.abs(breite / hoehe - G_SP / G_ZE) < 0.01,
     `Seitenverhältnis passt (${breite} × ${hoehe})`);
} else {
  console.log('  · keine assets/gesichter.png vorhanden, Prüfung übersprungen');
}

/* ── Fahrergesichter ── */
console.log('\nFahrergesichter\n');

const { fahrerSlot, FAHRER_SPALTEN, FAHRER_ZEILEN } = await import('../src/ui/sprites.js');
const { neuerFahrer, geschlechtVon } = await import('../src/sim/staff.js');
const { DRIVER_NAMES_M, DRIVER_NAMES_F } = await import('../src/config.js');

const kennungen = Array.from({ length: 40 }, (_, i) => `f${i}xyz${i * 7}`);
const slotsW = kennungen.map(k => fahrerSlot(k, 'w'));
const slotsM = kennungen.map(k => fahrerSlot(k, 'm'));

ok(slotsW.every(s => s >= 0 && s < 4), 'Weibliche Kennungen landen in der oberen Hälfte (0–3)');
ok(slotsM.every(s => s >= 4 && s < 8), 'Männliche Kennungen landen in der unteren Hälfte (4–7)');
ok(new Set(slotsW).size >= 3, `Gute Streuung bei weiblich (${new Set(slotsW).size} von 4 genutzt)`);
ok(fahrerSlot('immerselbe', 'w') === fahrerSlot('immerselbe', 'w'),
   'Dieselbe Kennung ergibt immer denselben Platz');
ok(fahrerSlot('x', 'w') !== fahrerSlot('x', 'm'),
   'Dasselbe Muster ergibt je nach Geschlecht einen anderen Platz');

/* Name und Geschlecht passen zusammen */
const state = await import('../src/state.js');
const { CITIES } = await import('../src/data/cities.js');
state.resetState(CITIES[0]);
state.S.drivers = [];

let alleRichtig = true;
for (let i = 0; i < 30; i++) {
  const f = neuerFahrer();
  state.S.drivers.push(f);
  const erwartet = DRIVER_NAMES_F.includes(f.name) ? 'w'
                 : DRIVER_NAMES_M.includes(f.name) ? 'm' : null;
  if (erwartet && erwartet !== f.geschlecht) alleRichtig = false;
}
ok(alleRichtig, '30 erzeugte Fahrer: Name und gewürfeltes Geschlecht stimmen überein');

/* Alte Spielstände ohne das Feld bekommen trotzdem etwas Stabiles */
ok(geschlechtVon({ id: 'ohne-feld' }) === geschlechtVon({ id: 'ohne-feld' }),
   'Ohne gespeichertes Geschlecht bleibt die Ableitung stabil');

const fBlatt = join(hier, '..', 'assets', 'fahrer.png');
if (existsSync(fBlatt)) {
  const daten = readFileSync(fBlatt);
  const breite = daten.readUInt32BE(16);
  const hoehe = daten.readUInt32BE(20);
  ok(breite % FAHRER_SPALTEN === 0, `Breite passt zu ${FAHRER_SPALTEN} Spalten`);
  ok(hoehe % FAHRER_ZEILEN === 0, `Höhe passt zu ${FAHRER_ZEILEN} Zeilen`);
} else {
  console.log('  · keine assets/fahrer.png vorhanden, Prüfung übersprungen');
}

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
