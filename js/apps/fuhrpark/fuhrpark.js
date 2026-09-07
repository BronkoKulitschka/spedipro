// fuhrpark.js
// Das Fuhrpark-Programm: reine Fahrzeug-Verwaltung und -Zustand.
// KEIN Kauf/Verkauf (-> Fahrzeughandel), KEINE Wartung (-> Werkstatt),
// KEINE Tourzuweisung (-> Tourenplanung). Diese Module liefern später
// echte Daten; bis dahin übernehmen die Debug-Buttons diese Rolle.

const FuhrparkApp = (function () {
  let fahrzeuge = [];
  let naechsteId = 1;

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
      verschleiss: { reifen: 100, bremsen: 100, motor: 100 }
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
        verschleiss: { reifen: 72, bremsen: 58, motor: 80 }
      }),
      neuesFahrzeugAusTyp("skanda-143m", {
        baujahr: 1993,
        kennzeichen: "F-SP 102",
        kmStand: 187000,
        standort: "Köln",
        verschleiss: { reifen: 90, bremsen: 85, motor: 91 }
      }),
      neuesFahrzeugAusTyp("iveko-turbostar", {
        baujahr: 1989,
        kennzeichen: "F-SP 103",
        kmStand: 455000,
        standort: "Mailand",
        status: "außer Betrieb",
        verschleiss: { reifen: 40, bremsen: 22, motor: 35 }
      }),
      neuesFahrzeugAusTyp("davo-95", {
        baujahr: 1995,
        kennzeichen: "F-SP 104",
        kmStand: 64000,
        standort: "Rotterdam",
        verschleiss: { reifen: 95, bremsen: 96, motor: 97 }
      })
    ];
  }

  // ---------- Darstellung ----------

  function zustandsKlasse(wert) {
    if (wert < 40) return "zustand-kritisch";
    if (wert < 70) return "zustand-warnung";
    return "zustand-gut";
  }

  function balken(label, wert) {
    return `
      <div class="verschleiss-zeile">
        <span class="verschleiss-label">${label}</span>
        <div class="verschleiss-balken-hintergrund">
          <div class="verschleiss-balken-fuellung ${zustandsKlasse(wert)}"
               style="width:${wert.toFixed(0)}%"></div>
        </div>
        <span class="verschleiss-wert">${wert.toFixed(0)}%</span>
      </div>
    `;
  }

  function fahrzeugKarte(fahrzeug) {
    const gesamt = Verschleiss.gesamtzustand(fahrzeug);
    return `
      <div class="fuhrpark-karte bevel-out" data-id="${fahrzeug.id}">
        <div class="fuhrpark-karte-kopf">
          <strong>${fahrzeug.marke} ${fahrzeug.modell}</strong>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-karte-info">
          Baujahr ${fahrzeug.baujahr} · ${fahrzeug.aufbautyp} ·
          ${fahrzeug.kmStand.toLocaleString("de-DE")} km · ${fahrzeug.standort}
          <br>Status: <em>${fahrzeug.status}</em> ·
          Verbrauch gesamt: ${fahrzeug.verbrauchGesamtL.toFixed(0)} l
        </div>

        <div class="fuhrpark-verschleiss">
          ${balken("Gesamtzustand", gesamt)}
          ${balken("Reifen", fahrzeug.verschleiss.reifen)}
          ${balken("Bremsen", fahrzeug.verschleiss.bremsen)}
          ${balken("Motor", fahrzeug.verschleiss.motor)}
        </div>

        <div class="fuhrpark-debug-leiste">
          <button class="win98-button bevel-out btn-tour-simulieren" data-id="${fahrzeug.id}">
            🎲 Tour simulieren
          </button>
          <select class="win98-button bevel-out select-teil-reparieren" data-id="${fahrzeug.id}">
            <option value="reifen">Reifen</option>
            <option value="bremsen">Bremsen</option>
            <option value="motor">Motor</option>
          </select>
          <button class="win98-button bevel-out btn-teil-reparieren" data-id="${fahrzeug.id}">
            🔧 Reparieren (Debug)
          </button>
        </div>
      </div>
    `;
  }

  function renderInhalt() {
    return `
      <div class="fuhrpark-liste">
        ${fahrzeuge.map(fahrzeugKarte).join("")}
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

  function ereignisseBinden() {
    fensterElement.querySelectorAll(".btn-tour-simulieren").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const fahrzeug = fahrzeuge.find((f) => f.id === id);
        const tour = Verschleiss.zufaelligeTour();
        Verschleiss.wendeTourAn(fahrzeug, tour);
        neuZeichnen();
      });
    });

    fensterElement.querySelectorAll(".btn-teil-reparieren").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const fahrzeug = fahrzeuge.find((f) => f.id === id);
        const select = fensterElement.querySelector(
          `.select-teil-reparieren[data-id="${id}"]`
        );
        Verschleiss.teilReparieren(fahrzeug, select.value);
        neuZeichnen();
      });
    });
  }

  function open() {
    if (fahrzeuge.length === 0) {
      seedFlotte();
    }

    fensterElement = WindowManager.open({
      title: "Fuhrpark",
      width: 480,
      height: 480,
      content: renderInhalt()
    });

    ereignisseBinden();
  }

  return { open };
})();

// ---------- Desktop-Icon verknüpfen ----------
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-fuhrpark");
  if (icon) {
    icon.addEventListener("dblclick", () => FuhrparkApp.open());
    icon.addEventListener("click", () => {
      // Einfacher Doppelklick-Ersatz für Touch/Desktop-Prototyp:
      // Einzelklick öffnet direkt, bis eine echte Icon-Auswahl-Logik existiert.
      FuhrparkApp.open();
    });
  }
});
