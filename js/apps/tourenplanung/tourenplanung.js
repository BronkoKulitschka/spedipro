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

  // ---------- Aufbau ----------

  function renderInhalt() {
    return `
      <div class="tour-layout">
        <div class="tour-kartenbereich">
          <div class="tour-karte-rahmen" id="tour-karte-rahmen">
            <div class="tour-karte-buehne" id="tour-karte-buehne">
              <img class="tour-karte-bild" id="tour-karte-bild"
                   src="${Karte.BILD}" alt="Europakarte" draggable="false">
              <div class="tour-karte-marken" id="tour-karte-marken"></div>
            </div>
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
    if (!gewaehlteStadt) {
      return `
        <div class="tour-dispo-leer">
          Stadt auf der Karte auswählen, um verfügbare Waren zu sehen.
        </div>
      `;
    }

    const s = gewaehlteStadt;
    return `
      <div class="tour-dispo-kopf">
        <span class="tour-dispo-stadt">${s.name}</span>
        <span class="tour-dispo-land">${s.land}</span>
        ${s.knoten ? `<span class="tour-dispo-knoten">Frachtknoten</span>` : ""}
      </div>
      <div class="tour-dispo-info">
        ${s.einw1995 ? `${(s.einw1995 * 1000).toLocaleString("de-DE")} Einwohner (1995) · ` : ""}
        ${s.lat.toFixed(2)}° N, ${s.lon.toFixed(2)}° O
      </div>

      <div class="tour-dispo-platzhalter">
        <div class="tour-dispo-titel">Verfügbare Waren</div>
        <p>
          Hier erscheinen später die Frachtangebote dieser Stadt.
          Das Auftragssystem ist noch nicht gebaut.
        </p>
      </div>
    `;
  }

  // ---------- Karte: Marken und Ansicht ----------

  function markenZeichnen() {
    const behaelter = fensterElement.querySelector("#tour-karte-marken");
    if (!behaelter) return;

    behaelter.innerHTML = Karte.alleStaedte()
      .map((stadt) => {
        const p = Karte.nachBild(stadt.lon, stadt.lat);
        const klasse = stadt.knoten ? "tour-marke tour-marke-knoten" : "tour-marke";
        const gewaehlt = gewaehlteStadt && gewaehlteStadt.name === stadt.name
          ? " tour-marke-gewaehlt" : "";
        return `<span class="${klasse}${gewaehlt}"
                      style="left:${p.x}px; top:${p.y}px"
                      data-stadt="${stadt.name}"></span>`;
      })
      .join("");
  }

  function ansichtAnwenden() {
    const buehne = fensterElement.querySelector("#tour-karte-buehne");
    if (!buehne) return;
    buehne.style.transform =
      `translate(${versatzX}px, ${versatzY}px) scale(${zoom})`;
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
    const dispo = fensterElement.querySelector("#tour-disposition");
    if (dispo) dispo.innerHTML = renderDisposition();
    markenZeichnen();
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
      const r = rahmen.getBoundingClientRect();
      tooltipZeigen(marke.dataset.stadt, e.clientX - r.left, e.clientY - r.top);
    });

    marken.addEventListener("mouseout", (e) => {
      if (e.target.closest(".tour-marke")) tooltipVerbergen();
    });

    // --- Verschieben mit Maus ---
    let ziehtGerade = false;
    let startX = 0, startY = 0, startVersatzX = 0, startVersatzY = 0;
    let bewegt = 0;

    rahmen.addEventListener("mousedown", (e) => {
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
    let letzterAbstand = null;
    let touchStartX = 0, touchStartY = 0;

    rahmen.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX - versatzX;
        touchStartY = e.touches[0].clientY - versatzY;
      } else if (e.touches.length === 2) {
        letzterAbstand = fingerAbstand(e.touches);
      }
    }, { passive: true });

    rahmen.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        versatzX = e.touches[0].clientX - touchStartX;
        versatzY = e.touches[0].clientY - touchStartY;
        versatzBegrenzen();
        ansichtAnwenden();
      } else if (e.touches.length === 2 && letzterAbstand) {
        e.preventDefault();
        const abstand = fingerAbstand(e.touches);
        const r = rahmen.getBoundingClientRect();
        const mitteX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        const mitteY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        zoomAendern(abstand / letzterAbstand, { x: mitteX, y: mitteY });
        letzterAbstand = abstand;
      }
    }, { passive: false });

    rahmen.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) letzterAbstand = null;
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
