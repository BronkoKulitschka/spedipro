/* Prüft, wie weit das Spiel ohne Netz kommt.

   Ziel ist eine eigenständige Fassung. Dieser Prüfstein hält fest,
   welche Bestandteile schon beiliegen und welche noch am Netz hängen —
   damit die Abhängigkeit nicht unbemerkt wieder wächst.

   Aufruf: node test/offline.mjs
*/

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b ? '✓' : '✗'} ${t}`); if (!b) fehler++; };
const merke = t => console.log(`  · ${t}`);

console.log('\nNetzunabhängigkeit\n');

/* 1. Was zum Starten nötig ist, muss beiliegen */
const html = readFileSync(join(wurzel, 'index.html'), 'utf8');
const fremdImKopf = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);

ok(fremdImKopf.length === 0,
   fremdImKopf.length
     ? `index.html lädt noch von außen: ${fremdImKopf.join(', ')}`
     : 'index.html lädt nichts von fremden Servern');

ok(existsSync(join(wurzel, 'vendor', 'leaflet.js')), 'Leaflet liegt bei');
ok(existsSync(join(wurzel, 'vendor', 'leaflet.css')), 'Leaflet-Stil liegt bei');

/* 2. Der Servicearbeiter bewahrt auf */
const sw = readFileSync(join(wurzel, 'sw.js'), 'utf8');
ok(/caches\.open/.test(sw), 'Servicearbeiter legt einen Speicher an');
ok(/openstreetmap/.test(sw) && /KACHELN/.test(sw),
   'Kartenkacheln werden aufbewahrt');

/* 3. Jede Netzabfrage braucht einen Rückfall */
function alleModule(pfad) {
  const raus = [];
  for (const name of readdirSync(pfad)) {
    const voll = join(pfad, name);
    if (statSync(voll).isDirectory()) raus.push(...alleModule(voll));
    else if (name.endsWith('.js')) raus.push(voll);
  }
  return raus;
}

const ohneRueckfall = [];
for (const datei of alleModule(join(wurzel, 'src'))) {
  const text = readFileSync(datei, 'utf8');
  if (!/\bfetch\s*\(/.test(text)) continue;

  const kurz = 'src' + datei.slice(datei.indexOf('/src/') + 4);
  if (!/catch/.test(text)) ohneRueckfall.push(kurz);
  else merke(`${kurz} fragt das Netz — mit Rückfall`);
}
ok(ohneRueckfall.length === 0,
   ohneRueckfall.length
     ? `ohne Rückfall: ${ohneRueckfall.join(', ')}`
     : 'Jede Netzabfrage hat einen Rückfall');

/* 4. Die erfundene Kundschaft deckt alle Standorte ab */
const { CITIES } = await import('../src/data/cities.js');
const { inventFirms } = await import('../src/data/invent.js');
const { haversine } = await import('../src/util.js');

let schlecht = 0;
for (const stadt of CITIES) {
  const firmen = inventFirms(stadt, 30);
  if (firmen.length < 30) { schlecht++; continue; }
  /* Wie viele liegen bei einer wirklichen Ortschaft? */
  const beiOrt = firmen.filter(f => CITIES.some(c => haversine(f, c) < 15)).length;
  if (beiOrt / firmen.length < 0.4) schlecht++;
}
ok(schlecht === 0,
   `Für alle ${CITIES.length} Standorte entsteht plausible Kundschaft ohne Netz`);

/* 5. Was noch offen ist, festhalten */
console.log('\n  Noch offen für eine eigenständige Fassung:');
console.log('  · Kartenbild ohne Netz (gezeichneter Umriss statt Kacheln)');
console.log('  · Spielstand als Datei statt im Browserspeicher');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles in Ordnung\n');
process.exit(fehler ? 1 : 0);
