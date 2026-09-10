// gueter.js
// Katalog der transportierbaren Waren.
//
// Jede Ware bringt mit, was für den Transport entscheidend ist:
//
//   aufbau        Welcher Aufbautyp nötig ist. Bestimmt, welche
//                 Fahrzeuge den Auftrag überhaupt fahren können.
//   dichteKgProM3 Schüttdichte. Entscheidet, ob eine Ladung durch
//                 Gewicht oder durch Volumen begrenzt ist - ein Sattel-
//                 auflieger fasst rund 90 m³. Styropor macht den
//                 Auflieger voll, lange bevor die 25 t erreicht sind,
//                 Stahl ist umgekehrt bei einem Bruchteil des Volumens
//                 am Gewichtslimit.
//   wertProTonne  Grober Warenwert in DM. Grundlage für Frachtpreis
//                 und Haftung bei Verlust.
//   verderblich   Braucht Kühlung und duldet keine Verzögerung.
//   gefahrgut     ADR-pflichtig: besondere Papiere, Ausrüstung und
//                 Fahrerqualifikation.
//
// ACHTUNG: Die Zahlenwerte sind plausible Größenordnungen, keine
// belegten Marktdaten von 1994. Vor einer ernsthaften Wirtschafts-
// bilanz gegenzuprüfen.

