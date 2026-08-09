import { CITIES } from '../src/data/cities.js';
import { ersatzPlatz } from '../src/data/depotsite.js';
import { haversine } from '../src/util.js';

console.log('\nErsatzplätze, falls Overpass nicht antwortet:\n');
let fehler = 0;
for (const stadt of CITIES.slice(0, 8)) {
  const p = ersatzPlatz(stadt);
  const km = haversine(stadt, p);
  const ok = km > 4 && km < 8;
  if (!ok) fehler++;
  console.log(`  ${ok?'✓':'✗'} ${stadt.name.padEnd(13)} ${km.toFixed(1)} km vom Zentrum`);
}

/* Alle Städte auf Plausibilität */
console.log('\nAlle 42 Städte:');
let schlecht = 0;
for (const s of CITIES) {
  const p = ersatzPlatz(s);
  const km = haversine(s, p);
  if (!(km > 4 && km < 8)) { schlecht++; console.log('  ✗', s.name, km.toFixed(1)); }
  if (!(s.lat > 47 && s.lat < 55 && s.lon > 5.5 && s.lon < 15.5)) {
    console.log('  ✗ Koordinate außerhalb Deutschlands:', s.name, s.lat, s.lon);
    schlecht++;
  }
}
console.log(schlecht ? `  ${schlecht} auffällig` : '  alle plausibel');

/* Doppelte Schlüssel? */
const keys = CITIES.map(c => c.key);
const doppelt = keys.filter((k,i) => keys.indexOf(k) !== i);
console.log(doppelt.length ? '  doppelte Schlüssel: ' + doppelt : '  alle Schlüssel eindeutig');

/* Regionen müssen alle Städte abdecken */
const { REGIONEN } = await import('../src/data/cities.js');
const zugeordnet = Object.values(REGIONEN).flat();
const ohne = CITIES.filter(c => !zugeordnet.includes(c.key));
console.log(ohne.length ? '  ohne Region: ' + ohne.map(c=>c.key).join(',') : '  alle Städte einer Region zugeordnet');

const gesamt = fehler + schlecht + doppelt.length + ohne.length;
console.log(gesamt ? `\n${gesamt} Fehler\n` : '\nAlles in Ordnung\n');
process.exit(gesamt ? 1 : 0);
