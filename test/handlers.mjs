/* Prüft, dass Klickbehandlungen nicht ins Leere greifen.

   Zwei Fehlerarten, die beide erst beim Anklicken auffallen:

   1. Namenskollision: Wird der Zustand eines Fensters in einem
      data-Attribut abgelegt, das denselben Namen trägt wie ein
      Knopfattribut, findet closest() beim Hochlaufen das Wurzel-
      element — und der erste Zweig verschluckt jeden Klick.

   2. Tote Verweise: Ein Zweig fragt ein Attribut ab, das im Aufbau
      nirgends vergeben wird.

   Aufruf: node test/handlers.mjs
*/

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const hier = dirname(fileURLToPath(import.meta.url));
const appsPfad = join(hier, '..', 'src', 'apps');

let fehler = 0;
const melde = (datei, text) => {
  console.log(`  ✗ ${datei}: ${text}`);
  fehler++;
};

console.log('\nKlickbehandlungen\n');

for (const datei of readdirSync(appsPfad).filter(f => f.endsWith('.js'))) {
  const s = readFileSync(join(appsPfad, datei), 'utf8');

  /* Attribute, die als Zustand am Wurzelelement abgelegt werden */
  const zustand = new Set();
  for (const m of s.matchAll(/\bel\.dataset\.(\w+)\s*=/g)) {
    /* dataset.foo entspricht dem Attribut data-foo, camelCase wird
       zu Bindestrichen: dataset.blattWahl → data-blatt-wahl */
    zustand.add(m[1].replace(/[A-Z]/g, c => '-' + c.toLowerCase()));
  }

  /* Attribute, nach denen closest() sucht */
  const gesucht = new Set();
  for (const m of s.matchAll(/closest\(\s*'\[(data-[\w-]+)/g)) gesucht.add(m[1]);

  /* 1. Kollision */
  for (const attr of gesucht) {
    if (zustand.has(attr)) {
      melde(datei, `closest('[${attr}]') findet das Wurzelelement, `
                 + `weil dort el.dataset gesetzt wird — jeder Klick landet in diesem Zweig`);
    }
  }

  /* 2. Tote Verweise */
  const vergeben = new Set();
  /* Auch Attribute ohne Wert: <button data-zeigestufe> */
  for (const m of s.matchAll(/(data-[\w-]+)(?==|[\s>])/g)) vergeben.add(m[1]);
  for (const attr of gesucht) {
    if (!vergeben.has(attr) && !zustand.has(attr)) {
      melde(datei, `closest('[${attr}]') sucht ein Attribut, das nirgends vergeben wird`);
    }
  }
}

console.log(fehler ? `\n${fehler} Fund(e)\n` : 'Keine Kollisionen und keine toten Verweise.\n');
process.exit(fehler ? 1 : 0);
