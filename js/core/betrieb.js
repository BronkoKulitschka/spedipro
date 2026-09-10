// betrieb.js
// Die Daten der eigenen Spedition. Bisher nur das Depot, später kommen
// Firmenname, Kapital, Ruf und Werkstattbesitz dazu - das ist der
// Anfang des globalen Spielstands, auf den mehrere Module zugreifen.
//
// Das Depot ist der Heimatstandort: dort stehen Fahrzeuge zwischen den
// Touren, dort beginnen und enden Rundtouren, und darauf beziehen sich
// später Fixkosten und Personal.

const Betrieb = (function () {
  const SPEICHER_SCHLUESSEL = "spedipro.betrieb";

  let daten = {
    depot: null,       // Name der Stadt aus STAEDTE
    gegruendetAm: null // ISO-Datum der Spielzeit
  };

  function laden() {
    try {
      const roh = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (roh) daten = { ...daten, ...JSON.parse(roh) };
    } catch (fehler) {
      // Speicher kann gesperrt sein (privates Fenster, strenge
      // Einstellungen). Dann läuft das Spiel eben ohne Speicherstand
      // weiter, statt beim Start abzubrechen.
      console.warn("Betriebsdaten nicht ladbar:", fehler.message);
    }
  }

  function speichern() {
    try {
      window.localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    } catch (fehler) {
      console.warn("Betriebsdaten nicht speicherbar:", fehler.message);
    }
  }

  function hatDepot() {
    return Boolean(daten.depot && STAEDTE[daten.depot]);
  }

  /** @returns {object|null} Stadtobjekt des Depots */
  function depot() {
    return hatDepot() ? STAEDTE[daten.depot] : null;
  }

  function depotName() {
    return hatDepot() ? daten.depot : null;
  }

  function depotSetzen(stadtName) {
    if (!STAEDTE[stadtName]) {
      throw new Error(`Unbekannte Stadt: ${stadtName}`);
    }
    daten.depot = stadtName;
    if (!daten.gegruendetAm) {
      daten.gegruendetAm = Spielzeit.heute().toISOString();
    }
    speichern();
    benachrichtigen();
  }

  function zuruecksetzen() {
    daten = { depot: null, gegruendetAm: null };
    speichern();
    benachrichtigen();
  }

  // Andere Module können auf Änderungen reagieren (z.B. der Fuhrpark,
  // wenn Fahrzeuge künftig am Depot stationiert werden).
  const beobachter = [];
  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r(depot())); }

  laden();

  return {
    hatDepot,
    depot,
    depotName,
    depotSetzen,
    zuruecksetzen,
    beiAenderung
  };
})();
