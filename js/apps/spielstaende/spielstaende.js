// spielstaende.js
// Spielstandverwaltung: drei feste Plätze, wie man sie von
// Konsolenspielen der Zeit kennt.
//
// Das Programm steht bewusst NICHT auf dem Desktop und nicht unter
// "Programme", sondern direkt im Startmenü - Spielstände gehören zum
// Spiel, nicht in den Arbeitsalltag der Spedition.
//
// Zwei Dinge, die hier bewusst anders laufen als sonst:
//   - Gesichert wird immer nur auf den AKTIVEN Platz. Sonst würde die
//     Automatik alle zehn Sekunden den zuletzt angesehenen Platz
//     überschreiben.
//   - Ein Stand aus einer älteren Fassung wird nicht gelöscht, sondern
//     als nicht ladbar ausgewiesen. Er lässt sich weiterhin als Datei
//     ausgeben und später wieder einlesen.

const SpielstaendeApp = (function () {
  let fensterElement = null;
  let meldung = null;

  // ---------- Darstellung ----------

  function formatiereRealzeit(ms) {
    if (!ms) return "unbekannt";
    const d = new Date(ms);
    const zwei = (n) => String(n).padStart(2, "0");
    return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()} ` +
           `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  }

  function formatiereSpielzeit(iso) {
    if (!iso) return "—";
    return Spielzeit.formatiereMitUhrzeit(new Date(iso));
  }

  function renderInhalt() {
    const plaetze = Speicher.plaetze();

    return `
      <div class="stand-layout">
        ${meldung ? `<div class="stand-meldung ${meldung.art}">${meldung.text}</div>` : ""}
        <p class="stand-hinweis">
          Gesichert wird laufend auf den aktiven Platz. Ein Platzwechsel
          beim Laden übernimmt auch die Automatik.
        </p>
        <div class="stand-liste">
          ${plaetze.map(renderPlatz).join("")}
        </div>
        <div class="stand-fusszeile">
          Spielstände liegen im Speicher dieses Browsers. Wird er
          geleert, sind sie weg — die Ausgabe als Datei ist die einzige
          Sicherung, die das überlebt.
        </div>
      </div>
      <input type="file" id="stand-datei" accept=".json,application/json" hidden>
    `;
  }

  function renderPlatz(p) {
    if (!p.belegt) {
      return `
        <div class="stand-platz stand-leer ${p.aktiv ? "aktiv" : ""}">
          <div class="stand-kopf">
            <span class="stand-nummer">Platz ${p.nr}</span>
            ${p.aktiv ? `<span class="stand-marke-aktiv">aktiv</span>` : ""}
          </div>
          <div class="stand-leertext">— leer —</div>
          <div class="stand-knoepfe">
            <button class="win98-button bevel-out" data-neu="${p.nr}">Neues Spiel hier</button>
            <button class="win98-button bevel-out" data-import="${p.nr}">Einlesen…</button>
          </div>
        </div>
      `;
    }

    const alt = !p.ladbar;
    return `
      <div class="stand-platz ${p.aktiv ? "aktiv" : ""} ${alt ? "stand-veraltet" : ""}">
        <div class="stand-kopf">
          <span class="stand-nummer">Platz ${p.nr}</span>
          <span class="stand-depot">${p.depot || "ohne Depot"}</span>
          ${p.aktiv ? `<span class="stand-marke-aktiv">aktiv</span>` : ""}
          ${alt ? `<span class="stand-marke-alt">Fassung ${p.fassung}</span>` : ""}
        </div>
        <dl class="stand-daten">
          <dt>Spielzeit</dt><dd>${formatiereSpielzeit(p.spielzeit)}</dd>
          <dt>Gesichert</dt><dd>${formatiereRealzeit(p.gesichertAm)}</dd>
          <dt>Fahrzeuge</dt><dd>${p.fahrzeuge}</dd>
          <dt>Unterwegs</dt><dd>${p.touren}</dd>
        </dl>
        ${alt ? `
          <div class="stand-warnung">
            Stammt aus einer älteren Fassung und lässt sich nicht laden.
            Er bleibt erhalten und kann als Datei ausgegeben werden.
          </div>` : ""}
        <div class="stand-knoepfe">
          ${!alt ? `<button class="win98-button bevel-out" data-laden="${p.nr}">Laden</button>` : ""}
          <button class="win98-button bevel-out" data-speichern="${p.nr}">Speichern</button>
          <button class="win98-button bevel-out" data-export="${p.nr}">Ausgeben…</button>
          <button class="win98-button bevel-out" data-import="${p.nr}">Einlesen…</button>
          <button class="win98-button bevel-out" data-loeschen="${p.nr}">Löschen</button>
        </div>
      </div>
    `;
  }

  // ---------- Aktionen ----------

  function neuZeichnen() {
    if (!fensterElement || !document.body.contains(fensterElement)) return;
    const koerper = fensterElement.querySelector(".win98-window-content");
    if (!koerper) return;
    koerper.innerHTML = renderInhalt();
    ereignisseBinden();
  }

  function melde(text, art) {
    meldung = { text, art: art || "info" };
  }

  function ereignisseBinden() {
    const koerper = fensterElement.querySelector(".win98-window-content");
    if (!koerper) return;

    koerper.querySelectorAll("[data-laden]").forEach((el) => {
      el.addEventListener("click", () => platzLaden(Number(el.dataset.laden)));
    });

    koerper.querySelectorAll("[data-speichern]").forEach((el) => {
      el.addEventListener("click", () => platzSpeichern(Number(el.dataset.speichern)));
    });

    koerper.querySelectorAll("[data-loeschen]").forEach((el) => {
      el.addEventListener("click", () => platzLoeschen(Number(el.dataset.loeschen)));
    });

    koerper.querySelectorAll("[data-neu]").forEach((el) => {
      el.addEventListener("click", () => platzNeu(Number(el.dataset.neu)));
    });

    koerper.querySelectorAll("[data-export]").forEach((el) => {
      el.addEventListener("click", () => platzAusgeben(Number(el.dataset.export)));
    });

    koerper.querySelectorAll("[data-import]").forEach((el) => {
      el.addEventListener("click", () => dateiWaehlen(Number(el.dataset.import)));
    });

    const datei = koerper.querySelector("#stand-datei");
    if (datei) {
      datei.addEventListener("change", () => {
        const f = datei.files && datei.files[0];
        if (!f) return;
        const leser = new FileReader();
        leser.onload = () => {
          const ziel = Number(datei.dataset.ziel);
          const ergebnis = Speicher.importieren(ziel, String(leser.result));
          melde(ergebnis.meldung, ergebnis.ok ? "gut" : "schlecht");
          datei.value = "";
          neuZeichnen();
        };
        leser.readAsText(f);
      });
    }
  }

  function platzLaden(nr) {
    if (!window.confirm(
      `Platz ${nr} laden?\n\n` +
      `Der aktuelle Spielstand wird vorher auf Platz ${Speicher.aktiver()} gesichert.`
    )) return;

    // Erst den laufenden Stand festhalten, sonst geht er verloren.
    Speicher.speichern(Speicher.aktiver());

    const ergebnis = TourenplanungApp.spielstandLaden(nr);
    if (ergebnis && ergebnis.fehler === "fassung") {
      melde(`Platz ${nr} stammt aus Fassung ${ergebnis.fassung} und ist nicht ladbar.`, "schlecht");
    } else {
      melde(`Platz ${nr} geladen.`, "gut");
      if (ergebnis && ergebnis.nachgeholteStunden > 0) {
        ProtokollFenster.zeigen(ergebnis);
      }
    }
    neuZeichnen();
  }

  function platzSpeichern(nr) {
    if (nr !== Speicher.aktiver() && !window.confirm(
      `Auf Platz ${nr} speichern?\n\nDer dortige Spielstand wird überschrieben, ` +
      `und Platz ${nr} wird ab jetzt laufend gesichert.`
    )) return;

    Speicher.aktivSetzen(nr);
    melde(Speicher.speichern(nr)
      ? `Auf Platz ${nr} gespeichert.`
      : `Platz ${nr} ließ sich nicht beschreiben.`,
      Speicher.vorhanden(nr) ? "gut" : "schlecht");
    neuZeichnen();
  }

  function platzLoeschen(nr) {
    if (!window.confirm(`Platz ${nr} endgültig löschen?`)) return;
    Speicher.loeschen(nr);
    melde(`Platz ${nr} gelöscht.`, "info");
    neuZeichnen();
  }

  function platzNeu(nr) {
    if (!window.confirm(
      `Neues Spiel auf Platz ${nr} beginnen?\n\n` +
      `Der aktuelle Spielstand wird vorher auf Platz ${Speicher.aktiver()} gesichert.`
    )) return;

    Speicher.speichern(Speicher.aktiver());
    Speicher.neuBeginnen(nr);
    TourenplanungApp.spielstandLaden(nr);
    melde(`Neues Spiel auf Platz ${nr}. Zuerst ein Depot gründen.`, "gut");
    neuZeichnen();
  }

  function platzAusgeben(nr) {
    const ausgabe = Speicher.exportieren(nr);
    if (!ausgabe) {
      melde("Nichts auszugeben.", "schlecht");
      neuZeichnen();
      return;
    }

    const blob = new Blob([ausgabe.inhalt], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ausgabe.dateiname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    melde(`${ausgabe.dateiname} wird heruntergeladen.`, "gut");
    neuZeichnen();
  }

  function dateiWaehlen(nr) {
    const datei = fensterElement.querySelector("#stand-datei");
    if (!datei) return;
    datei.dataset.ziel = String(nr);
    datei.click();
  }

  // ---------- Fenster ----------

  function open() {
    // Ohne laufende Uhr und Auftragspool wären die Angaben leer, wenn
    // man das Programm als erstes öffnet.
    TourenplanungApp.starten();
    meldung = null;

    const ergebnis = WindowManager.open({
      id: "spielstaende",
      title: "Spielstände",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;
    if (ergebnis.wurdeNeuErstellt) ereignisseBinden();
    else neuZeichnen();
  }

  return { open };
})();

/**
 * Das Fenster "Während deiner Abwesenheit". Zeigt, was die
 * Nachholsimulation beim Öffnen abgearbeitet hat - vorher stand dort
 * nur eine Zeile mit einer Zahl.
 */
const ProtokollFenster = (function () {

  const SYMBOLE = {
    ankunft: "🚚",
    verfall: "✕",
    frist: "⚠",
    ausfall: "⛔",
    kunde: "👤",
    hinweis: "ℹ"
  };

  function zeigen(ergebnis) {
    const eintraege = (ergebnis && ergebnis.protokoll) || Speicher.protokollLesen();

    const inhalt = `
      <div class="stand-layout">
        <div class="protokoll-kopf">
          ${ergebnis && ergebnis.nachgeholteStunden
            ? `${ergebnis.nachgeholteStunden} Stunden Spielzeit nachgeholt`
            : "Keine Zeit nachzuholen"}
          ${ergebnis && ergebnis.angekommen
            ? ` · ${ergebnis.angekommen} Tour${ergebnis.angekommen > 1 ? "en" : ""} zugestellt`
            : ""}
        </div>
        ${eintraege.length === 0
          ? `<div class="protokoll-leer">In der Zwischenzeit ist nichts passiert.</div>`
          : `<ul class="protokoll-liste">
              ${eintraege.map((e) => `
                <li class="protokoll-eintrag protokoll-${e.art}">
                  <span class="protokoll-symbol">${SYMBOLE[e.art] || "·"}</span>
                  <span class="protokoll-zeit">${
                    Spielzeit.formatiereMitUhrzeit(new Date(e.zeit))
                  }</span>
                  <span class="protokoll-text">${e.text}</span>
                </li>
              `).join("")}
            </ul>`}
      </div>
    `;

    WindowManager.open({
      id: "abwesenheit",
      title: "Während deiner Abwesenheit",
      content: inhalt
    });
  }

  return { zeigen };
})();
