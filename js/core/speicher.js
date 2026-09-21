// speicher.js
// Spielstände sichern, wiederherstellen und verwalten.
//
// Drei Aufgaben:
//   1. Alles Wesentliche im Browser ablegen, damit ein Neuladen der
//      Seite nicht bei null anfängt.
//   2. Drei feste Plätze führen, zwischen denen gewechselt werden kann.
//      Gesichert wird immer nur auf den aktiven Platz - sonst würde
//      die Automatik einen zweiten Spielstand überschreiben.
//   3. Die Zeit nachholen, die vergangen ist, während die Seite zu war,
//      und protokollieren, was dabei passiert ist.
//
// Zur Hintergrundsimulation: Ein Browser rechnet nicht, während er
// geschlossen ist - auch ein Service Worker nicht, sobald der Prozess
// beendet ist. Deshalb wird die vergangene Zeit beim Öffnen nachgeholt.
// Das ist kein Notbehelf, sondern das übliche Verfahren.
//
// Gespeichert wird bewusst kompakt: Routen werden NICHT abgelegt,
// sondern beim Laden aus Start- und Zielort neu berechnet. Das spart
// Platz und hält den Spielstand auch dann gültig, wenn sich das
// Straßennetz später ändert.

const Speicher = (function () {
  const PLAETZE = [1, 2, 3];
  const PRAEFIX = "spedipro.stand.";
  const AKTIV_SCHLUESSEL = "spedipro.aktiverPlatz";

  // Spielstand aus der Zeit vor der Platzverwaltung. Wird beim ersten
  // Start einmalig auf Platz 1 übernommen, damit niemand sein Spiel
  // durch ein Update verliert.
  const ALT_SCHLUESSEL = "spedipro.spielstand";

  const FASSUNG = 2;

  // Höchstens so viel Zeit wird nachgeholt. Ohne Grenze würde eine
  // wochenlange Pause hunderte Touren auf einmal abwickeln.
  const MAX_NACHHOLEN_TAGE = 7;

  // Wie oft von selbst gesichert wird (reale Sekunden).
  const SICHERUNG_INTERVALL_S = 10;

  // In welchen Schritten die Pause nachsimuliert wird. Ein einziger
  // großer Sprung würde Lenk- und Ruhezeiten übergehen.
  const SCHRITT_MINUTEN = 30;

  // Wie viele Ereignisse das Protokoll höchstens behält.
  const PROTOKOLL_MAX = 120;

  let aktiverPlatz = 1;
  let letzteSicherung = 0;

  // Was während der letzten Abwesenheit passiert ist. Gehört mit in den
  // Spielstand, damit es nicht verschwindet, wenn man das Fenster
  // schließt und später wiederkommt.
  let protokoll = [];

  function schluessel(nr) {
    return PRAEFIX + nr;
  }

  // ---------- Platzverwaltung ----------

  function aktiverPlatzLaden() {
    try {
      const roh = window.localStorage.getItem(AKTIV_SCHLUESSEL);
      const nr = Number(roh);
      if (PLAETZE.includes(nr)) aktiverPlatz = nr;
    } catch (fehler) {
      // Speicher gesperrt (privates Fenster) - Platz 1 bleibt aktiv.
    }
  }

  function aktiver() {
    return aktiverPlatz;
  }

  function aktivSetzen(nr) {
    if (!PLAETZE.includes(Number(nr))) return false;
    aktiverPlatz = Number(nr);
    try {
      window.localStorage.setItem(AKTIV_SCHLUESSEL, String(aktiverPlatz));
    } catch (fehler) {
      console.warn("Aktiver Platz nicht speicherbar:", fehler.message);
    }
    return true;
  }

  function rohLesen(nr) {
    try {
      const roh = window.localStorage.getItem(schluessel(nr));
      return roh ? JSON.parse(roh) : null;
    } catch (fehler) {
      console.warn(`Platz ${nr} nicht lesbar:`, fehler.message);
      return null;
    }
  }

  /**
   * Übersicht über alle drei Plätze - Grundlage für die Verwaltung.
   * Ein Stand aus einer älteren Fassung wird NICHT gelöscht, sondern
   * als nicht ladbar ausgewiesen. Er lässt sich weiterhin ausgeben.
   */
  function plaetze() {
    return PLAETZE.map((nr) => {
      const stand = rohLesen(nr);
      if (!stand) {
        return { nr, belegt: false, aktiv: nr === aktiverPlatz, ladbar: false };
      }
      return {
        nr,
        belegt: true,
        aktiv: nr === aktiverPlatz,
        ladbar: stand.fassung === FASSUNG,
        fassung: stand.fassung,
        depot: stand.betrieb ? stand.betrieb.depot : null,
        spielzeit: stand.spielzeit || null,
        gesichertAm: stand.gesichertAm || null,
        fahrzeuge: (stand.fahrzeuge || []).length,
        touren: (stand.fahrten || []).length,
        auftraege: (stand.auftraege || []).length
      };
    });
  }

  // ---------- Sichern ----------

  function standBauen() {
    return {
      fassung: FASSUNG,
      gesichertAm: Date.now(),              // reale Zeit
      spielzeit: Spielzeit.heute().toISOString(),
      betrieb: Betrieb.daten(),
      fahrzeuge: FuhrparkApp.alleFahrzeuge(),
      kunden: Kunden.alle(),
      auftraege: Auftraege.alle(),
      fahrten: Fahrt.alle().map(kompakteFahrt),
      finanzen: Finanzen.daten(),
      protokoll
    };
  }

  /**
   * Ein Spiel ohne Depot hat noch nicht begonnen. Solche Stände zu
   * sichern würde nur einen Platz mit einer leeren Spedition belegen,
   * sobald man das Spiel überhaupt öffnet.
   */
  function lohntSichern() {
    return Betrieb.hatDepot();
  }

  function speichern(nr) {
    const platz = PLAETZE.includes(Number(nr)) ? Number(nr) : aktiverPlatz;
    if (!lohntSichern() && !vorhanden(platz)) return false;
    try {
      window.localStorage.setItem(schluessel(platz), JSON.stringify(standBauen()));
      if (platz === aktiverPlatz) letzteSicherung = Date.now();
      return true;
    } catch (fehler) {
      console.warn("Spielstand nicht speicherbar:", fehler.message);
      return false;
    }
  }

  /** Eine laufende Tour auf das Nötigste eindampfen. */
  function kompakteFahrt(t) {
    return {
      fahrzeugId: t.fahrzeug.id,
      auftragNummer: t.auftragNummer,
      vonName: t.vonName,
      nachName: t.nachName,
      etappen: t.etappen.map((e) => ({
        typ: e.typ,
        von: e.route.stationen[0],
        nach: e.route.stationen[e.route.stationen.length - 1]
      })),
      etappeIndex: t.etappeIndex,
      gefahreneKm: t.gefahreneKm,
      gesamtGefahreneKm: t.gesamtGefahreneKm,
      gefahreneStundenHeute: t.gefahreneStundenHeute,
      ruhtBis: t.ruhtBis,
      startZeit: t.startZeit
    };
  }

  function vorhanden(nr) {
    const platz = PLAETZE.includes(Number(nr)) ? Number(nr) : aktiverPlatz;
    try {
      return Boolean(window.localStorage.getItem(schluessel(platz)));
    } catch (fehler) {
      return false;
    }
  }

  // ---------- Protokoll ----------

  function protokollEintrag(art, text, daten) {
    protokoll.push({
      zeit: Spielzeit.heute().toISOString(),
      art,      // ankunft | verfall | frist | ausfall | boerse | hinweis
      text,
      daten: daten || null
    });
    if (protokoll.length > PROTOKOLL_MAX) {
      protokoll = protokoll.slice(-PROTOKOLL_MAX);
    }
  }

  function protokollLesen() {
    return protokoll.slice();
  }

  function protokollLoeschen() {
    protokoll = [];
  }

  // ---------- Laden ----------

  /**
   * Lädt einen Spielstand und holt die verstrichene Zeit nach.
   * @param {number|function} nr Platznummer, oder der Rückruf, wenn der
   *   aktive Platz gemeint ist (Aufruf wie vor der Platzverwaltung).
   * @param {function} [beiAnkunft] Rückruf für Touren, die während der
   *   Nachsimulation ankommen - die Tourenplanung hängt sich hier ein.
   * @returns {null|object}
   */
  function laden(nr, beiAnkunft) {
    if (typeof nr === "function") {
      beiAnkunft = nr;
      nr = aktiverPlatz;
    }
    const platz = PLAETZE.includes(Number(nr)) ? Number(nr) : aktiverPlatz;

    const stand = rohLesen(platz);
    if (!stand) return null;

    if (stand.fassung !== FASSUNG) {
      // Bewusst NICHT löschen: Bei laufender Entwicklung ist ein
      // stillschweigend entsorgter Spielstand die häufigste
      // Verlustursache. Der Stand bleibt liegen und bleibt ausgebbar.
      console.warn(
        `Platz ${platz} stammt aus Fassung ${stand.fassung}, ` +
        `erwartet wird ${FASSUNG} - wird nicht geladen.`
      );
      return { fehler: "fassung", fassung: stand.fassung };
    }

    aktivSetzen(platz);

    Spielzeit.setzeAuf(new Date(stand.spielzeit));
    if (stand.betrieb) Betrieb.setzen(stand.betrieb);
    FuhrparkApp.fahrzeugeSetzen(stand.fahrzeuge || []);
    Kunden.setzen(stand.kunden || []);
    Auftraege.setzen(stand.auftraege || []);
    Finanzen.setzen(stand.finanzen);
    protokoll = Array.isArray(stand.protokoll) ? stand.protokoll.slice() : [];

    // Laufende Touren wiederherstellen: Routen neu berechnen
    (stand.fahrten || []).forEach((f) => {
      const fahrzeug = FuhrparkApp.alleFahrzeuge().find((x) => x.id === f.fahrzeugId);
      if (!fahrzeug) return;

      const etappen = f.etappen
        .map((e) => ({ typ: e.typ, route: Route.berechne(e.von, e.nach) }))
        .filter((e) => e.route);
      if (etappen.length === 0) return;

      Fahrt.wiederherstellen({
        ...f,
        fahrzeug,
        etappen,
        beiAnkunft
      });
    });

    return nachholen(stand);
  }

  /**
   * Holt die verstrichene Realzeit nach. Nicht nur Fahrzeuge bewegen
   * sich dabei: Die Börse frischt auf, unangetastete Aufträge
   * verfallen, Prüffristen laufen weiter und Kundenbeziehungen altern.
   * Sonst läge nach drei Tagen Pause exakt dieselbe Welt da wie vorher.
   */
  function nachholen(stand) {
    const pauseMs = Date.now() - (stand.gesichertAm || Date.now());
    const nachzuholendeMinuten = Math.max(
      0,
      Math.floor((pauseMs / 1000) * Spielzeit.MINUTEN_JE_SEKUNDE)
    );
    const grenze = MAX_NACHHOLEN_TAGE * 24 * 60;
    const minuten = Math.min(nachzuholendeMinuten, grenze);

    if (minuten <= 0) {
      return { nachgeholteStunden: 0, gekappt: false, angekommen: 0, protokoll: protokollLesen() };
    }

    // Das Protokoll beschreibt genau diese Abwesenheit - Ereignisse
    // einer früheren Pause wären hier irreführend.
    protokollLoeschen();

    const fristenVorher = ueberfaelligeFristen();
    const vorherTouren = Fahrt.anzahl();
    let angekommen = 0;
    let tagesZaehler = 0;

    for (let m = 0; m < minuten; m += SCHRITT_MINUTEN) {
      const dieserSchritt = Math.min(SCHRITT_MINUTEN, minuten - m);
      Spielzeit.minutenAddieren(dieserSchritt, true); // still, ohne Beobachter
      Fahrt.takt(dieserSchritt);

      tagesZaehler += dieserSchritt;
      if (tagesZaehler >= 24 * 60) {
        tagesZaehler -= 24 * 60;
        marktTakt();
      }
    }

    angekommen = vorherTouren - Fahrt.anzahl();
    marktTakt();
    fristenMelden(fristenVorher);

    const stunden = Math.round(minuten / 60);
    if (nachzuholendeMinuten > grenze) {
      protokollEintrag(
        "hinweis",
        `Es wurden höchstens ${MAX_NACHHOLEN_TAGE} Tage nachgeholt - ` +
        `die tatsächliche Pause war länger.`
      );
    }

    return {
      nachgeholteStunden: stunden,
      gekappt: nachzuholendeMinuten > grenze,
      angekommen,
      protokoll: protokollLesen()
    };
  }

  /** Ein Spieltag Marktgeschehen: Verfall, Nachschub, Kundenpflege. */
  function marktTakt() {
    // Monatsabschluss: Ohne ihn stünde nach einer Woche Pause kein
    // einziger Fixkostenposten in der Rechnung.
    if (typeof Finanzen !== "undefined" && Finanzen.monatspruefung()) {
      protokollEintrag("geld",
        `Monatsabschluss gebucht - Kontostand ${Finanzen.kontostand().toLocaleString("de-DE")} DM`);
    }

    const vorher = Auftraege.alle().filter((a) => a.status === Auftraege.STATUS.offen);
    Auftraege.auffrischen();
    const nachher = Auftraege.alle();

    // Verfallene Aufträge einzeln melden - das ist entgangene Ladung.
    vorher.forEach((a) => {
      const jetzt = nachher.find((x) => x.nummer === a.nummer);
      if (jetzt && jetzt.status === Auftraege.STATUS.verfallen) {
        protokollEintrag(
          "verfall",
          `${a.nummer} verfallen: ${a.vonName} → ${a.nachName}, ` +
          `${a.entgelt.toLocaleString("de-DE")} DM`,
          { nummer: a.nummer }
        );
      }
    });

    const verloren = Kunden.altern(Spielzeit.heute());
    verloren.forEach((k) => {
      protokollEintrag(
        "kunde",
        `${k.name} bestellt seltener - lange kein Auftrag mehr gefahren.`,
        { kundeId: k.id }
      );
    });
  }

  /** Fahrzeuge, deren Prüffristen gerade überfällig sind. */
  function ueberfaelligeFristen() {
    const menge = new Set();
    FuhrparkApp.alleFahrzeuge().forEach((f) => {
      Fristen.alle(f).forEach((frist) => {
        if (frist.status === "ueberfaellig") menge.add(`${f.id}|${frist.art}`);
      });
    });
    return menge;
  }

  /** Was während der Pause neu überfällig geworden ist. */
  function fristenMelden(vorher) {
    FuhrparkApp.alleFahrzeuge().forEach((f) => {
      Fristen.alle(f).forEach((frist) => {
        if (frist.status !== "ueberfaellig") return;
        if (vorher.has(`${f.id}|${frist.art}`)) return;
        protokollEintrag(
          "frist",
          `${f.kennzeichen}: ${frist.label} überfällig (${frist.text})`,
          { fahrzeugId: f.id, art: frist.art }
        );
      });
    });
  }

  /** Von außen aufrufbar, damit Module Ereignisse beisteuern können. */
  function melden(art, text, daten) {
    protokollEintrag(art, text, daten);
  }

  // ---------- Verwalten ----------

  function loeschen(nr) {
    const platz = PLAETZE.includes(Number(nr)) ? Number(nr) : aktiverPlatz;
    try {
      window.localStorage.removeItem(schluessel(platz));
      return true;
    } catch (fehler) {
      return false;
    }
  }

  /**
   * Gibt einen Spielstand als Text aus, der sich als Datei sichern
   * lässt. Der localStorage eines Handy-Browsers kann jederzeit geleert
   * werden - eine Datei überlebt das und lässt sich auf ein anderes
   * Gerät mitnehmen.
   */
  function exportieren(nr) {
    const stand = rohLesen(nr);
    if (!stand) return null;
    const datum = stand.spielzeit ? stand.spielzeit.slice(0, 10) : "ohne-datum";
    return {
      dateiname: `spedipro-platz${nr}-${datum}.json`,
      inhalt: JSON.stringify(stand, null, 1)
    };
  }

  /**
   * Nimmt einen ausgegebenen Spielstand wieder auf.
   * @returns {{ok: boolean, meldung: string}}
   */
  function importieren(nr, text) {
    const platz = Number(nr);
    if (!PLAETZE.includes(platz)) return { ok: false, meldung: "Unbekannter Platz." };

    let stand;
    try {
      stand = JSON.parse(text);
    } catch (fehler) {
      return { ok: false, meldung: "Die Datei ist kein lesbarer Spielstand." };
    }
    if (!stand || typeof stand !== "object" || !stand.fassung || !stand.spielzeit) {
      return { ok: false, meldung: "Die Datei enthält keinen Spielstand." };
    }

    try {
      window.localStorage.setItem(schluessel(platz), JSON.stringify(stand));
    } catch (fehler) {
      return { ok: false, meldung: "Speicher voll oder gesperrt." };
    }

    return stand.fassung === FASSUNG
      ? { ok: true, meldung: `Spielstand auf Platz ${platz} übernommen.` }
      : { ok: true, meldung: `Übernommen, stammt aber aus Fassung ${stand.fassung} und ist nicht ladbar.` };
  }

  /** Alles auf Anfang - für "Neues Spiel" auf einem Platz. */
  function neuBeginnen(nr) {
    const platz = PLAETZE.includes(Number(nr)) ? Number(nr) : aktiverPlatz;
    aktivSetzen(platz);

    Spielzeit.zuruecksetzen();
    Betrieb.zuruecksetzen();
    FuhrparkApp.fahrzeugeSetzen([]);
    Kunden.zuruecksetzen();
    Auftraege.setzen([]);
    Finanzen.zuruecksetzen();
    Fahrt.zuruecksetzen();
    protokollLoeschen();

    speichern(platz);
    return true;
  }

  // ---------- Automatik ----------

  /** Regelmäßig und beim Verlassen der Seite sichern. */
  function automatikStarten() {
    setInterval(() => {
      if (Date.now() - letzteSicherung >= SICHERUNG_INTERVALL_S * 1000) speichern();
    }, SICHERUNG_INTERVALL_S * 1000);

    // Beim Schließen oder Wegschalten sichern. Auf Mobilgeräten feuert
    // "beforeunload" oft gar nicht - "pagehide" und "visibilitychange"
    // sind dort verlässlicher. Alle drei anmelden, doppeltes Sichern
    // schadet nicht.
    window.addEventListener("beforeunload", () => speichern());
    window.addEventListener("pagehide", () => speichern());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") speichern();
    });
  }

  /**
   * Sofort sichern - für Momente, nach denen ein Verlust besonders
   * ärgerlich wäre: Tourstart, Ankunft, Kauf, Verkauf, Depotwahl.
   * Ein Handy-Browser kann die Seite jederzeit beenden, ohne dass ein
   * Ereignis dafür feuert.
   */
  function jetztSichern() {
    return speichern();
  }

  /** Einmalige Übernahme des alten Ein-Platz-Spielstands. */
  function altenStandUebernehmen() {
    try {
      const roh = window.localStorage.getItem(ALT_SCHLUESSEL);
      if (!roh) return;
      if (window.localStorage.getItem(schluessel(1))) return;
      window.localStorage.setItem(schluessel(1), roh);
      window.localStorage.removeItem(ALT_SCHLUESSEL);
      console.info("Alter Spielstand auf Platz 1 übernommen.");
    } catch (fehler) {
      // Kein Speicherzugriff - dann gibt es auch nichts zu übernehmen.
    }
  }

  aktiverPlatzLaden();
  altenStandUebernehmen();

  return {
    PLAETZE,
    FASSUNG,
    MAX_NACHHOLEN_TAGE,
    plaetze,
    aktiver,
    aktivSetzen,
    speichern,
    jetztSichern,
    laden,
    loeschen,
    vorhanden,
    exportieren,
    importieren,
    neuBeginnen,
    melden,
    protokollLesen,
    protokollLoeschen,
    automatikStarten
  };
})();
