import { pointOnRoute, haversine } from '../src/util.js';

const c = [];
for (let i = 0; i <= 10; i++) c.push([53.0 + i*0.05, 10.0]);
const laenge = haversine({lat:53.0,lon:10.0},{lat:53.5,lon:10.0});

let fehler = 0;
const pruef = (bed, text) => { console.log(`  ${bed?'✓':'✗'} ${text}`); if(!bed) fehler++; };

console.log('\nPosition auf der Route\n');

const r1 = { km: laenge, coords: c.map(p=>[...p]) };
for (const a of [0, 0.25, 0.5, 0.75, 1]) {
  const p = pointOnRoute(r1, r1.km * a);
  const soll = 53.0 + 0.5 * a;
  pruef(Math.abs(p[0]-soll) < 0.001, `${(a*100).toString().padStart(3)} % → ${p[0].toFixed(4)} (soll ${soll.toFixed(4)})`);
}

const r2 = { km: laenge * 1.28, coords: [[53.0,10.0],[53.5,10.0]] };
pruef(Math.abs(pointOnRoute(r2, r2.km*0.5)[0] - 53.25) < 0.001, 'Luftlinie mit Umwegfaktor, Mitte');
pruef(Math.abs(pointOnRoute(r2, r2.km)[0] - 53.5) < 0.001, 'Luftlinie, Ende');

pruef(Math.abs(pointOnRoute(r1, r1.km*1.5)[0] - 53.5) < 0.001, 'progress über das Ziel hinaus bleibt am Ende');
pruef(Math.abs(pointOnRoute(r1, -50)[0] - 53.0) < 0.001, 'negativer progress bleibt am Anfang');

const r4 = { km: 50, coords: [[52.0,9.0],[52.2,9.0]], cum: r1.cum };
const p4 = pointOnRoute(r4, 25);
pruef(p4 && Math.abs(p4[0]-52.1) < 0.01, `fremder Zwischenspeicher wird verworfen → ${p4?.[0].toFixed(3)}`);

pruef(pointOnRoute({km:10, coords:[]}, 5) === null, 'leere Route liefert nichts');
pruef(pointOnRoute({km:10, coords:[[53,10]]}, 5)[0] === 53, 'Route mit einem Punkt');
pruef(pointOnRoute({km:0, coords:c}, 0)[0] === 53, 'Route ohne Länge');

const doppelt = { km: 10, coords: [[53,10],[53,10],[53.1,10]] };
pruef(pointOnRoute(doppelt, 5) !== null, 'doppelte Punkte in der Geometrie');

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler?1:0);