const GUETER = [
  // ---------- Agrar und Rohstoffe aus der Landwirtschaft ----------
  { id: "weizen",        name: "Weizen",             kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 780,  wertProTonne: 320,   verderblich: false, gefahrgut: false },
  { id: "mais",          name: "Mais",               kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 720,  wertProTonne: 290,   verderblich: false, gefahrgut: false },
  { id: "kartoffeln",    name: "Kartoffeln",         kategorie: "agrar",     aufbau: "plane",  dichteKgProM3: 700,  wertProTonne: 240,   verderblich: false, gefahrgut: false },
  { id: "zuckerrueben",  name: "Zuckerrüben",        kategorie: "agrar",     aufbau: "plane",  dichteKgProM3: 650,  wertProTonne: 90,    verderblich: false, gefahrgut: false },
  { id: "raps",          name: "Raps",               kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 680,  wertProTonne: 480,   verderblich: false, gefahrgut: false },
  { id: "futtermittel",  name: "Futtermittel",       kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 600,  wertProTonne: 260,   verderblich: false, gefahrgut: false },
  { id: "duenger",       name: "Düngemittel",        kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 900,  wertProTonne: 380,   verderblich: false, gefahrgut: false },
  { id: "oliven",        name: "Oliven und Olivenöl",kategorie: "agrar",     aufbau: "plane",  dichteKgProM3: 900,  wertProTonne: 1900,  verderblich: false, gefahrgut: false },
  { id: "wein",          name: "Wein",               kategorie: "agrar",     aufbau: "plane",  dichteKgProM3: 800,  wertProTonne: 2400,  verderblich: false, gefahrgut: false },
  { id: "tabak",         name: "Rohtabak",           kategorie: "agrar",     aufbau: "plane",  dichteKgProM3: 300,  wertProTonne: 3200,  verderblich: false, gefahrgut: false },
  { id: "reis",          name: "Reis",               kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 750,  wertProTonne: 620,   verderblich: false, gefahrgut: false },
  { id: "sonnenblumen",  name: "Sonnenblumenkerne",  kategorie: "agrar",     aufbau: "silo",   dichteKgProM3: 420,  wertProTonne: 540,   verderblich: false, gefahrgut: false },

  // ---------- Frische und Kühlware ----------
  { id: "obst",          name: "Obst",               kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 600,  wertProTonne: 1200,  verderblich: true,  gefahrgut: false },
  { id: "gemuese",       name: "Gemüse",             kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 550,  wertProTonne: 900,   verderblich: true,  gefahrgut: false },
  { id: "zitrusfruechte",name: "Zitrusfrüchte",      kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 620,  wertProTonne: 1100,  verderblich: true,  gefahrgut: false },
  { id: "fisch",         name: "Fisch",              kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 700,  wertProTonne: 2800,  verderblich: true,  gefahrgut: false },
  { id: "fleisch",       name: "Fleisch",            kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 700,  wertProTonne: 4200,  verderblich: true,  gefahrgut: false },
  { id: "milchprodukte", name: "Milchprodukte",      kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 900,  wertProTonne: 2200,  verderblich: true,  gefahrgut: false },
  { id: "blumen",        name: "Schnittblumen",      kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 200,  wertProTonne: 9000,  verderblich: true,  gefahrgut: false },
  { id: "tiefkuehlkost", name: "Tiefkühlkost",       kategorie: "frische",   aufbau: "kuehl",  dichteKgProM3: 650,  wertProTonne: 2600,  verderblich: true,  gefahrgut: false },

  // ---------- Lebensmittelindustrie ----------
  { id: "mehl",          name: "Mehl",               kategorie: "lebensmittel", aufbau: "silo", dichteKgProM3: 600, wertProTonne: 520,   verderblich: false, gefahrgut: false },
  { id: "zucker",        name: "Zucker",             kategorie: "lebensmittel", aufbau: "silo", dichteKgProM3: 850, wertProTonne: 900,   verderblich: false, gefahrgut: false },
  { id: "konserven",     name: "Konserven",          kategorie: "lebensmittel", aufbau: "plane",dichteKgProM3: 750, wertProTonne: 1400,  verderblich: false, gefahrgut: false },
  { id: "bier",          name: "Bier",               kategorie: "lebensmittel", aufbau: "plane",dichteKgProM3: 800, wertProTonne: 1100,  verderblich: false, gefahrgut: false },
  { id: "kaffee",        name: "Kaffee und Tee",     kategorie: "lebensmittel", aufbau: "plane",dichteKgProM3: 400, wertProTonne: 6500,  verderblich: false, gefahrgut: false },
  { id: "speiseoel",     name: "Speiseöl",           kategorie: "lebensmittel", aufbau: "tank", dichteKgProM3: 920, wertProTonne: 1700,  verderblich: false, gefahrgut: false },
  { id: "spirituosen",   name: "Spirituosen",        kategorie: "lebensmittel", aufbau: "plane",dichteKgProM3: 850, wertProTonne: 5200,  verderblich: false, gefahrgut: false },

  // ---------- Bergbau, Energie, Grundstoffe ----------
  { id: "kohle",         name: "Steinkohle",         kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 850,  wertProTonne: 120,   verderblich: false, gefahrgut: false },
  { id: "eisenerz",      name: "Eisenerz",           kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 2500, wertProTonne: 95,    verderblich: false, gefahrgut: false },
  { id: "bauxit",        name: "Bauxit",             kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 1400, wertProTonne: 130,   verderblich: false, gefahrgut: false },
  { id: "kupfererz",     name: "Kupfererz",          kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 2200, wertProTonne: 480,   verderblich: false, gefahrgut: false },
  { id: "salz",          name: "Streusalz",          kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 1200, wertProTonne: 85,    verderblich: false, gefahrgut: false },
  { id: "torf",          name: "Torf",               kategorie: "rohstoff",  aufbau: "kipper", dichteKgProM3: 400,  wertProTonne: 110,   verderblich: false, gefahrgut: false },
  { id: "rohoel",        name: "Rohöl",              kategorie: "energie",   aufbau: "tank",   dichteKgProM3: 870,  wertProTonne: 210,   verderblich: false, gefahrgut: true  },
  { id: "diesel",        name: "Dieselkraftstoff",   kategorie: "energie",   aufbau: "tank",   dichteKgProM3: 835,  wertProTonne: 640,   verderblich: false, gefahrgut: true  },
  { id: "benzin",        name: "Benzin",             kategorie: "energie",   aufbau: "tank",   dichteKgProM3: 750,  wertProTonne: 720,   verderblich: false, gefahrgut: true  },
  { id: "heizoel",       name: "Heizöl",             kategorie: "energie",   aufbau: "tank",   dichteKgProM3: 860,  wertProTonne: 480,   verderblich: false, gefahrgut: true  },
  { id: "fluessiggas",   name: "Flüssiggas",         kategorie: "energie",   aufbau: "tank",   dichteKgProM3: 550,  wertProTonne: 880,   verderblich: false, gefahrgut: true  },

  // ---------- Holz und Papier ----------
  { id: "rundholz",      name: "Rundholz",           kategorie: "holz",      aufbau: "plane",  dichteKgProM3: 700,  wertProTonne: 160,   verderblich: false, gefahrgut: false },
  { id: "schnittholz",   name: "Schnittholz",        kategorie: "holz",      aufbau: "plane",  dichteKgProM3: 550,  wertProTonne: 340,   verderblich: false, gefahrgut: false },
  { id: "zellstoff",     name: "Zellstoff",          kategorie: "holz",      aufbau: "plane",  dichteKgProM3: 600,  wertProTonne: 700,   verderblich: false, gefahrgut: false },
  { id: "papier",        name: "Papier",             kategorie: "holz",      aufbau: "plane",  dichteKgProM3: 800,  wertProTonne: 950,   verderblich: false, gefahrgut: false },
  { id: "moebel",        name: "Möbel",              kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 180,  wertProTonne: 4200,  verderblich: false, gefahrgut: false },

  // ---------- Baustoffe ----------
  { id: "zement",        name: "Zement",             kategorie: "baustoff",  aufbau: "silo",   dichteKgProM3: 1400, wertProTonne: 130,   verderblich: false, gefahrgut: false },
  { id: "kies",          name: "Kies und Sand",      kategorie: "baustoff",  aufbau: "kipper", dichteKgProM3: 1600, wertProTonne: 25,    verderblich: false, gefahrgut: false },
  { id: "ziegel",        name: "Ziegel",             kategorie: "baustoff",  aufbau: "plane",  dichteKgProM3: 1300, wertProTonne: 180,   verderblich: false, gefahrgut: false },
  { id: "betonteile",    name: "Betonfertigteile",   kategorie: "baustoff",  aufbau: "schwer", dichteKgProM3: 2300, wertProTonne: 300,   verderblich: false, gefahrgut: false },
  { id: "glas",          name: "Flachglas",          kategorie: "baustoff",  aufbau: "plane",  dichteKgProM3: 1500, wertProTonne: 800,   verderblich: false, gefahrgut: false },
  { id: "daemmstoff",    name: "Dämmstoffe",         kategorie: "baustoff",  aufbau: "plane",  dichteKgProM3: 60,   wertProTonne: 2600,  verderblich: false, gefahrgut: false },
  { id: "marmor",        name: "Marmor",             kategorie: "baustoff",  aufbau: "schwer", dichteKgProM3: 2700, wertProTonne: 900,   verderblich: false, gefahrgut: false },

  // ---------- Metall und Chemie ----------
  { id: "stahl",         name: "Stahlbrammen",       kategorie: "metall",    aufbau: "schwer", dichteKgProM3: 7800, wertProTonne: 620,   verderblich: false, gefahrgut: false },
  { id: "stahlblech",    name: "Stahlblech",         kategorie: "metall",    aufbau: "plane",  dichteKgProM3: 4000, wertProTonne: 780,   verderblich: false, gefahrgut: false },
  { id: "aluminium",     name: "Aluminium",          kategorie: "metall",    aufbau: "plane",  dichteKgProM3: 2700, wertProTonne: 2400,  verderblich: false, gefahrgut: false },
  { id: "schrott",       name: "Schrott",            kategorie: "metall",    aufbau: "kipper", dichteKgProM3: 1200, wertProTonne: 150,   verderblich: false, gefahrgut: false },
  { id: "chemie",        name: "Chemikalien",        kategorie: "chemie",    aufbau: "tank",   dichteKgProM3: 1100, wertProTonne: 1600,  verderblich: false, gefahrgut: true  },
  { id: "kunststoff",    name: "Kunststoffgranulat", kategorie: "chemie",    aufbau: "silo",   dichteKgProM3: 550,  wertProTonne: 1800,  verderblich: false, gefahrgut: false },
  { id: "farben",        name: "Farben und Lacke",   kategorie: "chemie",    aufbau: "plane",  dichteKgProM3: 900,  wertProTonne: 3400,  verderblich: false, gefahrgut: true  },
  { id: "arzneimittel",  name: "Arzneimittel",       kategorie: "chemie",    aufbau: "kuehl",  dichteKgProM3: 350,  wertProTonne: 42000, verderblich: true,  gefahrgut: false },

  // ---------- Industrie und Konsum ----------
  { id: "maschinen",     name: "Maschinen",          kategorie: "industrie", aufbau: "schwer", dichteKgProM3: 1200, wertProTonne: 9500,  verderblich: false, gefahrgut: false },
  { id: "fahrzeugteile", name: "Fahrzeugteile",      kategorie: "industrie", aufbau: "plane",  dichteKgProM3: 400,  wertProTonne: 7200,  verderblich: false, gefahrgut: false },
  { id: "neuwagen",      name: "Neuwagen",           kategorie: "industrie", aufbau: "autotransporter", dichteKgProM3: 220, wertProTonne: 16000, verderblich: false, gefahrgut: false },
  { id: "elektronik",    name: "Elektronik",         kategorie: "industrie", aufbau: "plane",  dichteKgProM3: 300,  wertProTonne: 28000, verderblich: false, gefahrgut: false },
  { id: "hausgeraete",   name: "Haushaltsgeräte",    kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 250,  wertProTonne: 6800,  verderblich: false, gefahrgut: false },
  { id: "textilien",     name: "Textilien",          kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 250,  wertProTonne: 8500,  verderblich: false, gefahrgut: false },
  { id: "schuhe",        name: "Schuhe und Leder",   kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 220,  wertProTonne: 11000, verderblich: false, gefahrgut: false },
  { id: "spielwaren",    name: "Spielwaren",         kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 150,  wertProTonne: 7400,  verderblich: false, gefahrgut: false },
  { id: "konsumgueter",  name: "Konsumgüter",        kategorie: "konsum",    aufbau: "plane",  dichteKgProM3: 300,  wertProTonne: 5200,  verderblich: false, gefahrgut: false },
  { id: "baumaschinen",  name: "Baumaschinen",       kategorie: "industrie", aufbau: "schwer", dichteKgProM3: 1500, wertProTonne: 11000, verderblich: false, gefahrgut: false },
  { id: "container",     name: "Seecontainer",       kategorie: "umschlag",  aufbau: "container", dichteKgProM3: 300, wertProTonne: 3000, verderblich: false, gefahrgut: false },
  { id: "stueckgut",     name: "Stückgut",           kategorie: "umschlag",  aufbau: "plane",  dichteKgProM3: 350,  wertProTonne: 4000,  verderblich: false, gefahrgut: false },
  { id: "altpapier",     name: "Altpapier",          kategorie: "umschlag",  aufbau: "plane",  dichteKgProM3: 450,  wertProTonne: 60,    verderblich: false, gefahrgut: false },
  { id: "abfall",        name: "Gewerbeabfall",      kategorie: "umschlag",  aufbau: "kipper", dichteKgProM3: 350,  wertProTonne: 30,    verderblich: false, gefahrgut: false }
];

// Schneller Zugriff über die id
const GUETER_NACH_ID = Object.fromEntries(GUETER.map((g) => [g.id, g]));

// Alle vorkommenden Aufbautypen - nützlich für die Fahrzeugauswahl.
// Der Fuhrpark kennt bisher nur "Plane" und "Kühlkoffer"; die übrigen
// Typen brauchen später passende Fahrzeuge im Fahrzeughandel.
const AUFBAUTYPEN = [...new Set(GUETER.map((g) => g.aufbau))];
