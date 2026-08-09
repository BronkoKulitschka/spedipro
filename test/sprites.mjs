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

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
