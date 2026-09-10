// regionen.js
// Wirtschaftsregionen: Was wird wo erzeugt, was wird wo gebraucht?
//
// Ohne diese Zuordnung wären alle Städte gleich und Rundtouren sinnlos.
// Erst dadurch entsteht Richtungsverkehr: Erz und Holz aus dem Norden
// nach Süden, Obst und Gemüse aus dem Süden nach Norden, Fertigwaren
// aus den Industriezentren in alle Richtungen.
//
// ACHTUNG - Herkunft der Zuordnung: Sie ist aus bekannten
// Wirtschaftsschwerpunkten der jeweiligen Regionen abgeleitet
// (Ruhrgebiet: Kohle und Stahl, Norrland: Holz und Erz, Andalusien:
// Obst und Gemüse, Poebene: Maschinen und Textil, Rotterdam: Öl und
// Container). Es sind KEINE belegten Güterstromdaten für 1994 - eine
// solche Quelle liegt nicht vor. Die Zuordnung ist als plausible
// Annäherung gedacht und darf jederzeit verfeinert werden.
//
// Aufbau:
//   erzeugt  Waren, die von hier abgehen (Exportangebot)
//   braucht  Waren, die hierher geliefert werden (Bedarf)
//   staedte  Städte dieser Region. Nicht zugeordnete Städte bekommen
//            die Standardregion ihres Landes (siehe LAND_STANDARD).

