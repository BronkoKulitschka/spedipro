// spielzeit.js
// Der Kalender des Spiels. Bewusst als eigenes Kernmodul, weil später
// nicht nur der Fuhrpark davon abhängt: Tourenplanung (Lieferfristen),
// Personal (Lenkzeiten, Urlaub), Buchhaltung (Abrechnungszeiträume).
//
// Aktuell wird die Zeit nur über die Debug-Schaltflächen vorgespult.
// Sobald die Tourenplanung existiert, sollte das Vorspulen von dort
// kommen (eine Tour dauert x Tage) - die Schnittstelle bleibt gleich.

const Spielzeit = (function () {
  // Startdatum der Kampagne. 1994 gewählt, weil dann bereits im Spiel:
  // deutsche Einheit vollzogen, EU-Binnenmarkt seit 1993 in Kraft
  // (Wegfall der Zollformalitäten innerhalb der EU), Osteuropa offen.
  const STARTDATUM = new Date(1994, 2, 1); // 1. März 1994

  const MONATSNAMEN = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  let aktuell = new Date(STARTDATUM.getTime());
  const beobachter = [];

  function heute() {
    return new Date(aktuell.getTime()); // Kopie, damit niemand von außen verstellt
  }

  function vorspulen(tage) {
    aktuell.setDate(aktuell.getDate() + tage);
    beobachter.forEach((rueckruf) => rueckruf(heute()));
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
    heute,
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
