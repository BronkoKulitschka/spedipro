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
  /* ── Klasse B: bis 3,5 t, kein Lkw-Führerschein nötig ──────────
     Vom Sonntagsfahrverbot ausgenommen, deshalb an Feiertagen die
     einzigen Fahrzeuge, die überhaupt rollen.                      */
  kastenwagen: {
    key: 'kastenwagen', name: 'Kastenwagen 3.0', klasse: 'Kleintransporter',
    fs: 'B', price: 7500, speed: +10, fuel: 0.42, risk: 0.7, fix: 0.45,
    zgg: 3000, leer: 2000, nutzlast: 1000, paletten: 3, volumen: 8,
    aufbau: 'Kastenaufbau', kuehlbar: true, adrfaehig: false,
    text: 'Der Handwerkerbus. Für Eilsendungen und kleine Mengen.',
  },
  kurier: {
    key: 'kurier', name: 'Kurier 3.5', klasse: 'Transporter',
    fs: 'B', price: 12000, speed: +8, fuel: 0.55, risk: 0.8, fix: 0.55,
    zgg: 3500, leer: 2300, nutzlast: 1200, paletten: 4, volumen: 14,
    aufbau: 'Kofferaufbau', kuehlbar: true, adrfaehig: false,
    text: 'Wendig und sparsam. Für Stückgut und eilige Kleinsendungen.',
  },
  maxi: {
    key: 'maxi', name: 'Maxi 3.5 lang', klasse: 'Großraumtransporter',
    fs: 'B', price: 15500, speed: +6, fuel: 0.62, risk: 0.85, fix: 0.62,
    zgg: 3500, leer: 2450, nutzlast: 1050, paletten: 6, volumen: 20,
    aufbau: 'Kofferaufbau mit Ladebordwand', kuehlbar: true, adrfaehig: false,
    text: 'Langer Radstand, viel Volumen. Für Sperriges mit wenig Gewicht.',
  },

  /* ── Klasse C1: 3,5 bis 7,5 t ────────────────────────────────── */
  leicht: {
    key: 'leicht', name: 'Kompakt 5.0', klasse: 'Leicht-Lkw',
    fs: 'C1', price: 17000, speed: +4, fuel: 0.78, risk: 0.9, fix: 0.75,
    zgg: 5000, leer: 3200, nutzlast: 1800, paletten: 10, volumen: 26,
    aufbau: 'Pritsche mit Plane', kuehlbar: true, adrfaehig: true,
    text: 'Zwischen Transporter und Lkw. Kommt in enge Innenstädte.',
  },
  siebenhalb: {
    key: 'siebenhalb', name: 'Nahverkehr 7.5', klasse: 'Mittelschwerer Lkw',
    fs: 'C1', price: 24000, speed: +2, fuel: 0.88, risk: 0.95, fix: 0.88,
    zgg: 7500, leer: 5200, nutzlast: 2300, paletten: 15, volumen: 34,
    aufbau: 'Kofferaufbau mit Ladebordwand', kuehlbar: true, adrfaehig: true,
    text: 'Das Rückgrat des Verteilerverkehrs. Viel Volumen, wenig Nutzlast.',
  },

  /* ── Klasse C: über 7,5 t ────────────────────────────────────── */
  verteiler: {
    key: 'verteiler', name: 'Verteiler 12', klasse: 'Verteilerverkehr',
    fs: 'C', price: 30000, speed: 0, fuel: 1.00, risk: 1.0, fix: 1.0,
    zgg: 12000, leer: 6500, nutzlast: 5500, paletten: 17, volumen: 45,
    aufbau: 'Pritsche mit Plane', kuehlbar: true, adrfaehig: true,
    text: 'Der Allrounder für die Region. Ladebordwand, kommt überall hin.',
  },
  motorwagen: {
    key: 'motorwagen', name: 'Solo 18', klasse: 'Schwerer Motorwagen',
    fs: 'C', price: 42000, speed: +2, fuel: 1.10, risk: 1.0, fix: 1.2,
    zgg: 18000, leer: 8500, nutzlast: 9500, paletten: 18, volumen: 50,
    aufbau: 'Schiebeplane', kuehlbar: true, adrfaehig: true,
    text: 'Ohne Anhänger, aber mit Wucht. Gut für schwere Teilladungen.',
  },

  /* ── Klasse CE: Zugmaschinen mit Auflieger oder Anhänger ─────── */
  fern: {
    key: 'fern', name: 'Fernverkehr 400', klasse: 'Sattelzug',
    fs: 'CE', price: 52000, speed: +6, fuel: 1.20, risk: 1.0, fix: 1.35,
    zgg: 40000, leer: 16000, nutzlast: 24000, paletten: 33, volumen: 90,
    aufbau: 'Schiebeplane, 13,6 Lademeter', kuehlbar: true, adrfaehig: true,
    text: 'Das Arbeitspferd des Fernverkehrs. Volle Komplettladung.',
  },
  jumbo: {
    key: 'jumbo', name: 'Jumbo 40', klasse: 'Gliederzug',
    fs: 'CE', price: 58000, speed: +2, fuel: 1.32, risk: 1.05, fix: 1.45,
    zgg: 40000, leer: 15500, nutzlast: 24500, paletten: 38, volumen: 120,
    aufbau: 'Wechselbrücken, Durchladesystem', kuehlbar: true, adrfaehig: true,
    text: 'Motorwagen mit Anhänger. Das meiste Volumen von allen.',
  },
  kuehlzug: {
    key: 'kuehlzug', name: 'Thermo 40', klasse: 'Kühlsattelzug',
    fs: 'CE', price: 68000, speed: +4, fuel: 1.42, risk: 1.1, fix: 1.55,
    zgg: 40000, leer: 18500, nutzlast: 21500, paletten: 33, volumen: 82,
    aufbau: 'Tiefkühlkoffer mit Aggregat', kuehlbar: false, adrfaehig: false,
    kuehlfest: true,
    text: 'Kühlaggregat fest verbaut. Frischdienst und Tiefkühlware.',
  },
  schwer: {
    key: 'schwer', name: 'Schwerlast 620', klasse: 'Schwertransport',
    fs: 'CE', price: 78000, speed: -4, fuel: 1.55, risk: 1.2, fix: 1.7,
    zgg: 44000, leer: 17000, nutzlast: 27000, paletten: 26, volumen: 70,
    aufbau: 'Tieflader', kuehlbar: false, adrfaehig: true,
    text: 'Für schwere Güter. Industriepaletten statt Europaletten.',
  },
};

