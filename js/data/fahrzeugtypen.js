// fahrzeugtypen.js
// Katalog fiktiver Fahrzeugtypen. Jede Marke ist frei erfunden, aber an
// ein reales 90er-Nutzfahrzeug angelehnt (siehe "vorbild" - nur intern
// als Referenz für Realismus, taucht nicht im Spiel selbst auf).
//
// Werte (Leistung, Verbrauch, Zuladung, Preis) sind grobe historische
// Richtwerte für schwere Sattelzugmaschinen der 90er Jahre.
//
// ----------------------------------------------------------------------
// GEPLANT: weitere Fahrzeugkonfigurationen
// ----------------------------------------------------------------------
// Aktuell enthält der Katalog ausschließlich Sattelzugmaschinen mit
// Auflieger. Dazukommen sollen:
//
//   - Gliederzug: Motorwagen mit Anhänger, sowie Motorwagen solo
//   - Wechselbrücken-Fahrzeuge (BDF), ebenfalls mit und ohne Anhänger
//   - Verteilerfahrzeuge 7,5 bis 12 t, mit und ohne Anhänger
//   - Transporter bis 3,5 t (Kastenwagen, Pritsche, Kühlkasten) -
//     Kurier-/Express-/Kleingut, Teilebeschaffung, Nahverkehr
//
// Transporter fallen deutlich aus dem bisherigen Raster und brauchen
// eigene Annahmen:
//   * keine SP-Pflicht (die gilt erst über 7,5 t), HU je nach Fahrzeug
//     und Alter in anderem Rhythmus als bei schweren Nutzfahrzeugen
//   * keine EU-Lenkzeitpflicht mit Fahrtenschreiber unterhalb der
//     Gewichtsgrenze (in den 90ern 3,5 t) - das ändert Tourenplanung
//     und Personal-Modul spürbar
//   * Fahrerlaubnis Klasse 3 statt Klasse 2, also praktisch jeder
//     Fahrer einsetzbar
//   * ganz andere Größenordnungen: Anschaffung im niedrigen
//     fünfstelligen DM-Bereich statt sechsstellig, Verbrauch ~10-14 l
//     statt ~33 l, Zuladung rund eine Tonne statt 25
//   * Einsatzprofil Nahverkehr: viele Starts/Stopps, geringe
//     Tagesleistung - die Auslastungsrechnung mit 600-700 km/Tag passt
//     dafür nicht
//
// Spielerisch interessant als Einstiegsfahrzeug: geringe Investition,
// kleine Margen, aber ein möglicher Start für eine junge Spedition,
// bevor der erste Sattelzug finanzierbar ist.
//
// Was dafür angepasst werden muss (nicht nur ein neuer Katalogeintrag):
//
// 1) Anhänger/Auflieger als EIGENE Einheit, nicht als Teil des
//    Zugfahrzeugs. Sie haben eigene Laufleistung, eigenen Verschleiß
//    (v.a. Reifen und Bremsen) und eigene Prüffristen. Ein Zugfahrzeug
//    kann im Laufe seines Lebens mit verschiedenen Anhängern fahren -
//    genau das ist bei Wechselbrücken sogar der Betriebszweck.
//
// 2) Fristen werden gewichtsabhängig. Die SP-Pflicht nach §29 StVZO gilt
//    für Lkw/Zugmaschinen über 7,5 t und für Anhänger über 10 t
//    zulässigem Gesamtgewicht. Ein 7,5-Tonner fällt also anders aus als
//    ein 40-Tonner - `Fristen` muss die maßgeblichen Werte am Fahrzeug
//    auswerten, statt für alle dieselben Intervalle anzunehmen.
//    (Die genauen 90er-Fristen sind ohnehin noch gegenzuprüfen, siehe
//    Hinweis in fristen.js.)
//
// 3) Grafik: jede Konfiguration braucht ein eigenes Sprite UND eigene
//    Callout-Ankerpunkte, da CALLOUT_LAYOUT im Fuhrpark auf die
//    Bildkoordinaten genau dieses einen Sattelzugs ausgemessen ist.
//    Sinnvoll wäre, die Ankerpunkte pro Sprite zu hinterlegen statt
//    zentral im Fuhrpark-Modul.
//
// 4) Verschleiß-Bezugsgrößen: bei Gliederzügen verteilt sich die Last
//    anders als beim Sattelzug, und ein Solo-Motorwagen verschleißt
//    deutlich langsamer als derselbe Wagen mit Anhänger. Die Faktoren in
//    verschleiss.js sollten daher die Fahrzeugkonfiguration einbeziehen.
//
// 5) Einsatzprofil: leichte Verteilerfahrzeuge fahren Nahverkehr mit
//    vielen Stopps (mehr Bremsverschleiß, weniger km), Sattelzüge
//    Fernverkehr. Das betrifft die Auslastungsrechnung (dort sind
//    aktuell ~600-700 km/Tag als Fernverkehrs-Tagesleistung angesetzt)
//    und später die Tourenplanung.
//
// 6) Führerscheinklassen: in den 90ern galt für schwere Lkw Klasse 2,
//    für leichtere Klasse 3 - relevant fürs Personal-Modul, weil nicht
//    jeder Fahrer jedes Fahrzeug fahren darf. Vor Umsetzung die damals
//    gültigen Klassengrenzen prüfen.
// ----------------------------------------------------------------------

