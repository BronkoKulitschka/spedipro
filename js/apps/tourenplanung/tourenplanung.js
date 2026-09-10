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

  // ---------- Ablauf der Tourenplanung ----------
  // Schrittfolge: Startstadt -> Fahrzeug -> Ladung -> Ziel -> Start.
  // Bewusst erst einmal nur A nach B.
  //
  // GEPLANT: Rundtouren mit mehreren Stopps. Dafür müsste `tour` statt
  // eines einzelnen Ziels eine Liste von Etappen führen, jede mit
  // eigener Ladung - der Ablauf bliebe im Kern derselbe.
  let tour = {
    schritt: "start",   // start | fahrzeug | ladung | ziel | bereit
    startStadt: null,
    fahrzeug: null,
    gut: null,
    menge: 0,
    zielStadt: null
  };

  // Wird eine Ware angetippt, sollen alle Städte aufleuchten, die sie
  // liefern können.
  let hervorgehobenesGut = null;

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
    if (!Betrieb.hatDepot()) return renderDepotwahl();
    return renderTourplanung();
  }

  // ================= Tourenplanung: Ablauf =================

  function renderTourplanung() {
    return `
      <div class="tour-ablauf">
        ${schrittleiste()}
        <div class="tour-schrittinhalt">${schrittInhalt()}</div>
      </div>
    `;
  }

  const SCHRITTE = [
    { id: "start",    nr: 1, titel: "Standort" },
    { id: "fahrzeug", nr: 2, titel: "Fahrzeug" },
    { id: "ladung",   nr: 3, titel: "Ladung" },
    { id: "ziel",     nr: 4, titel: "Ziel" },
    { id: "bereit",   nr: 5, titel: "Start" }
  ];

  function schrittleiste() {
    const aktuellNr = SCHRITTE.find((x) => x.id === tour.schritt).nr;
    return `
      <ol class="tour-schrittleiste">
        ${SCHRITTE.map((x) => `
          <li class="tour-schritt ${
            x.nr < aktuellNr ? "erledigt" : x.nr === aktuellNr ? "aktiv" : "offen"
          }" data-schritt="${x.id}">
            <span class="tour-schritt-nr">${x.nr}</span>${x.titel}
          </li>
        `).join("")}
      </ol>
    `;
  }

  function schrittInhalt() {
    switch (tour.schritt) {
      case "start": return schrittStart();
      case "fahrzeug": return schrittFahrzeug();
      case "ladung": return schrittLadung();
      case "ziel": return schrittZiel();
      case "bereit": return schrittBereit();
      default: return "";
    }
  }

  // ---------- 1. Standort mit Fahrzeugen ----------
  function schrittStart() {
    const staedteMitFahrzeugen = Karte.alleStaedte()
      .map((s) => ({ stadt: s, anzahl: FuhrparkApp.fahrzeugeAn(s.name).length }))
      .filter((x) => x.anzahl > 0)
      .sort((a, b) => b.anzahl - a.anzahl);

    if (staedteMitFahrzeugen.length === 0) {
      return `<div class="tour-dispo-leer">Kein Fahrzeug im Bestand. Im Fuhrpark eines beschaffen.</div>`;
    }

    const gewaehlt = gewaehlteStadt && FuhrparkApp.fahrzeugeAn(gewaehlteStadt.name).length > 0
      ? gewaehlteStadt : null;

    return `
      <p class="tour-anleitung">
        Stadt mit Fahrzeugen auswählen - auf der Karte oder aus der Liste.
        Diese Städte sind mit einem Fahrzeugsymbol markiert.
      </p>
      <ul class="tour-auswahlliste">
        ${staedteMitFahrzeugen.map(({ stadt, anzahl }) => `
          <li class="tour-auswahl ${gewaehlt && gewaehlt.name === stadt.name ? "gewaehlt" : ""}"
              data-startstadt="${stadt.name}">
            <span class="tour-auswahl-name">${stadt.name}</span>
            <span class="tour-auswahl-zusatz">${anzahl} Fahrzeug${anzahl > 1 ? "e" : ""}</span>
          </li>
        `).join("")}
      </ul>
      ${gewaehlt ? `
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" id="tour-btn-weiter-fahrzeug">
            Weiter mit ${gewaehlt.name} &#10095;
          </button>
        </div>` : ""}
    `;
  }

  // ---------- 2. Fahrzeug ----------
  function schrittFahrzeug() {
    const fahrzeuge = FuhrparkApp.fahrzeugeAn(tour.startStadt.name);

    return `
      <p class="tour-anleitung">Fahrzeug in ${tour.startStadt.name} auswählen.</p>
      <ul class="tour-auswahlliste">
        ${fahrzeuge.map((f) => {
          const gesamt = Verschleiss.gesamtzustand(f);
          const steht = f.status === "stillstehend";
          return `
            <li class="tour-auswahl ${tour.fahrzeug === f ? "gewaehlt" : ""} ${steht ? "gesperrt" : ""}"
                data-fahrzeug="${f.id}">
              <span class="tour-auswahl-name">${f.marke} ${f.modell}</span>
              <span class="tour-auswahl-zusatz">
                ${f.kennzeichen} · ${f.aufbautyp} · ${(f.zuladungKg / 1000).toFixed(1)} t ·
                Zustand ${gesamt.toFixed(0)}%${steht ? " · steht still" : ""}
              </span>
            </li>
          `;
        }).join("")}
      </ul>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="start">&#10094; Zurück</button>
        ${tour.fahrzeug ? `<button class="win98-button bevel-out" id="tour-btn-weiter-ladung">Weiter &#10095;</button>` : ""}
      </div>
    `;
  }

  // ---------- 3. Ladung ----------
  function schrittLadung() {
    const angebot = Wirtschaft.angebot(tour.startStadt);
    const passend = Ladung.passendeWaren(tour.fahrzeug, angebot);
    const ungeeignet = angebot.filter((g) => !passend.includes(g));

    return `
      <p class="tour-anleitung">
        Ladung in ${tour.startStadt.name} auswählen.
        ${tour.fahrzeug.marke} ${tour.fahrzeug.modell} (${tour.fahrzeug.aufbautyp}).
        Antippen zeigt Warendetails und hebt die Lieferstädte hervor.
      </p>
      ${passend.length === 0 ? `
        <div class="tour-dispo-leer">
          Dieses Fahrzeug kann keine der hier verladbaren Waren befördern.
          Ein anderer Aufbautyp wird gebraucht.
        </div>` : `
      <ul class="tour-auswahlliste">
        ${passend.map((g) => {
          const max = Ladung.maxMengeTonnen(tour.fahrzeug, g);
          const grenze = Ladung.begrenztDurch(tour.fahrzeug, g);
          return `
            <li class="tour-auswahl ${tour.gut === g ? "gewaehlt" : ""}" data-gut="${g.id}">
              <span class="tour-auswahl-name">
                <span class="tour-ware-aufbau tour-aufbau-${g.aufbau}">${aufbauKurz(g.aufbau)}</span>
                ${g.name}
              </span>
              <span class="tour-auswahl-zusatz">
                max. ${max.toFixed(1)} t (${grenze} begrenzt) ·
                ${g.wertProTonne.toLocaleString("de-DE")} DM/t
                ${g.verderblich ? " · Kühlung" : ""}${g.gefahrgut ? " · ADR" : ""}
              </span>
            </li>
          `;
        }).join("")}
      </ul>`}
      ${ungeeignet.length > 0 ? `
        <div class="tour-ungeeignet">
          Nicht ladbar mit diesem Aufbau: ${ungeeignet.map((g) => g.name).join(", ")}
        </div>` : ""}
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="fahrzeug">&#10094; Zurück</button>
        ${tour.gut ? `<button class="win98-button bevel-out" id="tour-btn-weiter-ziel">Weiter &#10095;</button>` : ""}
      </div>
    `;
  }

  // ---------- 4. Ziel ----------
  function schrittZiel() {
    // Nur Städte, die diese Ware auch brauchen - sonst gäbe es keinen
    // Empfänger und die Fahrt wäre sinnlos.
    const ziele = Karte.alleStaedte()
      .filter((s) => s.name !== tour.startStadt.name)
      .filter((s) => Wirtschaft.bedarf(s).some((g) => g.id === tour.gut.id))
      .map((s) => ({ stadt: s, km: Karte.strassenEntfernung(tour.startStadt, s) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 40);

    return `
      <p class="tour-anleitung">
        Zielort für ${tour.gut.name} auswählen. Angezeigt werden die
        nächstgelegenen Städte, die diese Ware brauchen - auf der Karte
        sind sie hervorgehoben.
      </p>
      <ul class="tour-auswahlliste">
        ${ziele.map(({ stadt, km }) => {
          const menge = Ladung.maxMengeTonnen(tour.fahrzeug, tour.gut);
          const erloes = Ladung.frachtpreis(tour.gut, menge, km);
          return `
            <li class="tour-auswahl ${tour.zielStadt && tour.zielStadt.name === stadt.name ? "gewaehlt" : ""}"
                data-ziel="${stadt.name}">
              <span class="tour-auswahl-name">${stadt.name}</span>
              <span class="tour-auswahl-zusatz">
                ${stadt.land} · ${km.toLocaleString("de-DE")} km ·
                ${erloes.toLocaleString("de-DE")} DM
              </span>
            </li>
          `;
        }).join("")}
      </ul>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="ladung">&#10094; Zurück</button>
        ${tour.zielStadt ? `<button class="win98-button bevel-out" id="tour-btn-weiter-bereit">Weiter &#10095;</button>` : ""}
      </div>
    `;
  }

  // ---------- 5. Zusammenfassung und Start ----------
  function schrittBereit() {
    const km = Karte.strassenEntfernung(tour.startStadt, tour.zielStadt);
    const menge = tour.menge || Ladung.maxMengeTonnen(tour.fahrzeug, tour.gut);
    const erloes = Ladung.frachtpreis(tour.gut, menge, km);
    const tage = Math.max(1, Math.ceil(km / 650));

    return `
      <div class="tour-zusammenfassung">
        <div class="tour-zusammenfassung-titel">
          ${tour.startStadt.name} &#10230; ${tour.zielStadt.name}
        </div>
        <dl class="fuhrpark-infoliste">
          <dt>Fahrzeug</dt><dd>${tour.fahrzeug.marke} ${tour.fahrzeug.modell} (${tour.fahrzeug.kennzeichen})</dd>
          <dt>Ladung</dt><dd>${menge.toFixed(1)} t ${tour.gut.name}</dd>
          <dt>Strecke</dt><dd>${km.toLocaleString("de-DE")} km</dd>
          <dt>Dauer</dt><dd>${tage} Tag${tage > 1 ? "e" : ""}</dd>
          <dt>Frachterlös</dt><dd>${erloes.toLocaleString("de-DE")} DM</dd>
        </dl>
      </div>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="ziel">&#10094; Zurück</button>
        <button class="win98-button bevel-out" id="tour-btn-tour-starten">🚚 Tour starten</button>
      </div>
    `;
  }

  const AUFBAU_TEXT = {
    plane: "Planenauflieger", kuehl: "Kühlkoffer", tank: "Tankauflieger",
    silo: "Siloauflieger", kipper: "Kipper", schwer: "Schwerlast/Tieflader",
    container: "Containerchassis", autotransporter: "Autotransporter"
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
        // Steht hier ein Fahrzeug?
        const fahrzeugeHier = FuhrparkApp.fahrzeugeAn(stadt.name);

        // Kann diese Stadt die gerade betrachtete Ware liefern bzw.
        // braucht sie sie? Im Zielschritt zählt der Bedarf, sonst das
        // Angebot.
        let hervorgehoben = "";
        if (hervorgehobenesGut) {
          const id = hervorgehobenesGut.id;
          if (tour.schritt === "ziel") {
            if (Wirtschaft.bedarf(stadt).some((g) => g.id === id)) hervorgehoben = "tour-marke-empfaenger";
          } else if (Wirtschaft.angebot(stadt).some((g) => g.id === id)) {
            hervorgehoben = "tour-marke-lieferant";
          }
        }

        const klassen = [
          "tour-marke",
          `tour-marke-s${stufe}`,
          stadt.knoten ? "tour-marke-knoten" : "",
          Betrieb.depotName() === stadt.name ? "tour-marke-depot" : "",
          hervorgehoben,
          gewaehlteStadt && gewaehlteStadt.name === stadt.name ? "tour-marke-gewaehlt" : ""
        ].filter(Boolean).join(" ");

        const fahrzeugMarke = fahrzeugeHier.length > 0
          ? `<span class="tour-fahrzeugmarke">${fahrzeugeHier.length > 1 ? fahrzeugeHier.length : ""}</span>`
          : "";

        return `<span class="${klassen}" data-stadt="${stadt.name}">${fahrzeugMarke}</span>`;
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
    dispositionEreignisse(dispo);
    markenZeichnen();
  }

  /** Die Inhalte werden bei jedem Schritt neu erzeugt und neu verdrahtet. */
  function dispositionEreignisse(dispo) {
    // ---- Depot ----
    const gruenden = dispo.querySelector("#tour-btn-depot-waehlen");
    if (gruenden) {
      gruenden.addEventListener("click", () => {
        Betrieb.depotSetzen(gewaehlteStadt.name);
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 1: Startstadt ----
    dispo.querySelectorAll("[data-startstadt]").forEach((el) => {
      el.addEventListener("click", () => {
        gewaehlteStadt = STAEDTE[el.dataset.startstadt];
        dispositionAktualisieren();
      });
    });
    const weiterFahrzeug = dispo.querySelector("#tour-btn-weiter-fahrzeug");
    if (weiterFahrzeug) {
      weiterFahrzeug.addEventListener("click", () => {
        tour.startStadt = gewaehlteStadt;
        tour.fahrzeug = null;
        tour.schritt = "fahrzeug";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 2: Fahrzeug ----
    dispo.querySelectorAll("[data-fahrzeug]").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("gesperrt")) return;
        const id = Number(el.dataset.fahrzeug);
        tour.fahrzeug = FuhrparkApp.alleFahrzeuge().find((f) => f.id === id) || null;
        tour.gut = null;
        dispositionAktualisieren();
      });
    });
    const weiterLadung = dispo.querySelector("#tour-btn-weiter-ladung");
    if (weiterLadung) {
      weiterLadung.addEventListener("click", () => {
        tour.schritt = "ladung";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 3: Ladung ----
    dispo.querySelectorAll("[data-gut]").forEach((el) => {
      el.addEventListener("click", () => {
        const gut = GUETER_NACH_ID[el.dataset.gut];
        tour.gut = gut;
        tour.zielStadt = null;
        // Angetippte Ware: Lieferstädte hervorheben und Infofenster
        hervorgehobenesGut = gut;
        gutFensterOeffnen(gut);
        dispositionAktualisieren();
      });
    });
    const weiterZiel = dispo.querySelector("#tour-btn-weiter-ziel");
    if (weiterZiel) {
      weiterZiel.addEventListener("click", () => {
        tour.schritt = "ziel";
        // Im Zielschritt sollen die Empfängerstädte leuchten
        hervorgehobenesGut = tour.gut;
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 4: Ziel ----
    dispo.querySelectorAll("[data-ziel]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.zielStadt = STAEDTE[el.dataset.ziel];
        gewaehlteStadt = tour.zielStadt;
        dispositionAktualisieren();
      });
    });
    const weiterBereit = dispo.querySelector("#tour-btn-weiter-bereit");
    if (weiterBereit) {
      weiterBereit.addEventListener("click", () => {
        tour.menge = Ladung.maxMengeTonnen(tour.fahrzeug, tour.gut);
        tour.schritt = "bereit";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 5: Start ----
    const starten = dispo.querySelector("#tour-btn-tour-starten");
    if (starten) starten.addEventListener("click", tourAusfuehren);

    // ---- Zurück-Schaltflächen ----
    dispo.querySelectorAll("[data-zurueck-schritt]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.zurueckSchritt;
        if (tour.schritt !== "ziel") hervorgehobenesGut = null;
        dispositionAktualisieren();
      });
    });

    // Schrittleiste: bereits erledigte Schritte direkt anspringen
    dispo.querySelectorAll(".tour-schritt.erledigt").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.schritt;
        dispositionAktualisieren();
      });
    });
  }

  /**
   * Führt die Tour aus. Nutzt dieselbe Verschleißrechnung wie die
   * Debug-Touren im Fuhrpark - nur mit echten Streckendaten statt
   * Zufallswerten.
   */
  function tourAusfuehren() {
    const f = tour.fahrzeug;
    const km = Karte.strassenEntfernung(tour.startStadt, tour.zielStadt);
    const tage = Math.max(1, Math.ceil(km / 650));
    const menge = tour.menge || Ladung.maxMengeTonnen(f, tour.gut);
    const erloes = Ladung.frachtpreis(tour.gut, menge, km);

    // Beladung in Prozent der Zuladung - geht in den Verschleiß ein
    const beladungProzent = Math.min(100, Math.round((menge * 1000 / f.zuladungKg) * 100));

    const tourdaten = {
      km,
      tage,
      // GEPLANT: Gelände und Straßenqualität aus dem Streckenverlauf
      // ableiten, sobald die Route über das Straßennetz berechnet wird.
      // Bis dahin Durchschnittswerte statt Zufall.
      gelaende: "huegelland",
      strassenqualitaet: "landstrasse",
      jahreszeit: jahreszeitJetzt(),
      beladungProzent,
      // GEPLANT: kommt aus dem Personal-Modul, sobald es Fahrer gibt.
      fahrverhaltenFaktor: 1.0
    };

    const ergebnis = Verschleiss.wendeTourAn(f, tourdaten);

    Historie.hinzufuegen(f, {
      art: "tour",
      text: `${tour.startStadt.name} → ${tour.zielStadt.name}: ` +
            `${menge.toFixed(1)} t ${tour.gut.name}, ${km.toLocaleString("de-DE")} km`,
      km,
      tage,
      erloes,
      daten: {
        von: tour.startStadt.name,
        nach: tour.zielStadt.name,
        gut: tour.gut.id,
        tonnen: menge,
        verbrauchL: Math.round(ergebnis.verbrauchL)
      }
    });

    // Fahrzeug steht jetzt am Ziel, Zeit ist vergangen
    f.standort = tour.zielStadt.name;
    Spielzeit.vorspulen(tage);

    // Ist unterwegs ein Bauteil unter die kritische Grenze gefallen?
    const schaden = Ausfall.pruefe(f);
    if (schaden) {
      Ausfall.ausloesen(f, schaden.teil, schaden.wert);
      Historie.hinzufuegen(f, {
        art: "schaden",
        text: `Liegengeblieben in ${f.standort}: ${schaden.teil} bei ${schaden.wert.toFixed(0)}%`,
        daten: { teil: schaden.teil, wert: schaden.wert }
      });
    }

    window.alert(
      `Tour abgeschlossen.\n\n` +
      `${tour.startStadt.name} → ${tour.zielStadt.name}\n` +
      `${menge.toFixed(1)} t ${tour.gut.name} · ${km.toLocaleString("de-DE")} km · ${tage} Tag(e)\n` +
      `Erlös: ${erloes.toLocaleString("de-DE")} DM\n` +
      `Verbrauch: ${Math.round(ergebnis.verbrauchL)} l` +
      (schaden ? `\n\nACHTUNG: Fahrzeug ist liegengeblieben.` : "")
    );

    // Zurück auf Anfang, das Fahrzeug steht nun am Zielort
    tour = { schritt: "start", startStadt: null, fahrzeug: null, gut: null, menge: 0, zielStadt: null };
    hervorgehobenesGut = null;
    gewaehlteStadt = STAEDTE[f.standort];
    dispositionAktualisieren();
    if (FuhrparkApp.aktualisieren) FuhrparkApp.aktualisieren();
  }

  /** Jahreszeit aus der Spielzeit ableiten. */
  function jahreszeitJetzt() {
    const monat = Spielzeit.heute().getMonth() + 1;
    if (monat <= 2 || monat === 12) return "winter";
    if (monat <= 5) return "fruehling";
    if (monat <= 8) return "sommer";
    return "herbst";
  }

  /** Warendetails in einem eigenen Fenster. */
  function gutFensterOeffnen(gut) {
    const lieferstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.angebot(s).some((g) => g.id === gut.id));
    const bedarfsstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.bedarf(s).some((g) => g.id === gut.id));

    const inhalt = `
      <div class="gut-fenster">
        <div class="gut-kopf">
          <span class="tour-ware-aufbau tour-aufbau-${gut.aufbau}">${aufbauKurz(gut.aufbau)}</span>
          <span class="gut-name">${gut.name}</span>
        </div>
        <dl class="fuhrpark-infoliste">
          <dt>Kategorie</dt><dd>${gut.kategorie}</dd>
          <dt>Aufbau</dt><dd>${aufbauText(gut.aufbau)}</dd>
          <dt>Schüttdichte</dt><dd>${gut.dichteKgProM3.toLocaleString("de-DE")} kg/m³</dd>
          <dt>Warenwert</dt><dd>${gut.wertProTonne.toLocaleString("de-DE")} DM je Tonne</dd>
          <dt>Besonderheit</dt><dd>${
            [gut.verderblich ? "kühlpflichtig" : null, gut.gefahrgut ? "Gefahrgut (ADR)" : null]
              .filter(Boolean).join(", ") || "keine"
          }</dd>
          <dt>Ladung je Auflieger</dt><dd>${
            Math.min(25, (Ladung.LADEVOLUMEN_M3 * gut.dichteKgProM3) / 1000).toFixed(1)
          } t bei 90 m³ und 25 t Zuladung</dd>
        </dl>

        <div class="fuhrpark-fristen-titel">Wird angeboten in ${lieferstaedte.length} Städten</div>
        <div class="gut-staedte">${lieferstaedte.map((s) => s.name).join(", ")}</div>

        <div class="fuhrpark-fristen-titel">Wird gebraucht in ${bedarfsstaedte.length} Städten</div>
        <div class="gut-staedte">${bedarfsstaedte.map((s) => s.name).join(", ")}</div>
      </div>
    `;

    const ergebnis = WindowManager.open({
      id: "gut-info",
      title: `Ware – ${gut.name}`,
      content: inhalt
    });
    if (!ergebnis.wurdeNeuErstellt) {
      ergebnis.element.querySelector(".win98-window-content").innerHTML = inhalt;
      ergebnis.element.querySelector(".win98-titlebar-title").textContent = `Ware – ${gut.name}`;
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
      if (!stadt) return;

      // Die Karte wirkt im Ablauf mit: im Zielschritt wählt ein Klick
      // das Ziel, im Startschritt die Ausgangsstadt.
      if (Betrieb.hatDepot() && tour.schritt === "ziel") {
        const brauchtEs = Wirtschaft.bedarf(stadt).some((g) => g.id === tour.gut.id);
        if (brauchtEs && stadt.name !== tour.startStadt.name) {
          tour.zielStadt = stadt;
        }
      }
      stadtWaehlen(stadt);
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
