/* Alle Stellschrauben an einem Ort. */

export const DEPOTS = [
  { key: 'HH', name: 'Hamburg',   lat: 53.5461, lon:  9.9661 },
  { key: 'B',  name: 'Berlin',    lat: 52.5200, lon: 13.4050 },
  { key: 'K',  name: 'Köln',      lat: 50.9375, lon:  6.9603 },
  { key: 'F',  name: 'Frankfurt', lat: 50.1109, lon:  8.6821 },
  { key: 'M',  name: 'München',   lat: 48.1372, lon: 11.5755 },
];

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

/* Ereignisse aus dem Betriebsalltag.

   delta ist Geld, rep ist Ansehen. Was ein Lob ist, zahlt auf den Ruf ein
   und nicht auf das Konto — niemand überweist für Pünktlichkeit mehr, als
   die Fahrt selbst eingebracht hat. Geldbeträge bleiben klein gegenüber
   einer durchschnittlichen Fracht. */
export const EVENTS = [
  /* Ansehen statt Bargeld */
  { icon: '⭐', text: 'Ein Kunde lobt die Pünktlichkeit in den höchsten Tönen.',      rep: 2.0 },
  { icon: '🏅', text: 'Die Lokalzeitung schreibt ein freundliches Porträt über euch.', rep: 2.5 },
  { icon: '🤝', text: 'Ein Disponent empfiehlt euch an einen Kollegen weiter.',        rep: 1.5 },
  { icon: '📋', text: 'Die Ladungssicherung wird bei einer Kontrolle gelobt.',         rep: 1.2 },
  { icon: '🧭', text: 'Ein Fahrer hilft an der Rampe aus, ohne dass jemand fragt.',    rep: 0.8 },

  /* Kleine Zusatzerlöse */
  { icon: '📦', text: 'Ein Stammkunde legt spontan eine Palette drauf.',    delta:  420 },
  { icon: '💼', text: 'Ein Möbelhaus bucht eine Zusatztour.',               delta:  780 },
  { icon: '⏱️', text: 'Standgeld an der Rampe wird erstattet.',             delta:  260 },
  { icon: '♻️', text: 'Rückladung gefunden, die Leerfahrt entfällt.',       delta:  540, rep: 0.4 },

  /* Kleine Kosten */
  { icon: '⛽', text: 'Der Diesel wurde diese Woche teurer eingekauft.',    delta: -380 },
  { icon: '🔩', text: 'Kleine Reparatur an der Rampe.',                     delta: -290 },
  { icon: '📻', text: 'Neues Radio in der Werkstatt.',                      delta: -180 },
  { icon: '🧾', text: 'Nachzahlung bei der Mautabrechnung.',                delta: -450 },
  { icon: '🅿️', text: 'Parkgebühren auf der Raststätte.',                   delta: -120 },

  /* Reine Stimmung */
  { icon: '☕', text: 'Die Fahrer treffen sich zum Kaffee an der Raststätte.' },
  { icon: '🌧️', text: 'Landregen. Alle fahren einfach etwas ruhiger.' },
  { icon: '🐕', text: 'Der Hofhund vom Nachbarbetrieb hat sich einquartiert.' },
  { icon: '🌅', text: 'Klarer Morgen, freie Autobahn.' },
  { icon: '🥨', text: 'Eine Kundin bringt Brezeln in die Disposition.' },
  { icon: '📻', text: 'Im Funk läuft den ganzen Tag dieselbe Schlagerplatte.' },
];

/* ── Fahrzeugtypen ──────────────────────────────────────────────
   Angelehnt an den Aufbau von Aufbausimulationen wie dem Euro Truck
   Simulator: unterschiedliche Klassen mit Anschaffungspreis, Verbrauch,
   Reisegeschwindigkeit und Ladefähigkeit. Die Ladefähigkeit wirkt als
   Faktor auf den Frachterlös — ein schwerer Zug verdient an derselben
   Strecke mehr, verbraucht dafür deutlich mehr Diesel.                */
