// ausfall.js
// Regelt, wann ein Fahrzeug wegen eines Bauteils liegenbleibt und wie es
// wieder fahrbereit wird.
//
// Grundgedanke: Verschleiß ist nicht nur eine Zahl, die langsam sinkt -
// unterhalb einer kritischen Grenze steht das Fahrzeug. Das erzeugt die
// eigentliche Spannung im Fuhrpark: rechtzeitig warten (planbar, günstig)
// oder auf Verschleiß fahren und das Risiko eines Ausfalls tragen
// (unplanbar, teuer, Fahrzeug fällt tagelang aus).
//
// Zwei Wege zurück in den Betrieb:
//   1. Reparatur vor Ort - nur bei Bauteilen, für die das realistisch
//      ist. In den 90ern rückte bei einem Reifenschaden ein mobiler
//      Reifendienst an; ein Motorschaden dagegen bedeutete Abschleppen.
//   2. Bergung in die Werkstatt - teuer, dauert länger, aber für alle
//      anderen Schäden der einzige Weg.

// ----------------------------------------------------------------------
// GEPLANT: Tourausfall und Vertragsstrafe (braucht die Tourenplanung)
// ----------------------------------------------------------------------
// Bleibt ein Fahrzeug MITTEN in einer Tour liegen und wird nicht
// zeitnah instand gesetzt, soll die Tour platzen und eine Strafe fällig
// werden. Das lässt sich heute noch nicht sinnvoll bauen, weil:
//
//   * die Debug-Tour in einem Rutsch abgerechnet wird - es gibt keinen
//     Zwischenstand "Fahrzeug steht bei km X mit Ladung an Bord",
//   * kein Auftrag existiert, aus dem sich eine Strafe ableiten ließe
//     (Kunde, Liefertermin, vereinbartes Entgelt).
//
// Sobald die Tourenplanung steht, sollte eine Tour ein Vorgang über
// mehrere Tage mit Zwischenständen sein. Dann ergibt sich der Ablauf
// von selbst:
//
//   1. Panne unterwegs -> Tour pausiert, Ladung bleibt auf dem Fahrzeug,
//      die Uhr läuft weiter gegen den vereinbarten Liefertermin.
//   2. Der Spieler entscheidet: teuer und schnell bergen, oder billiger
//      warten und den Termin riskieren.
//   3. Wird der Liefertermin gerissen, greifen die Folgen aus dem
//      Auftrag - z.B. Konventionalstrafe, Kosten einer Ersatzbeförderung
//      durch einen Frachtführer, Minderung des Entgelts, im schlimmsten
//      Fall Verlust des Kunden für Folgeaufträge.
//
// Rechtlicher Hintergrund für die Ausgestaltung (vor Umsetzung prüfen):
// Für den Güterkraftverkehr galten in den 90ern die KVO im nationalen
// Verkehr und die CMR grenzüberschreitend, die Haftung und Ersatz bei
// Lieferfristüberschreitung regeln. Wie genau daraus Spielmechanik wird,
// beim Bau der Tourenplanung festlegen.
//
// Die Bausteine dafür stehen hier bereits bereit: `ausfall.seit` hält
// fest, seit wann das Fahrzeug steht, und `Spielzeit.tageZwischen()`
// liefert die Standdauer.
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// GEPLANT: Ausfälle auch ohne Verschleiß-Unterschreitung
// ----------------------------------------------------------------------
// Bisher fällt ein Fahrzeug nur aus, wenn ein Bauteil unter seine
// kritische Grenze rutscht - also durch planbaren Verschleiß. In der
// Realität bleiben Lkw auch aus anderen Gründen liegen:
//
//   * Zufällige Defekte: Lichtmaschine, Anlasser, Turbolader,
//     Druckluftanlage, Elektrik. Wahrscheinlichkeit steigt mit Alter
//     und Laufleistung, ist aber nicht an ein einzelnes Verschleißteil
//     gebunden.
//   * Reifenschaden durch Fremdkörper - unabhängig vom Profilzustand.
//   * Unfälle und Fremdverschulden; Wetter (Schneeverwehung, Sperrung).
//   * Kraftstoffprobleme im Winter (versulzter Diesel) - passt gut zum
//     bereits vorhandenen Jahreszeitfaktor.
//
// Umsetzungsidee: eine Ausfallwahrscheinlichkeit je Tour berechnen aus
// Fahrzeugalter, Laufleistung, Gesamtzustand und Jahreszeit. Die
// Behandlung danach ist dieselbe wie hier (vor Ort oder Bergung), nur
// die Ursache und die Reparaturkosten unterscheiden sich.
// Sinnvoll zusammen mit der Tourenplanung, damit ein Ausfall mitten in
// der Tour auch die Tour selbst betrifft (siehe Notiz weiter unten).
// ----------------------------------------------------------------------