/* Nachrüstung beim Kauf. Wer Kühlgut oder Gefahrgut fahren will,
   braucht das passende Fahrzeug. Fest verbaute Kühlung — der Thermo 40 —
   braucht keine Nachrüstung. */
export const EQUIPMENT = {
  kuehl: { key: 'kuehl', name: 'Kühlaufbau',     icon: '❄️', preis: 9000,
           text: 'nötig für Kühlgut, kostet 8 % Nutzlast' },
  adr:   { key: 'adr',   name: 'ADR-Ausrüstung', icon: '☢️', preis: 4500,
           text: 'nötig für Gefahrgut' },
};

/* Führerscheinklassen, nur zur Anzeige und Gruppierung */
export const LICENCE = {
  B:  { name: 'Klasse B',  text: 'bis 3,5 t, kein Lkw-Führerschein' },
  C1: { name: 'Klasse C1', text: '3,5 bis 7,5 t' },
  C:  { name: 'Klasse C',  text: 'über 7,5 t, solo' },
  CE: { name: 'Klasse CE', text: 'Zugmaschine mit Auflieger oder Anhänger' },
};

/* Fahrzeuge unter 7,5 t sind vom Sonntagsfahrverbot ausgenommen. */
export const LEICHT = ['kastenwagen', 'kurier', 'maxi', 'leicht'];

export const USED = {
  factor: 0.62,      // Anteil vom Neupreis
  risk: 1.7,         // Pannenrisiko gegenüber neu
  odo: 180000,       // Kilometerstand beim Kauf
};

/* ── Wirtschaft und Fahrphysik ── */
export const RULES = {
  BASE_KMH:     62,
  FUEL_PER_KM:  0.55,   // etwa 30 l/100 km bei 1,80 € je Liter
  DAILY_COST:    550,   // Grundwert; je Fahrzeug mit fix multipliziert
  RESALE_NEW:   0.55,   // Anteil vom Neupreis beim Verkauf
  RESALE_USED:  0.45,
  TRAIN_COST:   3000,
  RATE_PER_KM:  1.55,
  BASE_FEE:     180,    // Grundbetrag je Auftrag
  LOAD_BASE:     18,    // Grundzeit an der Rampe, in Minuten
  LOAD_JE_PAL:    1.6,  // zusätzlich je Palette
  LOAD_MAX:      75,    // Deckel
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

  /* Niemand hält auf der Autobahn. Ist die Zeit um, wird der nächste
     Parkplatz auf der Strecke angefahren. Diese Reserve darf dafür
     überzogen werden — die Verordnung erlaubt das ausdrücklich, um
     einen geeigneten Halteplatz zu erreichen. */
  RAST_SUCHE:  45,   // km, die höchstens weitergefahren werden
  RAST_NAEHE: 3.0,   // km: so nah muss ein Parkplatz an der Route liegen
};

/* ── Güterklassen ───────────────────────────────────────────────
   Angelehnt an das Einheitliche Güterverzeichnis für die
   Verkehrsstatistik (NST-2007) des Statistischen Bundesamts.

   kgProPalette bestimmt, ob eine Ladung am Gewicht oder am Platz
   scheitert: Baustoffe machen den Zug schwer, bevor er voll ist,
   Möbel füllen ihn, lange bevor er schwer wird.                      */
