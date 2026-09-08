// fristen.js
// Termin- und Fristenüberwachung für Fahrzeuge.
//
// Abgebildet sind die für schwere Nutzfahrzeuge relevanten Prüfungen:
//
//   HU  Hauptuntersuchung nach §29 StVZO - umfassende Prüfung des
//       gesamten Fahrzeugs.
//   SP  Sicherheitsprüfung nach §29 StVZO - Zusatzprüfung zwischen zwei
//       HU-Terminen, vorgeschrieben u.a. für Lkw und Sattelzugmaschinen
//       über 7,5 t zulässigem Gesamtgewicht. Prüft gezielt die
//       sicherheitsrelevanten und verschleißanfälligen Baugruppen
//       (Bremsen, Fahrwerk, Lenkung, Rahmen, Verbindungseinrichtungen) -
//       passt damit direkt zu unserem Bauteil-Verschleißmodell.
//   Wartung  Reguläre Inspektion, laufleistungsabhängig statt datums-
//       abhängig (Ölwechsel, Filter, Einstellarbeiten).
//
// ACHTUNG - noch zu prüfen: Die hier hinterlegten Intervalle orientieren
// sich an der heutigen Regelung (HU jährlich, SP halbjährlich für schwere
// Nutzfahrzeuge). Für die Spielzeit Mitte der 90er sollten die damals
// gültigen Fristen aus der StVZO gegengeprüft werden, bevor daraus
// Spielmechanik mit Bußgeldern o.ä. abgeleitet wird.

const Fristen = (function () {

  const ARTEN = {
    hu: {
      label: "Hauptuntersuchung",
      kurz: "HU",
      intervallMonate: 12,
      typ: "datum"
    },
    sp: {
      label: "Sicherheitsprüfung",
      kurz: "SP",
      intervallMonate: 6,
      typ: "datum"
    },
    wartung: {
      label: "Inspektion",
      kurz: "Wartung",
      intervallKm: 60000,
      typ: "km"
    }
  };

  // Ab wann gilt eine Frist als "bald fällig"?
  const VORWARNUNG_TAGE = 30;
  const VORWARNUNG_KM = 5000;

  /**
   * Bewertet eine einzelne Frist.
   * @returns {{art, label, kurz, typ, status, text, rest}}
   *   status: "ok" | "bald" | "ueberfaellig"
   *   rest: verbleibende Tage bzw. km (negativ = überschritten)
   */
  function bewerte(fahrzeug, art) {
    const definition = ARTEN[art];
    if (!definition) throw new Error(`Unbekannte Fristart: ${art}`);

    return definition.typ === "datum"
      ? bewerteDatumsfrist(fahrzeug, art, definition)
      : bewerteKmFrist(fahrzeug, art, definition);
  }

  function bewerteDatumsfrist(fahrzeug, art, definition) {
    const faelligAm = naechsterTermin(fahrzeug, art);
    const restTage = Spielzeit.tageZwischen(Spielzeit.heute(), faelligAm);

    let status = "ok";
    if (restTage < 0) status = "ueberfaellig";
    else if (restTage <= VORWARNUNG_TAGE) status = "bald";

    let text;
    if (restTage < 0) {
      text = `seit ${Math.abs(restTage)} Tagen überfällig`;
    } else if (restTage === 0) {
      text = "heute fällig";
    } else {
      text = `fällig ${Spielzeit.formatiereMonat(faelligAm)} (in ${restTage} Tagen)`;
    }

    return {
      art,
      label: definition.label,
      kurz: definition.kurz,
      typ: "datum",
      status,
      text,
      rest: restTage,
      faelligAm
    };
  }

  function bewerteKmFrist(fahrzeug, art, definition) {
    const letzteBei = fahrzeug.fristen?.[art]?.letzteBeiKm ?? 0;
    const faelligBei = letzteBei + definition.intervallKm;
    const restKm = faelligBei - fahrzeug.kmStand;

    let status = "ok";
    if (restKm < 0) status = "ueberfaellig";
    else if (restKm <= VORWARNUNG_KM) status = "bald";

    const text =
      restKm < 0
        ? `seit ${Math.abs(restKm).toLocaleString("de-DE")} km überfällig`
        : `fällig bei ${faelligBei.toLocaleString("de-DE")} km ` +
          `(noch ${restKm.toLocaleString("de-DE")} km)`;

    return {
      art,
      label: definition.label,
      kurz: definition.kurz,
      typ: "km",
      status,
      text,
      rest: restKm,
      faelligBei
    };
  }

  /** Nächster Termin einer Datumsfrist. */
  function naechsterTermin(fahrzeug, art) {
    const definition = ARTEN[art];
    const letzte = fahrzeug.fristen?.[art]?.letzteAm;
    const letztesDatum = letzte ? new Date(letzte) : Spielzeit.heute();
    return Spielzeit.monateAddieren(letztesDatum, definition.intervallMonate);
  }

  /** Alle Fristen eines Fahrzeugs, bewertet. */
  function alle(fahrzeug) {
    return Object.keys(ARTEN).map((art) => bewerte(fahrzeug, art));
  }

  /**
   * Schlimmster Status über alle Fristen eines Fahrzeugs - für die
   * Ampel in der Übersichtsliste.
   */
  function schlimmsterStatus(fahrzeug) {
    const stati = alle(fahrzeug).map((f) => f.status);
    if (stati.includes("ueberfaellig")) return "ueberfaellig";
    if (stati.includes("bald")) return "bald";
    return "ok";
  }

  /** Frist als erledigt eintragen (Prüfung bestanden / Wartung gemacht). */
  function erledigen(fahrzeug, art) {
    const definition = ARTEN[art];
    if (!definition) throw new Error(`Unbekannte Fristart: ${art}`);

    if (!fahrzeug.fristen) fahrzeug.fristen = {};
    if (!fahrzeug.fristen[art]) fahrzeug.fristen[art] = {};

    if (definition.typ === "datum") {
      fahrzeug.fristen[art].letzteAm = Spielzeit.heute().toISOString();
    } else {
      fahrzeug.fristen[art].letzteBeiKm = fahrzeug.kmStand;
    }
  }

  /**
   * Erzeugt einen plausiblen Ausgangsstand für ein Fahrzeug: die letzte
   * Prüfung liegt irgendwo im zurückliegenden Intervall. Für Neuwagen
   * (kmStand 0) liegt sie auf dem heutigen Datum.
   */
  function initialisiere(fahrzeug, { neuwagen = false } = {}) {
    fahrzeug.fristen = {};

    Object.entries(ARTEN).forEach(([art, definition]) => {
      if (definition.typ === "datum") {
        const monateZurueck = neuwagen
          ? 0
          : Math.random() * definition.intervallMonate;
        const letzte = Spielzeit.monateAddieren(Spielzeit.heute(), -monateZurueck);
        fahrzeug.fristen[art] = { letzteAm: letzte.toISOString() };
      } else {
        const kmZurueck = neuwagen
          ? 0
          : Math.random() * definition.intervallKm;
        fahrzeug.fristen[art] = {
          letzteBeiKm: Math.max(0, Math.round(fahrzeug.kmStand - kmZurueck))
        };
      }
    });
  }

  return {
    ARTEN,
    bewerte,
    alle,
    schlimmsterStatus,
    erledigen,
    initialisiere,
    naechsterTermin
  };
})();
