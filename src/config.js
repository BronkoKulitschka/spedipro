/* Alle Stellschrauben an einem Ort. */

export const DEPOTS = [
  { key: 'HH', name: 'Hamburg',   lat: 53.5461, lon:  9.9661 },
  { key: 'B',  name: 'Berlin',    lat: 52.5200, lon: 13.4050 },
  { key: 'K',  name: 'Köln',      lat: 50.9375, lon:  6.9603 },
  { key: 'F',  name: 'Frankfurt', lat: 50.1109, lon:  8.6821 },
  { key: 'M',  name: 'München',   lat: 48.1372, lon: 11.5755 },
];

/* Welche Autobahnen beim Start abgefragt werden.
   Mehr Einträge bedeuten mehr Meldungen, aber längere Ladezeit. */
export const AUTOBAHNEN = [
  'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A24','A31','A45','A61','A81','A99',
];

export const SKILLS = {
  eco:   { name: 'Spritsparen',      icon: '⛽',  max: 4, per: '−7 % Diesel je Stufe' },
  route: { name: 'Streckenkenntnis', icon: '🗺️', max: 4, per: '+5 km/h Schnitt je Stufe' },
  deal:  { name: 'Verhandlung',      icon: '🤝', max: 4, per: '+6 % Frachterlös je Stufe' },
  care:  { name: 'Fahrzeugpflege',   icon: '🔧', max: 4, per: '−25 % Pannenrisiko je Stufe' },
  calm:  { name: 'Gelassenheit',     icon: '🧘', max: 4, per: '−15 % Stauzeitverlust je Stufe' },
};

export const DRIVER_NAMES = [
  'Kurt','Heike','Ali','Renate','Jörg','Mia','Bernd','Sandra','Tomasz',
  'Fatma','Uwe','Nadine','Piet','Karin','Manfred','Ayla','Detlef','Svenja',
];

/* Ruhige Ereignisse. Vieles ist reine Stimmung ohne Geldwirkung. */
export const EVENTS = [
  { icon: '📦', text: 'Ein Stammkunde legt spontan eine Palette drauf.',      delta:  4000 },
  { icon: '☕', text: 'Die Fahrer treffen sich zum Kaffee an der Raststätte.', delta:     0 },
  { icon: '⛽', text: 'Der Diesel wurde diese Woche etwas teurer eingekauft.', delta: -1500 },
  { icon: '⭐', text: 'Ein Kunde lobt die Pünktlichkeit und zahlt einen Bonus.', delta: 3000 },
  { icon: '🌧️', text: 'Landregen. Alle fahren einfach etwas ruhiger.',        delta:     0 },
  { icon: '💼', text: 'Ein Möbelhaus bucht eine Zusatztour.',                 delta:  6000 },
  { icon: '🐕', text: 'Der Hofhund vom Nachbarbetrieb hat sich einquartiert.', delta:    0 },
  { icon: '🔩', text: 'Kleine Reparatur an der Rampe.',                       delta: -1200 },
  { icon: '🏅', text: 'Die Lokalzeitung schreibt ein freundliches Porträt.',   delta:  2500 },
  { icon: '🌅', text: 'Klarer Morgen, freie Autobahn.',                       delta:     0 },
  { icon: '🥨', text: 'Eine Kundin bringt Brezeln in die Disposition.',       delta:     0 },
  { icon: '📻', text: 'Neues Radio in der Werkstatt.',                        delta:  -600 },
];

/* ── Wirtschaft und Fahrphysik ── */
export const RULES = {
  BASE_KMH:     62,     // Schnitt eines ungeschulten Fahrers
  FUEL_PER_KM:  1.15,   // Euro je Kilometer
  DAILY_COST:   1400,   // Euro je LKW und Tag
  TRUCK_BUY:    20000,
  TRUCK_SELL:   12000,
  TRAIN_COST:   3000,   // Kursgebühr je Schulungsstufe
  RATE_PER_KM:  1.55,   // Frachtpreis je Kilometer
  BASE_FEE:     380,    // Grundbetrag je Auftrag
  MIN_PER_TICK: 15,     // Spielminuten je Takt
  EVENT_CHANCE: 0.004,  // je Takt
  BREAKDOWN:    0.035,  // je LKW und Tag, vor Fertigkeiten
  START_MONEY:  50000,
  OFFER_COUNT:  8,      // Größe der Auftragsbörse
  FIRM_RADIUS:  45000,  // Suchradius um das Depot in Metern
  JAM_RADIUS:   2.5,    // km: so nah muss eine Meldung an der Route liegen
};

/* Realzeit je Takt, je Geschwindigkeitsstufe */
export const TICK_MS = { 1: 260, 2: 130, 4: 55 };