export const GOODS = {
  agrar: {
    key: 'agrar', nst: '01', name: 'Land- und Forstwirtschaft', icon: '🌾',
    kgProPalette: 700, preis: 0.90, braucht: null,
  },
  nahrung: {
    key: 'nahrung', nst: '04', name: 'Nahrungs- und Genussmittel', icon: '🥫',
    kgProPalette: 600, preis: 1.00, braucht: null,
  },
  kuehlgut: {
    key: 'kuehlgut', nst: '04', name: 'Kühlgut', icon: '🧊',
    kgProPalette: 550, preis: 1.40, braucht: 'kuehl',
  },
  steine: {
    key: 'steine', nst: '03', name: 'Erze, Steine und Erden', icon: '🪨',
    kgProPalette: 1500, preis: 0.85, braucht: null,
  },
  bau: {
    key: 'bau', nst: '08', name: 'Baustoffe, Glas, Zement', icon: '🧱',
    kgProPalette: 1200, preis: 0.95, braucht: null,
  },
  chemie: {
    key: 'chemie', nst: '07', name: 'Chemische Erzeugnisse', icon: '⚗️',
    kgProPalette: 800, preis: 1.15, braucht: null,
  },
  gefahrgut: {
    key: 'gefahrgut', nst: '07', name: 'Gefahrgut nach ADR', icon: '☢️',
    kgProPalette: 850, preis: 1.55, braucht: 'adr',
  },
  metall: {
    key: 'metall', nst: '10', name: 'Metalle und Metallerzeugnisse', icon: '⚙️',
    kgProPalette: 1400, preis: 1.05, braucht: null,
  },
  maschinen: {
    key: 'maschinen', nst: '11', name: 'Maschinen und Ausrüstung', icon: '🏭',
    kgProPalette: 900, preis: 1.20, braucht: null,
  },
  moebel: {
    key: 'moebel', nst: '12', name: 'Möbel und Konsumgüter', icon: '🛋️',
    kgProPalette: 250, preis: 1.10, braucht: null,
  },
  papier: {
    key: 'papier', nst: '09', name: 'Papier und Druckerzeugnisse', icon: '📰',
    kgProPalette: 800, preis: 0.95, braucht: null,
  },
  stueckgut: {
    key: 'stueckgut', nst: '18', name: 'Stückgut und Sammelgut', icon: '📦',
    kgProPalette: 400, preis: 1.15, braucht: null,
  },
};

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
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi'], vertraege: 1, automatik: false },
    text: 'Transporter bis 3,5 t · ein Rahmenvertrag',
  },
  {
    nr: 2, name: 'Fuhrbetrieb',
    beschreibung: 'Der Betrieb läuft, ohne dass jemand danebensteht.',
    req: { tours: 12, trucks: 2 },
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi', 'leicht'], vertraege: 2, automatik: true },
    text: 'Selbstdisposition · Kompakt 5.0 · zwei Verträge',
  },
  {
    nr: 3, name: 'Kleinspedition',
    beschreibung: 'Erste richtige Lastwagen im Hof.',
    req: { tours: 45, trucks: 3, contracts: 1 },
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi', 'leicht', 'siebenhalb', 'verteiler'],
            vertraege: 3, automatik: true },
    text: 'Nahverkehr 7.5 und Verteiler 12 · drei Verträge',
  },
  {
    nr: 4, name: 'Spedition',
    beschreibung: 'Fernverkehr und feste Partner.',
    req: { tours: 120, km: 20000, rep: 60, trucks: 5 },
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi', 'leicht', 'siebenhalb',
                      'verteiler', 'motorwagen', 'fern'],
            vertraege: 4, automatik: true },
    text: 'Solo 18 und Fernverkehr 400 · vier Verträge · Partner fragen häufiger',
  },
  {
    nr: 5, name: 'Regionalspediteur',
    beschreibung: 'Über die eigene Region hinaus bekannt.',
    req: { tours: 280, km: 70000, rep: 75, contracts: 3 },
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi', 'leicht', 'siebenhalb',
                      'verteiler', 'motorwagen', 'fern', 'jumbo', 'kuehlzug'],
            vertraege: 5, automatik: true, depot2: true },
    text: 'Jumbo 40 und Thermo 40 · fünf Verträge · zweites Depot vorgemerkt',
  },
  {
    nr: 6, name: 'Logistiker',
    beschreibung: 'Eine Adresse, die man kennt.',
    req: { tours: 600, km: 200000, rep: 90, contracts: 8, trucks: 12 },
    frei: { modelle: ['kastenwagen', 'kurier', 'maxi', 'leicht', 'siebenhalb',
                      'verteiler', 'motorwagen', 'fern', 'jumbo', 'kuehlzug', 'schwer'],
            vertraege: 6, automatik: true, depot2: true, lager: true },
    text: 'Schwerlast 620 · sechs Verträge · Lager und Produktion vorgemerkt',
  },
];

export const REQ_LABEL = {
  tours:     { text: 'Zustellungen',        eins: 'Zustellung',      einheit: '' },
  km:        { text: 'gefahrene Kilometer', eins: 'Kilometer',       einheit: ' km' },
  rep:       { text: 'Ansehen',             eins: 'Punkt Ansehen',   einheit: '' },
  trucks:    { text: 'Fahrzeuge',           eins: 'Fahrzeug',        einheit: '' },
  contracts: { text: 'erfüllte Verträge',   eins: 'erfüllter Vertrag', einheit: '' },
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