const REGIONEN = [
  // ---------- Seehäfen: Umschlag statt Erzeugung ----------
  {
    id: "nordseehaefen",
    name: "Nordseehäfen",
    erzeugt: ["container", "stueckgut", "kaffee", "rohoel", "chemie", "zitrusfruechte", "fisch"],
    braucht: ["container", "stueckgut", "stahlblech", "maschinen", "papier", "neuwagen"],
    staedte: ["Rotterdam", "Antwerpen", "Amsterdam", "Zeebrugge", "Le Havre",
              "Bremerhaven", "Hamburg", "Bremen", "Felixstowe", "Grimsby"]
  },
  {
    id: "ostseehaefen",
    name: "Ostseehäfen",
    erzeugt: ["container", "stueckgut", "rundholz", "zellstoff", "fisch", "duenger"],
    braucht: ["container", "stueckgut", "konsumgueter", "maschinen", "fahrzeugteile"],
    staedte: ["Gdańsk", "Klaipėda", "Rīga", "Ventspils", "Tallinn", "Rostock",
              "København", "Göteborg", "Helsinki", "Turku", "Luleå", "Gävle"]
  },
  {
    id: "mittelmeerhaefen",
    name: "Mittelmeerhäfen",
    erzeugt: ["container", "stueckgut", "zitrusfruechte", "wein", "oliven", "marmor"],
    braucht: ["container", "stueckgut", "maschinen", "neuwagen", "kohle", "weizen"],
    staedte: ["Marseille", "Genova", "Trieste", "Koper", "Piraeus", "Algeciras",
              "València", "Barcelona", "Split", "Varna", "Thessaloniki"]
  },

  // ---------- Schwerindustrie ----------
  {
    id: "ruhrgebiet",
    name: "Ruhrgebiet und Rheinschiene",
    erzeugt: ["kohle", "stahl", "stahlblech", "chemie", "maschinen", "farben", "kunststoff"],
    braucht: ["eisenerz", "schrott", "kohle", "container", "konsumgueter", "fahrzeugteile"],
    staedte: ["Duisburg", "Köln"]
  },
  {
    id: "oberschlesien",
    name: "Oberschlesisches Industriegebiet",
    erzeugt: ["kohle", "stahl", "zement", "schrott", "kupfererz"],
    braucht: ["eisenerz", "maschinen", "konsumgueter", "konserven", "fahrzeugteile"],
    staedte: ["Katowice", "Košice"]
  },
  {
    id: "nordengland",
    name: "Nordengland und Schottland",
    erzeugt: ["kohle", "stahl", "maschinen", "spirituosen", "fisch", "rohoel", "chemie"],
    braucht: ["eisenerz", "container", "konsumgueter", "fahrzeugteile", "obst"],
    staedte: ["Manchester", "Newcastle-upon-Tyne", "Glasgow", "Aberdeen", "Cardiff", "Plymouth"]
  },
  {
    id: "lothringen",
    name: "Lothringen und Saar",
    erzeugt: ["stahl", "stahlblech", "kohle", "glas", "salz"],
    braucht: ["eisenerz", "schrott", "kohle", "maschinen", "konsumgueter"],
    staedte: ["Metz"]
  },

  // ---------- Fahrzeug- und Maschinenbau ----------
  {
    id: "sueddeutschland",
    name: "Süddeutscher Maschinen- und Fahrzeugbau",
    erzeugt: ["neuwagen", "fahrzeugteile", "maschinen", "elektronik", "hausgeraete", "bier"],
    braucht: ["stahlblech", "aluminium", "kunststoff", "elektronik", "container", "fahrzeugteile"],
    staedte: ["Stuttgart", "München", "Nürnberg", "Zürich", "Basel", "Linz"]
  },
  {
    id: "poebene",
    name: "Poebene",
    erzeugt: ["maschinen", "neuwagen", "fahrzeugteile", "textilien", "schuhe", "reis", "hausgeraete"],
    braucht: ["stahlblech", "kohle", "kunststoff", "container", "futtermittel"],
    staedte: ["Milano", "Torino", "Bologna", "Venezia"]
  },
  {
    id: "tschechien",
    name: "Böhmen und Mähren",
    erzeugt: ["neuwagen", "fahrzeugteile", "glas", "maschinen", "bier"],
    braucht: ["stahlblech", "kunststoff", "elektronik", "konsumgueter"],
    staedte: ["Praha"]
  },

  // ---------- Chemie und Pharma ----------
  {
    id: "rheinmain",
    name: "Rhein-Main-Chemie",
    erzeugt: ["chemie", "arzneimittel", "farben", "kunststoff", "elektronik"],
    braucht: ["rohoel", "chemie", "container", "kunststoff", "konsumgueter"],
    staedte: ["Frankfurt am Main"]
  },

  // ---------- Nordische Rohstoffe ----------
  {
    id: "norrland",
    name: "Nordschweden und Finnland",
    erzeugt: ["rundholz", "schnittholz", "zellstoff", "papier", "eisenerz", "kupfererz", "torf"],
    braucht: ["diesel", "maschinen", "konserven", "konsumgueter", "futtermittel"],
    staedte: ["Sundsvall", "Umeå", "Östersund", "Örebro", "Växjö", "Oulu", "Kuopio",
              "Rovaniemi", "Kuusamo", "Ivalo", "Kokkola", "Lappeenranta", "Tampere"]
  },
  {
    id: "norwegen",
    name: "Norwegen",
    erzeugt: ["fisch", "rohoel", "aluminium", "eisenerz", "papier"],
    braucht: ["konserven", "obst", "gemuese", "konsumgueter", "maschinen", "baumaschinen"],
    staedte: ["Oslo", "Bergen", "Stavanger", "Trondheim", "Tromsø", "Narvik", "Bodø",
              "Kristiansand", "Ålesund", "Alta", "Honningsvåg", "Dombås"]
  },

  // ---------- Landwirtschaft Süd ----------
  {
    id: "andalusien",
    name: "Andalusien und Levante",
    erzeugt: ["obst", "gemuese", "zitrusfruechte", "oliven", "wein", "marmor"],
    braucht: ["duenger", "maschinen", "konsumgueter", "diesel", "futtermittel"],
    staedte: ["Sevilla", "Granada", "Murcia", "Almaraz", "Badajoz", "Faro"]
  },
  {
    id: "sueditalien",
    name: "Süditalien",
    erzeugt: ["obst", "gemuese", "zitrusfruechte", "oliven", "wein", "konserven", "marmor"],
    braucht: ["duenger", "maschinen", "konsumgueter", "hausgeraete", "diesel"],
    staedte: ["Napoli", "Bari", "Catania", "Palermo", "Catanzaro", "Cagliari",
              "Sassari", "Pescara", "Ancona"]
  },
  {
    id: "griechenland",
    name: "Griechenland",
    erzeugt: ["oliven", "obst", "zitrusfruechte", "tabak", "wein", "marmor", "fisch"],
    braucht: ["maschinen", "neuwagen", "konsumgueter", "diesel", "weizen"],
    staedte: ["Patra", "Ioannina", "Chania", "Rodos", "Mytilini"]
  },
  {
    id: "suedfrankreich",
    name: "Südfrankreich",
    erzeugt: ["wein", "obst", "gemuese", "oliven", "arzneimittel", "salz"],
    braucht: ["duenger", "maschinen", "konsumgueter", "stahlblech"],
    staedte: ["Nice", "Toulouse", "Limoges", "Bastia"]
  },

  // ---------- Getreide und Agrarräume ----------
  {
    id: "nordfrankreich",
    name: "Nordfranzösische Agrar- und Industriezone",
    erzeugt: ["weizen", "zuckerrueben", "zucker", "mehl", "neuwagen", "textilien", "papier"],
    braucht: ["duenger", "futtermittel", "kohle", "stahlblech", "container"],
    staedte: ["Lille", "Bourges", "Le Mans", "Nantes", "Dijon", "Bordeaux", "Roscoff"]
  },
  {
    id: "norddeutschland",
    name: "Norddeutsche Tiefebene",
    erzeugt: ["weizen", "raps", "kartoffeln", "milchprodukte", "fleisch", "zucker"],
    braucht: ["duenger", "futtermittel", "maschinen", "diesel", "konsumgueter"],
    staedte: ["Hannover", "Berlin", "Leipzig"]
  },
  {
    id: "polen_agrar",
    name: "Polnische Agrarregion",
    erzeugt: ["weizen", "kartoffeln", "fleisch", "milchprodukte", "moebel", "schnittholz"],
    braucht: ["duenger", "maschinen", "fahrzeugteile", "konsumgueter", "diesel"],
    staedte: ["Warszawa", "Poznań", "Wrocław", "Lublin", "Białystok"]
  },
  {
    id: "ungarn_balkan_agrar",
    name: "Pannonische Tiefebene",
    erzeugt: ["weizen", "mais", "sonnenblumen", "wein", "fleisch", "konserven"],
    braucht: ["duenger", "maschinen", "neuwagen", "konsumgueter", "diesel"],
    staedte: ["Budapest", "Szeged", "Pécs", "Beograd", "Zagreb", "Ljubljana",
              "Bratislava", "Wien", "Sarajevo", "Banja Luka"]
  },
  {
    id: "rumaenien_bulgarien",
    name: "Donauraum",
    erzeugt: ["weizen", "mais", "rohoel", "chemie", "stahl", "wein", "tabak"],
    braucht: ["maschinen", "fahrzeugteile", "konsumgueter", "duenger", "elektronik"],
    staedte: ["București", "Craiova", "Galați", "Brașov", "Cluj-Napoca", "Iași",
              "Sofia", "Veliko Tarnovo", "Skopje", "Tiranë", "Bijelo Polje", "Edirne"]
  },

  // ---------- Iberische Halbinsel ----------
  {
    id: "nordspanien",
    name: "Nordspanien und Baskenland",
    erzeugt: ["stahl", "stahlblech", "neuwagen", "fahrzeugteile", "papier", "fisch", "wein"],
    braucht: ["eisenerz", "kohle", "schrott", "container", "futtermittel"],
    staedte: ["Bilbao", "Gijón", "A Coruña", "Valladolid", "Zaragoza", "Ciudad Real"]
  },
  {
    id: "portugal",
    name: "Portugal",
    erzeugt: ["textilien", "schuhe", "wein", "papier", "fisch", "konserven"],
    braucht: ["maschinen", "fahrzeugteile", "weizen", "container", "kunststoff"],
    staedte: ["Lisboa", "Porto"]
  },

  // ---------- Metropolen: viel Bedarf, wenig Erzeugung ----------
  {
    id: "metropole",
    name: "Ballungsraum",
    erzeugt: ["konsumgueter", "stueckgut", "papier", "altpapier", "abfall", "arzneimittel"],
    braucht: ["konserven", "obst", "gemuese", "fleisch", "milchprodukte", "bier",
              "konsumgueter", "hausgeraete", "moebel", "textilien", "kies", "zement",
              "ziegel", "diesel", "benzin", "heizoel", "stueckgut"],
    staedte: ["Paris", "London", "Madrid", "Roma", "İstanbul", "Saint Petersburg",
              "Dublin", "Brussel", "Lyon", "Birmingham", "Vilnius", "Daugavpils",
              "Pskov", "Aarhus", "Stockholm"]
  }
];