// Felder, die seit 0.15.39 dazugekommen sind und nur gesetzt werden
// müssen, wenn ein Typ vom Sattelzug abweicht:
//
//   klasse            "sattelzug" | "transporter" - steuert Texte und
//                     spätere Regeln (SP-Pflicht, Lenkzeit, Klasse 2)
//   zulGesamtgewichtKg  zulässiges Gesamtgewicht. Kfz-Steuer und
//                     Versicherung hängen daran (kostensaetze.js).
//                     Ohne Angabe wird vom Sattelzug ausgegangen.
//   ladevolumenM3     Laderaum. Vorher war das eine feste Zahl für alle
//                     (90 m³ in ladung.js) - beim 3,5-Tonner grob
//                     falsch, dort sind es rund 12 m³.
//   sprite            eigenes Bild. Ohne Angabe das Standardsprite.
//   miniaturAusschnitt  welcher Bildausschnitt in Listen gezeigt wird
//   calloutAnker      Ankerpunkte der Verschleiß-Sprechblasen, in
//                     Prozent der Bildbreite und -höhe. Sie waren bis
//                     0.15.38 zentral im Fuhrpark auf genau ein Sprite
//                     ausgemessen - mit einem zweiten Fahrzeug geht das
//                     nicht mehr, deshalb stehen sie jetzt am Typ.

const FAHRZEUGTYPEN = [
  {
    // Der Einstieg. Kein Sattelzug, kein Fernverkehr: ein Kastenwagen
    // bis 3,5 t, wie ihn eine junge Spedition 1994 als erstes Fahrzeug
    // gefahren hätte. Klasse 3 genügt, keine SP-Pflicht, keine
    // EU-Lenkzeitpflicht.
    typId: "kastor-t35",
    marke: "Kastor",
    modell: "T35",
    vorbild: "Mercedes-Benz T1 / VW LT 35",
    klasse: "transporter",
    baujahrVon: 1989,
    baujahrBis: 1995,
    aufbautyp: "Kastenwagen",
    motorleistungPS: 95,
    zuladungKg: 1400,
    zulGesamtgewichtKg: 3500,
    ladevolumenM3: 12,
    verbrauchBasisL100km: 12,
    neupreisDM: 38000,
    sprite: "assets/sprites/transporter-generisch.png",
    // Der ganze Wagen passt ins Listenbild - anders als beim Sattelzug,
    // wo nur die Zugmaschine gezeigt wird. Der Ausschnitt ist am
    // Bildinhalt gemessen (x 131-428, y 102-333) plus etwas Luft.
    miniaturAusschnitt: { x: 120, y: 92, breite: 320, hoehe: 252 },
    // Im Browser ausgemessen, nicht geschätzt: Das Bild füllt den
    // Rahmen bis auf 1 px, die Prozentwerte sind also die Bildpunkte
    // geteilt durch die Bildgröße. Räder über ihre dunklen Flächen
    // gefunden, nicht nach Augenmaß gesetzt. Der Antrieb zeigt bewusst
    // ZWISCHEN die Achsen - zeigte er aufs Rad, träfen sich zwei
    // Linien im selben Punkt.
    calloutAnker: {
      motor:      { anker: [31.5, 61.5], label: [8, 40] },
      bremsen:    { anker: [43.0, 70.7], label: [16, 88] },
      reifen:     { anker: [68.6, 58.9], label: [86, 82] },
      karosserie: { anker: [58.9, 45.9], label: [54, 12] },
      antrieb:    { anker: [52.0, 66.0], label: [88, 50] }
    }
  },
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
    zulGesamtgewichtKg: 40000,
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
    zulGesamtgewichtKg: 40000,
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
    zulGesamtgewichtKg: 40000,
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
    zulGesamtgewichtKg: 40000,
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
    zulGesamtgewichtKg: 40000,
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
    zulGesamtgewichtKg: 40000,
    verbrauchBasisL100km: 33,
    neupreisDM: 185000
  }
];
