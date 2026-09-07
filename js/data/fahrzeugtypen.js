// fahrzeugtypen.js
// Katalog fiktiver Fahrzeugtypen. Jede Marke ist frei erfunden, aber an
// ein reales 90er-Nutzfahrzeug angelehnt (siehe "vorbild" - nur intern
// als Referenz für Realismus, taucht nicht im Spiel selbst auf).
//
// Werte (Leistung, Verbrauch, Zuladung, Preis) sind grobe historische
// Richtwerte für schwere Sattelzugmaschinen der 90er Jahre.

const FAHRZEUGTYPEN = [
  {
    typId: "meridian-1830s",
    marke: "Meridian",
    modell: "1830 S",
    vorbild: "Mercedes-Benz SK",
    baujahrVon: 1988,
    baujahrBis: 1996,
    aufbautyp: "Plane",
    motorleistungPS: 300,
    zuladungKg: 25000,
    verbrauchBasisL100km: 32,
    neupreisDM: 165000
  },
  {
    typId: "skanda-143m",
    marke: "Skanda",
    modell: "143 M",
    vorbild: "Scania 143",
    baujahrVon: 1991,
    baujahrBis: 1997,
    aufbautyp: "Plane",
    motorleistungPS: 420,
    zuladungKg: 25500,
    verbrauchBasisL100km: 35,
    neupreisDM: 210000
  },
  {
    typId: "volsen-f12",
    marke: "Volsen",
    modell: "F12",
    vorbild: "Volvo F12",
    baujahrVon: 1989,
    baujahrBis: 1995,
    aufbautyp: "Kühlkoffer",
    motorleistungPS: 380,
    zuladungKg: 24000,
    verbrauchBasisL100km: 34,
    neupreisDM: 195000
  },
  {
    typId: "manker-f2000",
    marke: "Manker",
    modell: "F2000",
    vorbild: "MAN F2000",
    baujahrVon: 1994,
    baujahrBis: 1999,
    aufbautyp: "Plane",
    motorleistungPS: 350,
    zuladungKg: 25000,
    verbrauchBasisL100km: 33,
    neupreisDM: 180000
  },
  {
    typId: "iveko-turbostar",
    marke: "Iveko",
    modell: "TurboStar",
    vorbild: "Iveco TurboStar",
    baujahrVon: 1986,
    baujahrBis: 1993,
    aufbautyp: "Plane",
    motorleistungPS: 260,
    zuladungKg: 23000,
    verbrauchBasisL100km: 36,
    neupreisDM: 150000
  },
  {
    typId: "davo-95",
    marke: "Davo",
    modell: "95",
    vorbild: "DAF 95",
    baujahrVon: 1992,
    baujahrBis: 1998,
    aufbautyp: "Kühlkoffer",
    motorleistungPS: 350,
    zuladungKg: 24500,
    verbrauchBasisL100km: 33,
    neupreisDM: 185000
  }
];
