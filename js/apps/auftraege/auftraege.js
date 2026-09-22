// auftraege.js
// Die Auftragsübersicht - was ein Disponent 1994 als Stapel auf dem
// Tisch hatte: alle offenen Aufträge auf einen Blick, sortierbar und
// durchsuchbar.
//
// Bisher sah man Frachten nur in der Disposition, Stadt für Stadt. Wer
// wissen wollte, wo überhaupt etwas Gutes liegt, musste 165 Städte
// abklappern. Diese Liste beantwortet die umgekehrte Frage: Welcher
// Auftrag lohnt sich, und wo fängt er an?
//
// Bewusst NUR lesend und übernehmend: Disponiert wird weiterhin in der
// Disposition. Ein Klick auf "Übernehmen" öffnet sie mit dieser Fracht
// bereits gewählt.

const AuftraegeApp = (function () {
  let fensterElement = null;

  // Wonach sortiert wird. "jeTag" ist die Kennzahl, nach der auch die
  // Zielliste in der Disposition ordnet - der Deckungsbeitrag je Tag.
  let sortierung = "jeTag";

  // Welche Auswahl gezeigt wird.
  let filter = "alle"; // alle | standorte | ladbar
  let suche = "";

  const SORTIERUNGEN = [
    { id: "jeTag", titel: "Deckungsbeitrag je Tag" },
    { id: "entgelt", titel: "Entgelt" },
    { id: "frist", titel: "Frist zuerst" },
    { id: "km", titel: "Entfernung" },
    { id: "nah", titel: "Nähe zur Flotte" }
  ];

  const FILTER = [
    { id: "alle", titel: "Alle" },
    { id: "standorte", titel: "Ab meinen Standorten" },
    { id: "ladbar", titel: "Ladbar" }
  ];

  // Mehr Zeilen liest niemand, und jede kostet eine Streckenrechnung.
  const ZEILEN_MAX = 40;

  // ---------- Bewertung ----------

  /** Fahrzeuge, die gerade nicht unterwegs und nicht defekt sind. */
  function freieFahrzeuge() {
    if (typeof FuhrparkApp === "undefined") return [];
    return FuhrparkApp.alleFahrzeuge().filter(
      (f) => f.status !== "stillstehend" && !Fahrt.istUnterwegs(f.id)
    );
  }

  /**
   * Einen Auftrag durchrechnen.
   *
   * Gerechnet wird mit dem Fahrzeug, das ihn am günstigsten übernehmen
   * könnte - also dem, das am nächsten an der Ladestelle steht und die
   * Ware laden darf. Ohne ein solches Fahrzeug bleibt die Zeile
   * sichtbar, aber ohne Zahlen: Man soll sehen, was es gäbe, auch wenn
   * man es gerade nicht fahren kann.
   */
  function bewerten(auftrag, flotte) {
    const g = Auftraege.gut(auftrag);
    const passend = flotte.filter(
      (f) => Ladung.kannLaden(f, g) && Ladung.maxMengeTonnen(f, g) >= auftrag.tonnen
    );

    let bestes = null;
    let anfahrt = null;
    passend.forEach((f) => {
      const r = f.standort === auftrag.vonName
        ? { km: 0 }
        : Route.berechne(f.standort, auftrag.vonName);
      if (!r) return;
      if (!anfahrt || r.km < anfahrt.km) { anfahrt = r; bestes = f; }
    });

    if (!bestes) {
      return {
        auftrag, gut: g, fahrzeug: null, anfahrtKm: null,
        db: null, jeTag: null, stunden: null,
        grund: passend.length === 0 ? "kein passendes Fahrzeug" : "keine Strecke"
      };
    }

    const aufbau = String(bestes.aufbautyp || "standard").toLowerCase();
    const gesamtKm = anfahrt.km + auftrag.km;
    const sprit = Math.round(
      (gesamtKm / 100) * bestes.verbrauchBasisL100km * Kostensaetze.dieselpreis()
    );
    const stunden = Auftraege.dauerStunden(gesamtKm)
      + Kostensaetze.standzeit("laden", aufbau)
      + Kostensaetze.standzeit("abladen", aufbau);
    const db = auftrag.entgelt - sprit;

    return {
      auftrag, gut: g, fahrzeug: bestes, anfahrtKm: anfahrt.km,
      sprit, db, stunden,
      jeTag: Math.round(db / Math.max(0.1, stunden / 24)),
      grund: ""
    };
  }

  /** Die Liste, wie sie nach Filter, Suche und Sortierung aussieht. */
  function zeilen() {
    const flotte = freieFahrzeuge();
    const standorte = new Set(flotte.map((f) => f.standort));
    const text = suche.trim().toLowerCase();

    let liste = Auftraege.offene();

    if (filter === "standorte") {
      liste = liste.filter((a) => standorte.has(a.vonName));
    }

    if (text) {
      liste = liste.filter((a) => {
        const g = Auftraege.gut(a);
        return a.vonName.toLowerCase().includes(text)
          || a.nachName.toLowerCase().includes(text)
          || (g && g.name.toLowerCase().includes(text))
          || a.nummer.toLowerCase().includes(text)
          || (a.kundeName || "").toLowerCase().includes(text);
      });
    }

    // Erst filtern, dann rechnen: Jede Bewertung kostet mehrere
    // Streckensuchen, und die sind das Teuerste an dieser Liste.
    let bewertet = liste.map((a) => bewerten(a, flotte));

    if (filter === "ladbar") {
      bewertet = bewertet.filter((z) => z.fahrzeug !== null);
    }

    bewertet.sort((a, b) => {
      switch (sortierung) {
        case "entgelt": return b.auftrag.entgelt - a.auftrag.entgelt;
        case "frist":
          return Auftraege.restStunden(a.auftrag) - Auftraege.restStunden(b.auftrag);
        case "km": return a.auftrag.km - b.auftrag.km;
        case "nah":
          // Ohne Fahrzeug ans Ende, sonst nach Anfahrtsweg
          if (a.anfahrtKm === null) return 1;
          if (b.anfahrtKm === null) return -1;
          return a.anfahrtKm - b.anfahrtKm;
        default:
          return (b.jeTag === null ? -1 : b.jeTag) - (a.jeTag === null ? -1 : a.jeTag);
      }
    });

    return { alle: bewertet, gezeigt: bewertet.slice(0, ZEILEN_MAX) };
  }

  // ---------- Darstellung ----------

  function renderInhalt() {
    const { alle, gezeigt } = zeilen();
    const gesamt = Auftraege.offene().length;

    return `
      <div class="auf-layout">
        <div class="auf-leiste">
          <div class="auf-reiter">
            ${FILTER.map((f) => `
              <button class="auf-reiterknopf ${filter === f.id ? "aktiv" : ""}"
                      data-auf-filter="${f.id}">${f.titel}</button>
            `).join("")}
          </div>
          <div class="auf-suchzeile">
            <label for="auf-suche">Suche</label>
            <input type="text" id="auf-suche" class="auf-feld"
                   value="${suche.replace(/"/g, "&quot;")}"
                   placeholder="Stadt, Ware, Kunde oder Nummer">
            <label for="auf-sortierung">Sortiert nach</label>
            <select id="auf-sortierung" class="auf-feld">
              ${SORTIERUNGEN.map((s) => `
                <option value="${s.id}" ${sortierung === s.id ? "selected" : ""}>${s.titel}</option>
              `).join("")}
            </select>
          </div>
          <div class="auf-zaehler">
            ${alle.length} von ${gesamt} offenen Aufträgen${
              alle.length > ZEILEN_MAX ? ` · die besten ${ZEILEN_MAX}` : ""}
          </div>
        </div>

        <ul class="auf-liste" id="auf-liste">
          ${gezeigt.length === 0
            ? `<li class="auf-leer">Kein Auftrag passt zu dieser Auswahl.</li>`
            : gezeigt.map(zeile).join("")}
        </ul>
      </div>
    `;
  }

  function zeile(z) {
    const a = z.auftrag;
    const rest = Auftraege.restanteil(a);
    const stunden = Auftraege.restStunden(a);

    let klasse = "auf-frist-viel";
    if (rest < 0.2) klasse = "auf-frist-knapp";
    else if (rest < 0.5) klasse = "auf-frist-mittel";

    return `
      <li class="auf-zeile ${z.fahrzeug ? "" : "ohne-wagen"}" data-auftrag="${a.nummer}">
        <span class="auf-balken ${klasse}" style="width:${Math.round(rest * 100)}%"
              title="Noch ${stunden} Std am Markt"></span>
        <span class="auf-kopf">
          <span class="auf-weg">${a.vonName} → ${a.nachName}</span>
          <span class="auf-geld">${a.entgelt.toLocaleString("de-DE")} DM</span>
        </span>
        <span class="auf-daten">
          ${a.tonnen.toFixed(1)} t ${z.gut.name} ·
          ${a.km.toLocaleString("de-DE")} km ·
          ${a.quelle === "kunde"
            ? `<span class="auf-kunde">${a.kundeName}</span>`
            : `<span class="auf-boerse">Frachtbörse</span>`}
          <span class="auf-nummer">${a.nummer}</span>
        </span>
        <span class="auf-daten">
          ${z.fahrzeug
            ? `<span class="auf-jetag">${z.jeTag.toLocaleString("de-DE")} DM je Tag</span> ·
               ${z.anfahrtKm === 0
                 ? "Wagen steht dort"
                 : `${Math.round(z.anfahrtKm).toLocaleString("de-DE")} km Anfahrt`} ·
               ${z.fahrzeug.kennzeichen}`
            : `<span class="auf-warnung">${z.grund}</span>`}
          · liefern bis ${Spielzeit.formatiereMitUhrzeit(new Date(a.lieferFrist))}
        </span>
        <button class="win98-button bevel-out auf-uebernehmen"
                data-uebernehmen="${a.nummer}">Übernehmen</button>
      </li>
    `;
  }

  // ---------- Ereignisse ----------

  function neuZeichnen() {
    if (!fensterElement || !document.body.contains(fensterElement)) return;
    const inhalt = fensterElement.querySelector(".win98-window-content");
    if (!inhalt) return;

    // Die Scrollposition der Liste festhalten: Der Zeittakt baut die
    // Übersicht neu auf, sobald sich Aufträge ändern.
    const alteListe = inhalt.querySelector("#auf-liste");
    const stand = alteListe ? alteListe.scrollTop : 0;

    inhalt.innerHTML = renderInhalt();
    ereignisseBinden();

    const neueListe = inhalt.querySelector("#auf-liste");
    if (neueListe) neueListe.scrollTop = stand;
  }

  function ereignisseBinden() {
    if (!fensterElement) return;

    fensterElement.querySelectorAll("[data-auf-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        filter = el.dataset.aufFilter;
        neuZeichnen();
      });
    });

    const sort = fensterElement.querySelector("#auf-sortierung");
    if (sort) {
      sort.addEventListener("change", () => {
        sortierung = sort.value;
        neuZeichnen();
      });
    }

    const feld = fensterElement.querySelector("#auf-suche");
    if (feld) {
      feld.addEventListener("input", () => {
        suche = feld.value;
        neuZeichnen();
        // Nach dem Neuaufbau ist das Feld ein anderes - der Schreibfluss
        // darf davon nichts merken.
        const neu = fensterElement.querySelector("#auf-suche");
        if (neu) {
          neu.focus();
          neu.setSelectionRange(neu.value.length, neu.value.length);
        }
      });
    }

    fensterElement.querySelectorAll("[data-uebernehmen]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        uebernehmen(el.dataset.uebernehmen);
      });
    });

    fensterElement.querySelectorAll("[data-auftrag]").forEach((el) => {
      el.addEventListener("click", () => uebernehmen(el.dataset.auftrag));
    });
  }

  /**
   * Auftrag in die Disposition geben. Dort ist er dann gewählt, und der
   * Ablauf setzt beim Ziel ein - der Rest der Planung gehört dorthin,
   * nicht in diese Liste.
   */
  function uebernehmen(nummer) {
    if (typeof TourenplanungApp === "undefined" || !TourenplanungApp.auftragUebernehmen) return;
    TourenplanungApp.auftragUebernehmen(nummer);
  }

  // ---------- Fenster ----------

  let angemeldet = false;

  function open() {
    if (typeof TourenplanungApp !== "undefined" && TourenplanungApp.starten) {
      TourenplanungApp.starten();
    }

    const ergebnis = WindowManager.open({
      id: "auftraege",
      title: "Aufträge",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;
    if (ergebnis.wurdeNeuErstellt) ereignisseBinden();

    // Die Börse verändert sich laufend: Aufträge verfallen, neue kommen
    // herein, eigene werden disponiert. Die Liste zieht nach.
    if (!angemeldet) {
      angemeldet = true;
      Auftraege.beiAenderung(neuZeichnen);
    }
  }

  return {
    open,
    aktualisieren: neuZeichnen
  };
})();

AppRegistry.register({
  id: "auftraege",
  name: "Aufträge",
  open: AuftraegeApp.open
});

document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-auftraege");
  if (icon) icon.addEventListener("click", () => AuftraegeApp.open());
});
