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
  // Im Bild angeklicktes Bauteil - Ziel der Reparatur.
  let gewaehltesTeil = null;

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
      neupreisDM: typ.neupreisDM,
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

  /** Die Startflotte wird sonst erst beim Öffnen des Fuhrparks angelegt -
      die Tourenplanung braucht sie aber auch ohne das. */
  function flotteSicherstellen() {
    if (fahrzeuge.length === 0) seedFlotte();
  }

  function seedFlotte() {
    // Die Spedition startet mit einem einzigen Fahrzeug. Alles Weitere
    // muss erwirtschaftet werden - das ist der Reiz des Aufbaus.
    fahrzeuge = [
      neuesFahrzeugAusTyp("meridian-1830s", {
        baujahr: 1988,
        kennzeichen: "F-SP 101",
        kmStand: 412000,
        standort: (typeof Betrieb !== "undefined" && Betrieb.hatDepot())
          ? Betrieb.depotName()
          : "Frankfurt am Main",
        lackierung: "rot",
        // Gebraucht gekauft, entsprechend abgenutzt - aber fahrbereit
        verschleiss: { reifen: 64, bremsen: 58, motor: 71, antrieb: 66, karosserie: 74 }
      })
    ];

    // Jedes Startfahrzeug bekommt eine plausible Prüf-Vorgeschichte.
    fahrzeuge.forEach((f) => {
      Fristen.initialisiere(f);
      Historie.hinzufuegen(f, {
        art: "kauf",
        text: `Übernommen in den Fuhrpark (Bj. ${f.baujahr})`
      });
    });
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
      linie.setAttribute(
        "class",
        gewaehltesTeil === teil ? "callout-linie callout-linie-gewaehlt" : "callout-linie"
      );
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
        <div class="fuhrpark-callout${gewaehltesTeil === teil ? " callout-gewaehlt" : ""}"
             data-teil="${teil}" role="button" tabindex="0"
             title="${TEIL_LABEL[teil]} auswählen"
             style="left:${lx}%; top:${ly}%;">
          <span class="fuhrpark-callout-label">${TEIL_LABEL[teil]}</span>
          <span class="fuhrpark-callout-wert ${zustandsKlasse(wert)}">${wert.toFixed(0)}%</span>
        </div>
      `);

      // Blinkende Markierung am Linienende - zeigt, welches Bauteil am
      // Fahrzeug gemeint ist. Bewusst als HTML-Element statt im SVG:
      // Das SVG nutzt preserveAspectRatio="none", darin würde ein Kreis
      // je nach Fenstergröße zur Ellipse verzerrt.
      if (gewaehltesTeil === teil) {
        const [ax, ay] = layout.anker;
        boxen.push(
          `<span class="fuhrpark-anker-blink" style="left:${ax}%; top:${ay}%;"></span>`
        );
      }
    });

    return boxen.join("");
  }

  // ---------- Debug: Fahrzeuge beschaffen ----------
  // Platzhalter, bis das Fahrzeughandel-Modul existiert. Dient nur dazu,
  // die Übersichtsliste zum Testen zu füllen.

  // Standorte MÜSSEN Schlüssel aus STAEDTE sein - sonst kann die
  // Tourenplanung die Fahrzeuge keiner Stadt zuordnen.
  const STANDORTE = [
    "Frankfurt am Main", "Köln", "Hamburg", "München", "Rotterdam",
    "Milano", "Lyon", "Wien", "Praha", "Antwerpen"
  ];

  // Fortlaufende Kennzeichen im Stil der Testflotte (F-SP 1xx).

  function naechstesKennzeichen() {
    // Höchste vergebene Nummer aus der bestehenden Flotte ermitteln,
    // damit neue Kennzeichen nicht mit denen der Startflotte kollidieren.
    const hoechste = fahrzeuge.reduce((max, f) => {
      const treffer = /F-SP (\d+)/.exec(f.kennzeichen);
      return treffer ? Math.max(max, Number(treffer[1])) : max;
    }, 100);
    return `F-SP ${hoechste + 1}`;
  }

  function zufaelligAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  /**
   * Wo ein neu beschafftes Fahrzeug steht.
   *
   * Immer am Depot. Ist noch keines gegründet, kommt es dorthin, wo
   * bereits Fahrzeuge stehen - ein zufälliger Ort wäre für den Spieler
   * nicht nachvollziehbar und sah aus wie ein Fehler.
   */
  function beschaffungsstandort() {
    if (typeof Betrieb !== "undefined" && Betrieb.hatDepot()) {
      return Betrieb.depotName();
    }
    const vorhandenes = fahrzeuge.find((f) => f.standort);
    return vorhandenes ? vorhandenes.standort : "Frankfurt am Main";
  }

  function zufaelligerTyp() {
    return zufaelligAus(FAHRZEUGTYPEN);
  }

  function neuesFahrzeugKaufen() {
    const typ = zufaelligerTyp();
    // Neufahrzeug: jüngstes Baujahr der Baureihe, 0 km, alles auf 100%.
    const fahrzeug = neuesFahrzeugAusTyp(typ.typId, {
      baujahr: typ.baujahrBis,
      kennzeichen: naechstesKennzeichen(),
      kmStand: 0,
      standort: beschaffungsstandort(),
      lackierung: Lackierung.zufaelligeFarbe(),
      verschleiss: { reifen: 100, bremsen: 100, motor: 100, antrieb: 100, karosserie: 100 }
    });
    Fristen.initialisiere(fahrzeug, { neuwagen: true });
    Historie.hinzufuegen(fahrzeug, {
      art: "kauf",
      text: `Neufahrzeug übernommen (${typ.marke} ${typ.modell})`,
      kosten: typ.neupreisDM
    });
    fahrzeuge.push(fahrzeug);
    return fahrzeug;
  }

  function gebrauchtesFahrzeugKaufen() {
    const typ = zufaelligerTyp();

    // Baujahr irgendwo in der Bauzeit, Laufleistung grob passend dazu:
    // historisch realistisch sind ~80.000-130.000 km im Jahr für einen
    // Fernverkehrs-Sattelzug.
    const baujahr =
      typ.baujahrVon + Math.floor(Math.random() * (typ.baujahrBis - typ.baujahrVon + 1));
    const alterJahre = Math.max(1, typ.baujahrBis - baujahr + 1);
    const kmProJahr = 80000 + Math.random() * 50000;
    const kmStand = Math.round(alterJahre * kmProJahr);

    // Verschleiß passend zur Laufleistung herleiten, statt frei zu
    // würfeln - sonst gäbe es 400.000-km-Fahrzeuge mit Neuzustand.
    //
    // Wichtig: Kurzlebige Teile (Reifen, Bremsen) wurden im Laufe des
    // Fahrzeuglebens längst mehrfach ersetzt - ein Gebrauchter mit
    // 300.000 km fährt nicht auf der Erstbereifung. Für diese Teile
    // zählt daher nur die Laufleistung SEIT dem letzten Wechsel.
    // Langlebige Teile (Motor, Antrieb, Karosserie) altern dagegen über
    // die gesamte Laufleistung mit.
    const verschleiss = {};
    Verschleiss.TEILE.forEach((teil) => {
      const lebensdauer = Verschleiss.LEBENSDAUER_KM[teil];
      let massgeblicheKm = kmStand;

      if (kmStand > lebensdauer * 0.9) {
        // Teil muss zwischenzeitlich ersetzt worden sein - seitdem ist
        // irgendein Teil seiner Lebensdauer vergangen.
        massgeblicheKm = Math.random() * lebensdauer * 0.9;
      }

      const erwartet = Verschleiss.erwarteterZustand(teil, massgeblicheKm);
      const streuung = 0.85 + Math.random() * 0.3; // 85-115% (Pflege des Vorbesitzers)
      verschleiss[teil] = Math.max(5, Math.min(100, erwartet * streuung));
    });

    const fahrzeug = neuesFahrzeugAusTyp(typ.typId, {
      baujahr,
      kennzeichen: naechstesKennzeichen(),
      kmStand,
      standort: beschaffungsstandort(),
      lackierung: Lackierung.zufaelligeFarbe(),
      verschleiss
    });
    Fristen.initialisiere(fahrzeug);
    Historie.hinzufuegen(fahrzeug, {
      art: "kauf",
      text: `Gebrauchtfahrzeug übernommen (Bj. ${baujahr}, ${kmStand.toLocaleString("de-DE")} km)`,
      kosten: restwert(fahrzeug)
    });
    fahrzeuge.push(fahrzeug);
    return fahrzeug;
  }

  /**
   * Grobe Restwertschätzung in DM.
   *
   * GEPLANT: Wandert später ins Fahrzeughandel-Modul - dort dann mit
   * Marktschwankungen, Verhandlung und Händlerspanne. Hier bewusst
   * simpel gehalten, damit der Debug-Verkauf einen plausiblen Betrag
   * nennen kann.
   *
   * Faktoren: Alter (Nutzfahrzeuge verlieren in den ersten Jahren
   * kräftig), Laufleistung und der technische Zustand.
   */
  function restwert(fahrzeug) {
    const bezugsjahr = 1996; // solange es keine Spielzeit im gameState gibt
    const alter = Math.max(0, bezugsjahr - fahrzeug.baujahr);

    // Wertverlust ca. 15% pro Jahr, aber nie unter 15% Restwert.
    const altersfaktor = Math.max(0.15, Math.pow(0.85, alter));

    // Laufleistung: bis ~1 Mio km linear bis auf 30% herunter.
    const kmFaktor = Math.max(0.3, 1 - fahrzeug.kmStand / 1000000);

    // Zustand wirkt direkt mit (halbes Gewicht, damit ein schlechter
    // Zustand den Wert drückt, aber nicht auf null zieht).
    const zustand = Verschleiss.gesamtzustand(fahrzeug) / 100;
    const zustandsfaktor = 0.5 + zustand * 0.5;

    return Math.round(
      (fahrzeug.neupreisDM || 150000) * altersfaktor * kmFaktor * zustandsfaktor
    );
  }

  function fahrzeugVerkaufen(index) {
    fahrzeuge.splice(index, 1);
    if (aktuellerIndex >= fahrzeuge.length) {
      aktuellerIndex = Math.max(0, fahrzeuge.length - 1);
    }
    ansicht = "uebersicht"; // verkauftes Fahrzeug kann nicht mehr angezeigt werden
    neuZeichnen();
  }

  function miniaturQuelle(fahrzeug) {
    const hue = Lackierung.hueVonName(fahrzeug.lackierung);
    return hue === undefined ? Lackierung.QUELLE : Lackierung.miniatur(hue);
  }

  function uebersichtZeile(fahrzeug, index) {
    const gesamt = Verschleiss.gesamtzustand(fahrzeug);
    const fristStatus = Fristen.schlimmsterStatus(fahrzeug);

    // Nur auffällige Fristen anzeigen - "alles in Ordnung" muss nicht
    // in jeder Zeile stehen und würde die Liste unruhig machen.
    const fristHinweis =
      fristStatus === "ok"
        ? ""
        : `<span class="fuhrpark-frist-marke frist-${fristStatus}">${
            fristStatus === "ueberfaellig" ? "Frist überfällig" : "Frist bald fällig"
          }</span>`;

    // Ein stehendes Fahrzeug ist die dringlichste Meldung - dann sind
    // Fristen und Auslastung zweitrangig.
    const unterwegs = typeof Fahrt !== "undefined" ? Fahrt.fuerFahrzeug(fahrzeug.id) : null;
    const tourHinweis = unterwegs
      ? `<span class="fuhrpark-frist-marke marke-unterwegs" data-tourkarte="${fahrzeug.id}">
           🚛 Auf Tour: ${unterwegs.vonName} → ${unterwegs.nachName}
           (${Math.round(Fahrt.fortschritt(unterwegs) * 100)} %)
         </span>`
      : "";

    const stillstandHinweis = Ausfall.istStillstehend(fahrzeug)
      ? `<span class="fuhrpark-frist-marke marke-stillstand">⛔ Steht: ${
          TEIL_LABEL[fahrzeug.ausfall.teil]
        } defekt</span>`
      : "";

    // Auslastung nur melden, wenn sie auffällig ist - "normal" muss
    // nicht in jeder Zeile stehen.
    const a = Auslastung.berechne(fahrzeug);
    const auslastungHinweis =
      a.bewertung === "unterauslastung" || a.bewertung === "ueberlastung"
        ? `<span class="fuhrpark-frist-marke auslastung-marke-${a.bewertung}">${
            a.text
          } (${a.prozent.toFixed(0)}%)</span>`
        : "";

    return `
      <li class="fuhrpark-uebersicht-eintrag bevel-out" data-index="${index}">
        <img class="fuhrpark-uebersicht-mini" src="${miniaturQuelle(fahrzeug)}" alt="">
        <div class="fuhrpark-uebersicht-text">
          <div class="fuhrpark-uebersicht-kopf">
            <span class="fuhrpark-uebersicht-name">${fahrzeug.marke} ${fahrzeug.modell}</span>
            <span class="fuhrpark-uebersicht-kennzeichen">${fahrzeug.kennzeichen}</span>
          </div>
          <div class="fuhrpark-uebersicht-meta">
            ${fahrzeug.baujahr} · ${fahrzeug.aufbautyp} ·
            ${fahrzeug.kmStand.toLocaleString("de-DE")} km · ${fahrzeug.standort} ·
            ${fahrzeug.status}
          </div>
          ${tourHinweis}
          ${stillstandHinweis}
          ${fristHinweis}
          ${auslastungHinweis}
          <div class="fuhrpark-uebersicht-zustand">
            <div class="fuhrpark-gesamtbalken-hintergrund">
              <div class="fuhrpark-gesamtbalken-fuellung ${zustandsKlasse(gesamt)}"
                   style="width:${gesamt.toFixed(0)}%"></div>
            </div>
            <span class="fuhrpark-gesamtbalken-wert">${gesamt.toFixed(0)}%</span>
          </div>
        </div>
      </li>
    `;
  }

  function renderUebersicht() {
    const anzahlKritisch = fahrzeuge.filter(
      (f) => Verschleiss.gesamtzustand(f) < 40
    ).length;
    const anzahlFristen = fahrzeuge.filter(
      (f) => Fristen.schlimmsterStatus(f) !== "ok"
    ).length;

    const hinweise = [];
    const anzahlStillstand = fahrzeuge.filter((f) => Ausfall.istStillstehend(f)).length;
    if (anzahlStillstand > 0) hinweise.push(`${anzahlStillstand} steht`);
    if (anzahlKritisch > 0) hinweise.push(`${anzahlKritisch} kritisch`);
    if (anzahlFristen > 0) hinweise.push(`${anzahlFristen} mit Frist`);

    const flotte = Auslastung.flotte(fahrzeuge);
    if (flotte.unterausgelastet > 0) hinweise.push(`${flotte.unterausgelastet} unterausgelastet`);

    return `
      <div class="fuhrpark-uebersicht">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">Fuhrpark</span>
          <span class="fuhrpark-uebersicht-zaehler">${fahrzeuge.length} Fahrzeuge${
            hinweise.length > 0 ? ` · ${hinweise.join(" · ")}` : ""
          }</span>
        </div>

        <div class="fuhrpark-datumszeile">
          ${Spielzeit.formatiereLang(Spielzeit.heute())}
          ${
            flotte.bewertbareAnzahl > 0
              ? ` · Flottenauslastung ${flotte.prozent.toFixed(0)}%`
              : ""
          }
        </div>

        <ul class="fuhrpark-uebersicht-liste">
          ${
            fahrzeuge.length === 0
              ? `<li class="fuhrpark-uebersicht-leer">Keine Fahrzeuge im Fuhrpark.</li>`
              : fahrzeuge.map(uebersichtZeile).join("")
          }
        </ul>

        <div class="fuhrpark-debug-leiste">
          <!-- GEPLANT: Ersetzt durch das Fahrzeughandel-Modul, sobald es
               existiert. Bis dahin nur zum Füllen der Liste.
               Das Vorspulen der Zeit übernimmt später die Tourenplanung. -->
          <button class="win98-button bevel-out" id="fuhrpark-btn-kauf-neu">🚚 Neufahrzeug</button>
          <button class="win98-button bevel-out" id="fuhrpark-btn-kauf-gebraucht">🔑 Gebrauchtfahrzeug</button>
          <button class="win98-button bevel-out" id="fuhrpark-btn-flotte-leeren">🗑 Leeren</button>
          <button class="win98-button bevel-out" id="fuhrpark-btn-zeit-woche">📅 +1 Woche</button>
          <button class="win98-button bevel-out" id="fuhrpark-btn-zeit-monat">📅 +1 Monat</button>
        </div>
      </div>
    `;
  }

  function bildQuelle(fahrzeug) {
    const hue = Lackierung.hueVonName(fahrzeug.lackierung);
    // Ohne bekannte Farbe oder solange das Sprite noch nicht geladen ist,
    // liefert umfaerben() automatisch das Originalbild zurück.
    return hue === undefined ? Lackierung.QUELLE : Lackierung.umfaerben(hue);
  }

  function fristenBlock(fahrzeug) {
    const zeilen = Fristen.alle(fahrzeug)
      .map(
        (f) => `
          <li class="fuhrpark-frist frist-${f.status}">
            <span class="fuhrpark-frist-ampel"></span>
            <span class="fuhrpark-frist-label">${f.label}</span>
            <span class="fuhrpark-frist-text">${f.text}</span>
          </li>
        `
      )
      .join("");

    return `
      <div class="fuhrpark-fristen">
        <div class="fuhrpark-fristen-titel">Termine &amp; Fristen</div>
        <ul class="fuhrpark-fristen-liste">${zeilen}</ul>
      </div>
    `;
  }

  /** Auslastung in einem eigenen Fenster. */
  function auslastungFensterOeffnen(fahrzeug) {
    const a = Auslastung.berechne(fahrzeug);
    const breite = Math.min(100, a.prozent);

    // Tour-Einträge des Zeitraums für die Aufschlüsselung
    const touren = Historie.seitTagen(fahrzeug, Auslastung.ZEITRAUM_TAGE)
      .filter((e) => e.art === "tour")
      .reverse();

    const tourZeilen =
      touren.length === 0
        ? `<li class="fuhrpark-historie-leer">Keine Touren im Zeitraum.</li>`
        : touren
            .map(
              (t) => `
                <li class="fuhrpark-historie-eintrag">
                  <span class="fuhrpark-historie-datum">${Spielzeit.formatiere(new Date(t.datum))}</span>
                  <span class="fuhrpark-historie-kmstand">${(t.km || 0).toLocaleString("de-DE")} km</span>
                  <span class="fuhrpark-historie-kmstand">${t.tage || 0} Tage</span>
                  <span class="fuhrpark-historie-text">${t.text}</span>
                </li>
              `
            )
            .join("");

    const inhalt = `
      <div class="fuhrpark-historie-fenster">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-datumszeile">
          Auslastung der letzten ${Auslastung.ZEITRAUM_TAGE} Tage
        </div>
        <div class="fuhrpark-blaetter-zeile">
          <button class="win98-button bevel-out fuhrpark-zurueck" data-zurueck-zum-fahrzeug>
            &#10094; Zurück zum Fahrzeug
          </button>
        </div>

        <div class="fuhrpark-auslastung">
          <div class="fuhrpark-gesamtbalken">
            <span class="fuhrpark-gesamtbalken-label">${a.text}</span>
            <div class="fuhrpark-gesamtbalken-hintergrund">
              <div class="fuhrpark-gesamtbalken-fuellung auslastung-${a.bewertung}"
                   style="width:${breite.toFixed(0)}%"></div>
            </div>
            <span class="fuhrpark-gesamtbalken-wert">${a.prozent.toFixed(0)}%</span>
          </div>
          <dl class="fuhrpark-infoliste">
            <dt>Touren</dt><dd>${a.touren}</dd>
            <dt>Einsatztage</dt><dd>${a.einsatztage} von ${a.verfuegbareTage} möglichen</dd>
            <dt>Gefahrene km</dt><dd>${a.km.toLocaleString("de-DE")} km</dd>
            <dt>Durchschnitt</dt><dd>${
              a.kmProEinsatztag > 0
                ? Math.round(a.kmProEinsatztag).toLocaleString("de-DE") + " km je Einsatztag"
                : "–"
            }</dd>
          </dl>
          <div class="fuhrpark-auslastung-details">
            100 % entspricht dem Einsatz an allen realistisch erreichbaren
            Tagen (5 von 7 - Wochenenden, Sonntagsfahrverbot, Werkstattzeiten).
          </div>
        </div>

        <div class="fuhrpark-fristen-titel" style="margin-top:6px">Touren im Zeitraum</div>
        <ul class="fuhrpark-historie-vollliste">${tourZeilen}</ul>
      </div>
    `;

    fensterAktualisieren("fuhrpark-auslastung", `Auslastung – ${fahrzeug.kennzeichen}`, inhalt);
  }

  /**
   * Öffnet ein Nebenfenster oder aktualisiert es, falls es bereits mit
   * einem anderen Fahrzeug offen ist (WindowManager holt es dann nur
   * nach vorne, ohne den Inhalt zu tauschen).
   */
  function fensterAktualisieren(id, titel, inhalt) {
    const ergebnis = WindowManager.open({ id, title: titel, content: inhalt });
    if (!ergebnis.wurdeNeuErstellt) {
      ergebnis.element.querySelector(".win98-window-content").innerHTML = inhalt;
      ergebnis.element.querySelector(".win98-titlebar-title").textContent = titel;
    }

    // Der Inhalt wird bei jedem Aufruf neu gesetzt, also muss auch der
    // Zurück-Button jedes Mal neu verdrahtet werden.
    const zurueck = ergebnis.element.querySelector("[data-zurueck-zum-fahrzeug]");
    if (zurueck) {
      zurueck.addEventListener("click", () => {
        // Nebenfenster schließen und zurück zum Fuhrpark. Das Fenster
        // bleibt nicht als Karteileiche in der Taskleiste zurück.
        WindowManager.schliessen(id);
        FuhrparkApp.open();
      });
    }

    // Debug-Schaltflächen im Fristenfenster
    ergebnis.element.querySelectorAll("[data-frist-erledigen]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const fahrzeug = fahrzeuge[aktuellerIndex];
        const art = btn.dataset.fristErledigen;

        Fristen.erledigen(fahrzeug, art);
        Historie.hinzufuegen(fahrzeug, {
          art: art === "wartung" ? "wartung" : "pruefung",
          text: `${Fristen.ARTEN[art].label} durchgeführt`,
          daten: { fristart: art }
        });

        // Fenster mit den neuen Werten neu aufbauen, und die
        // Detailansicht dahinter ebenfalls auffrischen.
        fristenFensterOeffnen(fahrzeug);
        if (ansicht === "detail") neuZeichnen();
      });
    });
  }

  /**
   * Fristen im Detail, in einem eigenen Fenster.
   *
   * GEPLANT: Aus diesem Fenster wird später der Werkstatt-Zugang. Statt
   * die Frist per Debug-Schaltfläche zurückzusetzen, wird dann ein
   * Termin vereinbart oder die Prüfung intern durchgeführt - je nachdem,
   * ob eine eigene Werkstatt vorhanden ist (siehe Notiz an der
   * Debug-Leiste in der Detailansicht). Auch das Nichtbestehen einer
   * Prüfung gehört dann hierher (siehe Notiz in js/core/fristen.js).
   */
  function fristenFensterOeffnen(fahrzeug) {
    const zeilen = Fristen.alle(fahrzeug)
      .map((f) => {
        const definition = Fristen.ARTEN[f.art];
        const intervall =
          definition.typ === "datum"
            ? `alle ${definition.intervallMonate} Monate`
            : `alle ${definition.intervallKm.toLocaleString("de-DE")} km`;

        const letzte = fahrzeug.fristen?.[f.art];
        const zuletzt =
          definition.typ === "datum"
            ? letzte?.letzteAm
              ? Spielzeit.formatiere(new Date(letzte.letzteAm))
              : "unbekannt"
            : letzte?.letzteBeiKm !== undefined
              ? `${letzte.letzteBeiKm.toLocaleString("de-DE")} km`
              : "unbekannt";

        return `
          <li class="fuhrpark-fristzeile frist-${f.status}">
            <div class="fuhrpark-fristzeile-kopf">
              <span class="fuhrpark-frist-ampel"></span>
              <span class="fuhrpark-fristzeile-name">${f.label}</span>
              <span class="fuhrpark-fristzeile-kurz">${f.kurz}</span>
            </div>
            <div class="fuhrpark-fristzeile-text">${f.text}</div>
            <div class="fuhrpark-fristzeile-meta">
              Rhythmus: ${intervall} · zuletzt: ${zuletzt}
            </div>
            <button class="win98-button bevel-out" data-frist-erledigen="${f.art}">
              📋 ${f.label} durchführen (Debug)
            </button>
          </li>
        `;
      })
      .join("");

    const inhalt = `
      <div class="fuhrpark-historie-fenster">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-datumszeile">
          ${Spielzeit.formatiereLang(Spielzeit.heute())} ·
          ${fahrzeug.kmStand.toLocaleString("de-DE")} km
        </div>
        <div class="fuhrpark-blaetter-zeile">
          <button class="win98-button bevel-out fuhrpark-zurueck" data-zurueck-zum-fahrzeug>
            &#10094; Zurück zum Fahrzeug
          </button>
        </div>
        <ul class="fuhrpark-fristliste">${zeilen}</ul>
      </div>
    `;

    fensterAktualisieren("fuhrpark-fristen", `Fristen – ${fahrzeug.kennzeichen}`, inhalt);
  }

  /**
   * Eigenes Kartenfenster für eine laufende Tour.
   *
   * Bewusst ohne Zoom und Verschieben: Der Ausschnitt wird so gewählt,
   * dass die ganze Route hineinpasst. Wer die große Karte braucht,
   * nutzt die Tourenplanung.
   */
  function tourkarteOeffnen(fahrzeug) {
    const t = Fahrt.fuerFahrzeug(fahrzeug.id);
    if (!t) return;

    const inhalt = `
      <div class="tourkarte-fenster">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-blaetter-zeile">
          <button class="win98-button bevel-out fuhrpark-zurueck" data-zurueck-zum-fahrzeug>
            &#10094; Zurück zum Fuhrpark
          </button>
        </div>
        <div class="tourkarte-rahmen" id="tourkarte-rahmen">
          <img class="tourkarte-bild" id="tourkarte-bild" src="${Karte.BILD}" alt="Karte">
          <svg class="tourkarte-ebene" id="tourkarte-ebene"></svg>
        </div>
        <div class="tourkarte-info" id="tourkarte-info"></div>
      </div>
    `;

    fensterAktualisieren("fuhrpark-tourkarte", `Tour – ${fahrzeug.kennzeichen}`, inhalt);
    tourkarteZeichnen(fahrzeug.id);

    // Bei jedem Zeittakt mitzeichnen, solange das Fenster offen ist
    if (!tourkarteAngemeldet) {
      tourkarteAngemeldet = true;
      Spielzeit.beiAenderung(() => {
        if (WindowManager.istOffen("fuhrpark-tourkarte") && tourkarteFahrzeugId !== null) {
          tourkarteZeichnen(tourkarteFahrzeugId);
        }
      });
    }
    tourkarteFahrzeugId = fahrzeug.id;
  }

  let tourkarteAngemeldet = false;
  let tourkarteFahrzeugId = null;

  /** Zeichnet Route und Fahrzeugposition in das Tourkartenfenster. */
  function tourkarteZeichnen(fahrzeugId) {
    const fenster = document.querySelector('.win98-window[data-app-id="fuhrpark-tourkarte"]');
    if (!fenster) return;

    const t = Fahrt.fuerFahrzeug(fahrzeugId);
    const rahmen = fenster.querySelector("#tourkarte-rahmen");
    const bild = fenster.querySelector("#tourkarte-bild");
    const svg = fenster.querySelector("#tourkarte-ebene");
    const info = fenster.querySelector("#tourkarte-info");
    if (!rahmen || !svg) return;

    if (!t) {
      svg.innerHTML = "";
      if (info) info.textContent = "Die Tour ist abgeschlossen.";
      return;
    }

    // Alle Punkte der Tour sammeln, um den Ausschnitt zu bestimmen
    const alleStationen = [];
    t.etappen.forEach((e) => e.route.stationen.forEach((n) => alleStationen.push(n)));
    const punkte = alleStationen.map((n) => {
      const stadt = STAEDTE[n];
      return Karte.nachBild(stadt.lon, stadt.lat);
    });

    const rand = 60;
    const minX = Math.max(0, Math.min(...punkte.map((p) => p.x)) - rand);
    const maxX = Math.min(Karte.BILD_BREITE, Math.max(...punkte.map((p) => p.x)) + rand);
    const minY = Math.max(0, Math.min(...punkte.map((p) => p.y)) - rand);
    const maxY = Math.min(Karte.BILD_HOEHE, Math.max(...punkte.map((p) => p.y)) + rand);

    const breite = rahmen.clientWidth || 320;
    const hoehe = rahmen.clientHeight || 220;
    const massstab = Math.min(breite / (maxX - minX), hoehe / (maxY - minY));

    // Karte so verschieben und skalieren, dass die Route hineinpasst
    bild.style.width = `${Karte.BILD_BREITE * massstab}px`;
    bild.style.height = `${Karte.BILD_HOEHE * massstab}px`;
    bild.style.left = `${-minX * massstab}px`;
    bild.style.top = `${-minY * massstab}px`;

    const aufSchirm = (name) => {
      const stadt = STAEDTE[name];
      const p = Karte.nachBild(stadt.lon, stadt.lat);
      return { x: (p.x - minX) * massstab, y: (p.y - minY) * massstab };
    };

    svg.setAttribute("width", breite);
    svg.setAttribute("height", hoehe);

    const teile = [];
    t.etappen.forEach((e, i) => {
      const pts = e.route.stationen.map(aufSchirm);
      const linie = pts.map((p) => `${p.x},${p.y}`).join(" ");
      teile.push(`<polyline points="${linie}" class="tour-route-kontur-duenn" />`);
      teile.push(`<polyline points="${linie}" class="${
        e.typ === "anfahrt" ? "tour-route-anfahrt" : "tour-route-laufend"
      }" />`);
      if (i === 0) {
        teile.push(`<circle cx="${pts[0].x}" cy="${pts[0].y}" r="5" class="tour-route-start" />`);
      }
      if (i === t.etappen.length - 1) {
        const z = pts[pts.length - 1];
        teile.push(`<circle cx="${z.x}" cy="${z.y}" r="5" class="tour-route-ziel" />`);
      }
    });

    // Fahrzeugposition auf der aktuellen Etappe
    const etappe = Fahrt.aktuelleEtappe(t);
    const ePunkte = etappe.route.stationen.map(aufSchirm);
    const anteil = Fahrt.etappenFortschritt(t);
    const abschnitte = etappe.route.abschnitte;
    let restKm = anteil * (etappe.route.km || 1);
    let idx = 0;
    while (idx < abschnitte.length - 1 && restKm > abschnitte[idx].km) {
      restKm -= abschnitte[idx].km; idx++;
    }
    const teil = abschnitte[idx] && abschnitte[idx].km > 0 ? restKm / abschnitte[idx].km : 0;
    const a = ePunkte[idx], b = ePunkte[idx + 1] || ePunkte[idx];
    const fx = a.x + (b.x - a.x) * teil;
    const fy = a.y + (b.y - a.y) * teil;
    teile.push(`<circle cx="${fx}" cy="${fy}" r="7" class="tourkarte-fahrzeug" />`);

    svg.innerHTML = teile.join("");

    if (info) {
      info.innerHTML = `
        ${t.vonName} → ${t.nachName} ·
        ${Math.round(t.gesamtGefahreneKm).toLocaleString("de-DE")} von
        ${Math.round(Fahrt.gesamtKm(t)).toLocaleString("de-DE")} km ·
        ${t.ruhtBis ? "Ruhezeit" : Fahrt.istBeladen(t) ? "beladen unterwegs" : "Anfahrt leer"} ·
        Ankunft ${Spielzeit.formatiereMitUhrzeit(Fahrt.ankunft(t))}
      `;
    }
  }

  /** Vollständige Chronik in einem eigenen Fenster. */
  function historieFensterOeffnen(fahrzeug) {
    const eintraege = Historie.alle(fahrzeug);

    const zeilen =
      eintraege.length === 0
        ? `<li class="fuhrpark-historie-leer">Noch keine Einträge.</li>`
        : eintraege
            .map(
              (e) => `
                <li class="fuhrpark-historie-eintrag">
                  <span class="fuhrpark-historie-symbol">${Historie.symbolFuer(e.art)}</span>
                  <span class="fuhrpark-historie-datum">${Spielzeit.formatiere(new Date(e.datum))}</span>
                  <span class="fuhrpark-historie-kmstand">${(e.kmStand || 0).toLocaleString("de-DE")} km</span>
                  <span class="fuhrpark-historie-text">${e.text}</span>
                </li>
              `
            )
            .join("");

    const inhalt = `
      <div class="fuhrpark-historie-fenster">
        <div class="fuhrpark-kopfzeile">
          <span class="fuhrpark-fahrzeugname">${fahrzeug.marke} ${fahrzeug.modell}</span>
          <span class="fuhrpark-kennzeichen">${fahrzeug.kennzeichen}</span>
        </div>
        <div class="fuhrpark-datumszeile">${eintraege.length} Einträge, neueste zuerst</div>
        <div class="fuhrpark-blaetter-zeile">
          <button class="win98-button bevel-out fuhrpark-zurueck" data-zurueck-zum-fahrzeug>
            &#10094; Zurück zum Fahrzeug
          </button>
        </div>
        <ul class="fuhrpark-historie-vollliste">${zeilen}</ul>
      </div>
    `;

    fensterAktualisieren("fuhrpark-historie", `Historie – ${fahrzeug.kennzeichen}`, inhalt);
  }

  /** Hinweis, wenn das Fahrzeug gerade unterwegs ist. */
  function tourBlock(fahrzeug) {
    if (typeof Fahrt === "undefined") return "";
    const t = Fahrt.fuerFahrzeug(fahrzeug.id);
    if (!t) return "";

    const anteil = Math.round(Fahrt.fortschritt(t) * 100);
    return `
      <div class="fuhrpark-tourhinweis">
        <div class="fuhrpark-tourhinweis-kopf">
          🚛 Unterwegs: ${t.vonName} → ${t.nachName}
          <button class="win98-button bevel-out" data-tourkarte="${fahrzeug.id}">
            Auf der Karte zeigen
          </button>
        </div>
        <div class="fuhrpark-tourhinweis-balken">
          <div class="fuhrpark-tourhinweis-fuellung" style="width:${anteil}%"></div>
        </div>
        <div class="fuhrpark-tourhinweis-info">
          ${Math.round(t.gesamtGefahreneKm).toLocaleString("de-DE")} von
          ${Math.round(Fahrt.gesamtKm(t)).toLocaleString("de-DE")} km ·
          ${t.ruhtBis ? "Ruhezeit" : Fahrt.istBeladen(t) ? "beladen" : "Anfahrt leer"} ·
          Ankunft ${Spielzeit.formatiereMitUhrzeit(Fahrt.ankunft(t))}
        </div>
      </div>
    `;
  }

  function ausfallBlock(fahrzeug) {
    if (!Ausfall.istStillstehend(fahrzeug)) {
      // Kein Ausfall - aber vielleicht eine Vorwarnung.
      const warnungen = Ausfall.warnungen(fahrzeug);
      if (warnungen.length === 0) return "";

      const namen = warnungen.map((t) => TEIL_LABEL[t]).join(", ");
      return `
        <div class="fuhrpark-ausfall fuhrpark-ausfall-warnung">
          <div class="fuhrpark-ausfall-titel">⚠ Bald kritisch: ${namen}</div>
          <div class="fuhrpark-ausfall-text">
            Unterhalb der kritischen Grenze bleibt das Fahrzeug liegen.
            Eine geplante Instandsetzung ist deutlich günstiger als eine Bergung.
          </div>
        </div>
      `;
    }

    const ausfall = fahrzeug.ausfall;
    const seit = Spielzeit.tageZwischen(new Date(ausfall.seit), Spielzeit.heute());
    const kostenBergung = Ausfall.kostenBergung(fahrzeug);

    const vorOrtButton = Ausfall.kannVorOrt(fahrzeug)
      ? `<button class="win98-button bevel-out" id="fuhrpark-btn-vor-ort">
           🔧 Vor Ort reparieren (${Ausfall.kostenVorOrt(fahrzeug).toLocaleString("de-DE")} DM,
           ${Ausfall.DAUER_TAGE.vorOrt} Tag)
         </button>`
      : "";

    return `
      <div class="fuhrpark-ausfall fuhrpark-ausfall-stillstand">
        <div class="fuhrpark-ausfall-titel">
          ⛔ Fahrzeug steht: ${TEIL_LABEL[ausfall.teil]} bei ${ausfall.wert.toFixed(0)}%
        </div>
        <div class="fuhrpark-ausfall-text">
          Liegengeblieben in ${ausfall.ort}${seit > 0 ? `, seit ${seit} Tagen` : ""}.
          ${
            Ausfall.kannVorOrt(fahrzeug)
              ? "Ein mobiler Dienst kann den Schaden an Ort und Stelle beheben."
              : "Dieser Schaden lässt sich nicht an der Straße beheben - das Fahrzeug muss geborgen werden."
          }
        </div>
        <div class="fuhrpark-ausfall-buttons">
          ${vorOrtButton}
          <button class="win98-button bevel-out" id="fuhrpark-btn-bergung">
            🚨 Bergung in die Werkstatt (${kostenBergung.toLocaleString("de-DE")} DM,
            ${Ausfall.DAUER_TAGE.bergung} Tage)
          </button>
        </div>
      </div>
    `;
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
            ${ausfallBlock(fahrzeug)}
            ${tourBlock(fahrzeug)}
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
          <button class="win98-button bevel-out fuhrpark-zurueck" id="fuhrpark-btn-auslastung">📊 Auslastung</button>
          <button class="win98-button bevel-out fuhrpark-zurueck" id="fuhrpark-btn-historie">📜 Historie</button>
          <button class="win98-button bevel-out fuhrpark-zurueck" id="fuhrpark-btn-fristen">🔧 Fristen</button>
        </div>

        <dl class="fuhrpark-infoliste">
          <dt>Baujahr</dt><dd>${fahrzeug.baujahr}</dd>
          <dt>Aufbau</dt><dd>${fahrzeug.aufbautyp}</dd>
          <dt>Lackierung</dt><dd>${fahrzeug.lackierung}</dd>
          <dt>Laufleistung</dt><dd>${fahrzeug.kmStand.toLocaleString("de-DE")} km</dd>
          <dt>Standort</dt><dd>${fahrzeug.standort}</dd>
          <dt>Status</dt><dd>${fahrzeug.status}</dd>
          <dt>Verbrauch gesamt</dt><dd>${fahrzeug.verbrauchGesamtL.toFixed(0)} l</dd>
          <dt>Restwert (geschätzt)</dt><dd>${restwert(fahrzeug).toLocaleString("de-DE")} DM</dd>
        </dl>

        ${fristenBlock(fahrzeug)}

        <div class="fuhrpark-debug-leiste">
          <!-- Verschleiß und Laufleistung entstehen jetzt aus echten
               Touren der Tourenplanung - die frühere Debug-Tour ist
               deshalb entfallen.

               GEPLANT: Der Reparieren-Button wird später durch einen
               "Werkstatt"-Button ersetzt, der das Werkstatt-Modul mit
               diesem Fahrzeug im Kontext öffnet. Dort dann zwei Fälle:
                 1) Keine eigene Werkstatt -> Termin bei einer
                    Fremdwerkstatt vereinbaren (Wartezeit, Fremdpreise,
                    Fahrzeug ist bis dahin gebunden)
                 2) Eigene Werkstatt vorhanden -> Arbeiten intern
                    ausführen (günstiger, aber durch eigene Kapazität
                    begrenzt)
               Ob eine eigene Werkstatt existiert, gehört NICHT in den
               Fuhrpark, sondern in den späteren globalen gameState.
               Den Debug-Button erst entfernen, wenn das Werkstatt-Modul
               steht - sonst lässt sich Verschleiß nicht zurücksetzen.
               Details werden beim Bau des Werkstatt-Moduls festgelegt. -->
          <button class="win98-button bevel-out" id="fuhrpark-btn-reparieren"
                  ${gewaehltesTeil ? "" : "disabled"}>
            🔧 ${gewaehltesTeil ? `${TEIL_LABEL[gewaehltesTeil]} reparieren` : "Teil im Bild wählen"} (Debug)
          </button>
          <button class="win98-button bevel-out" id="fuhrpark-btn-verkaufen">💰 Verkaufen (${restwert(fahrzeug).toLocaleString("de-DE")} DM)</button>
        </div>
      </div>
    `;
  }

  function renderInhalt() {
    // Auch bei leerer Flotte die Übersicht zeigen - dort sitzen die
    // Kauf-Buttons, sonst wäre der leere Zustand eine Sackgasse.
    if (fahrzeuge.length === 0) return renderUebersicht();
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
    gewaehltesTeil = null; // Auswahl gilt nur für das aktuelle Fahrzeug
    neuZeichnen();
  }

  function zurueckZurUebersicht() {
    ansicht = "uebersicht";
    gewaehltesTeil = null;
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
        gewaehltesTeil = null;
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

    const btnKaufNeu = fensterElement.querySelector("#fuhrpark-btn-kauf-neu");
    if (btnKaufNeu) {
      btnKaufNeu.addEventListener("click", () => {
        neuesFahrzeugKaufen();
        neuZeichnen();
      });
    }

    const btnKaufGebraucht = fensterElement.querySelector("#fuhrpark-btn-kauf-gebraucht");
    if (btnKaufGebraucht) {
      btnKaufGebraucht.addEventListener("click", () => {
        gebrauchtesFahrzeugKaufen();
        neuZeichnen();
      });
    }

    const btnLeeren = fensterElement.querySelector("#fuhrpark-btn-flotte-leeren");
    if (btnLeeren) {
      btnLeeren.addEventListener("click", () => {
        fahrzeuge = [];
        aktuellerIndex = 0;
        neuZeichnen();
      });
    }

    const btnZeitWoche = fensterElement.querySelector("#fuhrpark-btn-zeit-woche");
    if (btnZeitWoche) {
      btnZeitWoche.addEventListener("click", () => {
        Spielzeit.vorspulen(7);
        neuZeichnen();
      });
    }

    const btnZeitMonat = fensterElement.querySelector("#fuhrpark-btn-zeit-monat");
    if (btnZeitMonat) {
      btnZeitMonat.addEventListener("click", () => {
        Spielzeit.vorspulen(30);
        neuZeichnen();
      });
    }

    // ---- Detailansicht ----
    const btnZurueck = fensterElement.querySelector("#fuhrpark-btn-zurueck");
    if (btnZurueck) btnZurueck.addEventListener("click", zurueckZurUebersicht);

    const visual = fensterElement.querySelector("#fuhrpark-visual");
    if (visual) swipeErkennen(visual);

    // Bauteil im Bild auswählen - Ziel der Reparatur
    fensterElement.querySelectorAll(".fuhrpark-callout").forEach((box) => {
      box.addEventListener("click", () => {
        // Erneutes Antippen hebt die Auswahl wieder auf.
        gewaehltesTeil = gewaehltesTeil === box.dataset.teil ? null : box.dataset.teil;
        neuZeichnen();
      });
    });

    const btnReparieren = fensterElement.querySelector("#fuhrpark-btn-reparieren");
    if (btnReparieren) {
      btnReparieren.addEventListener("click", () => {
        if (!gewaehltesTeil) return;
        const fahrzeug = fahrzeuge[aktuellerIndex];
        const teil = gewaehltesTeil;
        const zustandVorher = fahrzeug.verschleiss[teil];

        Verschleiss.teilReparieren(fahrzeug, teil);

        Historie.hinzufuegen(fahrzeug, {
          art: "reparatur",
          text: `${TEIL_LABEL[teil]} erneuert (vorher ${zustandVorher.toFixed(0)}%)`,
          daten: { teil, zustandVorher }
        });

        gewaehltesTeil = null;
        neuZeichnen();
      });
    }

    const btnVerkaufen = fensterElement.querySelector("#fuhrpark-btn-verkaufen");
    if (btnVerkaufen) {
      btnVerkaufen.addEventListener("click", () => {
        const fahrzeug = fahrzeuge[aktuellerIndex];
        const erloes = restwert(fahrzeug).toLocaleString("de-DE");
        // Rückfrage, da ein Verkauf das Fahrzeug endgültig entfernt.
        const bestaetigt = window.confirm(
          `${fahrzeug.marke} ${fahrzeug.modell} (${fahrzeug.kennzeichen}) ` +
          `für ${erloes} DM verkaufen?`
        );
        if (bestaetigt) {
          fahrzeugVerkaufen(aktuellerIndex);
        }
      });
    }

    fensterElement.querySelectorAll("[data-tourkarte]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // nicht zugleich das Fahrzeug öffnen
        const id = Number(el.dataset.tourkarte);
        const fahrzeug = fahrzeuge.find((f) => f.id === id);
        if (fahrzeug) tourkarteOeffnen(fahrzeug);
      });
    });

    const btnAuslastung = fensterElement.querySelector("#fuhrpark-btn-auslastung");
    if (btnAuslastung) {
      btnAuslastung.addEventListener("click", () => {
        auslastungFensterOeffnen(fahrzeuge[aktuellerIndex]);
      });
    }

    const btnHistorie = fensterElement.querySelector("#fuhrpark-btn-historie");
    if (btnHistorie) {
      btnHistorie.addEventListener("click", () => {
        historieFensterOeffnen(fahrzeuge[aktuellerIndex]);
      });
    }

    const btnFristen = fensterElement.querySelector("#fuhrpark-btn-fristen");
    if (btnFristen) {
      btnFristen.addEventListener("click", () => {
        fristenFensterOeffnen(fahrzeuge[aktuellerIndex]);
      });
    }

    function ausfallBeheben(weg) {
      const fahrzeug = fahrzeuge[aktuellerIndex];
      const ergebnis = Ausfall.beheben(fahrzeug, weg);

      Historie.hinzufuegen(fahrzeug, {
        art: "reparatur",
        text:
          weg === "vorOrt"
            ? `${TEIL_LABEL[ergebnis.teil]} vor Ort instand gesetzt`
            : `Bergung in die Werkstatt, ${TEIL_LABEL[ergebnis.teil]} erneuert`,
        kosten: ergebnis.kosten,
        tage: ergebnis.tage,
        daten: { teil: ergebnis.teil, weg }
      });

      // Die Instandsetzung kostet Standzeit.
      Spielzeit.vorspulen(ergebnis.tage);
      neuZeichnen();
    }

    const btnVorOrt = fensterElement.querySelector("#fuhrpark-btn-vor-ort");
    if (btnVorOrt) btnVorOrt.addEventListener("click", () => ausfallBeheben("vorOrt"));

    const btnBergung = fensterElement.querySelector("#fuhrpark-btn-bergung");
    if (btnBergung) btnBergung.addEventListener("click", () => ausfallBeheben("bergung"));

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

  /**
   * Hält die Anzeige während laufender Touren aktuell: Fortschritt und
   * Ankunftszeit ändern sich ja fortwährend. Bewusst nur die betroffenen
   * Stellen auffrischen statt alles neu zu bauen - sonst ginge eine
   * getroffene Bauteilauswahl verloren.
   */
  let taktAngemeldet = false;
  function taktVerbinden() {
    if (taktAngemeldet || typeof Spielzeit === "undefined") return;
    taktAngemeldet = true;

    Spielzeit.beiAenderung(() => {
      if (!fensterElement || !document.body.contains(fensterElement)) return;
      if (typeof Fahrt === "undefined" || Fahrt.anzahl() === 0) return;

      // Fortschrittsanzeige im Detailfenster
      const t = ansicht === "detail" ? Fahrt.fuerFahrzeug(fahrzeuge[aktuellerIndex]?.id) : null;
      if (t) {
        const balken = fensterElement.querySelector(".fuhrpark-tourhinweis-fuellung");
        const info = fensterElement.querySelector(".fuhrpark-tourhinweis-info");
        if (balken) balken.style.width = `${Math.round(Fahrt.fortschritt(t) * 100)}%`;
        if (info) {
          info.innerHTML =
            `${Math.round(t.gesamtGefahreneKm).toLocaleString("de-DE")} von ` +
            `${Math.round(Fahrt.gesamtKm(t)).toLocaleString("de-DE")} km · ` +
            `${t.ruhtBis ? "Ruhezeit" : Fahrt.istBeladen(t) ? "beladen" : "Anfahrt leer"} · ` +
            `Ankunft ${Spielzeit.formatiereMitUhrzeit(Fahrt.ankunft(t))}`;
        }
      }

      // Marken in der Übersicht
      if (ansicht === "uebersicht") {
        fensterElement.querySelectorAll("[data-tourkarte]").forEach((el) => {
          const lauf = Fahrt.fuerFahrzeug(Number(el.dataset.tourkarte));
          if (lauf) {
            el.innerHTML = `🚛 Auf Tour: ${lauf.vonName} → ${lauf.nachName} ` +
              `(${Math.round(Fahrt.fortschritt(lauf) * 100)} %)`;
          }
        });
      }
    });
  }

  function open() {
    flotteSicherstellen();
    taktVerbinden();

    const ergebnis = WindowManager.open({
      id: "fuhrpark",
      title: "Fuhrpark",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;

    if (!ergebnis.wurdeNeuErstellt) {
      // War das Fenster schon offen, zeigte es bisher den Stand von
      // damals - etwa ohne die inzwischen gestartete Tour. Deshalb
      // immer auffrischen.
      neuZeichnen();
    }

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

  return {
    open,
    // Zugriff für andere Module (Tourenplanung braucht die Fahrzeuge).
    // Bewusst nur lesend gedacht: das Fahrzeug-Objekt selbst wird
    // durchgereicht, damit Verschleiß und Historie direkt darauf
    // wirken können.
    alleFahrzeuge: () => { flotteSicherstellen(); return fahrzeuge; },

    /** Gespeicherte Flotte übernehmen (siehe speicher.js). */
    fahrzeugeSetzen: (liste) => {
      fahrzeuge = (liste || []).map((f) => ({ ...f }));
      // Nummernkreis fortsetzen, damit keine id doppelt vergeben wird
      fahrzeuge.forEach((f) => {
        if (f.id >= naechsteId) naechsteId = f.id + 1;
      });
      if (fensterElement && document.body.contains(fensterElement)) neuZeichnen();
    },

    fahrzeugeAn: (stadtName) => {
      flotteSicherstellen();
      return fahrzeuge.filter((f) => f.standort === stadtName);
    },
    aktualisieren: () => {
      if (fensterElement && document.body.contains(fensterElement)) neuZeichnen();
    }
  };
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
