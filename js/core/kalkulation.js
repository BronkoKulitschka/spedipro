// kalkulation.js
// Was eine Tour kostet und was von ihr übrig bleibt.
//
// Bis 0.15.39 stand dieselbe Rechnung an vier Stellen im Code -
// Zielliste der Disposition, Frachtbrief-Durchsicht, Auftragsübersicht
// und Ankunftsmeldung - und überall lautete sie `Entgelt - Sprit`.
// Gebucht wurde beim Abrechnen aber mehr: `Finanzen.tourAbgerechnet()`
// bucht zusätzlich Reifen und Verschleiß. Das Spiel versprach also
// 203 DM und schrieb 167 DM gut. Vier Kopien einer Formel, die keine
// von ihnen ganz richtig hatte.
//
// Dieses Modul ist die eine Stelle. Wer die Zahlen ändert, ändert sie
// hier, und alle Ansichten folgen.
//
// ----------------------------------------------------------------------
// DECKUNGSBEITRAG UND REINGEWINN SIND ZWEI VERSCHIEDENE ZAHLEN
// ----------------------------------------------------------------------
// Der DECKUNGSBEITRAG ist das Entgelt abzüglich der Kosten, die nur
// wegen dieser Fahrt anfallen: Sprit und Verschleiß. Er beantwortet
// die Frage "lohnt sich diese Fahrt gegenüber Stehenbleiben?".
//
// Der REINGEWINN zieht zusätzlich den Anteil an den Kosten ab, die
// ohnehin laufen: Kfz-Steuer, Versicherung, Depotmiete, Verwaltung und
// Abschreibung. Er beantwortet die Frage "lebt die Firma davon?".
//
// Beide Zahlen werden gebraucht. Eine kurze Tour kann einen guten
// Deckungsbeitrag und trotzdem einen schlechten Reingewinn haben,
// wenn sie den Wagen tagelang bindet - und genau das soll man sehen.
//
// ----------------------------------------------------------------------
// DER SCHLÜSSEL FÜR DIE FIXKOSTEN IST DIE ZEIT
// ----------------------------------------------------------------------
// Fixkosten laufen nach Kalender, nicht nach Kilometern. Ein Wagen,
// der zehn Tage für eine Tour braucht, trägt zehn Tage Miete, Steuer
// und Abschreibung - ob er dabei fährt, an der Rampe steht oder Ruhe-
// zeit hat. Deshalb ist der Schlüssel die Zeit, die die Tour den Wagen
// BINDET, einschließlich Standzeit und Ruhezeit.
//
// Das ist auch die Art, wie ein Spediteur wirklich kalkuliert: Er
// kennt seinen Tagessatz je Fahrzeug und rechnet die Tour dagegen.
// Siehe docs/kosten-1994.md, Abschnitt 6, zur Struktur der
// Fahrzeugkostenrechnung des Gewerbes.

