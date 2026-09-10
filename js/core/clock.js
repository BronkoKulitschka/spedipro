// clock.js
// Datum und Uhrzeit in der Taskleiste.
//
// Gezeigt wird die SPIELZEIT, nicht die reale Systemzeit: Der Rechner
// im Spiel steht in den 90ern, seine Uhr muss dazu passen. Eine reale
// Uhrzeit neben einem Spieldatum von 1994 wäre widersprüchlich.
//
// Solange die Spielzeit noch nicht geladen ist (Ladereihenfolge der
// Skripte), bleibt die Anzeige leer statt falsche Werte zu zeigen.

(function () {
  const uhrEl = document.getElementById("clock");
  const datumEl = document.getElementById("clock-date");

  function anzeigeAktualisieren(jetzt) {
    if (!jetzt) return;
    if (datumEl) datumEl.textContent = Spielzeit.formatiere(jetzt);
    if (uhrEl) uhrEl.textContent = Spielzeit.formatiereUhrzeit(jetzt);
  }

  function starten() {
    if (typeof Spielzeit === "undefined") {
      // Spielzeit noch nicht da - gleich noch einmal versuchen
      setTimeout(starten, 50);
      return;
    }

    anzeigeAktualisieren(Spielzeit.heute());
    Spielzeit.beiAenderung(anzeigeAktualisieren);

    // Die Uhr läuft, sobald irgendein Modul sie startet. Falls noch
    // keines offen ist, hier anstoßen, damit die Taskleiste tickt.
    Spielzeit.starten();
  }

  starten();
})();
