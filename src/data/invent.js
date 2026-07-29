/* Erfundene Kundschaft.

   Wird benutzt, solange Overpass noch nicht geantwortet hat, und bleibt,
   falls die Abfrage gar nicht durchkommt. Die Namen sind frei erfunden,
   die Standorte liegen in plausibler Entfernung rund um das Depot. */

const HAUSNAMEN = [
  'Brinkmann', 'Kowalski', 'Hübner', 'Waldschmidt', 'Petersen', 'Rothaug',
  'Vogelsang', 'Lindqvist', 'Delbrück', 'Ostermann', 'Kienzle', 'Marek',
  'Sauerbier', 'Ahrenkiel', 'Bültmann', 'Gerlach', 'Nowak', 'Steinkamp',
];

const ORTSTEILE = [
  'Nord', 'Süd', 'West', 'Ost', 'am Kanal', 'im Bruch', 'an der Heide',
  'Hafen', 'Feld', 'Aue', 'Berg', 'Moor',
];

const BRANCHEN = [
  ['Kunststofftechnik',   'Werk'],
  ['Baustoffe',           'Industrie'],
  ['Möbelwerke',          'Möbelhaus'],
  ['Landhandel',          'Lager'],
  ['Getränkelogistik',    'Lager'],
  ['Metallbau',           'Werk'],
  ['Papierwerk',          'Werk'],
  ['Futtermittel',        'Lager'],
  ['Fliesenhandel',       'Baumarkt'],
  ['Kühlhaus',            'Lager'],
  ['Maschinenbau',        'Werk'],
  ['Elektrotechnik',      'Werk'],
  ['Verpackungen',        'Werk'],
  ['Holzwerk',            'Werk'],
  ['Chemiehandel',        'Industrie'],
  ['Textilservice',       'Industrie'],
  ['Kaffeerösterei',      'Werk'],
  ['Privatbrauerei',      'Werk'],
  ['Baumarkt',            'Baumarkt'],
  ['Wohnwelt',            'Möbelhaus'],
  ['Zementwerk',          'Werk'],
  ['Saatgut',             'Lager'],
];

const FORMEN = ['GmbH', 'GmbH & Co. KG', 'KG', 'AG', '& Söhne', 'e.K.'];

const pick = a => a[Math.floor(Math.random() * a.length)];

function inventName() {
  const [branche, kind] = pick(BRANCHEN);
  const stil = Math.random();

  let name;
  if (stil < 0.45) {
    name = `${pick(HAUSNAMEN)} ${branche} ${pick(FORMEN)}`;
  } else if (stil < 0.75) {
    name = `${branche} ${pick(ORTSTEILE)}`;
  } else {
    name = `${pick(HAUSNAMEN)} ${pick(ORTSTEILE)} ${pick(FORMEN)}`;
  }
  return { name, kind };
}

/* Punkt in gegebener Entfernung und Richtung vom Depot */
function offset(depot, km, bearingDeg) {
  const rad = Math.PI / 180;
  const dLat = km / 111.32;
  const dLon = km / (111.32 * Math.cos(depot.lat * rad));
  return {
    lat: depot.lat + dLat * Math.cos(bearingDeg * rad),
    lon: depot.lon + dLon * Math.sin(bearingDeg * rad),
  };
}

export function inventFirms(depot, count = 40) {
  const firms = [];
  const used = new Set();

  while (firms.length < count) {
    const { name, kind } = inventName();
    if (used.has(name)) continue;
    used.add(name);

    /* Entfernungen so streuen, dass es kurze und lange Touren gibt */
    const km = 12 + Math.random() * Math.random() * 130;
    const { lat, lon } = offset(depot, km, Math.random() * 360);

    firms.push({ name, lat, lon, km, kind, tags: {}, invented: true });
  }

  return firms.sort((a, b) => a.km - b.km);
}