const Kalkulation = (function () {

  // Ein Monat hat im Mittel 30,44 Kalendertage. Mit glatten 30 wären
  // die Tagessätze um 1,5 % zu hoch - das fällt bei einer Tour nicht
  // auf, über ein Spieljahr aber schon.
  const TAGE_JE_MONAT = 30.44;

  /** Alle Fahrzeuge - über den Fuhrpark, wenn es ihn gibt. */
  function flotte() {
    if (typeof FuhrparkApp === "undefined" || !FuhrparkApp.alleFahrzeuge) return [];
    return FuhrparkApp.alleFahrzeuge();
  }

  /**
   * Abschreibung dieses Fahrzeugs je Monat, DM.
   *
   * Dieselbe lineare Rechnung wie in `Finanzen.abschreibungBuchen()`.
   * Ein voll abgeschriebener Wagen belastet nichts mehr - genau das
   * macht alte Fahrzeuge betriebswirtschaftlich attraktiv.
   */
  function abschreibungJeMonat(fahrzeug) {
    if (!fahrzeug || !fahrzeug.anschaffungDM) return 0;
    if ((fahrzeug.restbuchwertDM || 0) <= 0) return 0;
    const jahre = Kostensaetze.nutzungsdauer("zugmaschine");
    return fahrzeug.anschaffungDM / (jahre * 12);
  }

  /**
   * Die Fixkosten, die auf DIESES Fahrzeug entfallen, je Monat in DM.
   *
   * Steuer, Versicherung und Abschreibung gehören dem Fahrzeug allein.
   * Die Depotmiete wird nach Grundbetrag und Fläche aufgeteilt, die
   * Verwaltung nach Köpfen - ein Büro führt man für den Betrieb, nicht
   * für einen bestimmten Wagen.
   */
  function fixkostenJeMonat(fahrzeug, fahrzeuge) {
    if (!fahrzeug) return 0;
    const alle = fahrzeuge || flotte();
    const anzahl = Math.max(1, alle.length);
    return Kostensaetze.kfzSteuerJahr(fahrzeug) / 12
      + Kostensaetze.versicherungJahr(fahrzeug) / 12
      + (typeof Betrieb !== "undefined" && Betrieb.hatDepot()
          ? Kostensaetze.depotmieteAnteil(fahrzeug, alle) : 0)
      + Kostensaetze.VERWALTUNG_MONAT_DM / anzahl
      + abschreibungJeMonat(fahrzeug);
  }

  /** Dieselben Fixkosten, auf einen Kalendertag heruntergerechnet. */
  function fixkostenJeTag(fahrzeug, fahrzeuge) {
    return fixkostenJeMonat(fahrzeug, fahrzeuge) / TAGE_JE_MONAT;
  }

  /**
   * Spritkosten für eine Strecke, DM.
   *
   * Liegt ein gemessener Verbrauch vor - nach der Fahrt weiß man ihn
   * genau -, wird der genommen. Vorher wird mit DEMSELBEN Modell
   * geschätzt, mit dem die Fahrt später rechnet: Beladung und Gelände
   * eingerechnet. Der blanke Basisverbrauch lag bei vollem Wagen um
   * 39 % daneben, und zwar immer nach unten.
   */
  function spritkosten(fahrzeug, km, verbrauchL, beladungProzent) {
    let liter;
    if (verbrauchL !== undefined && verbrauchL !== null) {
      liter = verbrauchL;
    } else if (fahrzeug && typeof Verschleiss !== "undefined") {
      liter = Verschleiss.verbrauchSchaetzen(fahrzeug, {
        km, beladungProzent: beladungProzent || 0 });
    } else {
      liter = (km / 100) * ((fahrzeug && fahrzeug.verbrauchBasisL100km) || 33);
    }
    return liter * Kostensaetze.dieselpreis();
  }

  /** Reifen, Schmierstoffe und laufender Verschleiß, DM. */
  function verschleisskosten(km) {
    return (km || 0) * Kostensaetze.REIFEN_JE_KM_DM;
  }

  /**
   * Das Ergebnis einer Tour.
   *
   * @param {object}  a
   * @param {object}  a.fahrzeug
   * @param {number}  a.erloes     Summe der Entgelte, DM
   * @param {number}  a.km         gefahrene Kilometer, leer wie beladen
   * @param {number}  [a.stunden]  wie lange die Tour den Wagen bindet
   * @param {number}  [a.verbrauchL] gemessener Verbrauch, falls bekannt
   * @param {number}  [a.tonnen]   Ladung, für die Verbrauchsschätzung
   * @param {number}  [a.beladungProzent] alternativ direkt in Prozent
   * @param {Array}   [a.fahrzeuge]  Flotte, für den Fixkostenschlüssel
   * @returns {{erloes, sprit, verschleiss, fahrtkosten, deckungsbeitrag,
   *            tage, fixkosten, reingewinn, jeTag}}
   */
  function tour({ fahrzeug, erloes, km, stunden, verbrauchL, fahrzeuge,
                  tonnen, beladungProzent }) {
    // Beladung: entweder direkt angegeben oder aus der Tonnage und der
    // Zuladung des Wagens. Ohne Angabe wird leer gerechnet - das ist
    // die vorsichtige Richtung für eine Leerfahrt.
    const beladung = beladungProzent !== undefined && beladungProzent !== null
      ? beladungProzent
      : (tonnen && fahrzeug && fahrzeug.zuladungKg
          ? Math.min(100, (tonnen * 1000 / fahrzeug.zuladungKg) * 100)
          : 0);
    const sprit = Math.round(spritkosten(fahrzeug, km, verbrauchL, beladung));
    const verschleiss = Math.round(verschleisskosten(km));
    const deckungsbeitrag = Math.round((erloes || 0) - sprit - verschleiss);

    // Ohne Zeitangabe lässt sich kein Fixkostenanteil bilden. Dann
    // bleibt der Reingewinn null und die Ansicht zeigt ihn nicht -
    // besser als eine erfundene Zahl.
    const tage = stunden > 0 ? stunden / 24 : null;
    const fixkosten = tage === null
      ? null
      : Math.round(fixkostenJeTag(fahrzeug, fahrzeuge) * tage);
    const reingewinn = fixkosten === null ? null : deckungsbeitrag - fixkosten;

    return {
      erloes: Math.round(erloes || 0),
      sprit,
      verschleiss,
      fahrtkosten: sprit + verschleiss,
      deckungsbeitrag,
      tage,
      fixkosten,
      reingewinn,
      // Je Tag wird weiterhin auf den DECKUNGSBEITRAG bezogen: Die
      // Listen sortieren danach, und die Frage dort lautet "womit ist
      // der Wagen am besten ausgelastet?" - nicht "was bleibt nach
      // Kosten, die auch ohne ihn laufen?".
      jeTag: tage ? Math.round(deckungsbeitrag / Math.max(0.1, tage)) : null,
      // Was am Ende des Tages übrig bleibt - der Wert, über den
      // geurteilt wird. Nicht der Deckungsbeitrag: Der sagt nur, ob
      // sich die Fahrt gegenüber Stehenbleiben lohnt, und das ist
      // nicht die Frage, die der Spieler stellt.
      reinJeTag: tage && reingewinn !== null
        ? Math.round(reingewinn / Math.max(0.05, tage)) : null,
      urteil: tage && reingewinn !== null
        ? urteil(reingewinn / Math.max(0.05, tage), fahrzeug, fahrzeuge) : null
    };
  }

  // ---------- Die eine Bewertungsskala des Spiels ----------
  //
  // Regel 21 aus docs/spieldesign.md: Jede Bewertung im Spiel benutzt
  // dieselben Stufen, dieselben Farben und dieselben Wörter. Wer hier
  // eine sechste Stufe einführt oder ein Wort ändert, ändert es
  // überall.
  //
  // Die Wörter sind Sätze, keine Noten. "Mittelmäßig" ist eine Note -
  // man fragt sofort: gemessen woran? "Geht so" ist ein Satz, den der
  // Spieler selbst sagen würde, und er braucht keinen Vergleich.
  //
  // Der Maßstab ist der TAGESSATZ DES WAGENS: Was kostet dieses
  // Fahrzeug an einem Kalendertag, ohne einen Meter zu fahren? Eine
  // Tour, die weniger einbringt, verdient ihr Standgeld nicht. Der
  // Maßstab ist damit relativ - er wandert mit, wenn ein größerer
  // Wagen dazukommt - und er ist nicht erfunden, sondern gerechnet.
  //
  // Die Schwellen sind an der gemessenen Verteilung gesetzt (72
  // Aufträge, 25 Spielstände, Wartezeit eingerechnet): Median 3,4 -
  // fach, 13 % unter dem Tagessatz, Höchstwert 11-fach.
  const STUFEN = [
    { ab: -Infinity, wort: "Da legst du drauf.",           klasse: "urteil-schlecht" },
    { ab: 0,         wort: "Lohnt kaum.",                  klasse: "urteil-mager" },
    { ab: 1,         wort: "Geht so.",                     klasse: "urteil-mittel" },
    { ab: 3,         wort: "Verdient sich.",               klasse: "urteil-gut" },
    { ab: 6,         wort: "Da bleibt richtig was übrig.", klasse: "urteil-sehrgut" }
  ];

  /**
   * Das Urteil über ein Ergebnis je Tag.
   *
   * @param {number} jeTag      Reingewinn je Kalendertag, DM
   * @param {object} fahrzeug   für den Maßstab
   * @param {Array}  [fahrzeuge]
   * @returns {{stufe, wort, klasse, vielfaches}}
   */
  function urteil(jeTag, fahrzeug, fahrzeuge) {
    const satz = fixkostenJeTag(fahrzeug, fahrzeuge);
    const vielfaches = satz > 0 ? jeTag / satz : 0;
    let index = 0;
    STUFEN.forEach((s, i) => { if (vielfaches >= s.ab) index = i; });
    return { stufe: index, wort: STUFEN[index].wort,
             klasse: STUFEN[index].klasse, vielfaches };
  }

  return {
    TAGE_JE_MONAT,
    STUFEN,
    urteil,
    abschreibungJeMonat,
    fixkostenJeMonat,
    fixkostenJeTag,
    spritkosten,
    verschleisskosten,
    tour
  };
})();
