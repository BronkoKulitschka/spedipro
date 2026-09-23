// finanzen.js
// Buchhaltung der Spedition.
//
// Kontenrahmen an SKR03 angelehnt - die Nummern sind die echten,
// damit die Auswertungen aussehen wie das, was ein Steuerberater 1994
// geliefert hätte. Gebucht wird aber vereinfacht: jede Buchung hat ein
// Konto und einen Betrag, der gegen die Bank läuft. Kein Soll und
// Haben, keine Bilanz - das wäre Bedienungsaufwand ohne Spielwert.
//
// Zahlungsziele gibt es bewusst nicht: Eine Zustellung bringt das Geld
// sofort aufs Konto. Offene Posten und Mahnwesen wären der nächste
// Schritt, wenn Liquidität zum Spielproblem werden soll.
//
// Alle Beträge in DM. Kostensätze und ihre Beleglage: kostensaetze.js

const Finanzen = (function () {

  // ---------- Kontenrahmen ----------

  const KONTEN = {
    // Erlöse
    8400: { name: "Frachterlöse", art: "erloes" },
    8200: { name: "Sonstige Erlöse", art: "erloes" },

    // Fahrzeugkosten - alles, was einem Fahrzeug zurechenbar ist
    4500: { name: "Kraftstoffe", art: "aufwand", gruppe: "fahrzeug" },
    4510: { name: "Kfz-Steuer", art: "aufwand", gruppe: "fahrzeug" },
    4520: { name: "Kfz-Versicherung", art: "aufwand", gruppe: "fahrzeug" },
    4530: { name: "Laufende Kfz-Betriebskosten", art: "aufwand", gruppe: "fahrzeug" },
    4540: { name: "Maut, Vignetten und Fähren", art: "aufwand", gruppe: "fahrzeug" },

    // Betriebskosten
    4210: { name: "Miete Depot", art: "aufwand", gruppe: "betrieb" },
    4970: { name: "Verwaltung", art: "aufwand", gruppe: "betrieb" },
    4830: { name: "Abschreibungen", art: "aufwand", gruppe: "betrieb" },
    2110: { name: "Zinsaufwand", art: "aufwand", gruppe: "betrieb" },

    // Bestände - nicht erfolgswirksam
    1200: { name: "Bank", art: "bestand" },
    320: { name: "Fuhrpark", art: "bestand" },
    630: { name: "Darlehen", art: "bestand" }
  };

  // ---------- Zustand ----------

  let bank = 0;                 // Kontostand in DM, darf negativ werden
  let journal = [];             // alle Buchungen
  let naechsteBelegNr = 1;
  let kredite = [];             // laufende Darlehen
  let naechsteKreditNr = 1;
  let letzterAbschluss = null;  // ISO-Datum des zuletzt gebuchten Monats
  const beobachter = [];

  // Journal begrenzen: Ein Spielstand soll nicht unbegrenzt wachsen.
  // Für die Auswertung zählt ohnehin nur die jüngere Vergangenheit.
  const JOURNAL_MAX = 2000;

  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r()); }

  // ---------- Vorgänge ----------
  //
  // Der Spieler denkt in Vorgängen, die Buchhaltung bucht in Konten.
  // Ein Fahrzeugkauf sind zwei bis drei Buchungen, eine gefahrene Tour
  // drei - und wer wissen will, ob sich die Tour gelohnt hat, musste
  // sie bisher im Kopf zusammenzählen. Ein gemeldeter Fehler
  // ("zwei Abrechnungen für einen Kauf") war in Wahrheit genau das:
  // zwei richtige Buchungen, die wie zwei Abbuchungen aussahen.
  //
  // Deshalb bekommt jede Buchung eine Vorgangskennung, und
  // vorgaenge() fasst sie wieder zusammen. Die Buchungen selbst
  // bleiben unangetastet - die ausführliche Ansicht rechnet weiter
  // mit ihnen.

  /**
   * Die Kennung hängt an der nächsten Belegnummer. Die ist eindeutig,
   * läuft monoton und wird im Spielstand mitgeführt - ein eigener
   * Zähler würde nach dem Laden bei 1 wieder anfangen und mit den
   * wiederhergestellten Vorgängen kollidieren.
   */
  function vorgangBeginnen(art, text, zusatz = {}) {
    return {
      id: `V${naechsteBelegNr}`,
      art,
      text,
      fahrzeugId: zusatz.fahrzeugId || null,
      auftrag: zusatz.auftrag || null
    };
  }

  /**
   * Die Buchungen eines Monats zu Vorgängen zusammengefasst.
   *
   * Der Betrag eines Vorgangs ist bewusst die Summe seiner
   * ZAHLUNGSWIRKSAMEN Buchungen: Beim Kauf steht dort, was vom Konto
   * ging, nicht zusätzlich der Zugang im Anlagevermögen. Sonst stünde
   * bei einem Kauf über 165.000 DM eine Null, weil sich Zugang und
   * Zahlung aufheben - richtig gebucht, aber keine Auskunft.
   *
   * Buchungen ohne Vorgang (Einzelposten wie Kfz-Steuer) bleiben je
   * eine eigene Zeile. Das ist richtig so: Sie SIND je ein Vorgang.
   */
  function vorgaenge(monat) {
    const liste = buchungen({ monat });
    const nachId = new Map();
    const ergebnis = [];

    liste.forEach((b) => {
      if (!b.vorgang) {
        ergebnis.push({
          id: `B${b.beleg}`,
          art: "einzeln",
          datum: b.datum,
          text: b.text,
          betrag: b.betrag,
          fahrzeugId: b.fahrzeugId,
          auftrag: b.auftrag,
          posten: []
        });
        return;
      }

      let v = nachId.get(b.vorgang);
      if (!v) {
        v = {
          id: b.vorgang,
          art: b.vorgangArt,
          datum: b.datum,
          text: b.vorgangText,
          betrag: 0,
          fahrzeugId: b.fahrzeugId,
          auftrag: b.auftrag,
          posten: []
        };
        nachId.set(b.vorgang, v);
        ergebnis.push(v);
      }
      // Nur zahlungswirksame Buchungen bestimmen den Betrag; die
      // Gegenbuchung im Anlagevermögen ist keine zweite Zahlung.
      if (!b.ohneBank) v.betrag += b.betrag;
      v.posten.push({ konto: b.konto, kontoName: b.kontoName,
                      text: b.text, betrag: b.betrag });
    });

    return ergebnis;
  }

  // ---------- Buchen ----------

  /**
   * Eine Buchung erfassen. Positive Beträge sind Zuflüsse (Erlöse),
   * negative Abflüsse (Aufwand, Anschaffung).
   * @param {number} konto Kontonummer aus KONTEN
   * @param {number} betrag DM, Vorzeichen wie oben
   * @param {string} text Buchungstext
   * @param {object} [zusatz] { fahrzeugId, auftrag, ohneBank }
   */
  function buchen(konto, betrag, text, zusatz = {}) {
    const gerundet = Math.round(betrag);
    const eintrag = {
      beleg: naechsteBelegNr++,
      datum: Spielzeit.heute().toISOString(),
      konto,
      kontoName: KONTEN[konto] ? KONTEN[konto].name : String(konto),
      text,
      betrag: gerundet,
      fahrzeugId: zusatz.fahrzeugId || null,
      auftrag: zusatz.auftrag || null,
      km: zusatz.km || 0,
      // Zahlungswirksam? Die Gegenbuchung im Anlagevermögen ist keine
      // zweite Zahlung, und der Verlauf muss das unterscheiden können.
      ohneBank: Boolean(zusatz.ohneBank),
      // Zu welchem VORGANG die Buchung gehört. Ein Fahrzeugkauf sind
      // zwei bis drei Buchungen, eine gefahrene Tour drei - im
      // Verlauf soll daraus je eine Zeile werden.
      vorgang: zusatz.vorgang ? zusatz.vorgang.id : null,
      vorgangArt: zusatz.vorgang ? zusatz.vorgang.art : null,
      vorgangText: zusatz.vorgang ? zusatz.vorgang.text : null
    };

    journal.push(eintrag);
    if (journal.length > JOURNAL_MAX) journal = journal.slice(-JOURNAL_MAX);

    // Bestandsbuchungen (Anschaffung gegen Darlehen) berühren die Bank
    // nicht - dafür gibt es ohneBank.
    if (!zusatz.ohneBank) bank += gerundet;

    benachrichtigen();
    return eintrag;
  }

  // ---------- Vorgänge aus anderen Modulen ----------

  /** Eine zugestellte Sendung: Erlös rein, Sprit raus. */
  function tourAbgerechnet({ auftrag, fahrzeug, verbrauchL, km }) {
    // Erlös und die Kosten derselben Fahrt gehören zusammen: Im
    // Verlauf steht dann eine Zeile mit dem, was unterm Strich blieb,
    // statt dreier Zeilen, die man selbst verrechnen muss.
    const vorgang = vorgangBeginnen("tour",
      `${auftrag.nummer} · ${auftrag.vonName} → ${auftrag.nachName}`,
      { fahrzeugId: fahrzeug.id, auftrag: auftrag.nummer });

    buchen(8400, auftrag.entgelt,
      `${auftrag.nummer}: ${auftrag.vonName} → ${auftrag.nachName}`,
      { fahrzeugId: fahrzeug.id, auftrag: auftrag.nummer, vorgang });

    spritBuchen(fahrzeug, verbrauchL, `Tour ${auftrag.nummer}`, vorgang);
    reifenBuchen(fahrzeug, km, `Tour ${auftrag.nummer}`, vorgang);
  }

  /** Leerfahrt: nur Kosten, kein Erlös. */
  function leerfahrtAbgerechnet({ fahrzeug, verbrauchL, km, von, nach }) {
    const vorgang = vorgangBeginnen("leerfahrt",
      `Leerfahrt ${von} → ${nach}`, { fahrzeugId: fahrzeug.id });
    spritBuchen(fahrzeug, verbrauchL, `Leerfahrt ${von} → ${nach}`, vorgang);
    reifenBuchen(fahrzeug, km, `Leerfahrt ${von} → ${nach}`, vorgang);
  }

  function spritBuchen(fahrzeug, verbrauchL, anlass, vorgang) {
    const preis = Kostensaetze.dieselpreis();
    buchen(4500, -(verbrauchL * preis),
      `${fahrzeug.kennzeichen}: ${Math.round(verbrauchL).toLocaleString("de-DE")} l ` +
      `zu ${preis.toFixed(2)} DM (${anlass})`,
      { fahrzeugId: fahrzeug.id, vorgang });
  }

  function reifenBuchen(fahrzeug, km, anlass, vorgang) {
    if (!km) return;
    buchen(4530, -(km * Kostensaetze.REIFEN_JE_KM_DM),
      `${fahrzeug.kennzeichen}: Reifen und Schmierstoffe, ` +
      `${Math.round(km).toLocaleString("de-DE")} km (${anlass})`,
      { fahrzeugId: fahrzeug.id, km, vorgang });
  }

  /** Werkstatt, Bergung, Ersatzteile. */
  function reparaturGebucht({ fahrzeug, betrag, text }) {
    buchen(4530, -Math.abs(betrag), `${fahrzeug.kennzeichen}: ${text}`,
      { fahrzeugId: fahrzeug.id });
  }

  /**
   * Fahrzeugkauf. Wird finanziert, entsteht ein Darlehen; die Bank
   * sieht dann nur die Anzahlung.
   */
  function fahrzeugGekauft({ fahrzeug, preis, anzahlung, laufzeitJahre }) {
    const kredithoehe = Math.max(0, Math.round(preis - (anzahlung || preis)));
    const vorgang = vorgangBeginnen("kauf",
      `${fahrzeug.marke} ${fahrzeug.modell} gekauft`, { fahrzeugId: fahrzeug.id });

    // POSITIV: Ein gekaufter Lkw MEHRT das Anlagevermögen. Bis 0.15.36
    // stand hier -preis, und das Konto "Fuhrpark" rutschte mit jedem
    // Kauf tiefer ins Minus - nach einem Kauf zeigte es -144.115 DM,
    // obwohl die Firma zwei Lkw im Wert von 185.885 DM besaß. Das war
    // auch in sich widersprüchlich: Die Startflotte wurde als
    // Sacheinlage schon immer positiv gebucht, dasselbe Ereignis also
    // mit umgekehrtem Vorzeichen.
    buchen(320, preis,
      `Anschaffung ${fahrzeug.marke} ${fahrzeug.modell} (${fahrzeug.kennzeichen})`,
      { fahrzeugId: fahrzeug.id, ohneBank: true, vorgang });

    // Der Teil, der bar bezahlt wird, geht vom Konto.
    buchen(1200, -(preis - kredithoehe),
      `Zahlung ${fahrzeug.kennzeichen}`,
      { fahrzeugId: fahrzeug.id, vorgang });

    if (kredithoehe > 0) {
      kreditAufnehmen({
        betrag: kredithoehe,
        laufzeitJahre: laufzeitJahre || Kostensaetze.nutzungsdauer("zugmaschine"),
        zweck: `Fahrzeug ${fahrzeug.kennzeichen}`,
        ohneAuszahlung: true,
        vorgang
      });
    }

    // Anschaffungswert und Datum am Fahrzeug festhalten - die
    // Abschreibung braucht beides.
    fahrzeug.anschaffungDM = preis;
    fahrzeug.anschaffungAm = Spielzeit.heute().toISOString();
    fahrzeug.restbuchwertDM = preis;
  }

  function fahrzeugVerkauft({ fahrzeug, erloes }) {
    const vorgang = vorgangBeginnen("verkauf",
      `${fahrzeug.marke} ${fahrzeug.modell} verkauft`, { fahrzeugId: fahrzeug.id });
    buchen(8200, erloes,
      `Verkauf ${fahrzeug.marke} ${fahrzeug.modell} (${fahrzeug.kennzeichen})`,
      { fahrzeugId: fahrzeug.id, vorgang });
    // NEGATIV: Der Wagen geht aus dem Anlagevermögen ab. Auch das stand
    // bis 0.15.36 falsch herum.
    buchen(320, -(fahrzeug.restbuchwertDM || 0),
      `Abgang ${fahrzeug.kennzeichen}`,
      { fahrzeugId: fahrzeug.id, ohneBank: true, vorgang });
    fahrzeug.restbuchwertDM = 0;
  }

  // ---------- Kredite ----------

  /**
   * Darlehen aufnehmen. Annuität wäre genauer, aber ein Ratenkredit
   * mit gleichbleibender Tilgung ist nachvollziehbarer und war für
   * Fahrzeugfinanzierungen durchaus üblich.
   */
  function kreditAufnehmen({ betrag, laufzeitJahre, zweck, ohneAuszahlung, vorgang }) {
    const zins = Kostensaetze.kreditzins();
    const kredit = {
      nr: naechsteKreditNr++,
      zweck: zweck || "Investition",
      aufgenommenAm: Spielzeit.heute().toISOString(),
      ursprung: Math.round(betrag),
      restschuld: Math.round(betrag),
      zinssatz: zins,
      monate: Math.round(laufzeitJahre * 12),
      tilgungJeMonat: Math.round(betrag / (laufzeitJahre * 12))
    };
    kredite.push(kredit);

    const eigen = vorgang || vorgangBeginnen("darlehen",
      `Darlehen ${kredit.nr} über ${Math.round(betrag).toLocaleString("de-DE")} DM`);

    buchen(630, betrag,
      `Darlehen ${kredit.nr} über ${Math.round(betrag).toLocaleString("de-DE")} DM ` +
      `zu ${zins.toFixed(2)} %`,
      { ohneBank: true, vorgang: eigen });

    if (!ohneAuszahlung) {
      buchen(1200, betrag, `Auszahlung Darlehen ${kredit.nr}`, { vorgang: eigen });
    }

    benachrichtigen();
    return kredit;
  }

  function offeneKredite() {
    return kredite.filter((k) => k.restschuld > 0);
  }

  function restschuldGesamt() {
    return offeneKredite().reduce((s, k) => s + k.restschuld, 0);
  }

  // ---------- Monatsabschluss ----------

  /**
   * Bucht alle wiederkehrenden Posten eines Monats. Wird vom Zeittakt
   * angestoßen und läuft auch in der Nachholsimulation mit - sonst
   * stünde nach einer Woche Pause kein einziger Fixkostenposten in der
   * Rechnung.
   */
  function monatspruefung() {
    const jetzt = Spielzeit.heute();
    const marke = `${jetzt.getFullYear()}-${jetzt.getMonth()}`;
    if (letzterAbschluss === marke) return false;

    // Beim allerersten Aufruf nur merken, nicht rückwirkend buchen.
    if (letzterAbschluss === null) {
      letzterAbschluss = marke;
      return false;
    }

    letzterAbschluss = marke;
    monatBuchen();
    return true;
  }

  function monatBuchen() {
    const fahrzeuge = FuhrparkApp.alleFahrzeuge();

    fahrzeuge.forEach((f) => {
      // Beide Sätze hängen seit 0.15.39 am zulässigen Gesamtgewicht
      // des einzelnen Wagens. Vorher zahlte der 3,5-Tonner dasselbe
      // wie ein 40-t-Sattelzug.
      buchen(4510, -(Kostensaetze.kfzSteuerJahr(f) / 12),
        `${f.kennzeichen}: Kfz-Steuer`, { fahrzeugId: f.id });
      buchen(4520, -(Kostensaetze.versicherungJahr(f) / 12),
        `${f.kennzeichen}: Versicherung`, { fahrzeugId: f.id });
      abschreibungBuchen(f);
    });

    if (Betrieb.hatDepot()) {
      buchen(4210, -Kostensaetze.depotmieteMonat(fahrzeuge),
        `Miete Depot ${Betrieb.depotName()}`);
    }
    buchen(4970, -Kostensaetze.VERWALTUNG_MONAT_DM, "Verwaltung");

    kreditRatenBuchen();
    dispozinsBuchen();
  }

  /**
   * Lineare Abschreibung über die Nutzungsdauer der Branchentabelle.
   * Ein voll abgeschriebenes Fahrzeug belastet das Ergebnis nicht mehr,
   * fährt aber weiter - genau das macht alte Fahrzeuge betriebs-
   * wirtschaftlich attraktiv, solange sie halten.
   */
  function abschreibungBuchen(f) {
    if (!f.anschaffungDM) return;
    if ((f.restbuchwertDM || 0) <= 0) return;

    const jahre = Kostensaetze.nutzungsdauer("zugmaschine");
    const jeMonat = f.anschaffungDM / (jahre * 12);
    const betrag = Math.min(jeMonat, f.restbuchwertDM);

    f.restbuchwertDM = Math.max(0, f.restbuchwertDM - betrag);

    // Abschreibung ist "4830 an 320": Der Aufwand belastet das
    // Ergebnis, und derselbe Betrag geht vom Anlagevermögen ab. Ohne
    // die zweite Zeile trüge Konto 320 die Anschaffungswerte und
    // driftete mit jedem Monat weiter von den Restbuchwerten weg.
    const vorgang = vorgangBeginnen("abschreibung",
      `${f.kennzeichen}: Wertverlust`, { fahrzeugId: f.id });
    buchen(4830, -betrag, `${f.kennzeichen}: Abschreibung`,
      { fahrzeugId: f.id, ohneBank: true, vorgang });
    buchen(320, -betrag, `${f.kennzeichen}: Wertminderung`,
      { fahrzeugId: f.id, ohneBank: true, vorgang });
  }

  function kreditRatenBuchen() {
    offeneKredite().forEach((k) => {
      const zinsen = k.restschuld * (k.zinssatz / 100) / 12;
      const tilgung = Math.min(k.tilgungJeMonat, k.restschuld);

      buchen(2110, -zinsen, `Darlehen ${k.nr}: Zinsen`);
      buchen(1200, -tilgung, `Darlehen ${k.nr}: Tilgung`);
      buchen(630, -tilgung, `Darlehen ${k.nr}: Restschuld`, { ohneBank: true });

      k.restschuld = Math.max(0, k.restschuld - tilgung);
    });
  }

  function dispozinsBuchen() {
    if (bank >= 0) return;
    const zinsen = Math.abs(bank) * (Kostensaetze.dispozins() / 100) / 12;
    buchen(2110, -zinsen, "Kontokorrentzinsen");
  }

  // ---------- Auswertung ----------

  function kontostand() { return Math.round(bank); }

  function dispoRest() {
    return Math.round(bank + Kostensaetze.DISPOLINIE_DM);
  }

  /** Ist die Linie ausgeschöpft? Dann geht nichts mehr. */
  function zahlungsfaehig(betrag) {
    return bank - Math.abs(betrag) >= -Kostensaetze.DISPOLINIE_DM;
  }

  function buchungen({ monat, konto, fahrzeugId } = {}) {
    return journal.filter((b) => {
      if (konto && b.konto !== konto) return false;
      if (fahrzeugId && b.fahrzeugId !== fahrzeugId) return false;
      if (monat) {
        const d = new Date(b.datum);
        if (`${d.getFullYear()}-${d.getMonth()}` !== monat) return false;
      }
      return true;
    }).slice().reverse();
  }

  /** Monatsmarken, für die Buchungen vorliegen - jüngste zuerst. */
  function monate() {
    const menge = new Set();
    journal.forEach((b) => {
      const d = new Date(b.datum);
      menge.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return [...menge].sort().reverse();
  }

  function monatsName(marke) {
    const [jahr, monat] = marke.split("-").map(Number);
    const namen = ["Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"];
    return `${namen[monat]} ${jahr}`;
  }

  /**
   * Betriebswirtschaftliche Auswertung eines Monats: Erlöse, Aufwand
   * je Konto, Ergebnis. Bestandskonten bleiben draußen - sie sind
   * nicht erfolgswirksam, außer der Abschreibung, die es ist.
   */
  function bwa(monat) {
    const liste = journal.filter((b) => {
      const d = new Date(b.datum);
      return `${d.getFullYear()}-${d.getMonth()}` === monat;
    });

    const erloese = [];
    const aufwand = [];
    let summeErloes = 0;
    let summeAufwand = 0;

    Object.keys(KONTEN).forEach((nr) => {
      const konto = KONTEN[nr];
      if (konto.art === "bestand") return;

      const betrag = liste
        .filter((b) => String(b.konto) === String(nr))
        .reduce((s, b) => s + b.betrag, 0);
      if (betrag === 0) return;

      const zeile = { konto: Number(nr), name: konto.name, betrag };
      if (konto.art === "erloes") { erloese.push(zeile); summeErloes += betrag; }
      else { aufwand.push(zeile); summeAufwand += betrag; }
    });

    return {
      monat,
      name: monatsName(monat),
      erloese,
      aufwand: aufwand.sort((a, b) => a.betrag - b.betrag),
      summeErloes: Math.round(summeErloes),
      summeAufwand: Math.round(summeAufwand),
      ergebnis: Math.round(summeErloes + summeAufwand)
    };
  }

  /**
   * Kosten je Fahrzeug und Kilometer - die Rechnung, die eine
   * Spedition tatsächlich führt. Ein Fahrzeug, das mehr kostet als es
   * einfährt, muss weg.
   */
  function fahrzeugRechnung() {
    return FuhrparkApp.alleFahrzeuge().map((f) => {
      const eigene = journal.filter((b) => b.fahrzeugId === f.id);
      const erloes = eigene
        .filter((b) => b.betrag > 0 && KONTEN[b.konto] && KONTEN[b.konto].art === "erloes")
        .reduce((s, b) => s + b.betrag, 0);
      const kosten = eigene
        .filter((b) => b.betrag < 0 && KONTEN[b.konto] && KONTEN[b.konto].art === "aufwand")
        .reduce((s, b) => s + b.betrag, 0);

      // Kilometer aus dem Journal, nicht vom Tacho: Ein gebraucht
      // gekauftes Fahrzeug bringt fremde Kilometer mit, die nicht in
      // unsere Kostenrechnung gehören.
      const km = Math.max(1, Math.round(eigene.reduce((s2, b) => s2 + (b.km || 0), 0)));
      return {
        fahrzeug: f,
        km,
        erloes: Math.round(erloes),
        kosten: Math.round(kosten),
        ergebnis: Math.round(erloes + kosten),
        erloesJeKm: erloes / km,
        kostenJeKm: Math.abs(kosten) / km
      };
    }).sort((a, b) => b.ergebnis - a.ergebnis);
  }

  // ---------- Spielstand ----------

  function daten() {
    return {
      bank,
      journal,
      naechsteBelegNr,
      kredite,
      naechsteKreditNr,
      letzterAbschluss
    };
  }

  function setzen(d) {
    if (!d) { zuruecksetzen(); return; }
    bank = d.bank || 0;
    journal = Array.isArray(d.journal) ? d.journal.slice() : [];
    naechsteBelegNr = d.naechsteBelegNr || 1;
    kredite = Array.isArray(d.kredite) ? d.kredite.map((k) => ({ ...k })) : [];
    naechsteKreditNr = d.naechsteKreditNr || 1;
    letzterAbschluss = d.letzterAbschluss || null;
    benachrichtigen();
  }

  function zuruecksetzen() {
    bank = 0;
    journal = [];
    naechsteBelegNr = 1;
    kredite = [];
    naechsteKreditNr = 1;
    letzterAbschluss = null;
    benachrichtigen();
  }

  /**
   * Gründung: Eigenkapital einlegen und den vorhandenen Fuhrpark als
   * Sacheinlage aufnehmen. Ohne das hätte das Startfahrzeug keinen
   * Anschaffungswert und würde nie abgeschrieben - es stünde als
   * kostenloses Betriebsmittel in der Rechnung.
   */
  function gruenden() {
    zuruecksetzen();
    buchen(1200, Kostensaetze.STARTKAPITAL_DM, "Einlage Eigenkapital");

    FuhrparkApp.alleFahrzeuge().forEach((f) => {
      if (f.anschaffungDM) return;
      const wert = FuhrparkApp.restwertVon
        ? FuhrparkApp.restwertVon(f)
        : (f.neupreisDM || 0);
      if (!wert) return;

      f.anschaffungDM = wert;
      f.anschaffungAm = Spielzeit.heute().toISOString();
      f.restbuchwertDM = wert;
      buchen(320, wert,
        `Sacheinlage ${f.marke} ${f.modell} (${f.kennzeichen})`,
        { fahrzeugId: f.id, ohneBank: true });
    });

    const jetzt = Spielzeit.heute();
    letzterAbschluss = `${jetzt.getFullYear()}-${jetzt.getMonth()}`;
  }

  return {
    KONTEN,
    buchen,
    tourAbgerechnet,
    leerfahrtAbgerechnet,
    reparaturGebucht,
    fahrzeugGekauft,
    fahrzeugVerkauft,
    kreditAufnehmen,
    offeneKredite,
    restschuldGesamt,
    monatspruefung,
    kontostand,
    dispoRest,
    zahlungsfaehig,
    buchungen,
    monate,
    monatsName,
    /** Buchungen eines Monats zu Vorgängen zusammengefasst. */
    vorgaenge,
    bwa,
    fahrzeugRechnung,
    daten,
    setzen,
    zuruecksetzen,
    gruenden,
    beiAenderung
  };
})();
