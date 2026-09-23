// kostensaetze.js
// Alle Geldbeträge des Spiels an einer Stelle - mit Quellenangabe.
//
// Grundregel des Projekts: Jeder Wert beruht auf echten Daten. Wo das
// (noch) nicht geht, steht der Wert trotzdem hier, aber mit
// belegt: false und einer Begründung. Das Finanzprogramm zeigt diese
// Posten sichtbar als vorläufig an, statt sie unter echten Zahlen zu
// verstecken.
//
// Belege und offene Punkte im Einzelnen: docs/kosten-1994.md

const Kostensaetze = (function () {

  // ---------- Belegte Werte ----------

  // Durchschnittlicher Dieselpreis in Deutschland, DM je Liter.
  // Quelle: was-war-wann.de, Dieselpreise 1950 bis heute
  // https://www.was-war-wann.de/historische_werte/dieselpreise.html
  const DIESEL_JE_JAHR = {
    1990: 1.02, 1991: 1.07, 1992: 1.06, 1993: 1.08, 1994: 1.14,
    1995: 1.12, 1996: 1.22, 1997: 1.24, 1998: 1.14
  };

  // Betriebsgewöhnliche Nutzungsdauer in Jahren.
  // Quelle: BMF, AfA-Tabelle für den Wirtschaftszweig "Personen- und
  // Güterbeförderung", Fassung vom 26.01.1998.
  // Achtung: Die ALLGEMEINE AfA-Tabelle nennt längere Zeiten (Lkw und
  // Sattelschlepper 9, Auflieger 11 Jahre). Für eine Spedition gilt die
  // Branchentabelle, also die kürzeren.
  const NUTZUNGSDAUER_JAHRE = {
    zugmaschine: 5,      // Lkw ab 7,5 t und Sattelschlepper
    lkwLeicht: 6,        // Lkw unter 7,5 t
    anhaenger: 6
  };

  // Diskontsatz der Deutschen Bundesbank, Prozent, gültig ab Datum.
  // Quelle: Deutsche Bundesbank, Diskont- und Lombardsatz
  const DISKONTSATZ = [
    { ab: "1993-02-05", satz: 8.00 },
    { ab: "1994-02-18", satz: 5.25 },
    { ab: "1994-04-15", satz: 5.00 },
    { ab: "1994-05-13", satz: 4.50 },
    { ab: "1995-03-31", satz: 4.00 },
    { ab: "1995-12-15", satz: 3.00 },
    { ab: "1996-04-19", satz: 2.50 }
  ];

  // In Deutschland gab es 1994 KEINE Lkw-Maut. Die Eurovignette
  // startete zum 01.01.1995 (Belgien, Dänemark, Deutschland,
  // Luxemburg, Niederlande, Schweden). Quelle: Wikipedia, Maut.
  const EUROVIGNETTE_AB = "1995-01-01";

  // ---------- Vorläufige Werte ----------
  //
  // Diese Zahlen sind NICHT belegt. Sie sind so gewählt, dass die
  // Größenordnung zur Struktur der Fahrzeugkostenrechnung des Gewerbes
  // passt (siehe docs/kosten-1994.md, Abschnitt 6), aber sie sind
  // erfunden. Wer sie belegt, trägt hier Quelle ein und setzt
  // belegt: true.

  // Kfz-Steuer je Jahr und Fahrzeug, DM. Die Mechanik ist bekannt
  // (200-kg-Stufen des zGG, fünf progressive Sätze, Höchstbetrag nach
  // Schadstoff- und Geräuschklasse), die DM-Beträge der 1994er Fassung
  // des KraftStG sind es nicht.
  const KFZ_STEUER_JAHR_DM = 3600;

  // Das zulässige Gesamtgewicht, auf das sich KFZ_STEUER_JAHR_DM und
  // VERSICHERUNG_JAHR_DM beziehen: ein 40-t-Sattelzug. Bis 0.15.39 zahlte
  // JEDES Fahrzeug diese Beträge - auch ein 3,5-t-Kastenwagen, der damit
  // 3.600 DM Steuer im Jahr getragen hätte. Die Mechanik des KraftStG
  // ist gewichtsgestaffelt (200-kg-Stufen des zGG), also staffelt das
  // Spiel jetzt ebenfalls. Nur die Struktur ist belegt, nicht das
  // DM-Niveau - siehe die Vorbemerkung oben.
  const BEZUGSGEWICHT_KG = 40000;

  /** Zulässiges Gesamtgewicht eines Fahrzeugs in kg. */
  function gesamtgewichtKg(fahrzeug) {
    if (!fahrzeug) return BEZUGSGEWICHT_KG;
    if (fahrzeug.zulGesamtgewichtKg) return fahrzeug.zulGesamtgewichtKg;
    // Rückfall für Altstände ohne das Feld: Zuladung plus Leergewicht
    // in der Größenordnung des Sattelzugs.
    return (fahrzeug.zuladungKg || 24000) + 16000;
  }

  /**
   * Kfz-Steuer je Jahr für DIESES Fahrzeug, DM. Linear zum zGG - die
   * fünf progressiven Sätze des KraftStG bildet das nicht ab, die
   * Richtung aber schon.
   */
  function kfzSteuerJahr(fahrzeug) {
    return Math.round(
      KFZ_STEUER_JAHR_DM * (gesamtgewichtKg(fahrzeug) / BEZUGSGEWICHT_KG));
  }

  /**
   * Versicherung je Jahr für DIESES Fahrzeug, DM. Nicht linear: Ein
   * Kastenwagen kostet nicht ein Elftel eines Sattelzugs, weil
   * Grundbeitrag und Haftungsrisiko nicht mit dem Gewicht schrumpfen.
   * Deshalb die Wurzel - ein einfacher Degressionsansatz, nicht belegt.
   */
  function versicherungJahr(fahrzeug) {
    return Math.round(
      VERSICHERUNG_JAHR_DM * Math.sqrt(gesamtgewichtKg(fahrzeug) / BEZUGSGEWICHT_KG));
  }

  // Kfz-Versicherung je Jahr und Fahrzeug, DM (Haftpflicht und Kasko).
  const VERSICHERUNG_JAHR_DM = 9000;

  // Depotmiete je Monat, DM. Hängt in Wirklichkeit an Ort und Größe.
  const DEPOTMIETE_MONAT_DM = 2500;

  /**
   * Depotmiete je Monat für eine Flotte dieser Größe, DM.
   *
   * DEPOTMIETE_MONAT_DM ist der Hof, den eine Spedition mit vier
   * Sattelzügen braucht. Wer einen Kastenwagen fährt, mietet keinen
   * solchen Hof - er stellt ihn auf einen Stellplatz und sitzt in
   * einem Büro. Gerechnet wird deshalb ein Grundbetrag plus Fläche je
   * Fahrzeug, die Fläche nach Gewicht gestaffelt.
   *
   * Nicht belegt. Hallen- und Stellplatzmieten von 1994 stehen in
   * docs/kosten-1994.md unter "noch nicht recherchiert".
   */
  function depotmieteMonat(fahrzeuge) {
    const grund = 350;
    const jeSattelzug = (DEPOTMIETE_MONAT_DM - grund) / 4;
    const flaeche = (fahrzeuge || []).reduce(
      (s, f) => s + jeSattelzug * (gesamtgewichtKg(f) / BEZUGSGEWICHT_KG), 0);
    return Math.round(grund + flaeche);
  }

  // Verwaltung je Monat, DM: Büro, Telefon, Telefax, Steuerberater.
  // Noch ohne Personal - das kommt mit dem Personalmodul.
  const VERWALTUNG_MONAT_DM = 1800;

  // Aufschlag auf den Diskontsatz für einen Investitionskredit an einen
  // mittelständischen Betrieb, Prozentpunkte.
  const KREDIT_AUFSCHLAG_PROZENTPUNKTE = 3.0;

  // Aufschlag auf den Diskontsatz für die Kontokorrentlinie. Liegt in
  // der Praxis deutlich höher als der Investitionskredit.
  const DISPO_AUFSCHLAG_PROZENTPUNKTE = 8.0;

  // Startkapital der Spedition, DM.
  //
  // Bis 0.15.38 waren es 250.000 DM. Mit dem Transporter als
  // Startfahrzeug (0.15.39) ging das nicht mehr zusammen: Ein
  // Sattelzug kostet 165.000 DM, war also am ersten Spieltag
  // bezahlbar - der kleine Wagen wäre reine Dekoration gewesen, die
  // man in der ersten Minute wegkauft.
  //
  // hergeleitet aus dem Eigenkapitalnachweis: Die EU-Verordnung
  // 1071/2009 verlangt heute 9.000 EUR für das erste und 5.000 EUR
  // für jedes weitere Fahrzeug; für Fahrzeuge zwischen 2,5 und 3,5 t
  // sind es 1.800 EUR und 900 EUR (siehe docs/kosten-1994.md,
  // Abschnitt 11). Die DM-Beträge nach GüKG der 1990er sind nicht
  // greifbar - belegt: false. Gesetzt ist deshalb eine Größenordnung,
  // die zur Sache passt: genug für einen zweiten Transporter, zu
  // wenig für einen Sattelzug, und damit ist der Sattelzug ein Ziel.
  const STARTKAPITAL_DM = 45000;

  // Kontokorrentlinie, DM - so weit darf das Konto ins Minus. Mit dem
  // kleineren Startkapital muss auch sie kleiner sein, sonst wäre sie
  // das Startkapital durch die Hintertür.
  const DISPOLINIE_DM = 15000;

  // Reifen und Schmierstoffe je Kilometer, DM. Reparaturen laufen über
  // das Werkstattmodul, sobald es steht.
  const REIFEN_JE_KM_DM = 0.08;

  /**
   * Standzeit an der Rampe, in Stunden je Vorgang.
   *
   * Bis 0.15.28 kostete ein Halt nichts: anhalten, Ware ist drin,
   * weiter. Damit war jeder Kurzlauf rechnerisch dreimal so gut wie
   * eine Ferntour - nicht weil Kurzläufe so gut sind, sondern weil die
   * Rampe fehlte. Ein Lkw steht beim Be- und Entladen, und bei vielen
   * kleinen Sendungen steht er den halben Tag.
   *
   * Die Zahlen sind NICHT belegt. Sie liegen in der Größenordnung, die
   * für Stückgut an einer Rampe üblich ist; Silo und Tank brauchen zum
   * Ab- und Aufpumpen länger, ein Kipper ist in Minuten leer.
   */
  const STANDZEIT_STUNDEN = {
    laden:   { standard: 2.0, silo: 3.0, tank: 3.0, kipper: 0.75, container: 1.0 },
    abladen: { standard: 2.0, silo: 3.0, tank: 3.0, kipper: 0.5,  container: 1.0 }
  };

  // ---------- Zugriff ----------

  /**
   * Standzeit für einen Vorgang an einem Stopp.
   * @param {string} art "laden" oder "abladen"
   * @param {string} aufbau Aufbauart des Fahrzeugs
   */
  function standzeit(art, aufbau) {
    const tabelle = STANDZEIT_STUNDEN[art] || STANDZEIT_STUNDEN.laden;
    return tabelle[aufbau] !== undefined ? tabelle[aufbau] : tabelle.standard;
  }

  /** Dieselpreis in DM je Liter zum gegebenen Spieldatum. */
  function dieselpreis(datum) {
    const jahr = (datum || Spielzeit.heute()).getFullYear();
    if (DIESEL_JE_JAHR[jahr] !== undefined) return DIESEL_JE_JAHR[jahr];

    // Außerhalb der belegten Reihe den nächstgelegenen Wert nehmen,
    // statt zu extrapolieren - erfundene Preise wären schlechter als
    // ein ehrlich veralteter.
    const jahre = Object.keys(DIESEL_JE_JAHR).map(Number);
    const naechstes = jahr < Math.min(...jahre) ? Math.min(...jahre) : Math.max(...jahre);
    return DIESEL_JE_JAHR[naechstes];
  }

  function nutzungsdauer(art) {
    return NUTZUNGSDAUER_JAHRE[art] || NUTZUNGSDAUER_JAHRE.zugmaschine;
  }

  /** Diskontsatz in Prozent zum gegebenen Spieldatum. */
  function diskontsatz(datum) {
    const jetzt = datum || Spielzeit.heute();
    let satz = DISKONTSATZ[0].satz;
    DISKONTSATZ.forEach((s) => {
      if (jetzt >= new Date(s.ab)) satz = s.satz;
    });
    return satz;
  }

  function kreditzins(datum) {
    return diskontsatz(datum) + KREDIT_AUFSCHLAG_PROZENTPUNKTE;
  }

  function dispozins(datum) {
    return diskontsatz(datum) + DISPO_AUFSCHLAG_PROZENTPUNKTE;
  }

  /** Fällt zu diesem Zeitpunkt eine Straßenbenutzungsgebühr an? */
  function mautPflichtig(datum) {
    return (datum || Spielzeit.heute()) >= new Date(EUROVIGNETTE_AB);
  }

  /**
   * Alle Sätze für die Anzeige im Finanzprogramm, mit Beleglage.
   * Der Spieler soll sehen können, welche Zahl auf einer Quelle beruht
   * und welche noch vorläufig ist.
   */
  function angaben() {
    const jetzt = Spielzeit.heute();
    return [
      {
        name: "Dieselpreis",
        wert: dieselpreis(jetzt).toFixed(2) + " DM/l",
        belegt: true,
        quelle: "was-war-wann.de, Dieselpreise 1950 bis heute"
      },
      {
        name: "Nutzungsdauer Zugmaschine",
        wert: NUTZUNGSDAUER_JAHRE.zugmaschine + " Jahre",
        belegt: true,
        quelle: "BMF, AfA-Tabelle Personen- und Güterbeförderung (1998)"
      },
      {
        name: "Diskontsatz",
        wert: diskontsatz(jetzt).toFixed(2) + " %",
        belegt: true,
        quelle: "Deutsche Bundesbank"
      },
      {
        name: "Straßenbenutzungsgebühr",
        wert: mautPflichtig(jetzt) ? "Eurovignette" : "keine",
        belegt: true,
        quelle: "Eurovignette in Deutschland ab 01.01.1995"
      },
      {
        name: "Kfz-Steuer je Fahrzeug",
        wert: `${KFZ_STEUER_JAHR_DM.toLocaleString("de-DE")} DM/Jahr bei 40 t, `
          + `anteilig nach zGG (3,5 t: ${kfzSteuerJahr({ zulGesamtgewichtKg: 3500 })} DM)`,
        belegt: false,
        quelle: "Gewichtsstaffel des KraftStG bekannt, DM-Beträge der Fassung 1994 nicht belegt"
      },
      {
        name: "Versicherung je Fahrzeug",
        wert: `${VERSICHERUNG_JAHR_DM.toLocaleString("de-DE")} DM/Jahr bei 40 t, `
          + `degressiv nach zGG (3,5 t: ${versicherungJahr({ zulGesamtgewichtKg: 3500 })} DM)`,
        belegt: false,
        quelle: "Prämien im Güterkraftverkehr 1994 nicht belegt"
      },
      {
        name: "Depotmiete",
        wert: `${depotmieteMonat([{ zulGesamtgewichtKg: 3500 }]).toLocaleString("de-DE")} `
          + `DM/Monat bei einem Transporter, `
          + `${DEPOTMIETE_MONAT_DM.toLocaleString("de-DE")} DM bei vier Sattelzügen`,
        belegt: false,
        quelle: "Gewerbemieten 1994 nicht belegt"
      },
      {
        name: "Startkapital",
        wert: STARTKAPITAL_DM.toLocaleString("de-DE") + " DM",
        belegt: false,
        quelle: "Eigenkapitalnachweis nach GüKG in DM nicht belegt; "
          + "Größenordnung aus der heutigen EU-Verordnung 1071/2009 abgeleitet"
      },
      {
        name: "Verwaltung",
        wert: VERWALTUNG_MONAT_DM.toLocaleString("de-DE") + " DM/Monat",
        belegt: false,
        quelle: "geschätzt, ohne Personal"
      },
      {
        name: "Kreditzins",
        wert: kreditzins(jetzt).toFixed(2) + " %",
        belegt: false,
        quelle: `Diskontsatz belegt, Aufschlag von ${KREDIT_AUFSCHLAG_PROZENTPUNKTE} Punkten geschätzt`
      },
      {
        name: "Dispozins",
        wert: dispozins(jetzt).toFixed(2) + " %",
        belegt: false,
        quelle: `Diskontsatz belegt, Aufschlag von ${DISPO_AUFSCHLAG_PROZENTPUNKTE} Punkten geschätzt`
      },
      {
        name: "Reifen und Schmierstoffe",
        wert: REIFEN_JE_KM_DM.toFixed(2) + " DM/km",
        belegt: false,
        quelle: "geschätzt"
      },
      {
        name: "Standzeit je Rampe",
        wert: `${STANDZEIT_STUNDEN.laden.standard.toFixed(1)} Std laden, ` +
              `${STANDZEIT_STUNDEN.abladen.standard.toFixed(1)} Std abladen`,
        belegt: false,
        quelle: "plausible Größenordnung, keine erhobenen Rampenzeiten 1994"
      },
      {
        name: "Neupreise Fahrzeuge",
        wert: "150.000 bis 210.000 DM",
        belegt: false,
        quelle: "grobe Schätzung in fahrzeugtypen.js, nicht belegt"
      }
    ];
  }

  return {
    KFZ_STEUER_JAHR_DM,
    VERSICHERUNG_JAHR_DM,
    DEPOTMIETE_MONAT_DM,
    BEZUGSGEWICHT_KG,
    gesamtgewichtKg,
    kfzSteuerJahr,
    versicherungJahr,
    depotmieteMonat,
    VERWALTUNG_MONAT_DM,
    STARTKAPITAL_DM,
    DISPOLINIE_DM,
    REIFEN_JE_KM_DM,
    EUROVIGNETTE_AB,
    STANDZEIT_STUNDEN,
    standzeit,
    dieselpreis,
    nutzungsdauer,
    diskontsatz,
    kreditzins,
    dispozins,
    mautPflichtig,
    angaben
  };
})();
