/* Prüft, dass jedes Modul für sich allein geladen werden kann.

   Ringbezüge zwischen Modulen fliegen nur bei bestimmten
   Ladereihenfolgen auseinander. Im Browser hängt die Reihenfolge davon
   ab, welches Programm zuerst geöffnet wird — ein Fehler dieser Art
   zeigt sich also erst beim Spielen und dann nur manchmal.

   Deshalb wird hier jedes Modul einzeln als Einstiegspunkt geladen.

   Aufruf: node test/loading.mjs
*/

import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..', 'src');

function alleModule(pfad) {
  const raus = [];
  for (const name of readdirSync(pfad)) {
    const voll = join(pfad, name);
    if (statSync(voll).isDirectory()) raus.push(...alleModule(voll));
    else if (name.endsWith('.js')) raus.push(voll);
  }
  return raus;
}

/* Eine Browserumgebung, so knapp wie möglich */
const UMGEBUNG = `
const stub = () => ({
  style: { setProperty(){} }, dataset: {},
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  innerHTML: '', textContent: '', value: '', checked: false, files: [],
  querySelector: () => stub(), querySelectorAll: () => [],
  appendChild(){}, remove(){}, addEventListener(){}, removeEventListener(){},
  focus(){}, click(){}, closest: () => null,
  getBoundingClientRect: () => ({ width: 0, height: 0, top: 0, left: 0 }),
});
globalThis.document = {
  getElementById: () => stub(), createElement: stub,
  querySelector: () => stub(), querySelectorAll: () => [],
  addEventListener(){}, body: stub(), activeElement: null,
  documentElement: { style: { setProperty(){} },
                     classList: { add(){}, remove(){}, toggle(){} } },
};
globalThis.window = { addEventListener(){}, innerWidth: 1200, innerHeight: 800 };
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
globalThis.Image = class { set src(v){} };
globalThis.L = new Proxy(function(){}, {
  get: () => globalThis.L, apply: () => globalThis.L, construct: () => globalThis.L,
});
`;

const module = alleModule(wurzel);
let fehler = 0;

console.log(`\n${module.length} Module einzeln laden\n`);

for (const datei of module) {
  const kurz = 'src' + datei.slice(datei.indexOf('/src/') + 4);
  const skript = UMGEBUNG + `await import('file://${datei}');`;

  const lauf = spawnSync('node', ['--input-type=module', '-e', skript],
                         { encoding: 'utf8', timeout: 20000 });

  if (lauf.status === 0) continue;

  const meldung = (lauf.stderr || '').split('\n')
    .find(z => /Error|error/.test(z)) || 'unbekannter Fehler';
  console.log(`  ✗ ${kurz}`);
  console.log(`      ${meldung.trim()}`);
  fehler++;
}

console.log(fehler
  ? `\n${fehler} Modul(e) lassen sich nicht einzeln laden — Ringbezug?\n`
  : 'Alle Module laden einzeln.\n');
process.exit(fehler ? 1 : 0);