export const TRUCK_MODELS = {
  kurier: {
    key: 'kurier', name: 'Kurier 3.5', klasse: 'Sprinter',
    price: 12000, speed: +8, fuel: 0.55, load: 0.60, risk: 0.8,
    text: 'Wendig und sparsam. Rechnet sich auf kurzen Strecken.',
  },
  verteiler: {
    key: 'verteiler', name: 'Verteiler 12', klasse: 'Verteilerverkehr',
    price: 20000, speed: 0, fuel: 1.00, load: 1.00, risk: 1.0,
    text: 'Der Allrounder. Nichts herausragend, nichts falsch.',
  },
  fern: {
    key: 'fern', name: 'Fernverkehr 400', klasse: 'Sattelzug',
    price: 34000, speed: +6, fuel: 1.20, load: 1.40, risk: 1.0,
    text: 'Für lange Läufe. Hält den Schnitt auch nach Stunden.',
  },
  schwer: {
    key: 'schwer', name: 'Schwerlast 620', klasse: 'Schwertransport',
    price: 52000, speed: -4, fuel: 1.55, load: 1.90, risk: 1.2,
    text: 'Zieht alles, säuft alles. Lohnt erst bei hohen Frachtwerten.',
  },
};

export const USED = {
  factor: 0.62,      // Anteil vom Neupreis
  risk: 1.7,         // Pannenrisiko gegenüber neu
  odo: 180000,       // Kilometerstand beim Kauf
};

/* ── Wirtschaft und Fahrphysik ── */
export const RULES = {
  BASE_KMH:     62,
  FUEL_PER_KM:  1.15,
  DAILY_COST:   1400,
  RESALE_NEW:   0.55,   // Anteil vom Neupreis beim Verkauf
  RESALE_USED:  0.45,
  TRAIN_COST:   3000,
  RATE_PER_KM:  1.55,
  BASE_FEE:     180,    // Grundbetrag je Auftrag
  LOAD_MIN:      60,    // Zeit an der Rampe je Zustellung, in Minuten
  EVENT_PER_DAY: 1.4,    // erwartete Ereignisse je Spieltag
  BREAKDOWN:    0.035,
  START_MONEY:  50000,
  OFFER_COUNT:  8,
  FIRM_RADIUS:  45000,
  JAM_RADIUS:   2.5,
};

/* ── Lenk- und Ruhezeiten ──────────────────────────────────────
   Vereinfacht nach den europäischen Regeln. Alle Angaben in Minuten. */
export const DRIVE = {
  MAX_STINT:  270,   // 4,5 Stunden am Stück
  BREAK:       45,   // danach Pause
  MAX_DAY:    540,   // 9 Stunden Tageslenkzeit
  DAILY_REST: 660,   // 11 Stunden Ruhezeit
};

/* Fahrzeuge unter 7,5 Tonnen sind vom Sonntagsfahrverbot ausgenommen. */
export const BAN_EXEMPT = ['kurier'];

/* ── Betriebsstufen ─────────────────────────────────────────────
   Der Bogen des Spiels. Jede Stufe verlangt etwas Konkretes und gibt
   etwas frei, das vorher nicht ging. Nichts davon kann verloren gehen —
   erreicht ist erreicht.

   req  · was erfüllt sein muss
   frei · was danach möglich ist                                        */
export const LEVELS = [
  {
    nr: 1, name: 'Einzelunternehmer',
    beschreibung: 'Ein Fahrzeug, ein Fahrer, jede Fahrt selbst disponiert.',
    req: {},
    frei: { modelle: ['kurier', 'verteiler'], vertraege: 1, automatik: false },
    text: 'Kurier und Verteiler im Handel · ein Rahmenvertrag',
  },
  {
    nr: 2, name: 'Fuhrbetrieb',
    beschreibung: 'Der Betrieb läuft, ohne dass jemand danebensteht.',
    req: { tours: 12, trucks: 2 },
    frei: { modelle: ['kurier', 'verteiler'], vertraege: 2, automatik: true },
    text: 'Selbstdisposition der Fahrzeuge · zwei Verträge',
  },
  {
    nr: 3, name: 'Kleinspedition',
    beschreibung: 'Erste lange Läufe, feste Kundschaft.',
    req: { tours: 60, trucks: 4, contracts: 1 },
    frei: { modelle: ['kurier', 'verteiler', 'fern'], vertraege: 3, automatik: true },
    text: 'Fernverkehr 400 · drei Verträge gleichzeitig',
  },
  {
    nr: 4, name: 'Spedition',
    beschreibung: 'Schwere Züge, feste Partner, planbares Geschäft.',
    req: { tours: 150, km: 25000, rep: 60, trucks: 6 },
    frei: { modelle: ['kurier', 'verteiler', 'fern', 'schwer'], vertraege: 4, automatik: true },
    text: 'Schwerlast 620 · vier Verträge · Partner fragen häufiger an',
  },
  {
    nr: 5, name: 'Regionalspediteur',
    beschreibung: 'Über die eigene Region hinaus bekannt.',
    req: { tours: 300, km: 75000, rep: 75, contracts: 3 },
    frei: { modelle: ['kurier', 'verteiler', 'fern', 'schwer'], vertraege: 5, automatik: true, depot2: true },
    text: 'fünf Verträge · zweites Depot vorgemerkt',
  },
  {
    nr: 6, name: 'Logistiker',
    beschreibung: 'Eine Adresse, die man kennt.',
    req: { tours: 600, km: 200000, rep: 90, contracts: 8, trucks: 12 },
    frei: { modelle: ['kurier', 'verteiler', 'fern', 'schwer'], vertraege: 6, automatik: true, depot2: true, lager: true },
    text: 'sechs Verträge · Lager und Produktion vorgemerkt',
  },
];

