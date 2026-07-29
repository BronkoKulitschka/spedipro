/* Reserve, falls Overpass nicht antwortet.

   Echte Betriebe mit ungefähren Koordinaten, damit das Spiel auch dann
   läuft, wenn der öffentliche Overpass-Dienst überlastet ist. Sobald die
   Abfrage wieder klappt, werden diese Einträge durch die tatsächlichen
   OSM-Daten ersetzt. */

const LISTS = {
  HH: [
    ['Airbus Finkenwerder',        53.5350,  9.8355, 'Werk'],
    ['Aurubis Kupferhütte',        53.5300, 10.0200, 'Werk'],
    ['Beiersdorf Eimsbüttel',      53.5860, 10.0430, 'Werk'],
    ['Burchardkai Container',      53.5300,  9.9200, 'Lager'],
    ['Otto Versandzentrum',        53.6100, 10.0800, 'Lager'],
    ['Lufthansa Technik',          53.6300, 10.0000, 'Werk'],
    ['Still Gabelstapler',         53.5350, 10.0800, 'Werk'],
    ['Jungheinrich Norderstedt',   53.6900,  9.9900, 'Werk'],
    ['Holsten Brauerei',           53.5700,  9.8900, 'Werk'],
    ['Dräger Lübeck',              53.8700, 10.6900, 'Werk'],
    ['Possehl Lübeck',             53.8600, 10.6800, 'Industrie'],
    ['Nordfrost Buxtehude',        53.4700,  9.7000, 'Lager'],
  ],
  B: [
    ['BMW Motorrad Berlin',        52.5400, 13.3300, 'Werk'],
    ['Siemens Spandau',            52.5350, 13.2600, 'Werk'],
    ['Tesla Grünheide',            52.3960, 13.8000, 'Werk'],
    ['Mercedes Marienfelde',       52.4160, 13.3670, 'Werk'],
    ['Berliner Kindl Brauerei',    52.4700, 13.4400, 'Werk'],
    ['Coca-Cola Hohenschönhausen', 52.5500, 13.5000, 'Werk'],
    ['Rolls-Royce Dahlewitz',      52.3300, 13.4700, 'Werk'],
    ['Bayer Pharma Wedding',       52.5450, 13.3500, 'Werk'],
    ['Güterverkehrszentrum Wustermark', 52.5500, 12.9600, 'Lager'],
    ['Kaufland Verteilzentrum Ludwigsfelde', 52.3000, 13.2600, 'Lager'],
    ['Mercedes Ludwigsfelde',      52.2900, 13.2500, 'Werk'],
    ['Arvato Falkensee',           52.5600, 13.0900, 'Lager'],
  ],
  K: [
    ['Ford Werke Niehl',           50.9900,  6.9500, 'Werk'],
    ['Bayer Leverkusen',           51.0300,  6.9800, 'Werk'],
    ['Lanxess Dormagen',           51.0900,  6.8300, 'Werk'],
    ['Ineos Köln',                 50.9900,  6.9200, 'Werk'],
    ['Toyota Deutschland Marsdorf',50.9200,  6.8300, 'Lager'],
    ['REWE Zentrale',              50.9400,  6.9700, 'Lager'],
    ['Deutz AG',                   50.9500,  6.9900, 'Werk'],
    ['Bergische Achsen Wiehl',     50.9500,  7.5400, 'Werk'],
    ['Vorwerk Wuppertal',          51.2600,  7.1500, 'Werk'],
    ['Henkel Düsseldorf',          51.2200,  6.8200, 'Werk'],
    ['Kronenbrot Würselen',        50.8200,  6.1400, 'Werk'],
    ['Zentrallager Bonn Nord',     50.7600,  7.0800, 'Lager'],
  ],
  F: [
    ['Opel Rüsselsheim',           49.9900,  8.4200, 'Werk'],
    ['Sanofi Industriepark Höchst',50.0900,  8.5300, 'Werk'],
    ['Fraport Cargo City Süd',     50.0400,  8.5700, 'Lager'],
    ['Merck Darmstadt',            49.8700,  8.6600, 'Werk'],
    ['Continental Babenhausen',    49.9600,  8.9500, 'Werk'],
    ['Samson Offenbach',           50.0900,  8.7000, 'Werk'],
    ['Braas Heusenstamm',          50.0500,  8.8000, 'Werk'],
    ['Binding Brauerei',           50.1100,  8.7100, 'Werk'],
    ['Hessischer Rundfunk Technik',50.1300,  8.6900, 'Industrie'],
    ['Schenker Terminal Hanau',    50.1300,  8.9200, 'Lager'],
    ['Heraeus Hanau',              50.1200,  8.9300, 'Werk'],
    ['Rittal Herborn',             50.6800,  8.3000, 'Werk'],
  ],
  M: [
    ['BMW Werk München',           48.1780, 11.5560, 'Werk'],
    ['MAN Truck Karlsfeld',        48.2100, 11.4600, 'Werk'],
    ['Krauss-Maffei Allach',       48.1900, 11.4700, 'Werk'],
    ['Siemens Perlach',            48.1000, 11.6400, 'Werk'],
    ['Linde Pullach',              48.0600, 11.5200, 'Werk'],
    ['Infineon Neubiberg',         48.0700, 11.6300, 'Werk'],
    ['Audi Ingolstadt',            48.7900, 11.4200, 'Werk'],
    ['Paulaner Langwied',          48.1700, 11.4400, 'Werk'],
    ['Amazon Verteilzentrum Garching', 48.2500, 11.6500, 'Lager'],
    ['Webasto Gilching',           48.1100, 11.2900, 'Werk'],
    ['Rohde & Schwarz Teisnach',   49.0000, 12.9800, 'Werk'],
    ['Zentrallager Landsberg',     48.0500, 10.8800, 'Lager'],
  ],
};

import { haversine } from '../util.js';

export function fallbackFirms(depot) {
  const list = LISTS[depot.key] || [];
  return list.map(([name, lat, lon, kind]) => ({
    name, lat, lon, kind,
    km: haversine(depot, { lat, lon }),
    tags: {},
    fallback: true,
  }));
}
