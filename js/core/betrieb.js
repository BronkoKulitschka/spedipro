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

  /**
   * Betriebsdaten für den Spielstand herausgeben bzw. übernehmen.
   * Sie liegen NICHT mehr unter einem eigenen Schlüssel: Seit es drei
   * Spielstandplätze gibt, müssen Depot und Flotte zum selben Platz
   * gehören - ein global gespeichertes Depot würde beim Wechsel
   * stehenbleiben und zur falschen Flotte passen.
   */
  function alsDaten() {
    return { ...daten };
  }

  function setzen(neueDaten) {
    daten = { depot: null, gegruendetAm: null, ...(neueDaten || {}) };
    benachrichtigen();
  }

  /** Einmalige Übernahme der alten, global gespeicherten Daten. */
  function altenStandUebernehmen() {
    try {
      const roh = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (roh) daten = { ...daten, ...JSON.parse(roh) };
      window.localStorage.removeItem(SPEICHER_SCHLUESSEL);
    } catch (fehler) {
      // Speicher kann gesperrt sein (privates Fenster, strenge
      // Einstellungen). Dann läuft das Spiel eben ohne Speicherstand
      // weiter, statt beim Start abzubrechen.
      console.warn("Betriebsdaten nicht ladbar:", fehler.message);
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
    const ersteGruendung = !daten.gegruendetAm;
    daten.depot = stadtName;
    if (ersteGruendung) {
      daten.gegruendetAm = Spielzeit.heute().toISOString();
      // Die Startflotte steht zu diesem Zeitpunkt noch am Notbehelfs-
      // ort, an dem sie erzeugt wurde. Sie gehört ins Depot.
      if (typeof FuhrparkApp !== "undefined" && FuhrparkApp.zumDepotVersetzen) {
        FuhrparkApp.zumDepotVersetzen(stadtName);
      }
      // Mit dem Depot beginnt der Geschäftsbetrieb: Eigenkapital
      // einlegen, ab da laufen Miete und Verwaltung.
      if (typeof Finanzen !== "undefined") Finanzen.gruenden();
    }
    benachrichtigen();
    // Auch den übrigen Spielstand sichern, damit Depot und Flotte
    // zusammenpassen.
    if (typeof Speicher !== "undefined") Speicher.jetztSichern();
  }

  function zuruecksetzen() {
    daten = { depot: null, gegruendetAm: null };
    benachrichtigen();
  }

  // Andere Module können auf Änderungen reagieren (z.B. der Fuhrpark,
  // wenn Fahrzeuge künftig am Depot stationiert werden).
  const beobachter = [];
  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r(depot())); }

  altenStandUebernehmen();

  return {
    hatDepot,
    daten: alsDaten,
    setzen,
    depot,
    depotName,
    depotSetzen,
    zuruecksetzen,
    beiAenderung
  };
})();