export const REQ_LABEL = {
  tours:     { text: 'Zustellungen',        einheit: '' },
  km:        { text: 'gefahrene Kilometer', einheit: ' km' },
  rep:       { text: 'Ansehen',             einheit: '' },
  trucks:    { text: 'Fahrzeuge',           einheit: '' },
  contracts: { text: 'erfüllte Verträge',   einheit: '' },
};

/* ── Markt, Verträge, Branche ───────────────────────────────────
   Der Spotmarkt schwankt, Rahmenverträge sind planbar. Die anderen
   Speditionen sind keine Gegner: sie vergeben Aufträge weiter, an die
   man mit wachsendem Ansehen leichter herankommt.                    */
export const MARKET = {
  MIN: 0.78, MAX: 1.32,      // Spanne des Spotpreisindex
  DRIFT: 0.06,               // Bewegung je Tag
  WEEKDAY: {                 // Wochentagseinfluss auf das Angebot
    1: 1.10, 2: 1.05, 3: 1.00, 4: 1.05, 5: 1.12, 6: 0.80, 0: 0.55,
  },
};

export const CONTRACTS = {
  OFFERS: 3,                 // gleichzeitig ausliegende Ausschreibungen
  WEEKS: [2, 3, 4, 6],       // mögliche Laufzeiten
  PER_WEEK: [3, 4, 5, 6, 8], // Sendungen je Woche
  RATE: 0.88,                // Preis je Sendung gegenüber dem Spotmarkt
  BONUS: 0.35,               // Abschlussprämie, Anteil am Vertragswert
  FLOATER: 0.4,              // wie stark der Dieselindex durchschlägt
  PART_OK: 0.6,              // ab dieser Erfüllung gibt es die halbe Prämie
};

/* Befreundete Speditionen. Sie geben Aufträge an Subunternehmer weiter. */
export const PARTNERS = [
  { key: 'nordfracht', name: 'Nordfracht Logistik',  ort: 'Bremen'     },
  { key: 'hellweg',    name: 'Hellweg Spedition',    ort: 'Dortmund'   },
  { key: 'donau',      name: 'Donau Transport AG',   ort: 'Regensburg' },
  { key: 'kranich',    name: 'Kranich Verkehr KG',   ort: 'Kassel'     },
];

export const PARTNER_LEVELS = [
  { ab: 0,  name: 'unbekannt',      rate: 1.05, chance: 0.20 },
  { ab: 4,  name: 'gelegentlich',   rate: 1.12, chance: 0.35 },
  { ab: 12, name: 'fest im Boot',   rate: 1.20, chance: 0.55 },
  { ab: 28, name: 'Haussubunternehmer', rate: 1.30, chance: 0.75 },
];

export const REP = {
  START: 50, MAX: 100,
  PER_LOAD: 0.15,            // Ansehen je Zustellung
  PER_CONTRACT: 3,           // bei vollständig erfülltem Vertrag
  PER_PARTIAL: 1,
  MIN_MUL: 0.90, MAX_MUL: 1.20,   // Wirkung auf die Preise
};

/* ── Zeit ──
   Der Takt läuft in Realzeit fest mit TICK_MS. Wie viel Spielzeit dabei
   vergeht, bestimmt RATIO: Spielminuten je echter Minute bei Stufe 1×.
   Voreinstellung 3 bedeutet: eine echte Minute sind drei Spielminuten. */
export const TIME = {
  TICK_MS: 1000,
  DEFAULT_RATIO: 3,
  RATIOS: [1, 3, 10, 30, 60],   // in den Einstellungen wählbar
  SPEEDS: [0, 1, 2, 4],         // Multiplikator auf das Verhältnis
};
