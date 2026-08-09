/* Prüft die Bewertung bei der freien Standortwahl.

   Die Netzabfrage selbst lässt sich hier nicht testen — geprüft wird
   die Logik, welcher von mehreren Orten gewählt wird.

   Aufruf: node test/places.mjs
*/

import { haversine } from '../src/util.js';

let fehler = 0;
const ok = (bedingung, text) => {
  console.log(`  ${bedingung ? '✓' : '✗'} ${text}`);
  if (!bedingung) fehler++;
};

/* Nachbau der Bewertung aus data/placelookup.js */
const wertung = (ort, punkt) => {
  const km = haversine(punkt, ort);
  return (ort.ew ** 0.35) / Math.max(1.5, km);
};

const beste = (orte, punkt) =>
  [...orte].sort((a, b) => wertung(b, punkt) - wertung(a, punkt))[0];

console.log('\nAuswahl des Ortes bei freier Standortwahl\n');

/* Auf dem Land: das Dorf nebenan schlägt die ferne Großstadt */
{
  const punkt = { lat: 52.0, lon: 9.0 };
  const orte = [
    { name: 'Dorf',       lat: 52.01, lon: 9.01, ew: 2 },
    { name: 'Kleinstadt', lat: 52.05, lon: 9.05, ew: 25 },
    { name: 'Großstadt',  lat: 52.15, lon: 9.20, ew: 500 },
  ];
  ok(beste(orte, punkt).name === 'Dorf', 'Nächstgelegener Ort gewinnt auf dem Land');
}

/* In einer Stadt: der Stadtname schlägt den Vorort bei gleicher Nähe */
{
  const punkt = { lat: 53.55, lon: 9.99 };
  const orte = [
    { name: 'Vorort',    lat: 53.552, lon: 9.992, ew: 8 },
    { name: 'Großstadt', lat: 53.551, lon: 9.993, ew: 1900 },
  ];
  ok(beste(orte, punkt).name === 'Großstadt', 'Bei gleicher Nähe gewinnt der größere Ort');
}

/* Sehr nah: Entfernungen unter 1,5 km werden gleich behandelt,
   damit nicht jeder Meter den Ausschlag gibt */
{
  const punkt = { lat: 50.0, lon: 8.0 };
  const orte = [
    { name: 'Winziges Dorf', lat: 50.001, lon: 8.001, ew: 1 },
    { name: 'Stadt',         lat: 50.008, lon: 8.008, ew: 60 },
  ];
  ok(beste(orte, punkt).name === 'Stadt', 'Innerhalb von 1,5 km entscheidet die Größe');
}

/* Ein einzelner Ort wird immer genommen */
{
  const punkt = { lat: 51.0, lon: 11.0 };
  const orte = [{ name: 'Einsamer Weiler', lat: 51.1, lon: 11.1, ew: 1 }];
  ok(beste(orte, punkt).name === 'Einsamer Weiler', 'Einziger Ort wird gewählt');
}

console.log(fehler ? `\n${fehler} Fehler\n` : '\nAlles richtig\n');
process.exit(fehler ? 1 : 0);
