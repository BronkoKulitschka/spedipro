/* Der Rückweg lässt sich ohne Browser nicht vollständig prüfen.
   Geprüft wird die Logik, welches Fenster als Herkunft gilt. */

let fehler = 0;
const ok = (b, t) => { console.log(`  ${b?'✓':'✗'} ${t}`); if(!b) fehler++; };

/* Nachbau von oberstesFenster() */
function oberstes(fenster, ausser = null) {
  let bestes = null, hoechste = -1;
  for (const e of fenster) {
    if (e.key === ausser || e.minimized) continue;
    if (e.z > hoechste) { hoechste = e.z; bestes = e.key; }
  }
  return bestes;
}

console.log('\nHerkunft eines Fensteraufrufs\n');

ok(oberstes([
  { key: 'dispo', z: 100, minimized: false },
  { key: 'fleet', z: 103, minimized: false },
]) === 'fleet', 'Das oberste Fenster gilt als Herkunft');

ok(oberstes([
  { key: 'dispo', z: 100, minimized: false },
  { key: 'fleet', z: 103, minimized: true },
]) === 'dispo', 'Minimierte Fenster zählen nicht');

ok(oberstes([
  { key: 'fleet', z: 103, minimized: false },
  { key: 'training:1', z: 105, minimized: false },
], 'training:1') === 'fleet', 'Das eigene Fenster wird übersprungen');

ok(oberstes([]) === null, 'Ohne Fenster keine Herkunft');

ok(oberstes([{ key: 'a', z: 1, minimized: true }]) === null,
   'Nur minimierte Fenster ergeben keine Herkunft');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
