// anzeige.js
// Die Anzeigeeinstellungen: Größe, Kontrast, Zeilendichte, Eingabeart.
//
// Warum das ein eigenes Kernmodul ist und nicht Teil des Spielstands:
// docs/optik-und-bedienung.md, Regel 74 und A29. Wer seine Oberfläche
// mühsam auf 200 Prozent und hohen Kontrast gestellt hat, verliert bei
// einem Spielstandverlust sonst die Bedienbarkeit, nicht nur den
// Fortschritt. Deshalb liegen diese Werte in einem eigenen
// Speicherschlüssel, den Speicher.neuBeginnen() und das Löschen eines
// Platzes nicht anfassen.
//
// Alles, was hier gesetzt wird, landet als CSS-Variable oder Klasse am
// <body>. Es gibt genau eine Größe (--skala), aus der die gesamte
// Oberfläche abgeleitet ist - das ist der Punkt, an dem Regel 66 hängt.

const Anzeige = (function () {
  const SCHLUESSEL = "spedipro-anzeige";

  // Die Stufen. 0.61 ist die originalgetreue: 1rem landet dann bei
  // 11px, also genau dort, wo die alte Oberfläche stand. Sie ist
  // ausdrücklich als unter dem Minimum liegend beschriftet und
  // ausdrücklich NICHT die Voreinstellung - Regel 53.
  const SKALA_STUFEN = [
    { wert: 0.61, name: "Klein (98 originalgetreu)",
      hinweis: "11 px Grundschrift - so klein wie Windows 98 wirklich war" },
    { wert: 0.78, name: "Mittel",
      hinweis: "14 px Grundschrift - für viel Inhalt auf wenig Platz" },
    { wert: 1.00, name: "Normal",
      hinweis: "18 px Grundschrift - so startet das Spiel" },
    { wert: 1.30, name: "Groß",
      hinweis: "23 px Grundschrift" },
    { wert: 1.60, name: "Sehr groß",
      hinweis: "29 px Grundschrift" },
    { wert: 2.00, name: "Doppelt",
      hinweis: "36 px Grundschrift - doppelt so groß wie normal" }
  ];

  // Zeilenhöhe in Listen. Die drei belegten Stufen aus der
  // Enterprise-Tabellen-Analyse plus die 98er, die ausdrücklich nicht
  // fingertauglich ist - Regel 44.
  const DICHTE_STUFEN = [
    { wert: "original", name: "98 originalgetreu", rem: 1.0,
      hinweis: "18 px Zeilen - am Telefon kaum zu treffen" },
    { wert: "eng", name: "Eng", rem: 2.22,
      hinweis: "40 px Zeilen" },
    { wert: "normal", name: "Normal", rem: 2.67,
      hinweis: "48 px Zeilen" },
    { wert: "weit", name: "Weit", rem: 3.11,
      hinweis: "56 px Zeilen" }
  ];

  const VORGABE = {
    skala: 1.0,
    kontrast: false,
    dichte: "normal",
    eingabe: "auto"     // auto | maus | finger
  };

  let stand = Object.assign({}, VORGABE);

  // ---------- Speichern ----------

  function laden() {
    try {
      const roh = window.localStorage.getItem(SCHLUESSEL);
      if (roh) {
        const gelesen = JSON.parse(roh);
        Object.keys(VORGABE).forEach((k) => {
          if (gelesen[k] !== undefined) stand[k] = gelesen[k];
        });
      }
    } catch (e) {
      // Ein privates Fenster oder geleerter Speicher darf die
      // Oberfläche nicht daran hindern, zu starten. Dann gilt die
      // Voreinstellung - und die erfüllt die Mindestwerte.
    }
    anwenden();
  }

  function sichern() {
    try {
      window.localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    } catch (e) { /* siehe laden() */ }
  }

  // ---------- Anwenden ----------

  function anwenden() {
    const wurzel = document.documentElement;
    const koerper = document.body;
    if (!koerper) return;

    wurzel.style.setProperty("--skala", String(stand.skala));

    koerper.classList.toggle("kontrast-hoch", Boolean(stand.kontrast));

    const dichte = DICHTE_STUFEN.find((d) => d.wert === stand.dichte) || DICHTE_STUFEN[2];
    wurzel.style.setProperty("--zeile-hoehe", dichte.rem + "rem");

    koerper.classList.remove("eingabe-maus", "eingabe-finger");
    if (stand.eingabe === "maus") koerper.classList.add("eingabe-maus");
    if (stand.eingabe === "finger") koerper.classList.add("eingabe-finger");
  }

  // ---------- Setzen ----------

  function skalaSetzen(wert) {
    stand.skala = Number(wert) || VORGABE.skala;
    sichern();
    anwenden();
  }

  function kontrastSetzen(an) {
    stand.kontrast = Boolean(an);
    sichern();
    anwenden();
  }

  function dichteSetzen(wert) {
    if (!DICHTE_STUFEN.some((d) => d.wert === wert)) return;
    stand.dichte = wert;
    sichern();
    anwenden();
  }

  function eingabeSetzen(wert) {
    if (!["auto", "maus", "finger"].includes(wert)) return;
    stand.eingabe = wert;
    sichern();
    anwenden();
  }

  function zurueckSetzen() {
    stand = Object.assign({}, VORGABE);
    sichern();
    anwenden();
  }

  function lesen() {
    return Object.assign({}, stand);
  }

  // Die Voreinstellung wird gesetzt, bevor das erste Fenster aufgeht:
  // Regel 72 - der Standardzustand muss ohne jede Einstellung
  // bedienbar sein, also auch der Weg zu den Einstellungen.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", laden);
  } else {
    laden();
  }

  return {
    SKALA_STUFEN, DICHTE_STUFEN,
    laden, lesen, anwenden,
    skalaSetzen, kontrastSetzen, dichteSetzen, eingabeSetzen, zurueckSetzen
  };
})();
