// fuhrpark.js
// Das Fuhrpark-Programm: reine Fahrzeug-Verwaltung und -Zustand.
// KEIN Kauf/Verkauf (-> Fahrzeughandel), KEINE Wartung (-> Werkstatt),
// KEINE Tourzuweisung (-> Tourenplanung). Diese Module liefern später
// echte Daten; bis dahin übernehmen die Debug-Buttons diese Rolle.
//
// Ansicht: kein Liste-Layout, sondern ein Fahrzeug pro Bildschirm mit
// isometrischer Pixelart-Grafik (immer dieselbe Grafik für alle
// Fahrzeuge) und Floating-Callouts mit Linie zum jeweiligen Bauteil.
// Zwischen Fahrzeugen wird per Pfeil-Buttons oder Swipe geblättert.

const FuhrparkApp = (function () {
  let fahrzeuge = [];
  let naechsteId = 1;
  let aktuellerIndex = 0;
  // "uebersicht" = Liste aller Fahrzeuge, "detail" = Einzelansicht mit
  // LKW-Grafik und Callouts.
  let ansicht = "uebersicht";

  const TEIL_LABEL = {
    reifen: "Reifen",
    bremsen: "Bremsen",
    motor: "Motor",
    antrieb: "Antrieb",
    karosserie: "Karosserie"
  };

  // Ankerpunkte auf der LKW-Grafik (in % von Bildbreite/-höhe) und
  // Position der zugehörigen Beschriftung, ebenfalls in %. Beide Werte
  // beziehen sich auf dasselbe 0-100-Koordinatensystem, damit Bild,
  // Verbindungslinie (SVG) und Beschriftungs-Box exakt zusammenpassen.
  // Ermittelt am tatsächlichen Sprite assets/sprites/lkw-generisch.png.
  const CALLOUT_LAYOUT = {
    motor: { anker: [19.6, 52.8], label: [9, 36] },
    bremsen: { anker: [27.7, 81.4], label: [12, 93] },
    reifen: { anker: [78.6, 60.8], label: [88, 45] },
    karosserie: { anker: [30.4, 61.9], label: [30, 18] },
    antrieb: { anker: [48.2, 75.7], label: [50, 92] }
  };

  function typZuFinden(typId) {
    return FAHRZEUGTYPEN.find((t) => t.typId === typId);
  }

  function neuesFahrzeugAusTyp(typId, ueberschreibungen = {}) {
    const typ = typZuFinden(typId);
    if (!typ) throw new Error(`Unbekannter Fahrzeugtyp: ${typId}`);

    const fahrzeug = {
      id: naechsteId++,
      typId: typ.typId,
      marke: typ.marke,
      modell: typ.modell,
      aufbautyp: typ.aufbautyp,
      zuladungKg: typ.zuladungKg,
      verbrauchBasisL100km: typ.verbrauchBasisL100km,
      baujahr: typ.baujahrVon,
      kennzeichen: "??-XX 000",
      kmStand: 0,
      standort: "Frankfurt am Main",
      status: "verfügbar",
      lackierung: "rot",
      verbrauchGesamtL: 0,
      verschleiss: { reifen: 100, bremsen: 100, motor: 100, antrieb: 100, karosserie: 100 }
    };

    return Object.assign(fahrzeug, ueberschreibungen);
  }

  function seedFlotte() {
    fahrzeuge = [
      neuesFahrzeugAusTyp("meridian-1830s", {
        baujahr: 1991,
        kennzeichen: "F-SP 101",
        kmStand: 312000,
        standort: "Frankfurt am Main",
        lackierung: "rot",
        verschleiss: { reifen: 72, bremsen: 58, motor: 80, antrieb: 75, karosserie: 88 }
      }),
      neuesFahrzeugAusTyp("skanda-143m", {
        baujahr: 1993,
        kennzeichen: "F-SP 102",
        kmStand: 187000,
        standort: "Köln",
        lackierung: "blau",
        verschleiss: { reifen: 90, bremsen: 85, motor: 91, antrieb: 89, karosserie: 94 }
      }),
      neuesFahrzeugAusTyp("iveko-turbostar", {
        baujahr: 1989,
        kennzeichen: "F-SP 103",
        kmStand: 455000,
        standort: "Mailand",
        lackierung: "gelb",
        status: "außer Betrieb",
        verschleiss: { reifen: 40, bremsen: 22, motor: 35, antrieb: 30, karosserie: 55 }
      }),
      neuesFahrzeugAusTyp("davo-95", {
        baujahr: 1995,
        kennzeichen: "F-SP 104",
        kmStand: 64000,
        standort: "Rotterdam",
        lackierung: "gruen",
        verschleiss: { reifen: 95, bremsen: 96, motor: 97, antrieb: 96, karosserie: 98 }
      })
    ];
  }

  // ---------- Darstellung ----------

  function zustandsKlasse(wert) {
    if (wert < 40) return "zustand-kritisch";
    if (wert < 70) return "zustand-warnung";
    return "zustand-gut";
  }

  // Stufenlose Farbe von Rot (0%) über Gelb nach Grün (100%), statt nur
  // dreier fester Klassen - für die Callout-Linien passender als die
  // groben Ampel-Stufen.
  function zustandsFarbe(wert) {
    const hue = Math.max(0, Math.min(100, wert)) * 1.2; // 0=rot, 120=grün
    return `hsl(${hue}, 70%, 38%)`;
  }

  // Positioniert die Verbindungslinien NACH dem Rendern anhand der
  // tatsächlichen Textbox-Maße - die Linie beginnt exakt am Ende des
  // Unterstrichs (linke oder rechte Kante, je nachdem auf welcher
  // Seite das Ziel am Fahrzeug liegt), nicht an einem geschätzten Punkt.
  // Setzt die Größe der Bildbox explizit in Pixeln, statt sich allein
  // auf CSS aspect-ratio + max-width/max-height zu verlassen. Grund:
  // Ohne geladenes Bild (z.B. falscher Pfad) hat die Box sonst keine
  // eigene Mindestgröße mehr und kollabiert auf 0 - das reißt dann auch
  // alle nachfolgenden Elemente (Balken, Pager) aus ihrer Position.
  function visualGroesseAnpassen() {
    const pager = fensterElement.querySelector(".fuhrpark-pager");
    const rahmen = fensterElement.querySelector(".fuhrpark-visual-rahmen");
    const visual = fensterElement.querySelector("#fuhrpark-visual");
    if (!pager || !rahmen || !visual) return false;

    const verfuegbareBreite = rahmen.clientWidth || pager.clientWidth;

    // Ohne Breite ist noch gar nichts gelayoutet - dann später erneut
    // versuchen (siehe ResizeObserver unten), statt stillschweigend
    // aufzugeben und das Bild unsichtbar zu lassen.
    if (verfuegbareBreite === 0) return false;

    // Der Rahmen schmiegt sich jetzt ans Bild, hat also keine eigene
    // Höhe, aus der sich der Platz ableiten ließe. Stattdessen: Höhe des
    // Fensterinhalts minus alle Geschwister (Kopfzeile, Balken,
    // Navigation, Debug-Leiste).
    let belegteHoehe = 0;
    Array.from(pager.children).forEach((kind) => {
      if (kind !== rahmen) belegteHoehe += kind.offsetHeight;
    });
    const abstaende = 6 * (pager.children.length - 1); // gap zwischen den Blöcken
    const verfuegbareHoehe = pager.clientHeight - belegteHoehe - abstaende;

    const seitenverhaeltnis = 560 / 436;
    let breite = verfuegbareBreite;
    let hoehe = breite / seitenverhaeltnis;

    // Höhe nur begrenzen, wenn sinnvoll Platz bekannt ist. Sonst die
    // volle Breite ausnutzen - das Bild soll waagerecht ausfüllen.
    if (verfuegbareHoehe > 40 && hoehe > verfuegbareHoehe) {
      hoehe = verfuegbareHoehe;
      breite = hoehe * seitenverhaeltnis;
    }

    visual.style.width = `${breite}px`;
    visual.style.height = `${hoehe}px`;
    return true;
  }

  // Beobachtet den Rahmen und rechnet neu, sobald er eine echte Größe
  // bekommt. Fängt den Fall ab, dass beim ersten Render noch kein
  // Layout stand (Bild noch nicht geladen, Fenster gerade erst geöffnet).
  let groessenBeobachter = null;

  function groessenBeobachtungStarten() {
    if (typeof ResizeObserver === "undefined") return;

    // Bewusst den Pager (Fensterinhalt) beobachten, NICHT den Rahmen:
    // der Rahmen ändert seine Größe durch unsere eigene Anpassung mit,
    // das würde sich endlos selbst neu auslösen.
    const pager = fensterElement.querySelector(".fuhrpark-pager");
    if (!pager) return;

    if (groessenBeobachter) groessenBeobachter.disconnect();

    groessenBeobachter = new ResizeObserver(() => {
      if (visualGroesseAnpassen()) {
        linienPositionieren();
      }
    });
    groessenBeobachter.observe(pager);
  }

  function linienPositionieren() {
    const fahrzeug = fahrzeuge[aktuellerIndex];
    if (!fahrzeug) return;

    const container = fensterElement.querySelector("#fuhrpark-visual");
    const svg = fensterElement.querySelector(".fuhrpark-visual-linien");
    if (!container || !svg) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return; // noch nicht gelayoutet

    svg.innerHTML = "";

    Verschleiss.TEILE.forEach((teil) => {
      const box = container.querySelector(`.fuhrpark-callout[data-teil="${teil}"]`);
      const layout = CALLOUT_LAYOUT[teil];
      if (!box || !layout) return;

      const boxRect = box.getBoundingClientRect();
      const [ankerXProzent, ankerYProzent] = layout.anker;
      const ankerXPx = (ankerXProzent / 100) * containerRect.width;

      const boxMitteX = (boxRect.left + boxRect.right) / 2 - containerRect.left;
      // Rechte Kante des Unterstrichs, wenn das Ziel rechts vom Text liegt,
      // sonst linke Kante - damit die Linie nicht durch den Text verläuft.
      const startXPx =
        ankerXPx >= boxMitteX ? boxRect.right - containerRect.left : boxRect.left - containerRect.left;
      const startYPx = boxRect.bottom - containerRect.top - 1; // knapp an der Unterstreichung

      const startXProzent = (startXPx / containerRect.width) * 100;
      const startYProzent = (startYPx / containerRect.height) * 100;

      const wert = fahrzeug.verschleiss[teil];

      const linie = document.createElementNS("http://www.w3.org/2000/svg", "line");
      linie.setAttribute("x1", startXProzent.toFixed(1));
      linie.setAttribute("y1", startYProzent.toFixed(1));
      linie.setAttribute("x2", ankerXProzent);
      linie.setAttribute("y2", ankerYProzent);
      linie.setAttribute("class", "callout-linie");
      linie.setAttribute("stroke", zustandsFarbe(wert));
      svg.appendChild(linie);
    });
  }

  function callouts(fahrzeug) {
    const boxen = [];

    Verschleiss.TEILE.forEach((teil) => {
      const layout = CALLOUT_LAYOUT[teil];
      const [lx, ly] = layout.label;
      const wert = fahrzeug.verschleiss[teil];

      boxen.push(`
        <div class="fuhrpark-callout" data-teil="${teil}"
             style="left:${lx}%; top:${ly}%;">
          <span class="fuhrpark-callout-label">${TEIL_LABEL[teil]}</span>
          <span class="fuhrpark-callout-wert ${zustandsKlasse(wert)}">${wert.toFixed(0)}%</span>
        </div>
      `);
    });

    return boxen.join("");
  }

  function reparaturOptionen() {
    return Verschleiss.TEILE.map(
      (teil) => `<option value="${teil}">${TEIL_LABEL[teil]}</option>`
    ).join("");
  }

  function uebersichtZeile(fahrzeug, index) {
    const gesamt = Verschleiss.gesamtzustand(fahrzeug);
    return `
      <li class="fuhrpark-uebersicht-eintrag bevel-out" data-index="${index}">
        <div class="fuhrpark-uebersicht-kopf">
          <span class="fuhrpark-uebersicht-name">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-uebersicht-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-uebersicht-meta">
          ${fahrzeug.baujahr} · ${fahrzeug.aufbautyp} ·
          ${fahrzeug.kmStand.toLocaleString("de-DE")} km · ${fahrzeug.standort} ·
          ${fahrzeug.status}
        </div>
        <div class="fuhrpark-uebersicht-zustand">
          <div class="fuhrpark-gesamtbalken-hintergrund">
            <div class="fuhrpark-gesamtbalken-fuellung ${zustandsKlasse(gesamt)}"
                 style="width:${gesamt.toFixed(0)}%"></div>
          </div>
          <span class="fuhrpark-gesamtbalken-wert">${gesamt.toFixed(0)}%</span>
        </div>
      </li>
    `;
  }

  function renderUebersicht() {
    const anzahlKritisch = fahrzeuge.filter(
      (f) => Verschleiss.gesamtzustand(f) < 40
    ).length;

    return `
      <div class="fuhrpark-uebersicht">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">Fuhrpark</span>
          <span class="fuhrpark-uebersicht-zaehler">${fahrzeuge.length} Fahrzeuge${
            anzahlKritisch > 0 ? ` · ${anzahlKritisch} kritisch` : ""
          }</span>
        </div>

        <ul class="fuhrpark-uebersicht-liste">
          ${fahrzeuge.map(uebersichtZeile).join("")}
        </ul>
      </div>
    `;
  }

  function bildQuelle(fahrzeug) {
    const hue = Lackierung.hueVonName(fahrzeug.lackierung);
    // Ohne bekannte Farbe oder solange das Sprite noch nicht geladen ist,
    // liefert umfaerben() automatisch das Originalbild zurück.
    return hue === undefined ? Lackierung.QUELLE : Lackierung.umfaerben(hue);
  }

  function renderDetail() {
    const fahrzeug = fahrzeuge[aktuellerIndex];
    const gesamt = Verschleiss.gesamtzustand(fahrzeug);
    const boxen = callouts(fahrzeug);

    return `
      <div class="fuhrpark-pager">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>

        <div class="fuhrpark-visual-rahmen">
          <div class="fuhrpark-visual" id="fuhrpark-visual">
            <img class="fuhrpark-visual-bild" src="${bildQuelle(fahrzeug)}" alt="Isometrische LKW-Ansicht"
                 onerror="this.classList.add('bild-fehler'); this.alt='Bild nicht gefunden: assets/sprites/lkw-generisch.png';">
            <svg class="fuhrpark-visual-linien" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            ${boxen}
          </div>
        </div>

        <div class="fuhrpark-gesamtbalken">
          <span class="fuhrpark-gesamtbalken-label">Gesamtzustand</span>
          <div class="fuhrpark-gesamtbalken-hintergrund">
            <div class="fuhrpark-gesamtbalken-fuellung ${zustandsKlasse(gesamt)}"
                 style="width:${gesamt.toFixed(0)}%"></div>
          </div>
          <span class="fuhrpark-gesamtbalken-wert">${gesamt.toFixed(0)}%</span>
        </div>

        <div class="fuhrpark-blaetter-zeile">
          <button class="win98-button bevel-out fuhrpark-zurueck" id="fuhrpark-btn-zurueck">&#10094; Übersicht</button>
        </div>

        <dl class="fuhrpark-infoliste">
          <dt>Baujahr</dt><dd>${fahrzeug.baujahr}</dd>
          <dt>Aufbau</dt><dd>${fahrzeug.aufbautyp}</dd>
          <dt>Lackierung</dt><dd>${fahrzeug.lackierung}</dd>
          <dt>Laufleistung</dt><dd>${fahrzeug.kmStand.toLocaleString("de-DE")} km</dd>
          <dt>Standort</dt><dd>${fahrzeug.standort}</dd>
          <dt>Status</dt><dd>${fahrzeug.status}</dd>
          <dt>Verbrauch gesamt</dt><dd>${fahrzeug.verbrauchGesamtL.toFixed(0)} l</dd>
        </dl>

        <div class="fuhrpark-debug-leiste">
          <button class="win98-button bevel-out" id="fuhrpark-btn-tour">🎲 Tour simulieren</button>
          <select class="win98-button bevel-out" id="fuhrpark-select-teil">
            ${reparaturOptionen()}
          </select>
          <button class="win98-button bevel-out" id="fuhrpark-btn-reparieren">🔧 Reparieren (Debug)</button>
        </div>
      </div>
    `;
  }

  function renderInhalt() {
    if (fahrzeuge.length === 0) {
      return `<p>Keine Fahrzeuge im Fuhrpark.</p>`;
    }
    return ansicht === "uebersicht" ? renderUebersicht() : renderDetail();
  }

  // ---------- Verhalten ----------

  let fensterElement = null;

  function neuZeichnen() {
    const inhalt = fensterElement.querySelector(".win98-window-content");
    inhalt.innerHTML = renderInhalt();
    ereignisseBinden();
  }

  function fahrzeugOeffnen(index) {
    aktuellerIndex = index;
    ansicht = "detail";
    neuZeichnen();
  }

  function zurueckZurUebersicht() {
    ansicht = "uebersicht";
    neuZeichnen();
  }

  function swipeErkennen(element) {
    let startX = 0;
    let startY = 0;

    element.addEventListener("touchstart", (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    });

    element.addEventListener("touchend", (event) => {
      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Nur werten, wenn deutlich mehr horizontal als vertikal bewegt
      // wurde, damit vertikales Scrollen nicht versehentlich blättert.
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          aktuellerIndex = (aktuellerIndex + 1) % fahrzeuge.length;
        } else {
          aktuellerIndex = (aktuellerIndex - 1 + fahrzeuge.length) % fahrzeuge.length;
        }
        neuZeichnen();
      }
    });
  }

  function ereignisseBinden() {
    // ---- Übersicht ----
    fensterElement.querySelectorAll(".fuhrpark-uebersicht-eintrag").forEach((eintrag) => {
      eintrag.addEventListener("click", () => {
        fahrzeugOeffnen(Number(eintrag.dataset.index));
      });
    });

    // ---- Detailansicht ----
    const btnZurueck = fensterElement.querySelector("#fuhrpark-btn-zurueck");
    if (btnZurueck) btnZurueck.addEventListener("click", zurueckZurUebersicht);

    const visual = fensterElement.querySelector("#fuhrpark-visual");
    if (visual) swipeErkennen(visual);

    const btnTour = fensterElement.querySelector("#fuhrpark-btn-tour");
    if (btnTour) {
      btnTour.addEventListener("click", () => {
        const fahrzeug = fahrzeuge[aktuellerIndex];
        const tour = Verschleiss.zufaelligeTour();
        Verschleiss.wendeTourAn(fahrzeug, tour);
        neuZeichnen();
      });
    }

    const btnReparieren = fensterElement.querySelector("#fuhrpark-btn-reparieren");
    if (btnReparieren) {
      btnReparieren.addEventListener("click", () => {
        const fahrzeug = fahrzeuge[aktuellerIndex];
        const select = fensterElement.querySelector("#fuhrpark-select-teil");
        Verschleiss.teilReparieren(fahrzeug, select.value);
        neuZeichnen();
      });
    }

    // Bild-Layout nur relevant, wenn die Detailansicht sichtbar ist.
    if (ansicht === "detail") {
      visualGroesseAnpassen();
      linienPositionieren();
      groessenBeobachtungStarten();
    } else if (groessenBeobachter) {
      groessenBeobachter.disconnect();
    }
  }

  // Bei Größenänderung (z.B. Rotation des Handys) müssen Box und Linien
  // neu berechnet werden.
  window.addEventListener("resize", () => {
    if (ansicht === "detail" && fensterElement && document.body.contains(fensterElement)) {
      visualGroesseAnpassen();
      linienPositionieren();
    }
  });

  function open() {
    if (fahrzeuge.length === 0) {
      seedFlotte();
    }

    const ergebnis = WindowManager.open({
      id: "fuhrpark",
      title: "Fuhrpark",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;

    // Nur beim ersten Öffnen Events binden - ist das Fenster schon offen,
    // holt WindowManager es nur nach vorne, der Inhalt bleibt unverändert.
    if (ergebnis.wurdeNeuErstellt) {
      ereignisseBinden();

      // Das Umfärben braucht das geladene Sprite. Bis dahin zeigt
      // bildQuelle() das Original; sobald es da ist, einmal neu zeichnen.
      Lackierung.bildLaden()
        .then(() => {
          if (fensterElement && document.body.contains(fensterElement)) {
            neuZeichnen();
          }
        })
        .catch((fehler) => console.warn("Lackierung nicht verfügbar:", fehler.message));
    }
  }

  return { open };
})();

AppRegistry.register({
  id: "fuhrpark",
  name: "Fuhrpark",
  open: FuhrparkApp.open
});

// ---------- Desktop-Icon verknüpfen ----------
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-fuhrpark");
  if (icon) {
    icon.addEventListener("click", () => FuhrparkApp.open());
  }
});
