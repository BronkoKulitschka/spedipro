// verschleiss.js
// Reine Berechnungslogik für Fahrzeugverschleiß und Spritverbrauch.
// Kennt keine Herkunft der Tourdaten - ob die Werte von der echten
// Tourenplanung oder vom Debug-Zufallsgenerator kommen, ist dieser
// Datei egal. Genau das war die Absicht: austauschbare Datenquelle,
// unveränderte Berechnung.

const Verschleiss = (function () {

  // Basis-Abnutzung in Prozentpunkten pro gefahrenem km (vor Faktoren).
  // Grobe Richtwerte: Reifen ~90.000 km Lebensdauer, Bremsen ~65.000 km,
  // Motor (als Gesamtzustand) ~550.000 km bis Generalüberholung.
  const BASISRATE = {
    reifen: 100 / 90000,
    bremsen: 100 / 65000,
    motor: 100 / 550000
  };

  const TEILE = ["reifen", "bremsen", "motor"];

  const GELAENDE_FAKTOR = {
    flachland: { reifen: 0.9, bremsen: 0.8, motor: 0.9 },
    huegelland: { reifen: 1.0, bremsen: 1.2, motor: 1.1 },
    mittelgebirge: { reifen: 1.1, bremsen: 1.5, motor: 1.3 },
    hochgebirge: { reifen: 1.2, bremsen: 2.0, motor: 1.5 }
  };

  const STRASSE_FAKTOR = {
    autobahn: { reifen: 0.9, bremsen: 0.9, motor: 0.95 },
    landstrasse: { reifen: 1.0, bremsen: 1.0, motor: 1.0 },
    marode: { reifen: 1.4, bremsen: 1.1, motor: 1.15 }
  };

  const JAHRESZEIT_FAKTOR = {
    fruehling: { reifen: 1.0, bremsen: 1.05, motor: 1.0 },
    sommer: { reifen: 0.9, bremsen: 0.9, motor: 1.05 },
    herbst: { reifen: 1.05, bremsen: 1.1, motor: 1.0 },
    winter: { reifen: 1.3, bremsen: 1.1, motor: 1.15 }
  };

  /**
   * Erwartete Form von "tour":
   * {
   *   km: number,
   *   gelaende: "flachland" | "huegelland" | "mittelgebirge" | "hochgebirge",
   *   strassenqualitaet: "autobahn" | "landstrasse" | "marode",
   *   jahreszeit: "fruehling" | "sommer" | "herbst" | "winter",
   *   beladungProzent: number (0-100),
   *   fahrverhaltenFaktor: number (z.B. 0.8 = schonend, 1.3 = riskant)
   * }
   */

  function pruefeTour(tour) {
    const fehlt = [];
    if (typeof tour.km !== "number") fehlt.push("km");
    if (!GELAENDE_FAKTOR[tour.gelaende]) fehlt.push("gelaende");
    if (!STRASSE_FAKTOR[tour.strassenqualitaet]) fehlt.push("strassenqualitaet");
    if (!JAHRESZEIT_FAKTOR[tour.jahreszeit]) fehlt.push("jahreszeit");
    if (typeof tour.fahrverhaltenFaktor !== "number") fehlt.push("fahrverhaltenFaktor");
    if (fehlt.length > 0) {
      throw new Error("Unvollständiger Tour-Datensatz, fehlt: " + fehlt.join(", "));
    }
  }

  function wendeTourAn(fahrzeug, tour) {
    pruefeTour(tour);

    TEILE.forEach((teil) => {
      const geFaktor = GELAENDE_FAKTOR[tour.gelaende][teil];
      const strFaktor = STRASSE_FAKTOR[tour.strassenqualitaet][teil];
      const jzFaktor = JAHRESZEIT_FAKTOR[tour.jahreszeit][teil];

      const abnutzung =
        tour.km *
        BASISRATE[teil] *
        geFaktor *
        strFaktor *
        jzFaktor *
        tour.fahrverhaltenFaktor;

      fahrzeug.verschleiss[teil] = Math.max(0, fahrzeug.verschleiss[teil] - abnutzung);
    });

    const verbrauchL = berechneVerbrauch(fahrzeug, tour);
    fahrzeug.verbrauchGesamtL += verbrauchL;
    fahrzeug.kmStand += tour.km;

    return { verbrauchL };
  }

  function berechneVerbrauch(fahrzeug, tour) {
    const beladungsfaktor = 1 + (tour.beladungProzent / 100) * 0.3;
    // Geländefaktor für den Verbrauch: Motor-Faktor als Näherung nutzen,
    // da er bereits Steigung/Last abbildet.
    const geFaktorVerbrauch = GELAENDE_FAKTOR[tour.gelaende].motor;

    const literProKm = fahrzeug.verbrauchBasisL100km / 100;
    return (
      literProKm *
      tour.km *
      beladungsfaktor *
      geFaktorVerbrauch *
      tour.fahrverhaltenFaktor
    );
  }

  function gesamtzustand(fahrzeug) {
    // Schwächstes Teil bestimmt den Gesamtzustand (ein Bremsschaden
    // legt das Fahrzeug still, egal wie gut der Motor ist).
    return Math.min(
      fahrzeug.verschleiss.reifen,
      fahrzeug.verschleiss.bremsen,
      fahrzeug.verschleiss.motor
    );
  }

  function teilReparieren(fahrzeug, teil) {
    if (!TEILE.includes(teil)) {
      throw new Error(`Unbekanntes Verschleißteil: ${teil}`);
    }
    fahrzeug.verschleiss[teil] = 100;
  }

  // ---------- Debug: simulierte Tourdaten ----------
  // Platzhalter, bis Tourenplanung/Personal echte Werte liefern.
  // Erzeugt exakt dieselbe Datenform wie ein echter Tour-Datensatz.

  function zufaelligAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  function zufaelligeTour() {
    return {
      km: Math.round(50 + Math.random() * 750),
      gelaende: zufaelligAus(Object.keys(GELAENDE_FAKTOR)),
      strassenqualitaet: zufaelligAus(Object.keys(STRASSE_FAKTOR)),
      jahreszeit: zufaelligAus(Object.keys(JAHRESZEIT_FAKTOR)),
      beladungProzent: Math.round(Math.random() * 100),
      // 0.8 (schonender Fahrer, guter Tag) bis 1.3 (riskant, schlechter Tag)
      fahrverhaltenFaktor: Math.round((0.8 + Math.random() * 0.5) * 100) / 100
    };
  }

  return {
    TEILE,
    wendeTourAn,
    gesamtzustand,
    teilReparieren,
    zufaelligeTour
  };
})();
