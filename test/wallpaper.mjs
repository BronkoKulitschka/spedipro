/* Prüft, dass jede Voreinstellung einen gültigen Bildwert ergibt.
   Aufruf: node test/wallpaper.mjs */

import { readFileSync } from 'fs';

const quelle = readFileSync(new URL('../src/ui/wallpaper.js', import.meta.url), 'utf8');
const block = quelle.match(/export const PRESETS = \{([\s\S]*?)\n\};/)[1];

const eintraege = [...block.matchAll(/(\w+):\s*\{\s*name:\s*'([^']+)',\s*\n?\s*css:\s*'([^']+)'(?:,\s*\n?\s*size:\s*'([^']+)')?/g)];

let fehler = 0;
console.log('\nVoreinstellungen\n');

for (const [, key, name, css, size] of eintraege) {
  const istFarbe = css.startsWith('#');
  const bild = istFarbe ? `linear-gradient(${css}, ${css})` : css;

  /* Ein Bildwert darf keine Positions- oder Größenangabe enthalten. */
  const unsauber = /\)\s*\d|\)\s*\w+\s*\//.test(bild);
  const ok = !unsauber && (istFarbe || /^(repeating-)?(linear|radial|conic)-gradient\(|^url\(/.test(bild));

  console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(12)} ${size ? size.padEnd(10) : '—'.padEnd(10)} ${bild.slice(0, 50)}`);
  if (!ok) fehler++;
}

console.log(fehler ? `\n${fehler} ungültige Bildebene(n).\n` : '\nAlle Bildebenen gültig.\n');
process.exit(fehler ? 1 : 0);
