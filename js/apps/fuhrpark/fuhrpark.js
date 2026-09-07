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
    motor: { anker: [21.4, 78.0], label: [4, 60] },
    reifen: { anker: [27.7, 81.4], label: [4, 95] },
    bremsen: { anker: [78.6, 60.8], label: [95, 78] },
    antrieb: { anker: [56.2, 71.1], label: [60, 97] },
    karosserie: { anker: [76.8, 34.4], label: [95, 15] }
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
        verschleiss: { reifen: 72, bremsen: 58, motor: 80, antrieb: 75, karosserie: 88 }
      }),
      neuesFahrzeugAusTyp("skanda-143m", {
        baujahr: 1993,
        kennzeichen: "F-SP 102",
        kmStand: 187000,
        standort: "Köln",
        verschleiss: { reifen: 90, bremsen: 85, motor: 91, antrieb: 89, karosserie: 94 }
      }),
      neuesFahrzeugAusTyp("iveko-turbostar", {
        baujahr: 1989,
        kennzeichen: "F-SP 103",
        kmStand: 455000,
        standort: "Mailand",
        status: "außer Betrieb",
        verschleiss: { reifen: 40, bremsen: 22, motor: 35, antrieb: 30, karosserie: 55 }
      }),
      neuesFahrzeugAusTyp("davo-95", {
        baujahr: 1995,
        kennzeichen: "F-SP 104",
        kmStand: 64000,
        standort: "Rotterdam",
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

  function callouts(fahrzeug) {
    const linien = [];
    const boxen = [];

    Verschleiss.TEILE.forEach((teil) => {
      const layout = CALLOUT_LAYOUT[teil];
      const [ax, ay] = layout.anker;
      const [lx, ly] = layout.label;
      const wert = fahrzeug.verschleiss[teil];

      linien.push(
        `<line x1="${ax}" y1="${ay}" x2="${lx}" y2="${ly}" class="callout-linie" />`
      );
      linien.push(
        `<circle cx="${ax}" cy="${ay}" r="1.3" class="callout-punkt" />`
      );

      boxen.push(`
        <div class="fuhrpark-callout ${zustandsKlasse(wert)}"
             style="left:${lx}%; top:${ly}%;">
          <span class="fuhrpark-callout-label">${TEIL_LABEL[teil]}</span>
          <span class="fuhrpark-callout-wert">${wert.toFixed(0)}%</span>
        </div>
      `);
    });

    return { linien: linien.join(""), boxen: boxen.join("") };
  }

  function reparaturOptionen() {
    return Verschleiss.TEILE.map(
      (teil) => `<option value="${teil}">${TEIL_LABEL[teil]}</option>`
    ).join("");
  }

  function renderInhalt() {
    if (fahrzeuge.length === 0) {
      return `<p>Keine Fahrzeuge im Fuhrpark.</p>`;
    }

    const fahrzeug = fahrzeuge[aktuellerIndex];
    const gesamt = Verschleiss.gesamtzustand(fahrzeug);
    const { linien, boxen } = callouts(fahrzeug);

    return `
      <div class="fuhrpark-pager">
        <div class="fuhrpark-kopfzeile">
          <div>
            <strong>${fahrzeug.marke} ${fahrzeug.modell}</strong>
            <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
            <span class="fuhrpark-gesamt ${zustandsKlasse(gesamt)}">Gesamt: ${gesamt.toFixed(0)}%</span>
          </div>
          <div class="fuhrpark-karte-info">
            Baujahr ${fahrzeug.baujahr} · ${fahrzeug.aufbautyp} ·
            ${fahrzeug.kmStand.toLocaleString("de-DE")} km · ${fahrzeug.standort} ·
            Status: <em>${fahrzeug.status}</em> ·
            Verbrauch gesamt: ${fahrzeug.verbrauchGesamtL.toFixed(0)} l
          </div>
        </div>

        <div class="fuhrpark-blaetter-zeile">
          <button class="fuhrpark-nav bevel-out" id="fuhrpark-nav-links" aria-label="Vorheriges Fahrzeug">&#10094;</button>

          <div class="fuhrpark-visual-spalte">
            <div class="fuhrpark-visual" id="fuhrpark-visual">
              <img class="fuhrpark-visual-bild" src="assets/sprites/lkw-generisch.png" alt="Isometrische LKW-Ansicht">
              <svg class="fuhrpark-visual-linien" viewBox="0 0 100 100" preserveAspectRatio="none">
                ${linien}
              </svg>
              ${boxen}
            </div>

            <div class="fuhrpark-gesamtbalken">
              <span class="fuhrpark-gesamtbalken-label">Gesamtzustand</span>
              <div class="fuhrpark-gesamtbalken-hintergrund">
                <div class="fuhrpark-gesamtbalken-fuellung ${zustandsKlasse(gesamt)}"
                     style="width:${gesamt.toFixed(0)}%"></div>
              </div>
              <span class="fuhrpark-gesamtbalken-wert">${gesamt.toFixed(0)}%</span>
            </div>
          </div>

          <button class="fuhrpark-nav bevel-out" id="fuhrpark-nav-rechts" aria-label="Nächstes Fahrzeug">&#10095;</button>
        </div>

        <div class="fuhrpark-pager-indikator">${aktuellerIndex + 1} / ${fahrzeuge.length}</div>

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

  // ---------- Verhalten ----------

  let fensterElement = null;

  function neuZeichnen() {
    const inhalt = fensterElement.querySelector(".win98-window-content");
    inhalt.innerHTML = renderInhalt();
    ereignisseBinden();
  }

  function vorheriges() {
    aktuellerIndex = (aktuellerIndex - 1 + fahrzeuge.length) % fahrzeuge.length;
    neuZeichnen();
  }

  function naechstes() {
    aktuellerIndex = (aktuellerIndex + 1) % fahrzeuge.length;
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
          naechstes();
        } else {
          vorheriges();
        }
      }
    });
  }

  function ereignisseBinden() {
    const btnLinks = fensterElement.querySelector("#fuhrpark-nav-links");
    const btnRechts = fensterElement.querySelector("#fuhrpark-nav-rechts");
    if (btnLinks) btnLinks.addEventListener("click", vorheriges);
    if (btnRechts) btnRechts.addEventListener("click", naechstes);

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
  }

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
