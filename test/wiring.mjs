/* Prüft, dass jede im Quelltext aufgerufene Funktion auch existiert.

   Hintergrund: Wird eine Funktion beim Umbau entfernt, der Aufruf
   bleibt aber stehen, fällt das erst zur Laufzeit auf — und dort
   oft nur als etwas, das stillschweigend nicht erscheint.

   Aufruf: node test/wiring.mjs
*/

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function alleDateien(pfad) {
  const raus = [];
  for (const name of readdirSync(pfad)) {
    const voll = join(pfad, name);
    if (statSync(voll).isDirectory()) raus.push(...alleDateien(voll));
    else if (name.endsWith('.js')) raus.push(voll);
  }
  return raus;
}

/* Zeichenketten und Vorlagen entfernen — dort steht HTML und CSS,
   das wie ein Funktionsaufruf aussieht, aber keiner ist. */
function ohneTexte(quelle) {
  return quelle
    .replace(/`(?:\\.|[^`\\])*`/gs, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    /* Leere Rückruf-Standardwerte vereinfachen, damit die Klammern
       der Parameterliste nicht verschachtelt sind. */
    .replace(/\(\s*\)\s*=>\s*\{\s*\}/g, '0')
    .replace(/\(\s*\)\s*=>\s*[\w.]+/g, '0');
}

const SPRACHE = new Set([
  'if','for','while','switch','catch','return','typeof','function','await',
  'new','delete','void','instanceof','do','else','yield','super','this',
  'setTimeout','setInterval','clearTimeout','clearInterval','fetch',
  'parseInt','parseFloat','isFinite','isNaN','encodeURIComponent',
  'decodeURIComponent','structuredClone','queueMicrotask','import',
  'alert','confirm','prompt','requestAnimationFrame',
]);

let fehler = 0;
let geprueft = 0;

for (const datei of alleDateien(wurzel)) {
  const roh = readFileSync(datei, 'utf8');
  const text = ohneTexte(roh);
  const kurz = 'src' + datei.slice(datei.indexOf('/src/') + 4);

  const bekannt = new Set(SPRACHE);

  /* Alles, was in dieser Datei erklärt oder hereingeholt wird */
  for (const m of text.matchAll(/(?:function|const|let|var|class)\s+(\w+)/g)) bekannt.add(m[1]);

  /* Auseinandergenommene Zuweisungen: const { a, b } = ... */
  for (const m of text.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=/g))
    for (const teil of m[1].split(','))
      { const n = teil.trim().split(/[:=\s]/)[0]; if (n) bekannt.add(n); }
  for (const m of roh.matchAll(/import\s*\{([^}]+)\}/g))
    for (const teil of m[1].split(',')) bekannt.add(teil.trim().split(/\s+as\s+/).pop());
  for (const m of roh.matchAll(/import\s+(\w+)\s+from/g)) bekannt.add(m[1]);
  for (const m of roh.matchAll(/import\s*\*\s*as\s+(\w+)/g)) bekannt.add(m[1]);

  /* Namen von Methoden, die hier erklärt werden: name(...) { ... } */
  for (const m of text.matchAll(/(\w+)\s*\([^()]*\)\s*\{/g)) bekannt.add(m[1]);

  /* Alle Bezeichner in Klammerpaaren gelten als Parameter. Das ist
     großzügig, verhindert aber Fehlalarme bei Rückrufen. */
  for (const m of text.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g))
    for (const p of m[1].split(','))
      { const n = p.trim().split(/[=\s:]/)[0].replace(/[{}\[\].…]/g, ''); if (n) bekannt.add(n); }
  for (const m of text.matchAll(/\b(\w+)\s*=>/g)) bekannt.add(m[1]);

  /* Aufrufe: kleingeschrieben, nicht nach Punkt, und nicht von einem
     Rumpf gefolgt — sonst wäre es eine Erklärung, kein Aufruf. */
  for (const m of text.matchAll(/(?<![.\w$])\b([a-zäöüß][\w]*)\s*\(([^()]*)\)(\s*\{)?/g)) {
    if (m[3]) continue;                 // Erklärung, kein Aufruf
    geprueft++;
    if (bekannt.has(m[1])) continue;
    console.log(`  ✗ ${kurz}: ${m[1]}() ist hier nicht bekannt`);
    fehler++;
  }
}

console.log(`\n${geprueft} Aufrufe geprüft.`);
console.log(fehler
  ? `${fehler} davon unbekannt — fehlt eine Funktion?\n`
  : 'Alle aufgelöst.\n');
process.exit(fehler ? 1 : 0);
