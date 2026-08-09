/* Reserve, falls Overpass nicht antwortet.

   Erfundene Betriebe an plausiblen Industriestandorten, damit das Spiel
   auch dann läuft, wenn der öffentliche Overpass-Dienst überlastet ist.
   Die Namen sind bewusst abgewandelt und benennen keine wirklichen
   Unternehmen. Sobald die Abfrage klappt, treten die tatsächlichen
   OSM-Daten an ihre Stelle. */

const LISTS = {
  HH: [
    ['Nordwerft Flugzeugbau',      53.5350,  9.8355, 'Werk'],
    ['Elbkupfer Hütte',            53.5300, 10.0200, 'Werk'],
    ['Hansa Kosmetikwerke',        53.5860, 10.0430, 'Werk'],
    ['Containerterminal Süderelbe',53.5300,  9.9200, 'Lager'],
    ['Katalog Versandzentrum',     53.6100, 10.0800, 'Lager'],
    ['Luftfahrt Technik Nord',     53.6300, 10.0000, 'Werk'],
    ['Staplerbau Billbrook',       53.5350, 10.0800, 'Werk'],
    ['Flurförder Norderstedt',     53.6900,  9.9900, 'Werk'],
    ['Elbtor Brauerei',            53.5700,  9.8900, 'Werk'],
    ['Medizintechnik Trave',       53.8700, 10.6900, 'Werk'],
    ['Lübecker Handelskontor',     53.8600, 10.6800, 'Industrie'],
    ['Kühlhaus Este',              53.4700,  9.7000, 'Lager'],
  ],
  B: [
    ['Motorradwerk Spree',         52.5400, 13.3300, 'Werk'],
    ['Elektrotechnik Havelland',   52.5350, 13.2600, 'Werk'],
    ['Elektroauto Werk Grünheide', 52.3960, 13.8000, 'Werk'],
    ['Nutzfahrzeuge Marienfelde',  52.4160, 13.3670, 'Werk'],
    ['Hauptstadt Brauerei',        52.4700, 13.4400, 'Werk'],
    ['Getränkeabfüllung Lichtenberg', 52.5500, 13.5000, 'Werk'],
    ['Triebwerkbau Dahlewitz',     52.3300, 13.4700, 'Werk'],
    ['Pharmawerk Wedding',         52.5450, 13.3500, 'Werk'],
    ['Güterverkehrszentrum West',  52.5500, 12.9600, 'Lager'],
    ['Verteilzentrum Ludwigsfelde',52.3000, 13.2600, 'Lager'],
    ['Transporterwerk Teltow',     52.2900, 13.2500, 'Werk'],
    ['Versandlogistik Falkensee',  52.5600, 13.0900, 'Lager'],
  ],
  K: [
    ['Automobilwerk Niehl',        50.9900,  6.9500, 'Werk'],
    ['Chemiepark Leverkusen',      51.0300,  6.9800, 'Werk'],
    ['Kunststoffwerk Dormagen',    51.0900,  6.8300, 'Werk'],
    ['Petrochemie Rheinufer',      50.9900,  6.9200, 'Werk'],
    ['Importlager Marsdorf',       50.9200,  6.8300, 'Lager'],
    ['Handelszentrale Rhein',      50.9400,  6.9700, 'Lager'],
    ['Motorenwerk Rheinaue',       50.9500,  6.9900, 'Werk'],
    ['Achsenbau Oberberg',         50.9500,  7.5400, 'Werk'],
    ['Haushaltsgeräte Wupper',     51.2600,  7.1500, 'Werk'],
    ['Waschmittelwerk Düssel',     51.2200,  6.8200, 'Werk'],
    ['Großbäckerei Würselen',      50.8200,  6.1400, 'Werk'],
    ['Zentrallager Bonn Nord',     50.7600,  7.0800, 'Lager'],
  ],
  F: [
    ['Automobilwerk Rüsselsheim',  49.9900,  8.4200, 'Werk'],
    ['Industriepark Höchst',       50.0900,  8.5300, 'Werk'],
    ['Luftfracht Terminal Süd',    50.0400,  8.5700, 'Lager'],
    ['Feinchemie Darmstadt',       49.8700,  8.6600, 'Werk'],
    ['Fahrzeugelektronik Babenhausen', 49.9600, 8.9500, 'Werk'],
    ['Armaturenwerk Offenbach',    50.0900,  8.7000, 'Werk'],
    ['Dachziegelwerk Heusenstamm', 50.0500,  8.8000, 'Werk'],
    ['Apfelwein Kelterei',         50.1100,  8.7100, 'Werk'],
    ['Sendetechnik Main',          50.1300,  8.6900, 'Industrie'],
    ['Speditionsterminal Hanau',   50.1300,  8.9200, 'Lager'],
    ['Edelmetallwerk Hanau',       50.1200,  8.9300, 'Werk'],
    ['Schaltschrankbau Dilltal',   50.6800,  8.3000, 'Werk'],
  ],
  M: [
    ['Automobilwerk Isar',         48.1780, 11.5560, 'Werk'],
    ['Lastwagenwerk Karlsfeld',    48.2100, 11.4600, 'Werk'],
    ['Maschinenbau Allach',        48.1900, 11.4700, 'Werk'],
    ['Elektrotechnik Perlach',     48.1000, 11.6400, 'Werk'],
    ['Industriegase Pullach',      48.0600, 11.5200, 'Werk'],
    ['Halbleiterwerk Neubiberg',   48.0700, 11.6300, 'Werk'],
    ['Fahrzeugbau Donaumoos',      48.7900, 11.4200, 'Werk'],
    ['Weißbierbrauerei Langwied',  48.1700, 11.4400, 'Werk'],
    ['Verteilzentrum Garching',    48.2500, 11.6500, 'Lager'],
    ['Fahrzeugtechnik Gilching',   48.1100, 11.2900, 'Werk'],
    ['Messtechnik Bayerwald',      49.0000, 12.9800, 'Werk'],
    ['Zentrallager Lechfeld',      48.0500, 10.8800, 'Lager'],
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
