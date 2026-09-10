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
   * Eine Tour besteht aus Etappen. Üblich sind zwei: die Leerfahrt zur
   * Ladestelle (Anfahrt) und der beladene Hauptlauf. Getrennt gehalten,
   * weil sie unterschiedlich zählen - Leerkilometer kosten Geld, bringen
   * aber keinen Erlös.
   *
   * @param {object} auftrag
   *   fahrzeug, etappen: [{typ:"anfahrt"|"hauptlauf", route}], ...
   */
  function starten(auftrag) {
    const etappen = auftrag.etappen || [{ typ: "hauptlauf", route: auftrag.route }];

    const eintrag = {
      ...auftrag,
      etappen,
      etappeIndex: 0,
      gefahreneKm: 0,          // innerhalb der aktuellen Etappe
      gesamtGefahreneKm: 0,
      gefahreneStundenHeute: 0,
      ruhtBis: null,
      startZeit: Spielzeit.heute().toISOString(),
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

  /** Ist das Fahrzeug schon beladen unterwegs? */
  function istBeladen(t) {
    return aktuelleEtappe(t).typ === "hauptlauf";
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
        if (typeof t.beiEtappenwechsel === "function") t.beiEtappenwechsel(t);
        etappe = aktuelleEtappe(t);
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
        if (typeof t.beiAnkunft === "function") t.beiAnkunft(t);
      });
    }

    benachrichtigen();
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

    Spielzeit.stundenAddieren(restStunden + ruhezeiten);

    // Alle noch offenen Etappenwechsel nachholen (z.B. Beladung)
    while (tourEintrag.etappeIndex < tourEintrag.etappen.length - 1) {
      tourEintrag.etappeIndex += 1;
      if (typeof tourEintrag.beiEtappenwechsel === "function") {
        tourEintrag.beiEtappenwechsel(tourEintrag);
      }
    }
    tourEintrag.gesamtGefahreneKm = gesamtKm(tourEintrag);
    tourEintrag.gefahreneKm = aktuelleEtappe(tourEintrag).route.km;
    tourEintrag.abgeschlossen = true;
    const i = laufende.indexOf(tourEintrag);
    if (i >= 0) laufende.splice(i, 1);
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
    const ziel = Spielzeit.heute();
    ziel.setMinutes(ziel.getMinutes() + Math.round(restStunden * 60));
    return ziel;
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
    takt,
    abschliessen,
    aktuelleEtappe,
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
