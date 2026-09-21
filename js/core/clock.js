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
  const versionEl = document.getElementById("tray-version");

  if (versionEl && typeof VERSION !== "undefined") {
    versionEl.textContent = `v${VERSION}`;
    versionEl.title = `SpediPro 95, Fassung ${VERSION}`;
  }

  function anzeigeAktualisieren(jetzt) {
    if (!jetzt) return;
    if (datumEl) datumEl.textContent = Spielzeit.formatiere(jetzt);
    if (!uhrEl) return;

    // Die Uhr läuft nur, solange Fahrzeuge unterwegs sind. Steht sie,
    // muss man das sehen können - sonst wartet man auf Zeit, die nicht
    // vergeht. Das ist die einzige Uhr im Spiel; die Programme haben
    // keine eigene, so wenig wie unter Windows 98.
    const laeuft = Spielzeit.laeuftGerade();
    uhrEl.textContent = Spielzeit.formatiereUhrzeit(jetzt) + (laeuft ? "" : " ⏸");
    uhrEl.classList.toggle("uhr-steht", !laeuft);
    uhrEl.title = laeuft
      ? "Die Zeit läuft, solange Fahrzeuge unterwegs sind"
      : "Die Zeit steht still - kein Fahrzeug unterwegs";
  }

  function starten() {
    if (typeof Spielzeit === "undefined" || typeof Fahrt === "undefined") {
      // Module noch nicht geladen - gleich noch einmal versuchen
      setTimeout(starten, 50);
      return;
    }

    // Steht die Zeit, kommt kein Zeittakt mehr - die Anzeige erführe
    // nie, dass sie stehengeblieben ist. Der Wechsel passiert genau
    // dann, wenn eine Tour beginnt oder endet.
    Fahrt.beiAenderung(() => anzeigeAktualisieren(Spielzeit.heute()));

    anzeigeAktualisieren(Spielzeit.heute());
    Spielzeit.beiAenderung(anzeigeAktualisieren);

    // Die Laufbedingung muss hier stehen, nicht erst in der
    // Tourenplanung: Sonst tickt die Taskleistenuhr ab dem Seitenaufruf
    // frei vor sich hin, obwohl kein Fahrzeug unterwegs ist - und stoppt
    // erst, wenn die Tourenplanung zum ersten Mal geöffnet wird. Beides
    // zusammen sah aus wie zwei Uhren, die verschieden gehen.
    Spielzeit.setzeLaufBedingung(
      () => typeof Fahrt !== "undefined" && Fahrt.anzahl() > 0
    );

    Spielzeit.starten();
  }

  starten();
})();
