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

  // Kfz-Versicherung je Jahr und Fahrzeug, DM (Haftpflicht und Kasko).
  const VERSICHERUNG_JAHR_DM = 9000;

  // Depotmiete je Monat, DM. Hängt in Wirklichkeit an Ort und Größe.
  const DEPOTMIETE_MONAT_DM = 2500;

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
  const STARTKAPITAL_DM = 250000;

  // Kontokorrentlinie, DM - so weit darf das Konto ins Minus.
  const DISPOLINIE_DM = 50000;

  // Reifen und Schmierstoffe je Kilometer, DM. Reparaturen laufen über
  // das Werkstattmodul, sobald es steht.
  const REIFEN_JE_KM_DM = 0.08;

  // ---------- Zugriff ----------

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
        wert: KFZ_STEUER_JAHR_DM.toLocaleString("de-DE") + " DM/Jahr",
        belegt: false,
        quelle: "Mechanik bekannt, DM-Beträge der Fassung 1994 nicht belegt"
      },
      {
        name: "Versicherung je Fahrzeug",
        wert: VERSICHERUNG_JAHR_DM.toLocaleString("de-DE") + " DM/Jahr",
        belegt: false,
        quelle: "Prämien im Güterkraftverkehr 1994 nicht belegt"
      },
      {
        name: "Depotmiete",
        wert: DEPOTMIETE_MONAT_DM.toLocaleString("de-DE") + " DM/Monat",
        belegt: false,
        quelle: "Gewerbemieten 1994 nicht belegt"
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
    VERWALTUNG_MONAT_DM,
    STARTKAPITAL_DM,
    DISPOLINIE_DM,
    REIFEN_JE_KM_DM,
    EUROVIGNETTE_AB,
    dieselpreis,
    nutzungsdauer,
    diskontsatz,
    kreditzins,
    dispozins,
    mautPflichtig,
    angaben
  };
})();
