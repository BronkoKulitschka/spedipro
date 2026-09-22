// fahrt.js
// Verwaltet laufende Touren. Eine Tour ist kein einzelner Rechenschritt
// mehr, sondern ein Vorgang, der über die Spielzeit hinweg voranschreitet
// - dadurch können mehrere Fahrzeuge gleichzeitig unterwegs sein.
//
// Die Uhr tickt (siehe spielzeit.js), und bei jedem Takt rücken alle
// laufenden Touren um die vergangene Zeit weiter.
//
// Berücksichtigt wird dabei die Lenkzeit: Ein Fahrer darf nicht rund um
// die Uhr fahren. In den 90ern galten bereits EU-Lenkzeitregeln mit rund
// neun Stunden Lenkzeit je Tag und einer zusammenhängenden Ruhezeit.
// Genau geprüft ist die damalige Fassung noch nicht (siehe
// docs/historischer-rahmen-1994.md) - die Werte hier sind eine
// plausible Annäherung.

const Fahrt = (function () {

  // Durchschnittsgeschwindigkeit im Fernverkehr. Nicht die Höchst-
  // geschwindigkeit: Baustellen, Ortsdurchfahrten, Grenzen und Steigungen
  // drücken den Schnitt deutlich.
  const SCHNITT_KMH = {
    autobahn: 72,
    landstrasse: 58,
    marode: 42
  };
  const SCHNITT_STANDARD = 65;

  const LENKZEIT_STUNDEN = 9;      // Fahrleistung je Tag
  const RUHEZEIT_STUNDEN = 11;     // zusammenhängende Ruhe danach

  const laufende = [];
  const beobachter = [];

  /**
   * Startet eine Tour.
   *
   * Eine Tour ist eine Folge von STOPPS, dazwischen liegen die Etappen:
   *
   *     stopps[0] --etappen[0]--> stopps[1] --etappen[1]--> stopps[2]
   *
   * An jedem Stopp wird zu- und abgeladen. Beides sind Listen, auch
   * wenn 0.15.26 je Stopp nur einen Eintrag erzeugt - die Beiladung
   * mehrerer Sendungen zugleich füllt dieselben Listen, ohne dass das
   * Modell noch einmal umgebaut werden müsste.
   *
   *     stopps: [{ stadt, laden: [{auftragNummer}], abladen: [...] }]
   *     etappen: [{ typ: "anfahrt"|"hauptlauf", route }]
   *
   * `typ` sagt nur noch, ob auf dieser Etappe Ladung an Bord ist -
   * Leerkilometer kosten Geld, bringen aber keinen Erlös.
   *
   * @param {object} auftrag
   *   fahrzeug, stopps, etappen, beiStopp(t, index), beiAnkunft(t)
   */
  function starten(auftrag) {
    const etappen = auftrag.etappen || [{ typ: "hauptlauf", route: auftrag.route }];
    const stopps = auftrag.stopps || stoppsAusEtappen(etappen);

    const eintrag = {
      ...auftrag,
      etappen,
      stopps,
      vonName: auftrag.vonName || stopps[0].stadt,
      nachName: auftrag.nachName || stopps[stopps.length - 1].stadt,
      etappeIndex: 0,
      gefahreneKm: 0,          // innerhalb der aktuellen Etappe
      gesamtGefahreneKm: 0,
      gefahreneStundenHeute: 0,
      ruhtBis: null,
      stehtBis: null,
      startZeit: Spielzeit.heute().toISOString(),
      abgeschlossen: false
    };
    laufende.push(eintrag);

    // Am Startpunkt wird geladen, bevor es losgeht.
    if (typeof eintrag.beiStopp === "function") eintrag.beiStopp(eintrag, 0);
    standzeitSetzen(eintrag, 0);

    benachrichtigen();
    return eintrag;
  }

  /**
   * Notbehelf für Touren ohne Stoppliste - etwa Leerfahrten, bei denen
   * nichts zu laden ist.
   */
  function stoppsAusEtappen(etappen) {
    const namen = [etappen[0].route.stationen[0]];
    etappen.forEach((e) => namen.push(e.route.stationen[e.route.stationen.length - 1]));
    return namen.map((stadt) => ({ stadt, laden: [], abladen: [] }));
  }

  /** Stellt eine gespeicherte Tour wieder her (siehe speicher.js). */
  function wiederherstellen(daten) {
    const eintrag = {
      ...daten,
      stopps: daten.stopps || stoppsAusEtappen(daten.etappen),
      abgeschlossen: false
    };
    laufende.push(eintrag);
    benachrichtigen();
    return eintrag;
  }

  /** Die Etappe, auf der das Fahrzeug gerade fährt. */
  function aktuelleEtappe(t) {
    return t.etappen[Math.min(t.etappeIndex, t.etappen.length - 1)];
  }

  /** Gesamtstrecke über alle Etappen. */
  function gesamtKm(t) {
    return t.etappen.reduce((summe, e) => summe + e.route.km, 0);
  }

  /**
   * Was gerade an Bord ist: alles, was an einem schon erreichten Stopp
   * geladen und noch nicht wieder abgeladen wurde. Gibt die Nummern der
   * Aufträge zurück.
   */
  function ladung(t, bisStopp) {
    const grenze = bisStopp === undefined ? t.etappeIndex : bisStopp;
    const anBord = [];
    for (let i = 0; i <= grenze && i < t.stopps.length; i++) {
      (t.stopps[i].abladen || []).forEach((x) => {
        const k = anBord.indexOf(x.auftragNummer);
        if (k >= 0) anBord.splice(k, 1);
      });
      (t.stopps[i].laden || []).forEach((x) => anBord.push(x.auftragNummer));
    }
    return anBord;
  }

  /** Ist auf der laufenden Etappe Ladung an Bord? */
  function istBeladen(t) {
    return ladung(t).length > 0;
  }

  /** Der nächste Stopp, den das Fahrzeug ansteuert. */
  function naechsterStopp(t) {
    return t.stopps[Math.min(t.etappeIndex + 1, t.stopps.length - 1)];
  }

  /** Wie viele Stopps die Tour hat und der wievielte als Nächstes kommt. */
  function stoppStand(t) {
    return { nummer: t.etappeIndex + 1, gesamt: t.etappen.length };
  }

  /** Alle Touren um die vergangene Zeit weiterrücken. */
  function takt(vergangeneMinuten) {
    if (laufende.length === 0) return;

    const jetzt = Spielzeit.heute();
    const fertige = [];

    laufende.forEach((t) => {
      if (t.abgeschlossen) return;

      // Ruht das Fahrzeug gerade?
      if (t.ruhtBis && jetzt < new Date(t.ruhtBis)) return;
      if (t.ruhtBis && jetzt >= new Date(t.ruhtBis)) {
        t.ruhtBis = null;
        t.gefahreneStundenHeute = 0;
      }

      // Steht es an der Rampe? Anders als die Ruhezeit zählt das auf
      // die Lenkzeit nicht an - gearbeitet wird trotzdem.
      if (t.stehtBis && jetzt < new Date(t.stehtBis)) return;
      if (t.stehtBis) t.stehtBis = null;

      let stunden = vergangeneMinuten / 60;

      // Nur so lange fahren, wie die Lenkzeit reicht
      const restLenkzeit = LENKZEIT_STUNDEN - t.gefahreneStundenHeute;
      if (stunden > restLenkzeit) stunden = restLenkzeit;

      if (stunden > 0) {
        const gefahren = stunden * geschwindigkeit(t);
        t.gefahreneKm += gefahren;
        t.gesamtGefahreneKm += gefahren;
        t.gefahreneStundenHeute += stunden;
      }

      // Etappenwechsel: Ladestelle erreicht -> beladen weiterfahren
      let etappe = aktuelleEtappe(t);
      while (t.gefahreneKm >= etappe.route.km && t.etappeIndex < t.etappen.length - 1) {
        t.gefahreneKm -= etappe.route.km;
        t.etappeIndex += 1;
        stoppErreicht(t, t.etappeIndex);
        standzeitSetzen(t, t.etappeIndex);
        etappe = aktuelleEtappe(t);
        // Während der Rampenzeit geht es nicht weiter.
        if (t.stehtBis) break;
      }

      // Lenkzeit ausgeschöpft -> Ruhezeit einlegen
      if (t.gefahreneStundenHeute >= LENKZEIT_STUNDEN && t.gefahreneKm < etappe.route.km) {
        const ende = new Date(jetzt.getTime());
        ende.setHours(ende.getHours() + RUHEZEIT_STUNDEN);
        t.ruhtBis = ende.toISOString();
      }

      if (t.etappeIndex >= t.etappen.length - 1 && t.gefahreneKm >= etappe.route.km) {
        t.gefahreneKm = etappe.route.km;
        t.abgeschlossen = true;
        fertige.push(t);
      }
    });

    if (fertige.length > 0) {
      fertige.forEach((t) => {
        const i = laufende.indexOf(t);
        if (i >= 0) laufende.splice(i, 1);
        // Am letzten Stopp wird ebenfalls abgeladen, erst danach ist
        // die Tour zu Ende.
        stoppErreicht(t, t.etappen.length);
        if (typeof t.beiAnkunft === "function") t.beiAnkunft(t);
      });
    }

    benachrichtigen();
  }

  /**
   * Standzeit an einem Stopp: Für jede Sendung, die dort auf- oder
   * abgeht, steht das Fahrzeug an der Rampe. Am letzten Stopp wird nur
   * noch abgeladen; danach ist die Tour ohnehin zu Ende, deshalb wird
   * dort keine Standzeit mehr gesetzt.
   */
  function standzeitSetzen(t, index) {
    const stopp = t.stopps && t.stopps[index];
    if (!stopp || index >= t.etappen.length) return;
    const stunden = standzeitAn(t, index);
    if (stunden <= 0) return;
    const ende = new Date(Spielzeit.heute().getTime() + stunden * 3600000);
    t.stehtBis = ende.toISOString();
  }

  /** Wie lange an diesem Stopp gestanden wird, in Stunden. */
  function standzeitAn(t, index) {
    const stopp = t.stopps && t.stopps[index];
    if (!stopp || typeof Kostensaetze === "undefined") return 0;
    const aufbau = t.fahrzeug && t.fahrzeug.aufbautyp
      ? String(t.fahrzeug.aufbautyp).toLowerCase()
      : "standard";
    let stunden = 0;
    (stopp.abladen || []).forEach(() => { stunden += Kostensaetze.standzeit("abladen", aufbau); });
    (stopp.laden || []).forEach(() => { stunden += Kostensaetze.standzeit("laden", aufbau); });
    return stunden;
  }

  /** Summe der Standzeiten, die auf dieser Tour noch bevorstehen. */
  function restStandzeit(t) {
    let stunden = 0;
    for (let i = t.etappeIndex + 1; i < t.etappen.length; i++) {
      stunden += standzeitAn(t, i);
    }
    if (t.stehtBis) {
      const rest = (new Date(t.stehtBis) - Spielzeit.heute()) / 3600000;
      if (rest > 0) stunden += rest;
    }
    return stunden;
  }

  /**
   * Ein Stopp ist erreicht. Der Rückruf entscheidet, was dort geschieht -
   * abladen, abrechnen, neu beladen. Er darf keine Umgebung einfangen,
   * sondern muss aus `t.stopps[index]` lesen: Nach dem Laden eines
   * Spielstands gibt es die alte Umgebung nicht mehr.
   */
  function stoppErreicht(t, index) {
    if (typeof t.beiStopp === "function") t.beiStopp(t, index);
  }

  /** Geschwindigkeit dieser Tour - später je Streckenabschnitt. */
  function geschwindigkeit(t) {
    // GEPLANT: Abschnittsweise aus der Route ableiten (Autobahn vs.
    // marode Landstraße in Osteuropa) statt einem Mittelwert.
    return t.schnittKmh || SCHNITT_STANDARD;
  }

  /** Sofort ans Ziel - für "Fahrt überspringen". */
  function abschliessen(tourEintrag) {
    // Die verbleibende Fahrzeit muss trotzdem vergehen, sonst wäre
    // Überspringen ein Weg, Zeit zu sparen.
    const restKm = gesamtKm(tourEintrag) - tourEintrag.gesamtGefahreneKm;
    const restStunden = restKm / geschwindigkeit(tourEintrag);
    const ruhezeiten = Math.floor(
      (tourEintrag.gefahreneStundenHeute + restStunden) / LENKZEIT_STUNDEN
    ) * RUHEZEIT_STUNDEN;

    Spielzeit.stundenAddieren(restStunden + ruhezeiten + restStandzeit(tourEintrag));

    // Alle noch offenen Stopps nachholen (Zu- und Abladung unterwegs)
    while (tourEintrag.etappeIndex < tourEintrag.etappen.length - 1) {
      tourEintrag.etappeIndex += 1;
      stoppErreicht(tourEintrag, tourEintrag.etappeIndex);
    }
    tourEintrag.stehtBis = null;
    tourEintrag.gesamtGefahreneKm = gesamtKm(tourEintrag);
    tourEintrag.gefahreneKm = aktuelleEtappe(tourEintrag).route.km;
    tourEintrag.abgeschlossen = true;
    const i = laufende.indexOf(tourEintrag);
    if (i >= 0) laufende.splice(i, 1);
    stoppErreicht(tourEintrag, tourEintrag.etappen.length);
    if (typeof tourEintrag.beiAnkunft === "function") tourEintrag.beiAnkunft(tourEintrag);
    benachrichtigen();
  }

  /** Anteil der Gesamtstrecke über alle Etappen, 0 bis 1. */
  function fortschritt(t) {
    const gesamt = gesamtKm(t);
    return gesamt > 0 ? Math.min(1, t.gesamtGefahreneKm / gesamt) : 1;
  }

  /** Anteil innerhalb der aktuellen Etappe - für die Kartenposition. */
  function etappenFortschritt(t) {
    const e = aktuelleEtappe(t);
    return e.route.km > 0 ? Math.min(1, t.gefahreneKm / e.route.km) : 1;
  }

  /** Voraussichtliche Ankunft als Datum. */
  function ankunft(t) {
    const restKm = gesamtKm(t) - t.gesamtGefahreneKm;
    let restStunden = restKm / geschwindigkeit(t);
    // Ruhezeiten einrechnen, die auf der Reststrecke noch anfallen
    const nochHeute = Math.max(0, LENKZEIT_STUNDEN - t.gefahreneStundenHeute);
    if (restStunden > nochHeute) {
      const danach = restStunden - nochHeute;
      const weitereTage = Math.ceil(danach / LENKZEIT_STUNDEN);
      restStunden += weitereTage * RUHEZEIT_STUNDEN;
    }
    // Rampenzeiten der noch bevorstehenden Stopps kommen dazu.
    restStunden += restStandzeit(t);

    const ziel = Spielzeit.heute();
    ziel.setMinutes(ziel.getMinutes() + Math.round(restStunden * 60));
    return ziel;
  }

  /**
   * Alle laufenden Touren verwerfen, ohne Zeit vergehen zu lassen und
   * ohne Rückrufe auszulösen - für "Neues Spiel". Abschliessen wäre
   * hier falsch: Das würde die Touren noch zustellen und abrechnen.
   */
  function zuruecksetzen() {
    laufende.length = 0;
    benachrichtigen();
  }

  function alle() { return laufende.slice(); }
  function anzahl() { return laufende.length; }
  function fuerFahrzeug(fahrzeugId) {
    return laufende.find((t) => t.fahrzeug && t.fahrzeug.id === fahrzeugId) || null;
  }
  function istUnterwegs(fahrzeugId) { return fuerFahrzeug(fahrzeugId) !== null; }

  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r(alle())); }

  return {
    SCHNITT_KMH,
    SCHNITT_STANDARD,
    LENKZEIT_STUNDEN,
    RUHEZEIT_STUNDEN,
    starten,
    wiederherstellen,
    takt,
    abschliessen,
    zuruecksetzen,
    aktuelleEtappe,
    naechsterStopp,
    stoppStand,
    standzeitAn,
    restStandzeit,
    ladung,
    etappenFortschritt,
    gesamtKm,
    istBeladen,
    fortschritt,
    ankunft,
    alle,
    anzahl,
    fuerFahrzeug,
    istUnterwegs,
    beiAenderung
  };
})();
