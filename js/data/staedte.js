// staedte.js
// 165 europäische Städte mit echten Koordinaten, Länderkürzel und
// Einwohnerzahlen von 1995.
//
// Herkunft: Städteliste aus dem Projekt, abgeglichen mit Natural Earth
// (Koordinaten, Bevölkerung) - also keine geschätzten Positionen.
//
// Auswahlverfahren: gleichmäßige Verteilung über einen Mindestabstand
// von 140 km, ergänzt um Pflichtknoten (knoten: true), die diesen
// Abstand unterschreiten dürfen. Das sind die Frachtdrehscheiben
// Europas - Seehäfen, Binnenhäfen und große Wirtschaftszentren -,
// ohne die eine Speditionssimulation unvollständig wäre
// (Rotterdam/Antwerpen/Amsterdam, Ruhrgebiet, Poebene usw.).

const STAEDTE = {
"Rotterdam": {
"name": "Rotterdam",
"lat": 51.9219,
"lon": 4.478,
"land": "NL",
"einw1995": 981,
"knoten": true
},
"Antwerpen": {
"name": "Antwerpen",
"lat": 51.2223,
"lon": 4.4131,
"land": "BE",
"einw1995": 906,
"knoten": true
},
"Amsterdam": {
"name": "Amsterdam",
"lat": 52.3519,
"lon": 4.9147,
"land": "NL",
"einw1995": 988,
"knoten": true
},
"Brussel": {
"name": "Brussel",
"lat": 50.8353,
"lon": 4.3314,
"land": "BE",
"einw1995": 1715,
"knoten": true
},
"Hamburg": {
"name": "Hamburg",
"lat": 53.552,
"lon": 9.9981,
"land": "DE",
"einw1995": 1707,
"knoten": true
},
"Bremerhaven": {
"name": "Bremerhaven",
"lat": 53.5504,
"lon": 8.58,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Bremen": {
"name": "Bremen",
"lat": 53.08,
"lon": 8.8,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Duisburg": {
"name": "Duisburg",
"lat": 51.43,
"lon": 6.75,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Köln": {
"name": "Köln",
"lat": 50.932,
"lon": 6.9481,
"land": "DE",
"einw1995": 965,
"knoten": true
},
"Le Havre": {
"name": "Le Havre",
"lat": 49.505,
"lon": 0.105,
"land": "FR",
"einw1995": 0,
"knoten": true
},
"Zeebrugge": {
"name": "Zeebrugge",
"lat": 51.33,
"lon": 3.2,
"land": "BE",
"einw1995": 0,
"knoten": true
},
"Felixstowe": {
"name": "Felixstowe",
"lat": 51.9637,
"lon": 1.3511,
"land": "GB",
"einw1995": 0,
"knoten": true
},
"Gdańsk": {
"name": "Gdańsk",
"lat": 54.36,
"lon": 18.64,
"land": "PL",
"einw1995": 0,
"knoten": true
},
"Göteborg": {
"name": "Göteborg",
"lat": 57.75,
"lon": 12.0,
"land": "SE",
"einw1995": 0,
"knoten": true
},
"København": {
"name": "København",
"lat": 55.6805,
"lon": 12.5615,
"land": "DK",
"einw1995": 1048,
"knoten": true
},
"Klaipėda": {
"name": "Klaipėda",
"lat": 55.7204,
"lon": 21.1199,
"land": "LT",
"einw1995": 0,
"knoten": true
},
"Rīga": {
"name": "Rīga",
"lat": 56.95,
"lon": 24.1,
"land": "LV",
"einw1995": 0,
"knoten": true
},
"Tallinn": {
"name": "Tallinn",
"lat": 59.4339,
"lon": 24.728,
"land": "EE",
"einw1995": 0,
"knoten": true
},
"Helsinki": {
"name": "Helsinki",
"lat": 60.1775,
"lon": 24.9322,
"land": "FI",
"einw1995": 943,
"knoten": true
},
"Stockholm": {
"name": "Stockholm",
"lat": 59.3527,
"lon": 18.0954,
"land": "SE",
"einw1995": 1138,
"knoten": true
},
"Oslo": {
"name": "Oslo",
"lat": 59.9186,
"lon": 10.748,
"land": "NO",
"einw1995": 729,
"knoten": true
},
"Marseille": {
"name": "Marseille",
"lat": 43.2919,
"lon": 5.3731,
"land": "FR",
"einw1995": 1331,
"knoten": true
},
"Barcelona": {
"name": "Barcelona",
"lat": 41.3852,
"lon": 2.1814,
"land": "ES",
"einw1995": 4318,
"knoten": true
},
"València": {
"name": "València",
"lat": 39.487,
"lon": -0.402,
"land": "ES",
"einw1995": 785,
"knoten": true
},
"Genova": {
"name": "Genova",
"lat": 44.41,
"lon": 8.93,
"land": "IT",
"einw1995": 0,
"knoten": true
},
"Trieste": {
"name": "Trieste",
"lat": 45.6504,
"lon": 13.8,
"land": "IT",
"einw1995": 0,
"knoten": true
},
"Koper": {
"name": "Koper",
"lat": 45.5482,
"lon": 13.7296,
"land": "SI",
"einw1995": 0,
"knoten": true
},
"Piraeus": {
"name": "Piraeus",
"lat": 37.95,
"lon": 23.7,
"land": "GR",
"einw1995": 0,
"knoten": true
},
"Algeciras": {
"name": "Algeciras",
"lat": 36.1267,
"lon": -5.4665,
"land": "ES",
"einw1995": 0,
"knoten": true
},
"Napoli": {
"name": "Napoli",
"lat": 40.842,
"lon": 14.2431,
"land": "IT",
"einw1995": 2218,
"knoten": true
},
"Milano": {
"name": "Milano",
"lat": 45.4719,
"lon": 9.2031,
"land": "IT",
"einw1995": 3020,
"knoten": true
},
"Torino": {
"name": "Torino",
"lat": 45.0723,
"lon": 7.668,
"land": "IT",
"einw1995": 1733,
"knoten": true
},
"Bologna": {
"name": "Bologna",
"lat": 44.5004,
"lon": 11.34,
"land": "IT",
"einw1995": 0,
"knoten": true
},
"Venezia": {
"name": "Venezia",
"lat": 45.4387,
"lon": 12.335,
"land": "IT",
"einw1995": 0,
"knoten": true
},
"München": {
"name": "München",
"lat": 48.1319,
"lon": 11.573,
"land": "DE",
"einw1995": 1241,
"knoten": true
},
"Frankfurt am Main": {
"name": "Frankfurt am Main",
"lat": 50.1,
"lon": 8.675,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Stuttgart": {
"name": "Stuttgart",
"lat": 48.78,
"lon": 9.2,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Berlin": {
"name": "Berlin",
"lat": 52.5238,
"lon": 13.3996,
"land": "DE",
"einw1995": 3471,
"knoten": true
},
"Leipzig": {
"name": "Leipzig",
"lat": 51.3354,
"lon": 12.41,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Nürnberg": {
"name": "Nürnberg",
"lat": 49.45,
"lon": 11.08,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Hannover": {
"name": "Hannover",
"lat": 52.367,
"lon": 9.7167,
"land": "DE",
"einw1995": 0,
"knoten": true
},
"Paris": {
"name": "Paris",
"lat": 48.8686,
"lon": 2.3314,
"land": "FR",
"einw1995": 9510,
"knoten": true
},
"Lyon": {
"name": "Lyon",
"lat": 45.772,
"lon": 4.8281,
"land": "FR",
"einw1995": 1313,
"knoten": true
},
"Lille": {
"name": "Lille",
"lat": 50.6519,
"lon": 3.0781,
"land": "FR",
"einw1995": 984,
"knoten": true
},
"Madrid": {
"name": "Madrid",
"lat": 40.402,
"lon": -3.6853,
"land": "ES",
"einw1995": 4701,
"knoten": true
},
"Wien": {
"name": "Wien",
"lat": 48.202,
"lon": 16.3647,
"land": "AT",
"einw1995": 2127,
"knoten": true
},
"Praha": {
"name": "Praha",
"lat": 50.0853,
"lon": 14.464,
"land": "CZ",
"einw1995": 1194,
"knoten": true
},
"Bratislava": {
"name": "Bratislava",
"lat": 48.15,
"lon": 17.117,
"land": "SK",
"einw1995": 0,
"knoten": true
},
"Budapest": {
"name": "Budapest",
"lat": 47.502,
"lon": 19.0814,
"land": "HU",
"einw1995": 1893,
"knoten": true
},
"Warszawa": {
"name": "Warszawa",
"lat": 52.2519,
"lon": 20.9981,
"land": "PL",
"einw1995": 1652,
"knoten": true
},
"Poznań": {
"name": "Poznań",
"lat": 52.4058,
"lon": 16.8999,
"land": "PL",
"einw1995": 0,
"knoten": true
},
"Wrocław": {
"name": "Wrocław",
"lat": 51.1104,
"lon": 17.03,
"land": "PL",
"einw1995": 0,
"knoten": true
},
"Katowice": {
"name": "Katowice",
"lat": 50.2604,
"lon": 19.02,
"land": "PL",
"einw1995": 0,
"knoten": true
},
"Ljubljana": {
"name": "Ljubljana",
"lat": 46.0553,
"lon": 14.515,
"land": "SI",
"einw1995": 0,
"knoten": true
},
"Zagreb": {
"name": "Zagreb",
"lat": 45.8,
"lon": 16.0,
"land": "HR",
"einw1995": 0,
"knoten": true
},
"Zürich": {
"name": "Zürich",
"lat": 47.3819,
"lon": 8.5481,
"land": "CH",
"einw1995": 1048,
"knoten": true
},
"Basel": {
"name": "Basel",
"lat": 47.5804,
"lon": 7.59,
"land": "CH",
"einw1995": 0,
"knoten": true
},
"Manchester": {
"name": "Manchester",
"lat": 53.5024,
"lon": -2.2499,
"land": "GB",
"einw1995": 2262,
"knoten": true
},
"Birmingham": {
"name": "Birmingham",
"lat": 52.4769,
"lon": -1.9219,
"land": "GB",
"einw1995": 2291,
"knoten": true
},
"London": {
"name": "London",
"lat": 51.5019,
"lon": -0.1187,
"land": "GB",
"einw1995": 7908,
"knoten": true
},
"Dublin": {
"name": "Dublin",
"lat": 53.335,
"lon": -6.2509,
"land": "IE",
"einw1995": 946,
"knoten": true
},
"Lisboa": {
"name": "Lisboa",
"lat": 38.7247,
"lon": -9.1468,
"land": "PT",
"einw1995": 2600,
"knoten": true
},
"Porto": {
"name": "Porto",
"lat": 41.152,
"lon": -8.6219,
"land": "PT",
"einw1995": 1206,
"knoten": true
},
"Roma": {
"name": "Roma",
"lat": 41.8979,
"lon": 12.4813,
"land": "IT",
"einw1995": 3425,
"knoten": false
},
"İstanbul": {
"name": "İstanbul",
"lat": 41.1069,
"lon": 29.0081,
"land": "TR",
"einw1995": 7665,
"knoten": false
},
"București": {
"name": "București",
"lat": 44.4353,
"lon": 26.098,
"land": "RO",
"einw1995": 2018,
"knoten": false
},
"Saint Petersburg": {
"name": "Saint Petersburg",
"lat": 59.941,
"lon": 30.3141,
"land": "RU",
"einw1995": 4836,
"knoten": false
},
"Sofia": {
"name": "Sofia",
"lat": 42.6853,
"lon": 23.3147,
"land": "BG",
"einw1995": 1168,
"knoten": false
},
"Beograd": {
"name": "Beograd",
"lat": 44.8206,
"lon": 20.466,
"land": "RS",
"einw1995": 1149,
"knoten": false
},
"Sarajevo": {
"name": "Sarajevo",
"lat": 43.85,
"lon": 18.383,
"land": "BA",
"einw1995": 0,
"knoten": false
},
"Vilnius": {
"name": "Vilnius",
"lat": 54.6834,
"lon": 25.3166,
"land": "LT",
"einw1995": 0,
"knoten": false
},
"Skopje": {
"name": "Skopje",
"lat": 42.0,
"lon": 21.4335,
"land": "MK",
"einw1995": 0,
"knoten": false
},
"Sevilla": {
"name": "Sevilla",
"lat": 37.405,
"lon": -5.98,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Glasgow": {
"name": "Glasgow",
"lat": 55.8764,
"lon": -4.2527,
"land": "GB",
"einw1995": 1186,
"knoten": false
},
"Newcastle-upon-Tyne": {
"name": "Newcastle-upon-Tyne",
"lat": 55.0023,
"lon": -1.6019,
"land": "GB",
"einw1995": 883,
"knoten": false
},
"Bilbao": {
"name": "Bilbao",
"lat": 43.25,
"lon": -2.93,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Nice": {
"name": "Nice",
"lat": 43.717,
"lon": 7.2631,
"land": "FR",
"einw1995": 874,
"knoten": false
},
"Cardiff": {
"name": "Cardiff",
"lat": 51.5,
"lon": -3.225,
"land": "GB",
"einw1995": 0,
"knoten": false
},
"Palermo": {
"name": "Palermo",
"lat": 38.127,
"lon": 13.3481,
"land": "IT",
"einw1995": 850,
"knoten": false
},
"Tiranë": {
"name": "Tiranë",
"lat": 41.33,
"lon": 19.82,
"land": "AL",
"einw1995": 340,
"knoten": false
},
"Thessaloniki": {
"name": "Thessaloniki",
"lat": 40.6981,
"lon": 22.8831,
"land": "GR",
"einw1995": 771,
"knoten": false
},
"Bordeaux": {
"name": "Bordeaux",
"lat": 44.852,
"lon": -0.597,
"land": "FR",
"einw1995": 730,
"knoten": false
},
"Toulouse": {
"name": "Toulouse",
"lat": 43.6219,
"lon": 1.448,
"land": "FR",
"einw1995": 714,
"knoten": false
},
"Catania": {
"name": "Catania",
"lat": 37.5,
"lon": 15.08,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Zaragoza": {
"name": "Zaragoza",
"lat": 41.65,
"lon": -0.89,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Bari": {
"name": "Bari",
"lat": 41.1142,
"lon": 16.8728,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Nantes": {
"name": "Nantes",
"lat": 47.2104,
"lon": -1.59,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Metz": {
"name": "Metz",
"lat": 49.1203,
"lon": 6.18,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Murcia": {
"name": "Murcia",
"lat": 37.98,
"lon": -1.13,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Granada": {
"name": "Granada",
"lat": 37.165,
"lon": -3.585,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"A Coruña": {
"name": "A Coruña",
"lat": 43.33,
"lon": -8.42,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Lublin": {
"name": "Lublin",
"lat": 51.2504,
"lon": 22.5727,
"land": "PL",
"einw1995": 0,
"knoten": false
},
"Linz": {
"name": "Linz",
"lat": 48.3192,
"lon": 14.2888,
"land": "AT",
"einw1995": 0,
"knoten": false
},
"Gijón": {
"name": "Gijón",
"lat": 43.53,
"lon": -5.67,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Iași": {
"name": "Iași",
"lat": 47.1683,
"lon": 27.5749,
"land": "RO",
"einw1995": 0,
"knoten": false
},
"Valladolid": {
"name": "Valladolid",
"lat": 41.65,
"lon": -4.75,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Cluj-Napoca": {
"name": "Cluj-Napoca",
"lat": 46.7884,
"lon": 23.5984,
"land": "RO",
"einw1995": 0,
"knoten": false
},
"Pescara": {
"name": "Pescara",
"lat": 42.4554,
"lon": 14.2187,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Varna": {
"name": "Varna",
"lat": 43.2156,
"lon": 27.8953,
"land": "BG",
"einw1995": 0,
"knoten": false
},
"Galați": {
"name": "Galați",
"lat": 45.4559,
"lon": 28.0459,
"land": "RO",
"einw1995": 0,
"knoten": false
},
"Brașov": {
"name": "Brașov",
"lat": 45.6475,
"lon": 25.6072,
"land": "RO",
"einw1995": 0,
"knoten": false
},
"Craiova": {
"name": "Craiova",
"lat": 44.3263,
"lon": 23.8259,
"land": "RO",
"einw1995": 0,
"knoten": false
},
"Białystok": {
"name": "Białystok",
"lat": 53.1504,
"lon": 23.17,
"land": "PL",
"einw1995": 0,
"knoten": false
},
"Cagliari": {
"name": "Cagliari",
"lat": 39.2224,
"lon": 9.104,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Tampere": {
"name": "Tampere",
"lat": 61.5,
"lon": 23.75,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Plymouth": {
"name": "Plymouth",
"lat": 50.3854,
"lon": -4.16,
"land": "GB",
"einw1995": 0,
"knoten": false
},
"Aarhus": {
"name": "Aarhus",
"lat": 56.1572,
"lon": 10.2107,
"land": "DK",
"einw1995": 0,
"knoten": false
},
"Košice": {
"name": "Košice",
"lat": 48.7304,
"lon": 21.25,
"land": "SK",
"einw1995": 0,
"knoten": false
},
"Banja Luka": {
"name": "Banja Luka",
"lat": 44.7804,
"lon": 17.18,
"land": "BA",
"einw1995": 0,
"knoten": false
},
"Split": {
"name": "Split",
"lat": 43.5204,
"lon": 16.47,
"land": "HR",
"einw1995": 0,
"knoten": false
},
"Bergen": {
"name": "Bergen",
"lat": 60.391,
"lon": 5.3245,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Rostock": {
"name": "Rostock",
"lat": 54.0704,
"lon": 12.15,
"land": "DE",
"einw1995": 0,
"knoten": false
},
"Pskov": {
"name": "Pskov",
"lat": 57.83,
"lon": 28.3299,
"land": "RU",
"einw1995": 0,
"knoten": false
},
"Aberdeen": {
"name": "Aberdeen",
"lat": 57.1704,
"lon": -2.08,
"land": "GB",
"einw1995": 0,
"knoten": false
},
"Szeged": {
"name": "Szeged",
"lat": 46.2504,
"lon": 20.15,
"land": "HU",
"einw1995": 0,
"knoten": false
},
"Pécs": {
"name": "Pécs",
"lat": 46.0804,
"lon": 18.22,
"land": "HU",
"einw1995": 0,
"knoten": false
},
"Turku": {
"name": "Turku",
"lat": 60.4539,
"lon": 22.255,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Stavanger": {
"name": "Stavanger",
"lat": 58.97,
"lon": 5.68,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Dijon": {
"name": "Dijon",
"lat": 47.3304,
"lon": 5.03,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Patra": {
"name": "Patra",
"lat": 38.23,
"lon": 21.73,
"land": "GR",
"einw1995": 0,
"knoten": false
},
"Limoges": {
"name": "Limoges",
"lat": 45.83,
"lon": 1.25,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Trondheim": {
"name": "Trondheim",
"lat": 63.4167,
"lon": 10.4167,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Le Mans": {
"name": "Le Mans",
"lat": 48.0004,
"lon": 0.1,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Badajoz": {
"name": "Badajoz",
"lat": 38.8804,
"lon": -6.97,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Oulu": {
"name": "Oulu",
"lat": 65.0,
"lon": 25.47,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Edirne": {
"name": "Edirne",
"lat": 41.6704,
"lon": 26.57,
"land": "TR",
"einw1995": 0,
"knoten": false
},
"Sassari": {
"name": "Sassari",
"lat": 40.73,
"lon": 8.57,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Daugavpils": {
"name": "Daugavpils",
"lat": 55.88,
"lon": 26.51,
"land": "LV",
"einw1995": 0,
"knoten": false
},
"Ancona": {
"name": "Ancona",
"lat": 43.6004,
"lon": 13.4999,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Örebro": {
"name": "Örebro",
"lat": 59.2803,
"lon": 15.22,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Catanzaro": {
"name": "Catanzaro",
"lat": 38.9004,
"lon": 16.6,
"land": "IT",
"einw1995": 0,
"knoten": false
},
"Kuopio": {
"name": "Kuopio",
"lat": 62.8943,
"lon": 27.6949,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Ioannina": {
"name": "Ioannina",
"lat": 39.6679,
"lon": 20.8509,
"land": "GR",
"einw1995": 0,
"knoten": false
},
"Chania": {
"name": "Chania",
"lat": 35.5122,
"lon": 24.0156,
"land": "GR",
"einw1995": 0,
"knoten": false
},
"Umeå": {
"name": "Umeå",
"lat": 63.83,
"lon": 20.24,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Sundsvall": {
"name": "Sundsvall",
"lat": 62.4001,
"lon": 17.3167,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Bourges": {
"name": "Bourges",
"lat": 47.0837,
"lon": 2.4,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Gävle": {
"name": "Gävle",
"lat": 60.667,
"lon": 17.1666,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Kristiansand": {
"name": "Kristiansand",
"lat": 58.1666,
"lon": 8.0,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Växjö": {
"name": "Växjö",
"lat": 56.8837,
"lon": 14.8167,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Lappeenranta": {
"name": "Lappeenranta",
"lat": 61.0671,
"lon": 28.1833,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Rodos": {
"name": "Rodos",
"lat": 36.4412,
"lon": 28.2225,
"land": "GR",
"einw1995": 0,
"knoten": false
},
"Veliko Tarnovo": {
"name": "Veliko Tarnovo",
"lat": 43.0862,
"lon": 25.6555,
"land": "BG",
"einw1995": 0,
"knoten": false
},
"Tromsø": {
"name": "Tromsø",
"lat": 69.6351,
"lon": 18.992,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Luleå": {
"name": "Luleå",
"lat": 65.5966,
"lon": 22.1584,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Ålesund": {
"name": "Ålesund",
"lat": 62.5454,
"lon": 6.388,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Kokkola": {
"name": "Kokkola",
"lat": 63.8333,
"lon": 23.1167,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Östersund": {
"name": "Östersund",
"lat": 63.1833,
"lon": 14.65,
"land": "SE",
"einw1995": 0,
"knoten": false
},
"Ventspils": {
"name": "Ventspils",
"lat": 57.3899,
"lon": 21.5606,
"land": "LV",
"einw1995": 0,
"knoten": false
},
"Faro": {
"name": "Faro",
"lat": 37.0171,
"lon": -7.9333,
"land": "PT",
"einw1995": 0,
"knoten": false
},
"Bastia": {
"name": "Bastia",
"lat": 42.7032,
"lon": 9.45,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Rovaniemi": {
"name": "Rovaniemi",
"lat": 66.5,
"lon": 25.7159,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Bodø": {
"name": "Bodø",
"lat": 67.2764,
"lon": 14.4293,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Mytilini": {
"name": "Mytilini",
"lat": 39.1104,
"lon": 26.5546,
"land": "GR",
"einw1995": 0,
"knoten": false
},
"Almaraz": {
"name": "Almaraz",
"lat": 39.8142,
"lon": -5.677,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Bijelo Polje": {
"name": "Bijelo Polje",
"lat": 43.0383,
"lon": 19.7476,
"land": "ME",
"einw1995": 0,
"knoten": false
},
"Ciudad Real": {
"name": "Ciudad Real",
"lat": 38.9863,
"lon": -3.9291,
"land": "ES",
"einw1995": 0,
"knoten": false
},
"Dombås": {
"name": "Dombås",
"lat": 62.0755,
"lon": 9.1279,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Grimsby": {
"name": "Grimsby",
"lat": 53.5654,
"lon": -0.0755,
"land": "GB",
"einw1995": 0,
"knoten": false
},
"Honningsvåg": {
"name": "Honningsvåg",
"lat": 70.9821,
"lon": 25.9704,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Ivalo": {
"name": "Ivalo",
"lat": 68.6599,
"lon": 27.5389,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Kuusamo": {
"name": "Kuusamo",
"lat": 65.9645,
"lon": 29.1888,
"land": "FI",
"einw1995": 0,
"knoten": false
},
"Narvik": {
"name": "Narvik",
"lat": 68.3832,
"lon": 17.29,
"land": "NO",
"einw1995": 0,
"knoten": false
},
"Roscoff": {
"name": "Roscoff",
"lat": 48.7238,
"lon": -3.9871,
"land": "FR",
"einw1995": 0,
"knoten": false
},
"Alta": {
"name": "Alta",
"lat": 69.9666,
"lon": 23.2417,
"land": "NO",
"einw1995": 0,
"knoten": false
}
};
