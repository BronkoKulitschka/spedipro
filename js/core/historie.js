// historie.js
// Chronik pro Fahrzeug: jedes Ereignis wird mit Spieldatum festgehalten.
//
// Die Historie ist bewusst als eigenes Kernmodul angelegt, weil sie
// später von mehreren Seiten befüllt wird:
//   Tourenplanung  -> gefahrene Touren (km, Dauer, Strecke, Fahrer)
//   Werkstatt      -> Reparaturen, Wartungen, Prüfungen
//   Fahrzeughandel -> Kauf, Verkauf
//   Personal       -> Fahrerwechsel
// und von mehreren Seiten gelesen: Fuhrpark (Anzeige, Auslastung),
// Buchhaltung (Kosten je Fahrzeug), Werkstatt (Vorgeschichte).
//
// Jeder Eintrag ist ein einfaches Objekt - so lassen sich später
// beliebige Zusatzfelder ergänzen, ohne bestehende Einträge zu brechen.

const Historie = (function () {

  // Ereignisarten mit Anzeigetext und Symbol.
  const ARTEN = {
    kauf:       { label: "Zugang",     symbol: "🔑" },
    tour:       { label: "Tour",       symbol: "🛣" },
    reparatur:  { label: "Reparatur",  symbol: "🔧" },
    wartung:    { label: "Wartung",    symbol: "🛠" },
    pruefung:   { label: "Prüfung",    symbol: "📋" },
    schaden:    { label: "Schaden",    symbol: "⚠" },
    sonstiges:  { label: "Sonstiges",  symbol: "•" }
  };

  // Wie viele Einträge pro Fahrzeug aufgehoben werden. Verhindert, dass
  // die Chronik bei langen Partien unbegrenzt wächst.
  const MAX_EINTRAEGE = 200;

  /**
   * Hängt ein Ereignis an die Chronik eines Fahrzeugs.
   * @param {object} fahrzeug
   * @param {object} eintrag
   * @param {string} eintrag.art  Schlüssel aus ARTEN
   * @param {string} eintrag.text Beschreibung für die Anzeige
   * @param {number} [eintrag.kosten]  Betrag in DM (für die Buchhaltung)
   * @param {number} [eintrag.km]      gefahrene km (bei Touren)
   * @param {number} [eintrag.tage]    Dauer in Tagen (bei Touren)
   * @param {object} [eintrag.daten]   beliebige Zusatzdaten
   */
  function hinzufuegen(fahrzeug, eintrag) {
    if (!ARTEN[eintrag.art]) {
      throw new Error(`Unbekannte Ereignisart: ${eintrag.art}`);
    }
    if (!fahrzeug.historie) fahrzeug.historie = [];

    fahrzeug.historie.push({
      datum: Spielzeit.heute().toISOString(),
      kmStand: fahrzeug.kmStand,
      ...eintrag
    });

    // Älteste Einträge verwerfen, wenn das Limit überschritten ist.
    if (fahrzeug.historie.length > MAX_EINTRAEGE) {
      fahrzeug.historie.splice(0, fahrzeug.historie.length - MAX_EINTRAEGE);
    }
  }

  /** Alle Einträge, neueste zuerst. */
  function alle(fahrzeug) {
    return (fahrzeug.historie || []).slice().reverse();
  }

  /** Die n neuesten Einträge. */
  function letzte(fahrzeug, n = 10) {
    return alle(fahrzeug).slice(0, n);
  }

  /** Einträge einer bestimmten Art. */
  function nachArt(fahrzeug, art) {
    return alle(fahrzeug).filter((e) => e.art === art);
  }

  /** Einträge innerhalb der letzten n Tage (bezogen auf die Spielzeit). */
  function seitTagen(fahrzeug, tage) {
    const heute = Spielzeit.heute();
    return (fahrzeug.historie || []).filter((e) => {
      const alter = Spielzeit.tageZwischen(new Date(e.datum), heute);
      return alter >= 0 && alter <= tage;
    });
  }

  /** Summe eines Zahlenfeldes über einen Zeitraum, z.B. km oder kosten. */
  function summeSeitTagen(fahrzeug, feld, tage) {
    return seitTagen(fahrzeug, tage).reduce(
      (summe, e) => summe + (e[feld] || 0),
      0
    );
  }

  function symbolFuer(art) {
    return ARTEN[art]?.symbol || ARTEN.sonstiges.symbol;
  }

  function labelFuer(art) {
    return ARTEN[art]?.label || ARTEN.sonstiges.label;
  }

  return {
    ARTEN,
    hinzufuegen,
    alle,
    letzte,
    nachArt,
    seitTagen,
    summeSeitTagen,
    symbolFuer,
    labelFuer
  };
})();