const Ausfall = (function () {

  // Kritische Grenze je Bauteil in Prozent. Bewusst unterschiedlich:
  // Bremsen sind sicherheitsrelevant und führen früher zum Stillstand,
  // während eine angeschlagene Karosserie lange fahrbar bleibt.
  const KRITISCH = {
    bremsen: 15,
    reifen: 12,
    antrieb: 10,
    motor: 8,
    karosserie: 5
  };

  // Ab hier warnt der Fuhrpark, bevor es zum Ausfall kommt.
  const WARNGRENZE_AUFSCHLAG = 15; // Prozentpunkte über der kritischen Grenze

  // Welche Bauteile lassen sich an der Straße instand setzen?
  const VOR_ORT_REPARIERBAR = {
    reifen: true,
    bremsen: false,
    motor: false,
    antrieb: false,
    karosserie: false
  };

  // Kostenrahmen in DM. Grobe Größenordnungen für die 90er - vor einer
  // ernsthaften Wirtschaftsbilanz noch gegenzuprüfen.
  const KOSTEN = {
    // Mobiler Reifendienst: Anfahrt plus Reifen, je nach Ort und Uhrzeit.
    vorOrtGrund: 450,
    vorOrtProKm: 0,
    // Bergung eines Sattelzugs: Schwerlast-Abschleppwagen, oft mit
    // Wartezeit. Deutlich teurer als ein Pkw-Abschleppdienst.
    bergungGrund: 1800,
    // Aufschlag, wenn das Fahrzeug weit vom Heimatstandort liegenbleibt.
    bergungAuslandAufschlag: 900
  };

  // Ausfalldauer in Tagen - das Fahrzeug steht und verdient nichts.
  const DAUER_TAGE = {
    vorOrt: 1,
    bergung: 3
  };

  const AUSLAND = [
    "Rotterdam", "Mailand", "Lyon", "Wien", "Prag", "Antwerpen"
  ];

  /**
   * Prüft, ob ein Fahrzeug wegen eines Bauteils ausfällt.
   * @returns {null|{teil: string, wert: number}} das schlimmste
   *   unterschrittene Bauteil, oder null wenn alles über der Grenze liegt
   */
  function pruefe(fahrzeug) {
    let schlimmstes = null;
    let groessteUnterschreitung = 0;

    Object.entries(KRITISCH).forEach(([teil, grenze]) => {
      const wert = fahrzeug.verschleiss?.[teil];
      if (typeof wert !== "number") return;

      const unterschreitung = grenze - wert;
      if (unterschreitung > 0 && unterschreitung > groessteUnterschreitung) {
        groessteUnterschreitung = unterschreitung;
        schlimmstes = { teil, wert };
      }
    });

    return schlimmstes;
  }

  /** Bauteile, die kurz vor der kritischen Grenze stehen. */
  function warnungen(fahrzeug) {
    return Object.entries(KRITISCH)
      .filter(([teil, grenze]) => {
        const wert = fahrzeug.verschleiss?.[teil];
        return (
          typeof wert === "number" &&
          wert >= grenze &&
          wert <= grenze + WARNGRENZE_AUFSCHLAG
        );
      })
      .map(([teil]) => teil);
  }

  function istStillstehend(fahrzeug) {
    return fahrzeug.status === "stillstehend";
  }

  /** Setzt das Fahrzeug in den Ausfallzustand. */
  function ausloesen(fahrzeug, teil, wert) {
    fahrzeug.status = "stillstehend";
    fahrzeug.ausfall = {
      teil,
      wert,
      ort: fahrzeug.standort,
      seit: Spielzeit.heute().toISOString(),
      vorOrtMoeglich: !!VOR_ORT_REPARIERBAR[teil]
    };
    return fahrzeug.ausfall;
  }

  function kannVorOrt(fahrzeug) {
    return !!fahrzeug.ausfall?.vorOrtMoeglich;
  }

  /** Kosten für eine Reparatur an Ort und Stelle. */
  function kostenVorOrt(fahrzeug) {
    if (!kannVorOrt(fahrzeug)) return null;
    return KOSTEN.vorOrtGrund;
  }

  /** Kosten für die Bergung in die Werkstatt. */
  function kostenBergung(fahrzeug) {
    const imAusland = AUSLAND.includes(fahrzeug.ausfall?.ort || fahrzeug.standort);
    return KOSTEN.bergungGrund + (imAusland ? KOSTEN.bergungAuslandAufschlag : 0);
  }

  /**
   * Behebt den Ausfall. Das defekte Bauteil wird erneuert, das Fahrzeug
   * ist wieder verfügbar.
   * @param {"vorOrt"|"bergung"} weg
   * @returns {{kosten: number, tage: number, teil: string, weg: string}}
   */
  function beheben(fahrzeug, weg) {
    const ausfall = fahrzeug.ausfall;
    if (!ausfall) throw new Error("Fahrzeug hat keinen offenen Ausfall");

    if (weg === "vorOrt" && !kannVorOrt(fahrzeug)) {
      throw new Error(`${ausfall.teil} lässt sich nicht vor Ort instand setzen`);
    }

    const kosten = weg === "vorOrt" ? kostenVorOrt(fahrzeug) : kostenBergung(fahrzeug);
    const tage = DAUER_TAGE[weg];

    Verschleiss.teilReparieren(fahrzeug, ausfall.teil);
    fahrzeug.status = "verfügbar";
    const teil = ausfall.teil;
    delete fahrzeug.ausfall;

    return { kosten, tage, teil, weg };
  }

  return {
    KRITISCH,
    VOR_ORT_REPARIERBAR,
    DAUER_TAGE,
    pruefe,
    warnungen,
    istStillstehend,
    ausloesen,
    kannVorOrt,
    kostenVorOrt,
    kostenBergung,
    beheben
  };
})();
