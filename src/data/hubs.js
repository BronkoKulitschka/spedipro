/* Umschlagpunkte in ganz Deutschland.

   Frachtflughäfen, Güterbahnhöfe und Häfen. Sie liegen über die Republik
   verteilt und sorgen für den Fernverkehr — anders als die Betriebe im
   Umkreis des Depots, die den Nahverkehr abbilden.

   bonus wirkt auf den Frachtpreis: Umschlagverkehr zahlt besser, weil die
   Ladung terminiert ist und die Abfertigung Zeit kostet. */

export const HUBS = [
  /* ── Frachtflughäfen ── */
  { name: 'Flughafen Frankfurt, CargoCity Süd', lat: 50.0379, lon:  8.5622, art: 'Flughafen',    bonus: 1.25 },
  { name: 'Flughafen Leipzig/Halle, Frachtzentrum', lat: 51.4239, lon: 12.2364, art: 'Flughafen', bonus: 1.25 },
  { name: 'Flughafen Köln/Bonn, Cargo',        lat: 50.8659, lon:  7.1427, art: 'Flughafen',    bonus: 1.22 },
  { name: 'Flughafen München, Cargogate',      lat: 48.3538, lon: 11.7861, art: 'Flughafen',    bonus: 1.22 },
  { name: 'Flughafen Hahn, Frachtterminal',    lat: 49.9487, lon:  7.2639, art: 'Flughafen',    bonus: 1.20 },
  { name: 'Flughafen Hamburg, Frachtbereich',  lat: 53.6304, lon:  9.9882, art: 'Flughafen',    bonus: 1.18 },
  { name: 'Flughafen Stuttgart, Cargo',        lat: 48.6899, lon:  9.2210, art: 'Flughafen',    bonus: 1.18 },
  { name: 'Flughafen Berlin Brandenburg, Cargo', lat: 52.3667, lon: 13.5033, art: 'Flughafen',  bonus: 1.18 },

  /* ── Seehäfen ── */
  { name: 'Hamburger Hafen, Burchardkai',      lat: 53.5296, lon:  9.9207, art: 'Seehafen',     bonus: 1.30 },
  { name: 'Bremerhaven, Containerterminal',    lat: 53.5847, lon:  8.5300, art: 'Seehafen',     bonus: 1.30 },
  { name: 'JadeWeserPort Wilhelmshaven',       lat: 53.5906, lon:  8.1067, art: 'Seehafen',     bonus: 1.28 },
  { name: 'Seehafen Rostock',                  lat: 54.1500, lon: 12.1000, art: 'Seehafen',     bonus: 1.26 },
  { name: 'Lübeck-Travemünde, Skandinavienkai', lat: 53.9500, lon: 10.8700, art: 'Seehafen',    bonus: 1.24 },
  { name: 'Seehafen Kiel, Ostuferhafen',       lat: 54.3300, lon: 10.1600, art: 'Seehafen',     bonus: 1.22 },
  { name: 'Hafen Emden',                       lat: 53.3400, lon:  7.1900, art: 'Seehafen',     bonus: 1.22 },

  /* ── Binnenhäfen ── */
  { name: 'Duisburg, Duisport Logport',        lat: 51.4400, lon:  6.7200, art: 'Binnenhafen',  bonus: 1.24 },
  { name: 'Hafen Mannheim',                    lat: 49.5000, lon:  8.4500, art: 'Binnenhafen',  bonus: 1.18 },
  { name: 'Hafen Köln-Niehl',                  lat: 50.9900, lon:  6.9600, art: 'Binnenhafen',  bonus: 1.16 },
  { name: 'Hafen Magdeburg',                   lat: 52.1600, lon: 11.6900, art: 'Binnenhafen',  bonus: 1.16 },
  { name: 'Hafen Regensburg',                  lat: 49.0200, lon: 12.1300, art: 'Binnenhafen',  bonus: 1.16 },

  /* ── Güterbahnhöfe und Terminals ── */
  { name: 'Güterbahnhof Hamburg-Billwerder',   lat: 53.5100, lon: 10.1200, art: 'Güterbahnhof', bonus: 1.15 },
  { name: 'Terminal Köln Eifeltor',            lat: 50.9100, lon:  6.9200, art: 'Güterbahnhof', bonus: 1.15 },
  { name: 'Terminal München-Riem',             lat: 48.1300, lon: 11.6900, art: 'Güterbahnhof', bonus: 1.15 },
  { name: 'Terminal Nürnberg Hafen',           lat: 49.4100, lon: 11.1200, art: 'Güterbahnhof', bonus: 1.14 },
  { name: 'Terminal Hannover-Lehrte',          lat: 52.3800, lon:  9.9700, art: 'Güterbahnhof', bonus: 1.14 },
  { name: 'Terminal Kornwestheim',             lat: 48.8600, lon:  9.1800, art: 'Güterbahnhof', bonus: 1.14 },
  { name: 'Terminal Leipzig-Wahren',           lat: 51.3800, lon: 12.3200, art: 'Güterbahnhof', bonus: 1.14 },
  { name: 'Terminal Ludwigshafen KTL',         lat: 49.4800, lon:  8.4300, art: 'Güterbahnhof', bonus: 1.13 },
  { name: 'Terminal Dresden-Friedrichstadt',   lat: 51.0600, lon: 13.7100, art: 'Güterbahnhof', bonus: 1.13 },
  { name: 'Terminal Bremen Grolland',          lat: 53.0500, lon:  8.7600, art: 'Güterbahnhof', bonus: 1.13 },
];

export const HUB_ICON = {
  Flughafen:    '✈️',
  Seehafen:     '⚓',
  Binnenhafen:  '🛥️',
  Güterbahnhof: '🚉',
};

import { haversine } from '../util.js';

/* Umschlagpunkte als Kundschaft aufbereiten, mit Entfernung zum Depot. */
export function hubsFor(depot) {
  return HUBS
    .map(h => ({
      ...h,
      kind: h.art,
      km: haversine(depot, h),
      hub: true,
    }))
    .filter(h => h.km > 15);
}
