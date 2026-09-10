// speicher.js
// Spielstand sichern und wiederherstellen.
//
// Zwei Aufgaben:
//   1. Alles Wesentliche im Browser ablegen, damit ein Neuladen der
//      Seite nicht bei null anfängt.
//   2. Die Zeit nachholen, die vergangen ist, während die Seite zu war.
//      Eine Tour, die abends losfuhr, soll am nächsten Tag angekommen
//      sein - nicht immer noch am selben Kilometer stehen.
//
// Gespeichert wird bewusst kompakt: Routen werden NICHT abgelegt,
// sondern beim Laden aus Start- und Zielort neu berechnet. Das spart
// Platz und hält den Spielstand auch dann gültig, wenn sich das
// Straßennetz später ändert.

const Speicher = (function () {
  const SCHLUESSEL = "spedipro.spielstand";
  const FASSUNG = 1;

  // Höchstens so viel Zeit wird nachgeholt. Ohne Grenze würde eine
  // wochenlange Pause hunderte Touren auf einmal abwickeln.
  const MAX_NACHHOLEN_TAGE = 7;

  // Wie oft von selbst gesichert wird (reale Sekunden).
  const SICHERUNG_INTERVALL_S = 20;

  let letzteSicherung = 0;

  function speichern() {
    try {
      const stand = {
        fassung: FASSUNG,
        gesichertAm: Date.now(),              // reale Zeit
        spielzeit: Spielzeit.heute().toISOString(),
        fahrzeuge: FuhrparkApp.alleFahrzeuge(),
        kunden: Kunden.alle(),
        auftraege: Auftraege.alle(),
        fahrten: Fahrt.alle().map(kompakteFahrt)
      };
      window.localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
      letzteSicherung = Date.now();
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

  function vorhanden() {
    try {
      return Boolean(window.localStorage.getItem(SCHLUESSEL));
    } catch (fehler) {
      return false;
    }
  }

  /**
   * Lädt den Spielstand.
   * @param {function} beiAnkunft Rückruf für Touren, die während der
   *   Nachsimulation ankommen - die Tourenplanung hängt sich hier ein.
   * @returns {null|{nachgeholteStunden: number, angekommen: number}}
   */
  function laden(beiAnkunft) {
    let stand;
    try {
      const roh = window.localStorage.getItem(SCHLUESSEL);
      if (!roh) return null;
      stand = JSON.parse(roh);
    } catch (fehler) {
      console.warn("Spielstand nicht lesbar:", fehler.message);
      return null;
    }

    if (stand.fassung !== FASSUNG) {
      console.warn("Spielstand stammt aus einer anderen Fassung - wird verworfen.");
      return null;
    }

    Spielzeit.setzeAuf(new Date(stand.spielzeit));
    FuhrparkApp.fahrzeugeSetzen(stand.fahrzeuge || []);
    Kunden.setzen(stand.kunden || []);
    Auftraege.setzen(stand.auftraege || []);

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

    // Zeit nachholen, die während der Pause vergangen ist
    const pauseMs = Date.now() - (stand.gesichertAm || Date.now());
    const nachzuholendeMinuten = Math.max(
      0,
      Math.floor((pauseMs / 1000) * Spielzeit.MINUTEN_JE_SEKUNDE)
    );
    const grenze = MAX_NACHHOLEN_TAGE * 24 * 60;
    const minuten = Math.min(nachzuholendeMinuten, grenze);

    let angekommen = 0;
    if (minuten > 0) {
      // In Schritten simulieren, damit Lenk- und Ruhezeiten korrekt
      // greifen - ein einziger großer Sprung würde sie übergehen.
      const schritt = 30;
      const vorher = Fahrt.anzahl();
      for (let m = 0; m < minuten; m += schritt) {
        const dieserSchritt = Math.min(schritt, minuten - m);
        Spielzeit.minutenAddieren(dieserSchritt, true); // still, ohne Beobachter
        Fahrt.takt(dieserSchritt);
      }
      angekommen = vorher - Fahrt.anzahl();
    }

    return {
      nachgeholteStunden: Math.round(minuten / 60),
      gekappt: nachzuholendeMinuten > grenze,
      angekommen
    };
  }

  function loeschen() {
    try {
      window.localStorage.removeItem(SCHLUESSEL);
      return true;
    } catch (fehler) {
      return false;
    }
  }

  /** Regelmäßig und beim Verlassen der Seite sichern. */
  function automatikStarten() {
    setInterval(() => {
      if (Date.now() - letzteSicherung >= SICHERUNG_INTERVALL_S * 1000) speichern();
    }, SICHERUNG_INTERVALL_S * 1000);

    // Beim Schließen oder Wegschalten sichern - auf Mobilgeräten ist
    // "visibilitychange" verlässlicher als "beforeunload".
    window.addEventListener("beforeunload", speichern);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") speichern();
    });
  }

  return {
    MAX_NACHHOLEN_TAGE,
    speichern,
    laden,
    loeschen,
    vorhanden,
    automatikStarten
  };
})();
