/* Standorte für das Depot.

   Die Koordinaten bezeichnen die Stadtmitte. Wo genau das Depot
   entsteht, wird beim Start über Overpass gesucht — in einem echten
   Gewerbegebiet am Stadtrand, so wie eine Spedition wirklich liegt.

   einwohner in Tausend, dient nur zur Einordnung in der Auswahl.       */

export const CITIES = [
  /* ── Norden ── */
  { key: 'HH',  name: 'Hamburg',      land: 'Hamburg',              lat: 53.5511, lon:  9.9937, einwohner: 1900, text: 'Größter Seehafen des Landes, viel Umschlag.' },
  { key: 'HB',  name: 'Bremen',       land: 'Bremen',               lat: 53.0793, lon:  8.8017, einwohner:  570, text: 'Hafenstadt mit starker Automobilzulieferung.' },
  { key: 'BHV', name: 'Bremerhaven',  land: 'Bremen',               lat: 53.5396, lon:  8.5809, einwohner:  113, text: 'Containerhafen, viel Fernverkehr.' },
  { key: 'KI',  name: 'Kiel',         land: 'Schleswig-Holstein',   lat: 54.3233, lon: 10.1228, einwohner:  247, text: 'Fährverkehr nach Skandinavien.' },
  { key: 'HL',  name: 'Lübeck',       land: 'Schleswig-Holstein',   lat: 53.8655, lon: 10.6866, einwohner:  217, text: 'Ostseehafen, Lebensmittelindustrie.' },
  { key: 'HRO', name: 'Rostock',      land: 'Mecklenburg-Vorpommern', lat: 54.0924, lon: 12.0991, einwohner: 209, text: 'Ostseehafen im Nordosten.' },
  { key: 'OL',  name: 'Oldenburg',    land: 'Niedersachsen',        lat: 53.1435, lon:  8.2146, einwohner:  170, text: 'Agrar und Ernährungswirtschaft.' },
  { key: 'OS',  name: 'Osnabrück',    land: 'Niedersachsen',        lat: 52.2799, lon:  8.0472, einwohner:  165, text: 'Knotenpunkt zwischen Ruhrgebiet und Norden.' },

  /* ── Westen ── */
  { key: 'H',   name: 'Hannover',     land: 'Niedersachsen',        lat: 52.3759, lon:  9.7320, einwohner:  535, text: 'Zentrale Lage, große Messe.' },
  { key: 'BS',  name: 'Braunschweig', land: 'Niedersachsen',        lat: 52.2689, lon: 10.5268, einwohner:  249, text: 'Fahrzeugbau und Forschung.' },
  { key: 'DO',  name: 'Dortmund',     land: 'Nordrhein-Westfalen',  lat: 51.5136, lon:  7.4653, einwohner:  588, text: 'Mitten im Ruhrgebiet, dichtes Netz.' },
  { key: 'E',   name: 'Essen',        land: 'Nordrhein-Westfalen',  lat: 51.4556, lon:  7.0116, einwohner:  583, text: 'Industrieller Kern des Ruhrgebiets.' },
  { key: 'DU',  name: 'Duisburg',     land: 'Nordrhein-Westfalen',  lat: 51.4344, lon:  6.7623, einwohner:  498, text: 'Größter Binnenhafen Europas.' },
  { key: 'K',   name: 'Köln',         land: 'Nordrhein-Westfalen',  lat: 50.9375, lon:  6.9603, einwohner: 1080, text: 'Chemie, Automobil, Rheinschiene.' },
  { key: 'D',   name: 'Düsseldorf',   land: 'Nordrhein-Westfalen',  lat: 51.2277, lon:  6.7735, einwohner:  620, text: 'Handel und Dienstleistung am Rhein.' },
  { key: 'MS',  name: 'Münster',      land: 'Nordrhein-Westfalen',  lat: 51.9607, lon:  7.6261, einwohner:  318, text: 'Ländliches Umland, viel Agrarverkehr.' },
  { key: 'BI',  name: 'Bielefeld',    land: 'Nordrhein-Westfalen',  lat: 52.0302, lon:  8.5325, einwohner:  334, text: 'Maschinenbau in Ostwestfalen.' },
  { key: 'AC',  name: 'Aachen',       land: 'Nordrhein-Westfalen',  lat: 50.7753, lon:  6.0839, einwohner:  249, text: 'Dreiländereck, viel Grenzverkehr.' },

  /* ── Mitte ── */
  { key: 'F',   name: 'Frankfurt',    land: 'Hessen',               lat: 50.1109, lon:  8.6821, einwohner:  764, text: 'Größter Frachtflughafen, zentrale Lage.' },
  { key: 'WI',  name: 'Wiesbaden',    land: 'Hessen',               lat: 50.0782, lon:  8.2398, einwohner:  278, text: 'Rhein-Main-Gebiet, Chemieindustrie.' },
  { key: 'KS',  name: 'Kassel',       land: 'Hessen',               lat: 51.3127, lon:  9.4797, einwohner:  201, text: 'Geografische Mitte, ideal für Fernverkehr.' },
  { key: 'MZ',  name: 'Mainz',        land: 'Rheinland-Pfalz',      lat: 49.9929, lon:  8.2473, einwohner:  218, text: 'Rheinhafen und Pharmaindustrie.' },
  { key: 'LU',  name: 'Ludwigshafen', land: 'Rheinland-Pfalz',      lat: 49.4741, lon:  8.4400, einwohner:  172, text: 'Größter Chemiestandort Europas.' },
  { key: 'SB',  name: 'Saarbrücken',  land: 'Saarland',             lat: 49.2402, lon:  6.9969, einwohner:  180, text: 'Grenznah zu Frankreich, Stahl.' },
  { key: 'EF',  name: 'Erfurt',       land: 'Thüringen',            lat: 50.9848, lon: 11.0299, einwohner:  214, text: 'Logistikdrehscheibe in der Mitte.' },

  /* ── Osten ── */
  { key: 'B',   name: 'Berlin',       land: 'Berlin',               lat: 52.5200, lon: 13.4050, einwohner: 3700, text: 'Größter Absatzmarkt, viel Verteilverkehr.' },
  { key: 'P',   name: 'Potsdam',      land: 'Brandenburg',          lat: 52.3906, lon: 13.0645, einwohner:  183, text: 'Berliner Umland, wachsende Gewerbegebiete.' },
  { key: 'L',   name: 'Leipzig',      land: 'Sachsen',              lat: 51.3397, lon: 12.3731, einwohner:  616, text: 'Frachtflughafen und Automobilwerke.' },
  { key: 'DD',  name: 'Dresden',      land: 'Sachsen',              lat: 51.0504, lon: 13.7373, einwohner:  563, text: 'Halbleiter und Feinmechanik.' },
  { key: 'C',   name: 'Chemnitz',     land: 'Sachsen',              lat: 50.8278, lon: 12.9214, einwohner:  243, text: 'Maschinenbau im Erzgebirgsvorland.' },
  { key: 'MD',  name: 'Magdeburg',    land: 'Sachsen-Anhalt',       lat: 52.1205, lon: 11.6276, einwohner:  238, text: 'Elbhafen, Schwermaschinenbau.' },
  { key: 'HAL', name: 'Halle',        land: 'Sachsen-Anhalt',       lat: 51.4825, lon: 11.9705, einwohner:  238, text: 'Chemiedreieck, nah am Flughafen Leipzig.' },

  /* ── Süden ── */
  { key: 'S',   name: 'Stuttgart',    land: 'Baden-Württemberg',    lat: 48.7758, lon:  9.1829, einwohner:  630, text: 'Automobilbau und Zulieferer.' },
  { key: 'KA',  name: 'Karlsruhe',    land: 'Baden-Württemberg',    lat: 49.0069, lon:  8.4037, einwohner:  308, text: 'Rheinhafen, Nähe zu Frankreich.' },
  { key: 'MA',  name: 'Mannheim',     land: 'Baden-Württemberg',    lat: 49.4875, lon:  8.4660, einwohner:  311, text: 'Binnenhafen und Nutzfahrzeugbau.' },
  { key: 'UL',  name: 'Ulm',          land: 'Baden-Württemberg',    lat: 48.4011, lon:  9.9876, einwohner:  127, text: 'An der Achse Stuttgart–München.' },
  { key: 'FR',  name: 'Freiburg',     land: 'Baden-Württemberg',    lat: 47.9990, lon:  7.8421, einwohner:  231, text: 'Südwestecke, Verkehr in die Schweiz.' },
  { key: 'M',   name: 'München',      land: 'Bayern',               lat: 48.1372, lon: 11.5755, einwohner: 1490, text: 'Starke Industrie, Verkehr nach Süden.' },
  { key: 'N',   name: 'Nürnberg',     land: 'Bayern',               lat: 49.4521, lon: 11.0767, einwohner:  518, text: 'Großes Güterverkehrszentrum.' },
  { key: 'A',   name: 'Augsburg',     land: 'Bayern',               lat: 48.3705, lon: 10.8978, einwohner:  296, text: 'Zwischen München und Stuttgart.' },
  { key: 'R',   name: 'Regensburg',   land: 'Bayern',               lat: 49.0134, lon: 12.1016, einwohner:  153, text: 'Donauhafen, Fahrzeugbau.' },
  { key: 'WÜ',  name: 'Würzburg',     land: 'Bayern',               lat: 49.7913, lon:  9.9534, einwohner:  127, text: 'Kreuzung wichtiger Autobahnen.' },
];

export const cityByKey = key => CITIES.find(c => c.key === key);

/* Für die Gruppierung in der Auswahl */
export const REGIONEN = {
  Norden: ['HH','HB','BHV','KI','HL','HRO','OL','OS'],
  Westen: ['H','BS','DO','E','DU','K','D','MS','BI','AC'],
  Mitte:  ['F','WI','KS','MZ','LU','SB','EF'],
  Osten:  ['B','P','L','DD','C','MD','HAL'],
  Süden:  ['S','KA','MA','UL','FR','M','N','A','R','WÜ'],
};
