// auftraege.js
// Der Auftragspool - das Herzstück der Disposition.
//
// Angelehnt an das Vorgehen echter Speditionssoftware: Nicht der
// Disponent erfindet die Ladung, sondern es liegen Transportaufträge
// vor, die auf verfügbare Fahrzeuge verteilt werden. Jeder Auftrag
// bringt Ladestelle, Entladestelle, Ware, Menge, Zeitfenster,
// vereinbartes Entgelt und Anforderungen mit.
//
// Zwei Quellen:
//   Frachtbörse - anonyme Einzelaufträge, jederzeit verfügbar,
//                 niedrige Preise
//   Stammkunden - Aufträge von Auftraggebern, für die schon gefahren
//                 wurde; besser bezahlt (siehe kunden.js)
//
// Statuskette (wie in der Praxis):
//   offen -> disponiert -> unterwegs -> zugestellt -> abgerechnet
//   (dazu: storniert, wenn ein Auftrag verfällt)

const Auftraege = (function () {

  const STATUS = {
    offen: "offen",
    disponiert: "disponiert",
    unterwegs: "unterwegs",
    zugestellt: "zugestellt",
    abgerechnet: "abgerechnet",
    verfallen: "verfallen"
  };

  // So viele Aufträge sollen in der Börse liegen. Darunter wird
  // nachgefüllt, damit immer etwas zu disponieren ist.
  const BOERSE_ZIEL = 24;

  // Wie lange ein Auftrag am Markt bleibt, bevor ihn jemand anders
  // nimmt (in Spieltagen ab Ladefenster-Ende).
  const VERFALL_TAGE = 2;

  let naechsteNummer = 1000;
  const auftraege = [];
  const beobachter = [];

  function zufaelligAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  /**
   * Erzeugt einen Auftrag zwischen zwei Städten, sofern die Ware dort
   * angeboten und gebraucht wird.
   * @param {object} [vorgabe] erzwingt Absender/Kunde (für Stammkunden)
   */
  function erzeugen(vorgabe = {}) {
    const staedte = Karte.alleStaedte();

    let von = vorgabe.von || zufaelligAus(staedte);
    const angebot = Wirtschaft.angebot(von);
    if (angebot.length === 0) return null;

    const gut = vorgabe.gut || zufaelligAus(angebot);

    // Empfänger: eine Stadt, die diese Ware braucht und erreichbar ist.
    // Nähere Ziele sind häufiger - lange Läufe bleiben die Ausnahme.
    const moegliche = staedte.filter(
      (s) => s.name !== von.name && Wirtschaft.bedarf(s).some((g) => g.id === gut.id)
    );
    if (moegliche.length === 0) return null;

    const nahe = moegliche
      .map((s) => ({ s, km: Karte.luftlinie(von, s) }))
      .sort((a, b) => a.km - b.km);
    // Aus den nächstgelegenen zwei Dritteln wählen
    const auswahl = nahe.slice(0, Math.max(3, Math.floor(nahe.length * 0.66)));
    const nach = (vorgabe.nach ? { s: vorgabe.nach } : zufaelligAus(auswahl)).s;

    const route = Route.berechne(von.name, nach.name);
    if (!route) return null;

    // Menge: Teil- oder Komplettladung
    const maxTonnen = Math.min(25, (90 * gut.dichteKgProM3) / 1000);
    const tonnen = Math.round(Math.max(3, maxTonnen * (0.45 + Math.random() * 0.55)) * 10) / 10;

    const kunde = vorgabe.kunde || Kunden.fuer(von, gut.kategorie);
    const grundpreis = Ladung.frachtpreis(gut, tonnen, route.km);

    // Börsenaufträge sind gedrückt, Kundenaufträge bringen Aufschlag.
    const faktor = vorgabe.kunde
      ? Kunden.preisfaktor(kunde)
      : 0.82 + Math.random() * 0.12;

    // Zeitfenster: Ladung steht in den nächsten Tagen bereit, die
    // Lieferfrist berücksichtigt die reine Fahrzeit plus Puffer.
    const jetzt = Spielzeit.heute();
    const ladeBeginn = new Date(jetzt.getTime());
    ladeBeginn.setHours(ladeBeginn.getHours() + Math.round(Math.random() * 36));
    const ladeEnde = new Date(ladeBeginn.getTime());
    ladeEnde.setHours(ladeEnde.getHours() + 24 + Math.round(Math.random() * 24));

    const fahrStunden = route.km / Fahrt.SCHNITT_STANDARD;
    const ruheStunden = Math.floor(fahrStunden / Fahrt.LENKZEIT_STUNDEN) * Fahrt.RUHEZEIT_STUNDEN;
    const lieferFrist = new Date(ladeEnde.getTime());
    lieferFrist.setHours(
      lieferFrist.getHours() + Math.ceil((fahrStunden + ruheStunden) * (1.15 + Math.random() * 0.35))
    );

    const auftrag = {
      nummer: `A-${naechsteNummer++}`,
      status: STATUS.offen,
      quelle: vorgabe.kunde ? "kunde" : "boerse",
      kundeId: kunde.id,
      kundeName: kunde.name,
      vonName: von.name,
      nachName: nach.name,
      gutId: gut.id,
      tonnen,
      km: route.km,
      entgelt: Math.round(grundpreis * faktor),
      ladeBeginn: ladeBeginn.toISOString(),
      ladeEnde: ladeEnde.toISOString(),
      lieferFrist: lieferFrist.toISOString(),
      angelegtAm: jetzt.toISOString(),
      fahrzeugId: null,
      zugestelltAm: null,
      puenktlich: null
    };

    auftraege.push(auftrag);
    return auftrag;
  }

  /** Füllt die Börse auf und lässt abgelaufene Aufträge verfallen. */
  function auffrischen() {
    const jetzt = Spielzeit.heute();

    // Verfallene aussortieren
    auftraege.forEach((a) => {
      if (a.status !== STATUS.offen) return;
      const grenze = new Date(a.ladeEnde);
      grenze.setDate(grenze.getDate() + VERFALL_TAGE);
      if (jetzt > grenze) a.status = STATUS.verfallen;
    });

    // Stammkunden melden sich zuerst
    Kunden.mitBindung().forEach((kunde) => {
      const offeneVonKunde = offene().filter((a) => a.kundeId === kunde.id).length;
      const soll = Kunden.stufe(kunde).angebote;
      const stadt = STAEDTE[kunde.stadt];
      if (!stadt) return;
      for (let i = offeneVonKunde; i < soll; i++) {
        erzeugen({ von: stadt, kunde });
      }
    });

    // Rest über die Börse
    let versuche = 0;
    while (offene().length < BOERSE_ZIEL && versuche < BOERSE_ZIEL * 4) {
      erzeugen();
      versuche++;
    }

    benachrichtigen();
  }

  // ---------- Abfragen ----------

  function offene() {
    return auftraege.filter((a) => a.status === STATUS.offen);
  }

  function laufende() {
    return auftraege.filter(
      (a) => a.status === STATUS.disponiert || a.status === STATUS.unterwegs
    );
  }

  function abgeschlossene() {
    return auftraege.filter(
      (a) => a.status === STATUS.zugestellt || a.status === STATUS.abgerechnet
    );
  }

  /**
   * Offene Frachten ab einer Stadt. Erzeugt bei Bedarf welche nach.
   *
   * Grund: Ein globaler Pool von zwei Dutzend Aufträgen verteilt sich
   * auf 165 Städte - fast jede wäre leer. Aus Sicht des Spielers bietet
   * aber jede Stadt Ladung an, die dort erzeugt wird. Die Aufträge
   * werden einmal erzeugt und bleiben dann bestehen, damit die Liste
   * nicht bei jedem Blick anders aussieht.
   */
  function fuerStadt(stadt, mindestens = 6) {
    let vorhandene = offene().filter((a) => a.vonName === stadt.name);

    let versuche = 0;
    while (vorhandene.length < mindestens && versuche < mindestens * 4) {
      const neu = erzeugen({ von: stadt });
      if (neu) vorhandene.push(neu);
      versuche++;
    }
    return vorhandene;
  }

  function nachNummer(nummer) {
    return auftraege.find((a) => a.nummer === nummer) || null;
  }

  function gut(auftrag) {
    return GUETER_NACH_ID[auftrag.gutId];
  }

  // ---------- Statuswechsel ----------

  function disponieren(auftrag, fahrzeug) {
    auftrag.status = STATUS.disponiert;
    auftrag.fahrzeugId = fahrzeug.id;
    benachrichtigen();
  }

  function beginnen(auftrag) {
    auftrag.status = STATUS.unterwegs;
    benachrichtigen();
  }

  function zustellen(auftrag) {
    const jetzt = Spielzeit.heute();
    auftrag.status = STATUS.zugestellt;
    auftrag.zugestelltAm = jetzt.toISOString();
    auftrag.puenktlich = jetzt <= new Date(auftrag.lieferFrist);

    const kunde = Kunden.alle().find((k) => k.id === auftrag.kundeId);
    if (kunde) {
      Kunden.auftragErledigt(kunde, {
        puenktlich: auftrag.puenktlich,
        entgelt: auftrag.entgelt
      });
    }
    benachrichtigen();
    return auftrag;
  }

  function freigeben(auftrag) {
    // Disposition rückgängig machen, z.B. wenn ein Fahrzeug ausfällt
    auftrag.status = STATUS.offen;
    auftrag.fahrzeugId = null;
    benachrichtigen();
  }

  // ---------- Hilfen für die Disposition ----------

  /** Bleibt genug Zeit, den Auftrag rechtzeitig zuzustellen? */
  function terminMachbar(auftrag, abStadtName) {
    const anfahrt = Route.berechne(abStadtName, auftrag.vonName);
    const hauptlauf = Route.berechne(auftrag.vonName, auftrag.nachName);
    if (!anfahrt || !hauptlauf) return null;

    const gesamtKm = anfahrt.km + hauptlauf.km;
    const fahrStunden = gesamtKm / Fahrt.SCHNITT_STANDARD;
    const ruheStunden =
      Math.floor(fahrStunden / Fahrt.LENKZEIT_STUNDEN) * Fahrt.RUHEZEIT_STUNDEN;

    const ankunft = Spielzeit.heute();
    ankunft.setHours(ankunft.getHours() + Math.ceil(fahrStunden + ruheStunden));

    return {
      anfahrtKm: anfahrt.km,
      hauptlaufKm: hauptlauf.km,
      gesamtKm,
      ankunft,
      puenktlich: ankunft <= new Date(auftrag.lieferFrist),
      stundenPuffer: Math.round(
        (new Date(auftrag.lieferFrist) - ankunft) / 3600000
      )
    };
  }

  function beiAenderung(rueckruf) { beobachter.push(rueckruf); }
  function benachrichtigen() { beobachter.forEach((r) => r()); }

  function alle() { return auftraege.slice(); }

  /** Gespeicherte Aufträge übernehmen. */
  function setzen(liste) {
    auftraege.length = 0;
    (liste || []).forEach((a) => auftraege.push({ ...a }));

    // Nummernkreis fortsetzen, damit keine Nummer doppelt vergeben wird
    auftraege.forEach((a) => {
      const nummer = Number(String(a.nummer).replace("A-", ""));
      if (!Number.isNaN(nummer) && nummer >= naechsteNummer) naechsteNummer = nummer + 1;
    });
    benachrichtigen();
  }

  return {
    STATUS,
    BOERSE_ZIEL,
    erzeugen,
    auffrischen,
    offene,
    fuerStadt,
    laufende,
    abgeschlossene,
    nachNummer,
    gut,
    disponieren,
    beginnen,
    zustellen,
    freigeben,
    terminMachbar,
    beiAenderung,
    alle,
    setzen
  };
})();