// Standardregion je Land für Städte, die keiner Region zugeordnet sind.
const LAND_STANDARD = {
  DE: "norddeutschland", FR: "nordfrankreich", IT: "sueditalien",
  ES: "nordspanien", PT: "portugal", NL: "nordseehaefen", BE: "nordseehaefen",
  GB: "nordengland", IE: "metropole", DK: "ostseehaefen", SE: "norrland",
  NO: "norwegen", FI: "norrland", PL: "polen_agrar", CZ: "tschechien",
  SK: "oberschlesien", AT: "ungarn_balkan_agrar", CH: "sueddeutschland",
  HU: "ungarn_balkan_agrar", SI: "ungarn_balkan_agrar", HR: "ungarn_balkan_agrar",
  BA: "ungarn_balkan_agrar", RS: "ungarn_balkan_agrar", ME: "rumaenien_bulgarien",
  MK: "rumaenien_bulgarien", AL: "rumaenien_bulgarien", XK: "rumaenien_bulgarien",
  GR: "griechenland", BG: "rumaenien_bulgarien", RO: "rumaenien_bulgarien",
  MD: "rumaenien_bulgarien", UA: "polen_agrar", BY: "polen_agrar",
  LT: "ostseehaefen", LV: "ostseehaefen", EE: "ostseehaefen",
  RU: "metropole", TR: "metropole", LU: "ruhrgebiet"
};

const REGIONEN_NACH_ID = Object.fromEntries(REGIONEN.map((r) => [r.id, r]));

// Stadt -> Region, einmal aufgebaut
const STADT_REGION = (function () {
  const zuordnung = {};
  REGIONEN.forEach((r) => {
    (r.staedte || []).forEach((stadt) => {
      zuordnung[stadt] = r.id;
    });
  });
  return zuordnung;
})();
