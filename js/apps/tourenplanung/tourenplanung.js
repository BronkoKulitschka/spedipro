// tourenplanung.js
// Aufbau des Fensters:
//   - oberes Drittel: Kartenansicht, zoombar und verschiebbar
//   - darunter: Dispositionsbereich, zeigt die gewählte Stadt und die
//     dort verfügbaren Waren
//
// Die Karte hat eine feste Höhe und darf sich durch nichts verkleinern -
// deshalb `flex: none` statt einer flexiblen Höhe. Der Bereich darunter
// scrollt bei Bedarf, die Karte bleibt davon unberührt.
//
// Stand: Grundgerüst. Aufträge, Fahrzeugzuweisung und Tourdurchführung
// folgen in den nächsten Schritten.

const TourenplanungApp = (function () {
  let fensterElement = null;
  let gewaehlteStadt = null;

  // Ansichtszustand der Karte
  let zoom = 1;
  let versatzX = 0;
  let versatzY = 0;

  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 4;

  // Ab diesen Zoomstufen werden Städtenamen eingeblendet: in der
  // vorletzten Stufe nur größere Städte und Frachtknoten, in der
  // höchsten alle. Bei weiter Ansicht wären 165 Namen unlesbar.
  const ZOOM_NAMEN_TEIL = 2.2;
  const ZOOM_NAMEN_ALLE = 3.2;

  // ---------- Aufbau ----------

  function renderInhalt() {
    return `
      <div class="tour-layout">
        <div class="tour-kartenbereich">
          <div class="tour-karte-rahmen" id="tour-karte-rahmen">
            <div class="tour-karte-buehne" id="tour-karte-buehne">
              <img class="tour-karte-bild" id="tour-karte-bild"
                   src="${Karte.BILD}" alt="Europakarte" draggable="false">
            </div>
            <!-- Marken und Namen liegen AUSSERHALB der gezoomten Bühne.
                 Sonst würden die Quadrate mitwachsen und der Text
                 unscharf werden. Ihre Bildschirmpositionen werden bei
                 jeder Ansichtsänderung neu berechnet. -->
            <div class="tour-karte-marken" id="tour-karte-marken"></div>
            <!-- Namen liegen bewusst AUSSERHALB der gezoomten Bühne:
                 Text in einer skalierten Ebene wird unscharf, weil er
                 auf Zwischenpixel fällt. Hier werden die Positionen
                 stattdessen bei jeder Ansichtsänderung neu berechnet. -->
            <div class="tour-karte-namen" id="tour-karte-namen"></div>
            <div class="tour-karte-tooltip hidden" id="tour-karte-tooltip"></div>
          </div>
          <div class="tour-karte-leiste">
            <button class="win98-button bevel-out" id="tour-zoom-minus">−</button>
            <button class="win98-button bevel-out" id="tour-zoom-plus">+</button>
            <button class="win98-button bevel-out" id="tour-zoom-reset">Ansicht zurücksetzen</button>
            <span class="tour-karte-hinweis" id="tour-karte-hinweis">
              ${Karte.alleStaedte().length} Städte
            </span>
          </div>
        </div>

        <div class="tour-disposition" id="tour-disposition">
          ${renderDisposition()}
        </div>
      </div>
    `;
  }

  function renderDisposition() {
    // Ohne Depot ist noch keine Disposition möglich - zuerst muss der
    // Heimatstandort feststehen.
    if (!Betrieb.hatDepot()) {
      return renderDepotwahl();
    }

    if (!gewaehlteStadt) {
      return `
        <div class="tour-dispo-leer">
          Stadt auf der Karte auswählen, um Angebot und Bedarf zu sehen.
        </div>
      `;
    }

    const s = gewaehlteStadt;
    const istDepot = Betrieb.depotName() === s.name;
    const angebot = Wirtschaft.angebot(s);
    const bedarf = Wirtschaft.bedarf(s);

    return `
      <div class="tour-dispo-kopf">
        <span class="tour-dispo-stadt">${s.name}</span>
        <span class="tour-dispo-land">${s.land}</span>
        ${s.knoten ? `<span class="tour-dispo-knoten">Frachtknoten</span>` : ""}
        ${istDepot ? `<span class="tour-dispo-depot">Depot</span>` : ""}
      </div>
      <div class="tour-dispo-info">
        ${Wirtschaft.regionName(s)}
        ${s.einw ? ` · ${s.einw.toLocaleString("de-DE")} Einwohner${s.einwQuelle === "1995" ? " (1995)" : ""}` : ""}
        ${
          Betrieb.hatDepot() && !istDepot
            ? ` · ${Karte.strassenEntfernung(Betrieb.depot(), s).toLocaleString("de-DE")} km ab Depot`
            : ""
        }
      </div>

      <div class="tour-warenblock">
        <div class="tour-warenspalte">
          <div class="tour-warentitel">Wird hier verladen (${angebot.length})</div>
          ${warenListe(angebot)}
        </div>
        <div class="tour-warenspalte">
          <div class="tour-warentitel">Wird hier gebraucht (${bedarf.length})</div>
          ${warenListe(bedarf)}
        </div>
      </div>

      ${
        !istDepot
          ? `<div class="tour-dispo-aktionen">
               <button class="win98-button bevel-out" id="tour-btn-depot-hierher">
                 🏠 Depot hierher verlegen
               </button>
             </div>`
          : ""
      }
    `;
  }

  function warenListe(waren) {
    if (waren.length === 0) {
      return `<div class="tour-ware-leer">keine</div>`;
    }
    return `
      <ul class="tour-warenliste">
        ${waren
          .map(
            (g) => `
              <li class="tour-ware" title="${aufbauText(g.aufbau)}, ${g.wertProTonne.toLocaleString("de-DE")} DM je Tonne">
                <span class="tour-ware-aufbau tour-aufbau-${g.aufbau}">${aufbauKurz(g.aufbau)}</span>
                <span class="tour-ware-name">${g.name}</span>
                ${g.verderblich ? `<span class="tour-ware-merkmal">Kühlung</span>` : ""}
                ${g.gefahrgut ? `<span class="tour-ware-merkmal tour-merkmal-gefahr">ADR</span>` : ""}
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  const AUFBAU_TEXT = {
    plane: "Planenauflieger",
    kuehl: "Kühlkoffer",
    tank: "Tankauflieger",
    silo: "Siloauflieger",
    kipper: "Kipper",
    schwer: "Schwerlast/Tieflader",
    container: "Containerchassis",
    autotransporter: "Autotransporter"
  };
  const AUFBAU_KURZ = {
    plane: "PL", kuehl: "KÜ", tank: "TA", silo: "SI",
    kipper: "KI", schwer: "SL", container: "CO", autotransporter: "AT"
  };
  function aufbauText(a) { return AUFBAU_TEXT[a] || a; }
  function aufbauKurz(a) { return AUFBAU_KURZ[a] || "??"; }

  /** Startbildschirm, solange kein Depot gewählt wurde. */
  function renderDepotwahl() {
    if (!gewaehlteStadt) {
      return `
        <div class="tour-depotwahl">
          <div class="tour-depotwahl-titel">Standort der Spedition wählen</div>
          <p>
            Zuerst braucht die Spedition ein Depot. Von dort starten die
            Touren, dort stehen die Fahrzeuge zwischen den Fahrten.
          </p>
          <p class="tour-depotwahl-hinweis">
            Eine Stadt auf der Karte antippen. Alle ${Karte.alleStaedte().length}
            Städte stehen zur Wahl - ein Frachtknoten an einem Hafen bietet
            mehr Ladung, liegt aber selten zentral.
          </p>
        </div>
      `;
    }

    const s = gewaehlteStadt;
    const angebot = Wirtschaft.angebot(s);
    return `
      <div class="tour-depotwahl">
        <div class="tour-dispo-kopf">
          <span class="tour-dispo-stadt">${s.name}</span>
          <span class="tour-dispo-land">${s.land}</span>
          ${s.knoten ? `<span class="tour-dispo-knoten">Frachtknoten</span>` : ""}
        </div>
        <div class="tour-dispo-info">
          ${Wirtschaft.regionName(s)}
          ${s.einw ? ` · ${s.einw.toLocaleString("de-DE")} Einwohner` : ""}
        </div>
        <div class="tour-depotwahl-vorschau">
          Vor Ort verladbar: ${angebot.map((g) => g.name).join(", ")}
        </div>
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" id="tour-btn-depot-waehlen">
            🏠 Hier Depot gründen
          </button>
        </div>
      </div>
    `;
  }

  // ---------- Karte: Marken und Ansicht ----------

  /**
   * Größenstufe einer Stadt nach Einwohnerzahl. Die Marken sollen auf
   * einen Blick zeigen, wo die großen Zentren liegen - ohne dass Namen
   * auf der Karte stehen.
   */
  function groessenstufe(stadt) {
    const ew = stadt.einw || 0;
    if (ew >= 1000000) return 4;
    if (ew >= 400000) return 3;
    if (ew >= 120000) return 2;
    return 1;
  }

  // Marken werden einmal erzeugt und danach nur noch verschoben. Ihre
  // Bildkoordinaten stehen fest, die Bildschirmposition folgt aus Zoom
  // und Versatz.
  let markenListe = [];

  function markenZeichnen() {
    const behaelter = fensterElement.querySelector("#tour-karte-marken");
    if (!behaelter) return;

    behaelter.innerHTML = Karte.alleStaedte()
      .map((stadt) => {
        const stufe = groessenstufe(stadt);
        const klassen = [
          "tour-marke",
          `tour-marke-s${stufe}`,
          stadt.knoten ? "tour-marke-knoten" : "",
          Betrieb.depotName() === stadt.name ? "tour-marke-depot" : "",
          gewaehlteStadt && gewaehlteStadt.name === stadt.name ? "tour-marke-gewaehlt" : ""
        ].filter(Boolean).join(" ");

        return `<span class="${klassen}" data-stadt="${stadt.name}"></span>`;
      })
      .join("");

    // Bildkoordinaten einmal vorberechnen, statt sie bei jedem
    // Verschieben neu aus den Geokoordinaten abzuleiten.
    markenListe = Array.from(behaelter.children).map((el) => {
      const stadt = STAEDTE[el.dataset.stadt];
      const p = Karte.nachBild(stadt.lon, stadt.lat);
      return { el, x: p.x, y: p.y };
    });

    markenPositionieren();
  }

  function markenPositionieren() {
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    if (!rahmen || markenListe.length === 0) return;

    const breite = rahmen.clientWidth;
    const hoehe = rahmen.clientHeight;
    const rand = 30;

    // Steht die Fenstergröße noch nicht fest (erster Aufbau), darf nicht
    // ausgeblendet werden - sonst gilt jede Marke als außerhalb und die
    // Karte bliebe leer.
    const kannAusblenden = breite > 0 && hoehe > 0;

    markenListe.forEach(({ el, x, y }) => {
      const sx = Math.round(x * zoom + versatzX);
      const sy = Math.round(y * zoom + versatzY);

      el.style.left = `${sx}px`;
      el.style.top = `${sy}px`;

      // Marken außerhalb des Fensters ausblenden - spart Darstellungs-
      // aufwand beim Verschieben.
      const draussen =
        sx < -rand || sx > breite + rand || sy < -rand || sy > hoehe + rand;
      el.style.display = kannAusblenden && draussen ? "none" : "";
    });
  }

  function ansichtAnwenden() {
    const buehne = fensterElement.querySelector("#tour-karte-buehne");
    if (!buehne) return;
    buehne.style.transform =
      `translate(${versatzX}px, ${versatzY}px) scale(${zoom})`;
    markenPositionieren();
    namenAktualisieren();
  }

  /**
   * Zeichnet die Städtenamen neu. Sie sitzen in einer eigenen, NICHT
   * skalierten Ebene - dadurch bleibt die Schrift in jeder Zoomstufe
   * gestochen scharf. Die Bildschirmposition wird aus Zoom und Versatz
   * berechnet und auf ganze Pixel gerundet, damit kein Text zwischen
   * zwei Pixeln landet.
   */
  function namenAktualisieren() {
    const ebene = fensterElement.querySelector("#tour-karte-namen");
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    if (!ebene || !rahmen) return;

    if (zoom < ZOOM_NAMEN_TEIL) {
      if (ebene.childElementCount) ebene.innerHTML = "";
      return;
    }

    const alleZeigen = zoom >= ZOOM_NAMEN_ALLE;
    const breite = rahmen.clientWidth;
    const hoehe = rahmen.clientHeight;
    const rand = 60; // etwas über den Rand hinaus, damit nichts abrupt erscheint

    const teile = [];
    Karte.alleStaedte().forEach((stadt) => {
      if (!alleZeigen && !stadt.knoten && groessenstufe(stadt) < 3) return;

      const p = Karte.nachBild(stadt.lon, stadt.lat);
      const x = Math.round(p.x * zoom + versatzX);
      const y = Math.round(p.y * zoom + versatzY);

      // Nur beschriften, was auch im Fenster liegt
      if (x < -rand || x > breite + rand || y < -rand || y > hoehe + rand) return;

      // Name unten rechts neben die Marke setzen, mit Abstand je nach
      // Markengröße - ohne Zentrierung, damit er auf ganzen Pixeln sitzt.
      const versatz = 4 + Math.round(groessenstufe(stadt) * 1.5);
      teile.push(
        `<span class="tour-stadtname" style="left:${x + versatz}px; top:${y + versatz}px">${stadt.name}</span>`
      );
    });

    ebene.innerHTML = teile.join("");
  }

  /** Verschiebung begrenzen, damit die Karte nicht aus dem Fenster wandert. */
  function versatzBegrenzen() {
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    if (!rahmen) return;

    const sichtbarB = rahmen.clientWidth;
    const sichtbarH = rahmen.clientHeight;
    const kartenB = Karte.BILD_BREITE * zoom;
    const kartenH = Karte.BILD_HOEHE * zoom;

    // Ist die Karte kleiner als das Fenster, mittig halten; sonst so
    // begrenzen, dass kein Rand über die Kante hinausrutscht.
    if (kartenB <= sichtbarB) {
      versatzX = (sichtbarB - kartenB) / 2;
    } else {
      versatzX = Math.min(0, Math.max(sichtbarB - kartenB, versatzX));
    }

    if (kartenH <= sichtbarH) {
      versatzY = (sichtbarH - kartenH) / 2;
    } else {
      versatzY = Math.min(0, Math.max(sichtbarH - kartenH, versatzY));
    }
  }

  function zoomAendern(faktor, mittelpunkt) {
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    if (!rahmen) return;

    const alt = zoom;
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * faktor));
    if (zoom === alt) return;

    // Um den angegebenen Punkt zoomen (sonst springt die Ansicht),
    // ohne Angabe um die Fenstermitte.
    const mx = mittelpunkt ? mittelpunkt.x : rahmen.clientWidth / 2;
    const my = mittelpunkt ? mittelpunkt.y : rahmen.clientHeight / 2;

    versatzX = mx - ((mx - versatzX) / alt) * zoom;
    versatzY = my - ((my - versatzY) / alt) * zoom;

    versatzBegrenzen();
    ansichtAnwenden();
  }

  function ansichtZuruecksetzen() {
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    if (!rahmen) return;

    // Startzoom so wählen, dass die Karte in der Breite hineinpasst.
    zoom = Math.min(1, rahmen.clientWidth / Karte.BILD_BREITE);
    zoom = Math.max(ZOOM_MIN, zoom);

    // Mitteleuropa in den Blick nehmen statt Nordskandinavien.
    const mitte = Karte.nachBild(9, 50);
    versatzX = rahmen.clientWidth / 2 - mitte.x * zoom;
    versatzY = rahmen.clientHeight / 2 - mitte.y * zoom;

    versatzBegrenzen();
    ansichtAnwenden();
  }

  // ---------- Auswahl ----------

  function stadtWaehlen(stadt) {
    gewaehlteStadt = stadt;
    dispositionAktualisieren();
    markenZeichnen();
  }

  function dispositionAktualisieren() {
    const dispo = fensterElement.querySelector("#tour-disposition");
    if (!dispo) return;
    dispo.innerHTML = renderDisposition();

    // Die Schaltflächen entstehen bei jedem Neuaufbau neu und müssen
    // deshalb jedes Mal verdrahtet werden.
    const gruenden = dispo.querySelector("#tour-btn-depot-waehlen");
    if (gruenden) {
      gruenden.addEventListener("click", () => {
        Betrieb.depotSetzen(gewaehlteStadt.name);
        dispositionAktualisieren();
        markenZeichnen();
      });
    }

    const verlegen = dispo.querySelector("#tour-btn-depot-hierher");
    if (verlegen) {
      verlegen.addEventListener("click", () => {
        const ziel = gewaehlteStadt.name;
        if (window.confirm(`Depot nach ${ziel} verlegen?`)) {
          Betrieb.depotSetzen(ziel);
          dispositionAktualisieren();
          markenZeichnen();
        }
      });
    }
  }

  function tooltipZeigen(text, x, y) {
    const t = fensterElement.querySelector("#tour-karte-tooltip");
    if (!t) return;
    t.textContent = text;
    t.style.left = `${x + 12}px`;
    t.style.top = `${y + 12}px`;
    t.classList.remove("hidden");
  }

  function tooltipVerbergen() {
    const t = fensterElement.querySelector("#tour-karte-tooltip");
    if (t) t.classList.add("hidden");
  }

  // ---------- Ereignisse ----------

  function ereignisseBinden() {
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
    const marken = fensterElement.querySelector("#tour-karte-marken");

    fensterElement.querySelector("#tour-zoom-plus")
      .addEventListener("click", () => zoomAendern(1.35));
    fensterElement.querySelector("#tour-zoom-minus")
      .addEventListener("click", () => zoomAendern(1 / 1.35));
    fensterElement.querySelector("#tour-zoom-reset")
      .addEventListener("click", ansichtZuruecksetzen);

    // --- Marken: Auswahl und Tooltip ---
    marken.addEventListener("click", (e) => {
      const marke = e.target.closest(".tour-marke");
      if (!marke) return;
      const stadt = STAEDTE[marke.dataset.stadt];
      if (stadt) stadtWaehlen(stadt);
    });

    marken.addEventListener("mouseover", (e) => {
      const marke = e.target.closest(".tour-marke");
      if (!marke) return;
      const stadt = STAEDTE[marke.dataset.stadt];
      if (!stadt) return;
      const r = rahmen.getBoundingClientRect();
      const zusatz = stadt.einw
        ? ` · ${stadt.einw.toLocaleString("de-DE")} Einw.`
        : "";
      tooltipZeigen(
        `${stadt.name} (${stadt.land})${zusatz}`,
        e.clientX - r.left,
        e.clientY - r.top
      );
    });

    marken.addEventListener("mouseout", (e) => {
      if (e.target.closest(".tour-marke")) tooltipVerbergen();
    });

    // Zustand der Fingergeste - wird weiter unten gesetzt, hier bereits
    // deklariert, weil die Maus-Handler ihn abfragen.
    let touchModus = "keine";

    // --- Verschieben mit Maus ---
    let ziehtGerade = false;
    let startX = 0, startY = 0, startVersatzX = 0, startVersatzY = 0;
    let bewegt = 0;

    rahmen.addEventListener("mousedown", (e) => {
      // Nach einer Berührung senden manche Browser zusätzlich
      // Maus-Ereignisse. Läuft gerade eine Fingergeste, ignorieren -
      // sonst verschieben beide Handler gleichzeitig.
      if (touchModus !== "keine") return;
      ziehtGerade = true;
      bewegt = 0;
      startX = e.clientX; startY = e.clientY;
      startVersatzX = versatzX; startVersatzY = versatzY;
      rahmen.classList.add("zieht");
    });

    document.addEventListener("mousemove", (e) => {
      if (!ziehtGerade) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      bewegt = Math.max(bewegt, Math.abs(dx) + Math.abs(dy));
      versatzX = startVersatzX + dx;
      versatzY = startVersatzY + dy;
      versatzBegrenzen();
      ansichtAnwenden();
    });

    document.addEventListener("mouseup", () => {
      ziehtGerade = false;
      rahmen.classList.remove("zieht");
    });

    // --- Zoom mit Mausrad ---
    rahmen.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = rahmen.getBoundingClientRect();
      zoomAendern(e.deltaY < 0 ? 1.2 : 1 / 1.2,
                  { x: e.clientX - r.left, y: e.clientY - r.top });
    }, { passive: false });

    // --- Touch: Verschieben mit einem Finger, Zoom mit zwei ---
    //
    // Wichtig ist der Wechsel zwischen beiden Modi: Wird beim Zoomen ein
    // Finger angehoben, greift wieder die Ein-Finger-Logik. Ohne
    // Neuberechnung des Startpunktes würde sie mit den Werten von VOR
    // dem Zoomen weiterrechnen - die Karte springt dann.
    // touchModus ist oben deklariert: "keine" | "ziehen" | "zoomen"
    let letzterAbstand = 0;
    let griffX = 0, griffY = 0;

    function ziehenStarten(touch) {
      touchModus = "ziehen";
      griffX = touch.clientX - versatzX;
      griffY = touch.clientY - versatzY;
    }

    function zoomenStarten(touches) {
      touchModus = "zoomen";
      letzterAbstand = fingerAbstand(touches);
    }

    rahmen.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        ziehenStarten(e.touches[0]);
      } else if (e.touches.length >= 2) {
        zoomenStarten(e.touches);
      }
    }, { passive: true });

    rahmen.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && touchModus === "ziehen") {
        e.preventDefault();
        versatzX = e.touches[0].clientX - griffX;
        versatzY = e.touches[0].clientY - griffY;
        versatzBegrenzen();
        ansichtAnwenden();
      } else if (e.touches.length >= 2) {
        e.preventDefault();
        // Zweiter Finger kam nachträglich dazu
        if (touchModus !== "zoomen") {
          zoomenStarten(e.touches);
          return;
        }
        const abstand = fingerAbstand(e.touches);
        if (letzterAbstand <= 0) {
          letzterAbstand = abstand;
          return;
        }
        const r = rahmen.getBoundingClientRect();
        const mitteX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        const mitteY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        zoomAendern(abstand / letzterAbstand, { x: mitteX, y: mitteY });
        letzterAbstand = abstand;
      }
    }, { passive: false });

    rahmen.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) {
        touchModus = "keine";
        letzterAbstand = 0;
      } else if (e.touches.length === 1) {
        // Von zwei auf einen Finger: Griffpunkt neu setzen, sonst
        // springt die Karte um die Differenz seit dem Zoombeginn.
        ziehenStarten(e.touches[0]);
        letzterAbstand = 0;
      } else {
        letzterAbstand = fingerAbstand(e.touches);
      }
    }, { passive: true });

    rahmen.addEventListener("touchcancel", () => {
      touchModus = "keine";
      letzterAbstand = 0;
    }, { passive: true });

    // Bei Fenstergrößenänderung Begrenzung neu anwenden
    window.addEventListener("resize", () => {
      if (fensterElement && document.body.contains(fensterElement)) {
        versatzBegrenzen();
        ansichtAnwenden();
      }
    });
  }

  function fingerAbstand(touches) {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  // ---------- Öffnen ----------

  function open() {
    const ergebnis = WindowManager.open({
      id: "tourenplanung",
      title: "Tourenplanung",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;

    if (ergebnis.wurdeNeuErstellt) {
      ereignisseBinden();
      markenZeichnen();
      dispositionAktualisieren();
      // Erst nach dem Einhängen ins Dokument steht die Fenstergröße fest.
      setTimeout(ansichtZuruecksetzen, 0);
    }
  }

  return { open };
})();

AppRegistry.register({
  id: "tourenplanung",
  name: "Tourenplanung",
  open: TourenplanungApp.open
});

document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-tourenplanung");
  if (icon) icon.addEventListener("click", () => TourenplanungApp.open());
});
