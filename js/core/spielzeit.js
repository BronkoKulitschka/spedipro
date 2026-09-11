// spielzeit.js
// Der Kalender des Spiels. Bewusst als eigenes Kernmodul, weil später
// nicht nur der Fuhrpark davon abhängt: Tourenplanung (Lieferfristen),
// Personal (Lenkzeiten, Urlaub), Buchhaltung (Abrechnungszeiträume).
//
// Aktuell wird die Zeit nur über die Debug-Schaltflächen vorgespult.
// Sobald die Tourenplanung existiert, sollte das Vorspulen von dort
// kommen (eine Tour dauert x Tage) - die Schnittstelle bleibt gleich.

const Spielzeit = (function () {
  // ---------- Taktgeber ----------
  // Eine Simulationsstunde dauert eine reale Minute. Damit entspricht
  // eine reale Sekunde einer Simulationsminute, und ein Spieltag
  // vergeht in 24 realen Minuten.
  //
  // GEPLANT: Das Tempo gehört später in die Einstellungen (pausiert,
  // langsam, normal, schnell). Dann sollte MINUTEN_JE_SEKUNDE von dort
  // kommen statt fest zu stehen.
  const MINUTEN_JE_SEKUNDE = 1;
  const TAKT_MS = 1000;

  let taktZaehler = null;
  let laeuft = false;

  // Bedingung, unter der die Uhr überhaupt tickt. Ohne Fahrzeuge
  // unterwegs steht die Zeit still - sonst würden Fristen und
  // Auftragsangebote verstreichen, während der Spieler nur plant.
  let laufBedingung = () => true;
  // Startdatum der Kampagne. 1994 gewählt, weil dann bereits im Spiel:
  // deutsche Einheit vollzogen, EU-Binnenmarkt seit 1993 in Kraft
  // (Wegfall der Zollformalitäten innerhalb der EU), Osteuropa offen.
  const STARTDATUM = new Date(1994, 2, 1, 6, 0); // 1. März 1994, 06:00 Uhr

  const MONATSNAMEN = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  let aktuell = new Date(STARTDATUM.getTime());
  const beobachter = [];


  function heute() {
    return new Date(aktuell.getTime()); // Kopie, damit niemand von außen verstellt
  }

  /** Startet die laufende Uhr. Mehrfaches Aufrufen schadet nicht. */
  function starten() {
    if (taktZaehler !== null) return;
    laeuft = true;
    taktZaehler = setInterval(() => {
      if (!laeuft) return;
      if (!laufBedingung()) return;
      minutenAddieren(MINUTEN_JE_SEKUNDE);
    }, TAKT_MS);
  }

  /** Legt fest, wann die Uhr laufen darf. */
  function setzeLaufBedingung(fn) {
    laufBedingung = typeof fn === "function" ? fn : () => true;
    beobachter.forEach((rueckruf) => rueckruf(heute()));
  }

  /** Läuft die Zeit gerade tatsächlich? */
  function laeuftGerade() {
    return laeuft && laufBedingung();
  }

  function pausieren() { laeuft = false; }
  function fortsetzen() { laeuft = true; }
  function istPausiert() { return !laeuft; }

  /** Rückt die Uhr um Minuten vor und benachrichtigt alle Beobachter. */
  function minutenAddieren(minuten, still = false) {
    aktuell.setMinutes(aktuell.getMinutes() + minuten);
    // "still" wird beim Nachsimulieren nach dem Laden gebraucht: dort
    // sollen nicht bei jedem Schritt alle Anzeigen neu zeichnen.
    if (!still) beobachter.forEach((rueckruf) => rueckruf(heute()));
  }

  /** Setzt die Uhr auf einen gespeicherten Stand. */
  function setzeAuf(datum) {
    aktuell = new Date(datum.getTime());
    beobachter.forEach((rueckruf) => rueckruf(heute()));
  }

  function stundenAddieren(stunden) {
    minutenAddieren(Math.round(stunden * 60));
  }

  function vorspulen(tage) {
    minutenAddieren(tage * 24 * 60);
    return heute();
  }

  function beiAenderung(rueckruf) {
    beobachter.push(rueckruf);
  }

  function zuruecksetzen() {
    aktuell = new Date(STARTDATUM.getTime());
    beobachter.forEach((rueckruf) => rueckruf(heute()));
  }

  /** Tage zwischen zwei Daten (b - a), auf ganze Tage gerundet. */
  function tageZwischen(a, b) {
    const einTag = 24 * 60 * 60 * 1000;
    const aOhneZeit = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bOhneZeit = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((bOhneZeit - aOhneZeit) / einTag);
  }

  function monateAddieren(datum, monate) {
    const neu = new Date(datum.getTime());
    neu.setMonth(neu.getMonth() + monate);
    return neu;
  }

  /** Uhrzeit im 24-Stunden-Format: 07:45 */
  function formatiereUhrzeit(datum) {
    const hh = String(datum.getHours()).padStart(2, "0");
    const mm = String(datum.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /** Datum mit Uhrzeit: 01.03.1994, 07:45 */
  function formatiereMitUhrzeit(datum) {
    return `${formatiere(datum)}, ${formatiereUhrzeit(datum)}`;
  }

  /** Kurzform: 01.03.1994 */
  function formatiere(datum) {
    const tt = String(datum.getDate()).padStart(2, "0");
    const mm = String(datum.getMonth() + 1).padStart(2, "0");
    return `${tt}.${mm}.${datum.getFullYear()}`;
  }

  /** Nur Monat/Jahr - so stehen HU-Fristen auch auf der Prüfplakette. */
  function formatiereMonat(datum) {
    return `${MONATSNAMEN[datum.getMonth()]} ${datum.getFullYear()}`;
  }

  /** Lang: Dienstag, 1. März 1994 */
  function formatiereLang(datum) {
    const wochentage = [
      "Sonntag", "Montag", "Dienstag", "Mittwoch",
      "Donnerstag", "Freitag", "Samstag"
    ];
    return `${wochentage[datum.getDay()]}, ${datum.getDate()}. ` +
           `${MONATSNAMEN[datum.getMonth()]} ${datum.getFullYear()}`;
  }

  return {
    STARTDATUM,
    MINUTEN_JE_SEKUNDE,
    heute,
    starten,
    pausieren,
    fortsetzen,
    istPausiert,
    setzeLaufBedingung,
    laeuftGerade,
    minutenAddieren,
    stundenAddieren,
    setzeAuf,
    formatiereUhrzeit,
    formatiereMitUhrzeit,
    vorspulen,
    beiAenderung,
    zuruecksetzen,
    tageZwischen,
    monateAddieren,
    formatiere,
    formatiereMonat,
    formatiereLang
  };
})();
