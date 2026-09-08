// auslastung.js
// Berechnet, wie gut ein Fahrzeug ausgelastet ist - abgeleitet aus den
// Tour-Einträgen der Fahrzeughistorie.
//
// Der Sinn im Spiel entspricht dem in echter Fuhrparksoftware: erkennen,
// welche Fahrzeuge zu wenig laufen (unnötige Fixkosten, Kandidat für
// Verkauf) und welche überlastet sind (Verschleiß, Ausfallrisiko).
//
// Die Daten kommen aktuell aus den Debug-Touren. Sobald die
// Tourenplanung existiert, schreibt sie dieselben Historien-Einträge -
// diese Berechnung bleibt dann unverändert.

const Auslastung = (function () {

  // Betrachtungszeitraum in Tagen. 90 Tage entspricht einem Quartal und
  // glättet einzelne Ausreißer besser als ein Monat.
  const ZEITRAUM_TAGE = 90;

  // Ein Fahrzeug kann nicht an 7 Tagen die Woche laufen: Wochenenden,
  // Sonntagsfahrverbot (in Deutschland seit den 50ern in Kraft),
  // Feiertage, Werkstattzeiten. Rund 5 von 7 Tagen sind realistisch
  // erreichbar - das gilt als 100 % Auslastung.
  const ERREICHBARE_TAGE_ANTEIL = 5 / 7;

  // Schwellen für die Bewertung.
  // 100 % = das Fahrzeug läuft an allen realistisch erreichbaren Tagen,
  // also der Idealzustand - keine Überlastung. Erst wer darüber hinaus
  // fährt (Wochenenden, Sonntagsfahrverbot umgangen, keine Standzeit
  // für Wartung), gilt als überlastet.
  const SCHWELLE_UNTERAUSLASTUNG = 45; // Prozent
  const SCHWELLE_HOCH = 75;
  const SCHWELLE_UEBERLASTUNG = 105;

  // Unter dieser Zeit im Bestand ist noch keine sinnvolle Aussage
  // möglich - ein gestern gekauftes Fahrzeug ist nicht
  // "unterausgelastet", es hatte schlicht noch keine Gelegenheit.
  const MINDEST_TAGE_FUER_BEWERTUNG = 14;

  /**
   * @returns {{
   *   einsatztage: number, verfuegbareTage: number, prozent: number,
   *   km: number, kmProEinsatztag: number, touren: number,
   *   bewertung: "unterauslastung"|"normal"|"hoch"|"ueberlastung",
   *   text: string
   * }}
   */
  function berechne(fahrzeug, zeitraumTage = ZEITRAUM_TAGE) {
    const touren = Historie.seitTagen(fahrzeug, zeitraumTage)
      .filter((e) => e.art === "tour");

    const einsatztage = touren.reduce((s, t) => s + (t.tage || 0), 0);
    const km = touren.reduce((s, t) => s + (t.km || 0), 0);

    // Ein Fahrzeug, das erst seit kurzem im Bestand ist, darf nicht als
    // unterausgelastet gelten - deshalb der Zeitraum ab Zugang.
    const tageImBestand = tageSeitZugang(fahrzeug, zeitraumTage);

    const verfuegbareTage = Math.max(1, Math.round(tageImBestand * ERREICHBARE_TAGE_ANTEIL));

    const prozent = Math.min(200, (einsatztage / verfuegbareTage) * 100);
    const kmProEinsatztag = einsatztage > 0 ? km / einsatztage : 0;

    let bewertung;
    if (tageImBestand < MINDEST_TAGE_FUER_BEWERTUNG) {
      bewertung = "zuwenigdaten";
    } else if (prozent < SCHWELLE_UNTERAUSLASTUNG) {
      bewertung = "unterauslastung";
    } else if (prozent > SCHWELLE_UEBERLASTUNG) {
      bewertung = "ueberlastung";
    } else if (prozent > SCHWELLE_HOCH) {
      bewertung = "hoch";
    } else {
      bewertung = "normal";
    }

    return {
      einsatztage,
      verfuegbareTage,
      prozent,
      km,
      kmProEinsatztag,
      touren: touren.length,
      bewertung,
      text: bewertungsText(bewertung)
    };
  }

  /**
   * Wie viele Tage ist das Fahrzeug schon im Bestand - höchstens aber
   * der Betrachtungszeitraum.
   */
  function tageSeitZugang(fahrzeug, zeitraumTage) {
    const zugang = (fahrzeug.historie || []).find((e) => e.art === "kauf");
    if (!zugang) return zeitraumTage;

    const tage = Spielzeit.tageZwischen(new Date(zugang.datum), Spielzeit.heute());
    return Math.min(zeitraumTage, Math.max(1, tage));
  }

  function bewertungsText(bewertung) {
    switch (bewertung) {
      case "zuwenigdaten": return "noch keine Aussage";
      case "unterauslastung": return "unterausgelastet";
      case "hoch": return "gut ausgelastet";
      case "ueberlastung": return "überlastet";
      default: return "normal ausgelastet";
    }
  }

  /** Auslastung über die gesamte Flotte, für eine spätere Kennzahl-Anzeige. */
  function flotte(fahrzeuge, zeitraumTage = ZEITRAUM_TAGE) {
    if (fahrzeuge.length === 0) {
      return { prozent: 0, km: 0, unterausgelastet: 0, ueberlastet: 0 };
    }

    const einzeln = fahrzeuge.map((f) => berechne(f, zeitraumTage));
    // Fahrzeuge ohne ausreichende Datenbasis verzerren den Schnitt.
    const bewertbar = einzeln.filter((a) => a.bewertung !== "zuwenigdaten");

    return {
      bewertbareAnzahl: bewertbar.length,
      prozent: bewertbar.length > 0
        ? bewertbar.reduce((s, a) => s + a.prozent, 0) / bewertbar.length
        : 0,
      km: einzeln.reduce((s, a) => s + a.km, 0),
      unterausgelastet: einzeln.filter((a) => a.bewertung === "unterauslastung").length,
      ueberlastet: einzeln.filter((a) => a.bewertung === "ueberlastung").length
    };
  }

  return { ZEITRAUM_TAGE, berechne, flotte };
})();
