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
  // Seit 0.15.26 kann eine Tour mehrere Frachten nacheinander fahren:
  // `tour.geplant` führt die festgelegten Etappen, die offene wird wie
  // gehabt zusammengestellt. Der Ablauf bleibt im Kern derselbe, er
  // wiederholt sich nur.
  //
  // Seit 0.15.28 dürfen mehrere Sendungen zugleich an Bord sein. Eine
  // Tour ist damit keine Kette von Etappen mehr, sondern eine Liste von
  // SENDUNGEN, aus der `stoppfolge()` eine fahrbare Reihenfolge baut.
  //
  // GEPLANT: Die Reihenfolge von Hand umsortieren. Heute entscheidet
  // die Heuristik allein; ein Disponent, der seine Strecke kennt, wüsste
  // es manchmal besser.
  //
  // Ablauf ab 0.15.23: ohne Startknopf. Eine Stadt auf der Karte
  // antippen genügt - darunter steht sofort, was von dort ausgeht.
  // Aus dieser Liste wählt der Pfeil am Zeilenende die Fracht und
  // schaltet gleich weiter:
  //
  //     Stadt (Karte) -> Fracht -> Fahrzeug -> [Ziel] -> Start
  //
  // Die Fracht steht damit vor dem Fahrzeug. Das entspricht der
  // Disposition: Erst weiß man, was zu fahren ist, dann sucht man den
  // Wagen dazu - und sieht in der Fahrzeugliste sofort, welcher die
  // Ladung überhaupt nehmen kann.
  //
  // Zwei Frachtarten:
  //   auftrag  fester Auftrag aus Börse oder von einem Kunden; Ziel,
  //            Frist und Entgelt stehen fest, der Schritt "Ziel" entfällt
  //   spot     freies Warenangebot der Region; das Ziel wählt man selbst
  //            unter allen Städten mit Bedarf, ohne Frist und ohne
  //            Kundenbindung (Spotmarkt)
  let tour = {
    schritt: "fracht",  // fracht | ziel | fahrzeug | bereit
    stadt: null,
    fahrzeug: null,
    // Die Etappen, die schon feststehen. Jede ist eine Fracht von A
    // nach B; die nächste beginnt dort, wo die vorige endete.
    geplant: [],
    // Die Etappe, die gerade zusammengestellt wird:
    art: null,         // "auftrag" | "spot"
    auftrag: null,     // bei art === "auftrag"
    gut: null,         // bei art === "spot"
    tonnen: 0,
    ziel: null,
    machbarkeit: null,
    // Wird eine schon festgelegte Sendung bearbeitet, liegt sie
    // solange NICHT in `geplant`, sondern hier in der Bearbeitung -
    // dadurch rechnet der ganze Rest des Moduls unverändert weiter.
    // `bearbeitet` merkt sich den Platz, an den sie zurückgehört,
    // `urfassung` die Fassung von vorher: Abbrechen stellt sie wieder
    // her, das Bearbeiten ist also nicht zerstörend.
    bearbeitet: null,
    urfassung: null,
    // Von Hand gelegte Reihenfolge der Halte. null heißt: die
    // berechnete gilt.
    reihenfolge: null,
    // Sobald der Spieler die Menge selbst einstellt, darf sie nicht
    // mehr automatisch auf das Maximum zurückspringen.
    mengeVonHand: false
  };

  function tourZuruecksetzen() {
    tour = {
      schritt: "fracht", stadt: null, fahrzeug: null, geplant: [],
      art: null, auftrag: null, gut: null, tonnen: 0, ziel: null,
      machbarkeit: null, bearbeitet: null, urfassung: null,
      reihenfolge: null, mengeVonHand: false
    };
  }

  /** Die gerade zusammengestellte Etappe zurücksetzen, Rest behalten. */
  function etappeZuruecksetzen() {
    tour.art = null;
    tour.auftrag = null;
    tour.gut = null;
    tour.tonnen = 0;
    tour.ziel = null;
    tour.machbarkeit = null;
    tour.bearbeitet = null;
    tour.urfassung = null;
    tour.mengeVonHand = false;
  }

  /**
   * Alle Sendungen der Tour, die gerade bearbeitete an IHREM Platz.
   *
   * Vor 0.15.36 stand die angefangene Sendung immer hinten dran, weil
   * es nur den Fall "eine neue dazu" gab. Seit man eine bestehende
   * bearbeiten kann, gehört sie dorthin zurück, wo sie war - sonst
   * springt die Tour beim Ändern einer Kleinigkeit um.
   */
  function alleSendungen() {
    const liste = tour.geplant.slice();
    const offen = aktuelleEtappeAlsPlan();
    const platz = tour.bearbeitet;

    if (offen && offen.nachName) {
      if (platz !== null) liste.splice(platz, 0, offen);
      else liste.push(offen);
    } else if (platz !== null && tour.urfassung) {
      // Angefangen umzubauen, aber noch nicht fertig: Bis dahin gilt
      // die alte Fassung. Genau das macht das Bearbeiten unschädlich.
      liste.splice(platz, 0, tour.urfassung);
    }
    return liste;
  }

  /** Welcher Platz in `alleSendungen()` gerade bearbeitet wird. */
  function inArbeitPlatz() {
    if (tour.bearbeitet !== null) return tour.bearbeitet;
    return aktuelleEtappeAlsPlan() ? tour.geplant.length : -1;
  }

  /**
   * Die angefangene Sendung festschreiben, bevor etwas anderes
   * angefasst wird. Unvollständig Angefangenes fällt weg; war eine
   * bestehende Sendung in Bearbeitung, kommt ihre alte Fassung zurück.
   */
  function offeneSendungSichern() {
    const offen = aktuelleEtappeAlsPlan();
    const platz = tour.bearbeitet;

    if (offen && offen.nachName) {
      if (platz !== null) tour.geplant.splice(platz, 0, offen);
      else tour.geplant.push(offen);
    } else if (platz !== null && tour.urfassung) {
      tour.geplant.splice(platz, 0, tour.urfassung);
    }
    tour.bearbeitet = null;
    tour.urfassung = null;
  }

  /**
   * Steckt der Disponent gerade in einer Auswahl? Dann darf der
   * Zeittakt die Liste nicht unter seinen Fingern neu aufbauen.
   */
  function inAuswahl() {
    return tour.schritt !== "fracht" || Boolean(tour.art)
        || tour.geplant.length > 0 || tour.bearbeitet !== null;
  }

  // Wird eine Ware angetippt, sollen alle Städte aufleuchten, die sie
  // liefern können.
  let hervorgehobenesGut = null;

  // Warendetails werden im selben Rahmen gezeigt statt in einem eigenen
  // Fenster - so bleibt die Karte darüber sichtbar.
  let detailGut = null;

  // Stadt, in die ein Fahrzeug leer umgesetzt werden soll
  let umsetzZiel = null;

  /**
   * Was die Karte gerade vorwegnimmt, während der Zeiger über einer
   * Zeile steht: bei einem festen Auftrag die eine vorgegebene
   * Zielstadt, bei Spotware alle Städte mit Bedarf.
   *
   *   { art: "auftrag"|"spot"|"ziel", gutId, zielName }
   *
   * Bewusst getrennt von der Auswahl: Man soll über die Liste fahren
   * und sehen, wohin es ginge, ohne sich festzulegen.
   */
  let vorschau = null;

  // Aktuell auf der Karte hervorgehobene Route (Liste von Städtenamen)
  let aktiveRoute = null;

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
            <!-- Route und fahrendes Fahrzeug: eigene Ebene über der
                 Karte, ebenfalls nicht mitskaliert. -->
            <svg class="tour-route-ebene" id="tour-route-ebene"></svg>
            <div class="tour-karte-marken" id="tour-karte-marken"></div>
            <div class="tour-fahrt" id="tour-fahrt"></div>
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
          </div>
          <!-- Legende: Ohne sie sind die Ringe auf der Karte nur
               hübsch. Sie steht fest da, damit man sie nicht suchen
               muss, und ist bewusst knapp gehalten. -->
          <div class="tour-legende">
            <span><i class="tour-legende-punkt leg-depot"></i>Depot</span>
            <span><i class="tour-legende-punkt leg-flotte"></i>eigenes Fahrzeug</span>
            <span><i class="tour-legende-punkt leg-ziel"></i>Ziel</span>
            <span><i class="tour-legende-punkt leg-empfaenger"></i>Abnehmer</span>
          </div>
        </div>

        <!-- Fensterteiler. Wie im Explorer: ziehen teilt neu auf,
             Doppeltippen springt zur nächsten Raste. Ohne ihn bekam
             die Disposition feste 50 % - zu wenig, sobald im
             Frachtbrief mehrere Sendungen stehen. -->
        <div class="tour-teiler" id="tour-teiler"
             role="separator" aria-orientation="horizontal" tabindex="0"
             title="Ziehen teilt Karte und Liste neu auf · Doppeltippen springt zur nächsten Raste">
          <span class="tour-teiler-griff"></span>
        </div>

        <div class="tour-disposition" id="tour-disposition">
          ${renderDisposition()}
        </div>
      </div>
    `;
  }

  // ---------- Fensterteiler ----------
  //
  // Karte und Disposition teilen sich die Fensterhöhe. Wieviel jede
  // bekommt, entscheidet der Spieler und nicht das Programm: Beim
  // Stadtwählen will man Karte, beim Zusammenstellen einer Tour mit
  // vier Sendungen will man Liste. Die Teilung überlebt das Schließen
  // des Fensters.

  const TEILUNG_SCHLUESSEL = "spedipro.kartenanteil";
  const TEILER_RASTEN = [0.72, 0.5, 0.3];   // Karte groß · halbe-halbe · Liste groß
  const KARTE_MIN_PX = 150;
  const DISPO_MIN_PX = 150;

  let kartenAnteil = 0.5;

  function teilungLesen() {
    try {
      const roh = window.localStorage.getItem(TEILUNG_SCHLUESSEL);
      const wert = Number(roh);
      if (roh !== null && Number.isFinite(wert) && wert > 0.1 && wert < 0.95) {
        kartenAnteil = wert;
      }
    } catch (e) { /* privater Modus: dann eben die Voreinstellung */ }
  }

  function teilungSchreiben() {
    try {
      window.localStorage.setItem(TEILUNG_SCHLUESSEL, kartenAnteil.toFixed(3));
    } catch (e) { /* nicht schlimm, die Teilung gilt dann nur diese Sitzung */ }
  }

  /**
   * Setzt den Anteil und hält dabei beide Seiten benutzbar: Die Karte
   * darf nie unter KARTE_MIN_PX rutschen, die Disposition nie unter
   * DISPO_MIN_PX - sonst zieht man sich selbst in eine Sackgasse.
   */
  function teilungSetzen(anteil, speichern) {
    const layout = fensterElement && fensterElement.querySelector(".tour-layout");
    if (!layout) return;

    const hoehe = layout.clientHeight;
    let a = anteil;
    if (hoehe > KARTE_MIN_PX + DISPO_MIN_PX) {
      a = Math.max(KARTE_MIN_PX / hoehe, Math.min(1 - DISPO_MIN_PX / hoehe, a));
    }
    kartenAnteil = a;
    layout.style.setProperty("--tour-kartenanteil", (a * 100).toFixed(2) + "%");

    // Die Marken liegen außerhalb der gezoomten Bühne und werden aus
    // der Rahmengröße berechnet - nach jeder Höhenänderung also neu.
    versatzBegrenzen();
    ansichtAnwenden();
    if (speichern) teilungSchreiben();
  }

  /** Doppeltippen: zur nächsten Raste, der Reihe nach im Kreis. */
  function naechsteRaste() {
    let i = 0;
    let beste = Infinity;
    TEILER_RASTEN.forEach((r, k) => {
      const d = Math.abs(r - kartenAnteil);
      if (d < beste) { beste = d; i = k; }
    });
    teilungSetzen(TEILER_RASTEN[(i + 1) % TEILER_RASTEN.length], true);
  }

  function teilerEreignisse() {
    const teiler = fensterElement && fensterElement.querySelector("#tour-teiler");
    const layout = fensterElement && fensterElement.querySelector(".tour-layout");
    if (!teiler || !layout) return;

    let zieht = false;

    teiler.addEventListener("pointerdown", (e) => {
      zieht = true;
      teiler.setPointerCapture(e.pointerId);
      teiler.classList.add("zieht");
      e.preventDefault();
    });

    teiler.addEventListener("pointermove", (e) => {
      if (!zieht) return;
      const kasten = layout.getBoundingClientRect();
      if (kasten.height <= 0) return;
      teilungSetzen((e.clientY - kasten.top) / kasten.height, false);
    });

    const loslassen = (e) => {
      if (!zieht) return;
      zieht = false;
      teiler.classList.remove("zieht");
      try { teiler.releasePointerCapture(e.pointerId); } catch (x) { /* egal */ }
      teilungSchreiben();
    };
    teiler.addEventListener("pointerup", loslassen);
    teiler.addEventListener("pointercancel", loslassen);

    teiler.addEventListener("dblclick", naechsteRaste);

    // Auf dem Telefon kommt kein dblclick, wenn dazwischen gezogen
    // wurde - deshalb zusätzlich zwei kurze Tipps von Hand zählen.
    let letzterTipp = 0;
    teiler.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      const jetzt = Date.now();
      if (jetzt - letzterTipp < 400) { naechsteRaste(); letzterTipp = 0; }
      else letzterTipp = jetzt;
    });

    // Mit der Tastatur: Pfeile verschieben, Eingabe rastet weiter.
    teiler.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { teilungSetzen(kartenAnteil - 0.04, true); e.preventDefault(); }
      else if (e.key === "ArrowDown") { teilungSetzen(kartenAnteil + 0.04, true); e.preventDefault(); }
      else if (e.key === "Enter" || e.key === " ") { naechsteRaste(); e.preventDefault(); }
    });
  }

  function renderDisposition() {
    if (!Betrieb.hatDepot()) return renderDepotwahl();
    if (umsetzZiel) return renderUmsetzen(umsetzZiel);
    if (detailGut) return renderWarendetails(detailGut);
    return renderTourplanung();
  }

  /** Warendetails im Dispositionsbereich, mit Rückweg zur Liste. */
  function renderWarendetails(gut) {
    const lieferstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.angebot(s).some((g) => g.id === gut.id));
    const bedarfsstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.bedarf(s).some((g) => g.id === gut.id));
    // Was von dieser Ware auf EINEN Wagen geht. Bis 0.15.38 stand hier
    // fest "90 m³, max. 25 t" - das galt für den Sattelzug und für
    // sonst nichts. Ein 3,5-Tonner mit 12 m³ hätte dieselbe Zahl
    // angezeigt und damit gelogen.
    const bezug = referenzFahrzeug();
    const jeWagen = bezug
      ? Ladung.maxMengeTonnen(bezug, gut)
      : Math.min(25, (Ladung.LADEVOLUMEN_M3 * gut.dichteKgProM3) / 1000);

    return `
      <div class="tour-detailkopf">
        <button class="win98-button bevel-out" id="tour-btn-detail-zurueck">&#10094; Zurück</button>
        <span class="tour-ware-aufbau tour-aufbau-${gut.aufbau}">${aufbauKurz(gut.aufbau)}</span>
        <span class="tour-dispo-stadt">${gut.name}</span>
      </div>
      <div class="tour-detailinhalt">
        <dl class="fuhrpark-infoliste">
          <dt>Kategorie</dt><dd>${gut.kategorie}</dd>
          <dt>Aufbau</dt><dd>${aufbauText(gut.aufbau)}</dd>
          <dt>Schüttdichte</dt><dd>${gut.dichteKgProM3.toLocaleString("de-DE")} kg/m³</dd>
          <dt>Warenwert</dt><dd>${gut.wertProTonne.toLocaleString("de-DE")} DM je Tonne</dd>
          <dt>Besonderheit</dt><dd>${
            [gut.verderblich ? "kühlpflichtig" : null, gut.gefahrgut ? "Gefahrgut (ADR)" : null]
              .filter(Boolean).join(", ") || "keine"
          }</dd>
          <dt>Ladung je Wagen</dt><dd>${
            bezug
              ? `${jeWagen.toFixed(1)} t · ${bezug.marke} ${bezug.modell}
                 (${Ladung.ladevolumen(bezug)} m³, ${((bezug.zuladungKg || 24000) / 1000).toFixed(1)} t)`
              : `${jeWagen.toFixed(1)} t je Sattelauflieger`
          }</dd>
        </dl>
        <div class="tour-warentitel">Wird angeboten in ${lieferstaedte.length} Städten</div>
        <div class="gut-staedte">${lieferstaedte.map((s) => s.name).join(", ")}</div>
        <div class="tour-warentitel">Wird gebraucht in ${bedarfsstaedte.length} Städten</div>
        <div class="gut-staedte">${bedarfsstaedte.map((s) => s.name).join(", ")}</div>
      </div>
    `;
  }

  /** Übersicht der Fahrzeuge, die gerade unterwegs sind. */
  function laufendeFahrten() {
    const touren = Fahrt.alle();
    if (touren.length === 0) return "";

    return `
      <div class="tour-laufende">
        <div class="tour-warentitel">Unterwegs (${touren.length})</div>
        <ul class="tour-laufende-liste">
          ${touren.map((t) => {
            const anteil = Math.round(Fahrt.fortschritt(t) * 100);
            const beladen = Fahrt.istBeladen(t);
            const ruht = Boolean(t.ruhtBis);
            const steht = Boolean(t.stehtBis);
            // An Bord können mehrere Sendungen sein; maßgeblich für die
            // Fristwarnung ist die nächste, die abgeladen wird.
            const anBord = Fahrt.ladung(t).map((nr) => Auftraege.nachNummer(nr))
              .filter(Boolean);
            const auftrag = anBord[0] || Auftraege.nachNummer(t.auftragNummer);
            const stand = Fahrt.stoppStand(t);
            const ziel = Fahrt.naechsterStopp(t);
            const frist = auftrag ? new Date(auftrag.lieferFrist) : null;
            const ankunft = Fahrt.ankunft(t);
            const zuSpaet = frist && ankunft > frist;

            return `
              <li class="tour-laufend ${ruht ? "ruht" : ""}">
                <div class="tour-laufend-kopf">
                  <span class="tour-laufend-kennzeichen">${t.fahrzeug.kennzeichen}</span>
                  <span class="tour-laufend-strecke">
                    ${auftrag ? auftrag.nummer + " · " : ""}${t.vonName} → ${t.nachName}
                    ${stand.gesamt > 1
                      ? `<span class="tour-etappe-marke">Etappe ${stand.nummer}/${stand.gesamt}</span>`
                      : ""}
                  </span>
                </div>
                <div class="tour-laufend-balken">
                  <div class="tour-laufend-fuellung" style="width:${anteil}%"></div>
                </div>
                <div class="tour-laufend-info">
                  <span class="tour-status tour-status-${
                    steht ? "ruht" : ruht ? "ruht" : beladen ? "beladen" : "anfahrt"}">
                    ${steht ? "an der Rampe"
                      : ruht ? "Ruhezeit"
                      : beladen ? "beladen unterwegs" : "Anfahrt leer"}
                  </span>
                  ${Math.round(t.gesamtGefahreneKm).toLocaleString("de-DE")} von
                  ${Math.round(Fahrt.gesamtKm(t)).toLocaleString("de-DE")} km ·
                  ${stand.gesamt > 1 && ziel ? `nächster Halt ${ziel.stadt} · ` : ""}
                  Ankunft ${Spielzeit.formatiereMitUhrzeit(ankunft)}
                  ${zuSpaet ? `<span class="tour-warnung">nach Frist</span>` : ""}
                </div>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `;
  }

  /** Hinweis, was während der Pause passiert ist. */
  function nachholhinweis() {
    if (!nachholmeldung) return "";
    const n = nachholmeldung;
    return `
      <div class="tour-nachholung">
        <div class="tour-warentitel">
          Während der Pause vergangen: ${n.nachgeholteStunden} Stunden
          <button class="win98-button bevel-out tour-ankunft-weg" id="tour-btn-nachholung-weg">✕</button>
        </div>
        <div class="tour-laufend-info">
          ${n.angekommen > 0
            ? `${n.angekommen} Tour${n.angekommen > 1 ? "en" : ""} in der Zwischenzeit zugestellt.`
            : "Keine Tour ist in der Zwischenzeit angekommen."}
          ${n.gekappt ? ` Es wurden höchstens ${Speicher.MAX_NACHHOLEN_TAGE} Tage nachgeholt.` : ""}
        </div>
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" id="tour-btn-protokoll">
            Protokoll ansehen
          </button>
        </div>
      </div>
    `;
  }

  /** Meldung über die zuletzt zugestellte Sendung. */
  function ankunftsmeldung() {
    if (!letzteAnkunft) return "";
    const a = letzteAnkunft;
    return `
      <div class="tour-ankunft ${a.schaden ? "tour-mit-schaden" : ""}">
        <div class="tour-warentitel">
          Zugestellt: ${a.auftrag.nummer} · ${a.auftrag.vonName} → ${a.auftrag.nachName}
          <button class="win98-button bevel-out tour-ankunft-weg" id="tour-btn-meldung-weg">✕</button>
        </div>
        <div class="tour-laufend-info">
          ${a.auftrag.tonnen.toFixed(1)} t ${a.gut.name} ·
          ${a.gesamtKm.toLocaleString("de-DE")} km (davon ${a.anfahrtKm.toLocaleString("de-DE")} leer) ·
          ${a.verbrauchL.toLocaleString("de-DE")} l
        </div>
        <div class="tour-laufend-info">
          Entgelt ${a.erloes.toLocaleString("de-DE")} DM −
          Sprit ${a.spritkosten.toLocaleString("de-DE")} DM =
          <strong class="${a.deckungsbeitrag > 0 ? "tour-positiv" : "tour-negativ"}">
            ${a.deckungsbeitrag.toLocaleString("de-DE")} DM
          </strong>
          ${a.puenktlich
            ? `<span class="tour-puenktlich">pünktlich</span>`
            : `<span class="tour-warnung">verspätet</span>`}
        </div>
        ${a.schaden ? `<div class="tour-schadenhinweis">
          ⛔ Liegengeblieben: ${a.schaden.teil} bei ${a.schaden.wert.toFixed(0)}%
        </div>` : ""}
      </div>
    `;
  }

  /** Schaltfläche, um ein Fahrzeug leer in eine andere Stadt zu schicken. */
  function umsetzKnopf(stadt) {
    if (alleVerfuegbaren().length === 0) return "";
    return `
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-umsetzen="${stadt.name}">
          🚚 Fahrzeug leer hierher schicken
        </button>
      </div>
    `;
  }

  /** Auswahl, welches Fahrzeug leer umgesetzt werden soll. */
  function renderUmsetzen(zielName) {
    const ziel = STAEDTE[zielName];
    const kandidaten = alleVerfuegbaren()
      .filter((f) => f.standort !== zielName)
      .map((f) => ({ f, route: Route.berechne(f.standort, zielName) }))
      .filter((k) => k.route)
      .sort((a, b) => a.route.km - b.route.km);

    return `
      <div class="tour-detailkopf">
        <button class="win98-button bevel-out" id="tour-btn-detail-zurueck">&#10094; Zurück</button>
        <span class="tour-dispo-stadt">Leerfahrt nach ${zielName}</span>
      </div>
      <div class="tour-detailinhalt">
        <p class="tour-anleitung">
          Eine Leerfahrt bringt keinen Erlös, kostet Sprit und Verschleiß.
          Sinnvoll, wenn am neuen Ort deutlich bessere Frachten warten.
        </p>
        <ul class="tour-auswahlliste">
          ${kandidaten.length === 0
            ? `<li class="tour-ware-leer">Kein Fahrzeug verfügbar.</li>`
            : kandidaten.map(({ f, route }) => {
                const kosten = Math.round((route.km / 100) * f.verbrauchBasisL100km * dieselpreis());
                return `
                  <li class="tour-auswahl" data-umsetz-fahrzeug="${f.id}" data-umsetz-ziel="${zielName}">
                    <span class="tour-auswahl-name">
                      ${f.marke} ${f.modell}
                      <span class="tour-auftrag-nummer">${f.kennzeichen}</span>
                    </span>
                    <span class="tour-auswahl-zusatz">
                      ab ${f.standort} · ${route.km.toLocaleString("de-DE")} km leer ·
                      rund ${kosten.toLocaleString("de-DE")} DM Sprit
                    </span>
                  </li>
                `;
              }).join("")}
        </ul>
      </div>
    `;
  }

  function warenListe(waren) {
    if (waren.length === 0) return `<div class="tour-ware-leer">keine</div>`;
    return `
      <ul class="tour-warenliste">
        ${waren.map((g) => `
          <li class="tour-ware" data-wareninfo="${g.id}"
              title="${aufbauText(g.aufbau)} · ${g.wertProTonne.toLocaleString("de-DE")} DM je Tonne">
            <span class="tour-ware-aufbau tour-aufbau-${g.aufbau}">${aufbauKurz(g.aufbau)}</span>
            <span class="tour-ware-name">${g.name}</span>
            ${g.verderblich ? `<span class="tour-ware-merkmal">Kühlung</span>` : ""}
            ${g.gefahrgut ? `<span class="tour-ware-merkmal tour-merkmal-gefahr">ADR</span>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
  }

  // ================= Tourenplanung: Ablauf =================
  //
  // Vier Schritte, immer dieselben, immer an derselben Stelle:
  //
  //     Stadt (Karte) -> 1 Fracht -> 2 Ziel -> 3 Fahrzeug -> 4 Losschicken
  //
  // Gestaltungsregeln, die im ganzen Ablauf gelten:
  //
  //   Die Zeile IST der Knopf. Antippen wählt und schaltet weiter. Es
  //   gibt keinen Weiter-Knopf; der einzige echte Knopf im Ablauf ist
  //   "Losschicken" - dadurch bekommt er Gewicht.
  //
  //   Der Frachtbrief oben ersetzt Schrittleiste und Zurück-Knopf. Er
  //   füllt sich mit jeder Wahl, und jedes gefüllte Feld ist anklickbar
  //   und springt zu genau diesem Schritt zurück.
  //
  //   Ein Balken hinter der Schrift bedeutet überall dasselbe: lang ist
  //   gut. Bei der Fracht die Restfrist, beim Ziel der Deckungsbeitrag
  //   im Verhältnis zum besten, beim Fahrzeug der Puffer bis zum
  //   Liefertermin. Man lernt es einmal und liest danach ohne zu lesen.
  //
  //   Nie eine Sackgasse: Kann kein Fahrzeug die Fracht nehmen, zeigt
  //   der Fahrzeugschritt die Leerfahrt-Anforderung statt einer Absage.
  //
  //   Die Flotte hat hier keine Liste mehr. Die Fahrzeuge stehen als
  //   Marken auf der Karte - dort, wo sie hingehören. Wer sie im
  //   Einzelnen sehen will, öffnet den Fuhrpark.

  function renderTourplanung() {
    const s = tour.stadt;

    if (!s) {
      return `
        <div class="tour-ablauf">
          ${nachholhinweis()}${ankunftsmeldung()}
          <div class="tour-schrittinhalt">
            ${laufendeFahrten()}
            <div class="tour-dispo-leer">
              Stadt auf der Karte auswählen.<br>
              Die eigenen Fahrzeuge stehen als helle Marken darauf.
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="tour-ablauf">
        ${nachholhinweis()}${ankunftsmeldung()}
        ${frachtbrief()}
        <div class="tour-schrittinhalt">${schrittInhalt()}</div>
      </div>
    `;
  }

  const SCHRITTE = [
    { id: "fracht",   nr: 1, titel: "Fracht" },
    { id: "ziel",     nr: 2, titel: "Ziel" },
    { id: "fahrzeug", nr: 3, titel: "Fahrzeug" },
    { id: "bereit",   nr: 4, titel: "Losschicken" }
  ];

  // Weiter als das wird kein Fahrzeug zur Leerfahrt angeboten. Eine
  // Anfahrt quer über den Kontinent frisst jeden Erlös auf; wer das
  // wirklich will, setzt das Fahrzeug in mehreren Schritten um.
  // 1500 km sind rund zwei Lenktage - Hamburg-Milano liegt darunter,
  // Hamburg-Madrid deutlich darüber.
  const ANFORDERUNG_MAX_KM = 1500;

  // Wie viele Fahrzeuge zur Leerfahrt vorgeschlagen werden.
  const ANFORDERUNG_ANZAHL = 5;

  // Abschlag auf den Richtpreis am freien Markt. Spotladung wird ohne
  // Vertrag und ohne Bindung verkauft und bringt entsprechend weniger
  // als ein Auftrag aus der Börse oder von einem Stammkunden.
  const SPOT_FAKTOR = 0.88;

  // ---------- Stoppfolge ----------
  //
  // Eine Tour ist eine Liste von SENDUNGEN. Jede will von A nach B, und
  // mehrere dürfen gleichzeitig an Bord sein. Daraus wird hier eine
  // fahrbare Reihenfolge von Stopps.
  //
  // Zwei Regeln begrenzen sie: Abgeladen werden kann nur, was vorher
  // geladen wurde, und geladen nur, was noch hineinpasst - nach Gewicht
  // und nach Laderaum, je Teilstrecke gerechnet. Bei drei Sendungen
  // wären das im schlimmsten Fall sechs Stationen; gesucht wird nicht
  // das Optimum, sondern der jeweils nächstgelegene zulässige Schritt.
  // Das ist die Nächster-Nachbar-Heuristik, wie sie ein Disponent im
  // Kopf auch anwendet: Was auf dem Weg liegt, kommt zuerst.

  // Mehr Sendungen zugleich sprengen die Übersicht im Frachtbrief und
  // die Rechenzeit der Reihenfolge.
  const SENDUNGEN_MAX = 4;

  /**
   * Baut aus den Sendungen eine Stoppfolge.
   *
   * @param {Array} sendungen [{ vonName, nachName, tonnen, gut, ... }]
   * @param {object} fahrzeug
   * @param {string} startOrt
   * @returns {object|null} { stopps, folge, machbar, grund, km, leerKm }
   *   stopps: [{ stadt, laden: [i], abladen: [i] }] mit Indizes in
   *   `sendungen`; folge: die Stationen in gefahrener Reihenfolge.
   */
  function stoppfolge(sendungen, fahrzeug, startOrt) {
    if (sendungen.length === 0) return null;

    // Hat der Disponent die Reihenfolge selbst gelegt und passt sie
    // noch zu den vorhandenen Sendungen, dann gilt seine - auch wenn
    // sie länger ist als die berechnete. Das ist der Sinn der Sache.
    const eigene = handStationen(sendungen);
    if (eigene) return stationenAuswerten(eigene, sendungen, fahrzeug, startOrt);

    return stationenAuswerten(
      stationenFinden(sendungen, fahrzeug, startOrt),
      sendungen, fahrzeug, startOrt);
  }

  // ---------- Reihenfolge von Hand ----------
  //
  // Gespeichert wird sie NICHT als Liste von Städtenamen: Eine Stadt
  // kann zweimal in einer Tour vorkommen, und dann wäre nicht mehr
  // klar, welcher Halt gemeint ist. Stattdessen als Stationen mit
  // einem Schlüssel je Sendung - der überlebt auch das Umsortieren
  // der Sendungsliste.

  /** Woran eine Sendung wiederzuerkennen ist. */
  function sendungSchluessel(s) {
    if (!s) return "";
    return s.art === "auftrag" && s.auftrag
      ? `A:${s.auftrag.nummer}`
      : `S:${s.gut ? s.gut.id : "?"}:${s.vonName}:${s.nachName}`;
  }

  /**
   * Die gemerkte Reihenfolge auf die aktuellen Sendungen übersetzen.
   *
   * Gibt null zurück, sobald sie nicht mehr passt - dann rechnet
   * wieder die Heuristik. "Passt nicht mehr" heißt: Eine Sendung aus
   * der gemerkten Folge gibt es nicht mehr. Eine NEU dazugekommene ist
   * dagegen kein Grund aufzugeben; sie wird von der Heuristik an ihrer
   * besten Stelle eingefügt, und der Rest bleibt, wie er gelegt wurde.
   */
  function handStationen(sendungen) {
    if (!tour.reihenfolge || tour.reihenfolge.length === 0) return null;

    const nachSchluessel = new Map();
    sendungen.forEach((s, i) => nachSchluessel.set(sendungSchluessel(s), i));

    const stationen = [];
    for (const st of tour.reihenfolge) {
      const i = nachSchluessel.get(st.schluessel);
      if (i === undefined) return null;      // Sendung ist weg
      stationen.push({ stadt: st.stadt, art: st.art, sendung: i });
    }

    // Neue Sendungen, die noch nicht in der Handfolge stehen, hinten
    // anhängen: erst laden, dann abladen. Das ist bewusst schlicht -
    // wer eine Reihenfolge von Hand legt, sortiert die Neue ohnehin
    // gleich dorthin, wo er sie haben will.
    const bekannt = new Set(stationen.map((x) => x.sendung));
    sendungen.forEach((s, i) => {
      if (bekannt.has(i)) return;
      stationen.push({ stadt: s.vonName, art: "laden", sendung: i });
      stationen.push({ stadt: s.nachName, art: "abladen", sendung: i });
    });

    return stationen;
  }

  /** Die aktuelle Folge als Handreihenfolge festhalten. */
  function reihenfolgeMerken(stationen, sendungen) {
    tour.reihenfolge = stationen.map((st) => ({
      stadt: st.stadt,
      art: st.art,
      schluessel: sendungSchluessel(sendungen[st.sendung])
    }));
  }

  /**
   * Einen Halt verschieben. Umsortiert werden HALTE, nicht einzelne
   * Stationen: Ein Halt, an dem zwei Sendungen wechseln, ist ein Halt,
   * und den verschiebt man als Ganzes. Das ist auch das, was ein
   * Disponent meint, wenn er sagt "Hannover vor Bremen".
   */
  /**
   * Stationen nach Halten gruppieren: Aufeinanderfolgende Stationen in
   * derselben Stadt sind EIN Halt.
   */
  function stationenGruppieren(stationen) {
    const gruppen = [];
    stationen.forEach((st) => {
      const letzte = gruppen[gruppen.length - 1];
      if (letzte && letzte.stadt === st.stadt) letzte.stationen.push(st);
      else gruppen.push({ stadt: st.stadt, stationen: [st] });
    });
    return gruppen;
  }

  /**
   * `index` ist die Nummer der GRUPPE, nicht des Halts in der
   * Stoppfolge. Die beiden fallen nur dann zusammen, wenn im Startort
   * auch geladen wird - sonst steht dort ein Halt ohne Station davor.
   * Genau daran ging der erste Versuch schief: Ein Klick auf den
   * letzten Halt verschob den vorletzten.
   */
  function haltVerschieben(index, richtung) {
    const sendungen = alleSendungen();
    const f = tour.fahrzeug;
    if (!f || sendungen.length === 0) return;

    const plan = tourPlan(sendungen);
    if (!plan || !plan.folge) return;

    const gruppen = stationenGruppieren(plan.folge);

    const von = index;
    const nach = von + richtung;
    if (von < 0 || nach < 0 || von >= gruppen.length || nach >= gruppen.length) return;

    const [weg] = gruppen.splice(von, 1);
    gruppen.splice(nach, 0, weg);

    reihenfolgeMerken(
      gruppen.reduce((alle, g) => alle.concat(g.stationen), []),
      sendungen);

    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
  }

  /** Zurück zur berechneten Reihenfolge. */
  function reihenfolgeZuruecksetzen() {
    tour.reihenfolge = null;
    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
  }

  /**
   * Die Heuristik: Was am nächsten liegt, kommt zuerst. Sie liefert
   * die Stationen in gefahrener Reihenfolge, bewertet aber nichts -
   * das macht stationenAuswerten(), und zwar für JEDE Reihenfolge,
   * auch eine von Hand gelegte.
   */
  function stationenFinden(sendungen, fahrzeug, startOrt) {
    const anBord = [];
    const stationen = [];
    let ort = startOrt;

    const nochZuHolen = new Set(sendungen.map((s, i) => i));
    const nochZuBringen = new Set();

    while (nochZuHolen.size > 0 || nochZuBringen.size > 0) {
      const moeglich = [];

      // Abladen darf man immer - das macht nur Platz.
      nochZuBringen.forEach((i) => {
        const r = Route.berechne(ort, sendungen[i].nachName);
        if (r) moeglich.push({ art: "abladen", i, km: ort === sendungen[i].nachName ? 0 : r.km });
      });

      // Laden nur, wenn es noch hineinpasst.
      nochZuHolen.forEach((i) => {
        const s = sendungen[i];
        const pruefung = Ladung.passtDazu(
          fahrzeug,
          anBord.map((k) => ({ gut: sendungen[k].gut, tonnen: sendungen[k].tonnen })),
          s.gut, s.tonnen
        );
        if (!pruefung.passt) return;
        const r = Route.berechne(ort, s.vonName);
        if (r) moeglich.push({ art: "laden", i, km: ort === s.vonName ? 0 : r.km });
      });

      // Nichts mehr möglich: Die Heuristik gibt auf und liefert, was
      // sie hat - die Bewertung nennt dann den Grund.
      if (moeglich.length === 0) return stationen;

      // Was am nächsten liegt, kommt zuerst. Bei gleicher Entfernung
      // hat das Abladen Vorrang: Es schafft Platz für das Übrige.
      moeglich.sort((a, b) => a.km - b.km || (a.art === "abladen" ? -1 : 1));
      const naechst = moeglich[0];
      const s = sendungen[naechst.i];

      if (naechst.art === "laden") {
        anBord.push(naechst.i);
        nochZuHolen.delete(naechst.i);
        nochZuBringen.add(naechst.i);
      } else {
        anBord.splice(anBord.indexOf(naechst.i), 1);
        nochZuBringen.delete(naechst.i);
      }

      const zielOrt = naechst.art === "laden" ? s.vonName : s.nachName;
      stationen.push({ stadt: zielOrt, art: naechst.art, sendung: naechst.i });
      ort = zielOrt;
    }

    return stationen;
  }

  /**
   * Eine gegebene Stationsfolge durchrechnen UND prüfen.
   *
   * Hier liegt der Unterschied zu vorher: Die Prüfung galt bis 0.15.38
   * implizit, weil die Heuristik nie etwas Unmögliches erzeugte. Eine
   * von Hand gelegte Reihenfolge kann sehr wohl unmöglich sein - eine
   * Sendung abladen, die noch nicht an Bord ist, oder mehr laden, als
   * hineinpasst. Genau das muss hier auffallen und benannt werden,
   * statt stillschweigend falsch zu rechnen.
   */
  function stationenAuswerten(stationen, sendungen, fahrzeug, startOrt) {
    const anBord = [];
    let ort = startOrt;
    let km = 0;
    let leerKm = 0;
    let fehler = "";

    stationen.forEach((st) => {
      if (fehler) return;
      const s = sendungen[st.sendung];
      if (!s) { fehler = "Sendung gibt es nicht mehr"; return; }

      const zielOrt = st.art === "laden" ? s.vonName : s.nachName;

      if (st.art === "laden") {
        const pruefung = Ladung.passtDazu(
          fahrzeug,
          anBord.map((k) => ({ gut: sendungen[k].gut, tonnen: sendungen[k].tonnen })),
          s.gut, s.tonnen
        );
        if (!pruefung.passt) {
          fehler = `In ${zielOrt} passt die Sendung ${st.sendung + 1} nicht mehr dazu`;
          return;
        }
        anBord.push(st.sendung);
      } else {
        const stelle = anBord.indexOf(st.sendung);
        if (stelle < 0) {
          fehler = `Sendung ${st.sendung + 1} ist in ${zielOrt} noch nicht geladen`;
          return;
        }
        anBord.splice(stelle, 1);
      }

      if (ort !== zielOrt) {
        const r = Route.berechne(ort, zielOrt);
        if (!r) { fehler = `Keine Strecke ${ort} → ${zielOrt}`; return; }
        // anBord enthält beim Laden die neue Sendung schon; für die
        // Frage, ob die Anfahrt leer war, zählt der Stand VORHER.
        const vorher = st.art === "laden" ? anBord.length - 1 : anBord.length + 1;
        if (vorher === 0) leerKm += r.km;
        km += r.km;
      }
      ort = zielOrt;
    });

    // Ist am Ende noch etwas an Bord oder gar nicht erst geladen, ist
    // die Reihenfolge unvollständig - auch das ist ein Zustand, den man
    // sehen und reparieren können muss.
    if (!fehler && anBord.length > 0) {
      fehler = `Sendung ${anBord[0] + 1} wird nirgends abgeladen`;
    }
    if (!fehler) {
      const geladen = new Set(stationen.filter((x) => x.art === "laden").map((x) => x.sendung));
      const fehlt = sendungen.findIndex((s, i) => !geladen.has(i));
      if (fehlt >= 0) fehler = `Sendung ${fehlt + 1} kommt in der Reihenfolge nicht vor`;
    }

    if (fehler) {
      return { machbar: false, grund: fehler, stopps: [], folge: stationen };
    }

    // Aufeinanderfolgende Stationen in derselben Stadt zu einem Stopp
    // zusammenfassen - ein Halt, an dem zwei Sendungen wechseln, ist
    // ein Halt und nicht zwei.
    const stopps = [{ stadt: startOrt, laden: [], abladen: [] }];
    stationen.forEach((st) => {
      let letzter = stopps[stopps.length - 1];
      if (letzter.stadt !== st.stadt) {
        stopps.push({ stadt: st.stadt, laden: [], abladen: [] });
        letzter = stopps[stopps.length - 1];
      }
      letzter[st.art].push(st.sendung);
    });

    // Etappen zwischen den Stopps - mit dem Typ, der sagt, ob auf
    // dieser Teilstrecke überhaupt Ladung mitfährt.
    const belegung = belegungJeEtappe(stopps, sendungen);
    const etappen = [];
    for (let i = 0; i < stopps.length - 1; i++) {
      const r = Route.berechne(stopps[i].stadt, stopps[i + 1].stadt);
      if (!r) return { machbar: false, grund: "Keine Strecke", stopps: [], folge: stationen };
      etappen.push({
        typ: belegung[i].tonnen > 0 ? "hauptlauf" : "anfahrt",
        route: r
      });
    }

    return { machbar: true, grund: "", stopps, etappen, belegung,
             folge: stationen, km, leerKm };
  }

  /**
   * Die ganze Tour durchgerechnet: Reihenfolge, Zeiten, Warnungen.
   *
   * Erst hier zeigt sich, was die feste Buchung kostet - wer vier
   * Sendungen gleichzeitig bucht, bindet sich an vier Termine, die
   * nacheinander fällig werden.
   */
  function tourPlan(sendungen) {
    const f = tour.fahrzeug;
    if (!f || sendungen.length === 0) return null;

    const folge = stoppfolge(sendungen, f, f.standort);
    if (!folge || !folge.machbar) return folge;

    const je = sendungen.map(() => ({
      warnung: "", warnungLaden: "", warnungZiel: "",
      zustellung: null, abholung: null
    }));
    let standGesamt = 0;
    let zeit = new Date(Spielzeit.heute().getTime());

    const aufbau = f.aufbautyp ? String(f.aufbautyp).toLowerCase() : "standard";

    folge.stopps.forEach((stopp, i) => {
      if (i > 0) {
        const km = folge.etappen[i - 1].route.km;
        zeit = new Date(zeit.getTime() + Auftraege.dauerStunden(km) * 3600000);
      }

      // Standzeit an der Rampe - für jede Sendung, die hier wechselt.
      const standHier = (stopp.abladen.length * Kostensaetze.standzeit("abladen", aufbau))
        + (stopp.laden.length * Kostensaetze.standzeit("laden", aufbau));
      standGesamt += i < folge.etappen.length ? standHier : stopp.abladen.length
        * Kostensaetze.standzeit("abladen", aufbau);

      stopp.abladen.forEach((k) => {
        const s = sendungen[k];
        zeit = new Date(zeit.getTime() + Kostensaetze.standzeit("abladen", aufbau) * 3600000);
        je[k].zustellung = new Date(zeit.getTime());
        if (s.art === "auftrag" && zeit > new Date(s.auftrag.lieferFrist)) {
          je[k].warnungZiel = "Liefertermin nicht zu halten";
        }
      });

      stopp.laden.forEach((k) => {
        const s = sendungen[k];
        je[k].abholung = new Date(zeit.getTime());
        zeit = new Date(zeit.getTime() + Kostensaetze.standzeit("laden", aufbau) * 3600000);
        if (s.art !== "auftrag") return;
        const ladeBeginn = new Date(s.auftrag.ladeBeginn);
        const ladeEnde = new Date(s.auftrag.ladeEnde);
        if (zeit > ladeEnde) {
          je[k].warnungLaden = `Ladefenster in ${s.vonName} verpasst`;
        } else if (zeit < ladeBeginn) {
          const stunden = Math.round((ladeBeginn - zeit) / 3600000);
          // Das Fahrzeug steht, bis die Ware bereitsteht - diese Zeit
          // fehlt allen folgenden Sendungen.
          zeit = new Date(ladeBeginn.getTime());
          if (stunden > 12) je[k].warnungLaden = `${stunden} Std Standzeit in ${s.vonName}`;
        }
      });
    });

    // Für die Listen, die nur eine Warnung je Sendung zeigen können.
    je.forEach((x) => { x.warnung = x.warnungZiel || x.warnungLaden; });

    // Gesamtdauer der Tour: fahren, ruhen, stehen. Das ist die Zeit,
    // für die das Fahrzeug gebunden ist - bei kleinem Fuhrpark die
    // härteste Währung.
    const dauer = (zeit - Spielzeit.heute()) / 3600000;

    return { ...folge, je, dauerStunden: dauer, standStunden: standGesamt };
  }

  /**
   * Was auf jeder Teilstrecke an Bord ist. Ergebnis je Etappe:
   * { sendungen: [i], tonnen, anteil: { i: Anteil an der Ladung } }
   *
   * Die Anteile sind der Schlüssel für die Kostenverteilung: Wer die
   * Hälfte der Tonnage stellt, trägt die Hälfte des Sprits. Leerfahrten
   * gehen zulasten dessen, wofür sie gefahren werden - also der
   * Sendungen, die am Ende der Leerstrecke zugeladen werden.
   */
  function belegungJeEtappe(stopps, sendungen) {
    const anBord = [];
    const je = [];

    for (let i = 0; i < stopps.length - 1; i++) {
      stopps[i].abladen.forEach((k) => {
        const p = anBord.indexOf(k);
        if (p >= 0) anBord.splice(p, 1);
      });
      stopps[i].laden.forEach((k) => anBord.push(k));

      const tonnen = anBord.reduce((s, k) => s + sendungen[k].tonnen, 0);
      const anteil = {};
      if (tonnen > 0) {
        anBord.forEach((k) => { anteil[k] = sendungen[k].tonnen / tonnen; });
      } else {
        // Leerfahrt: Sie wird für die nächste Zuladung gefahren.
        const naechste = stopps[i + 1].laden;
        const summe = naechste.reduce((s, k) => s + sendungen[k].tonnen, 0);
        naechste.forEach((k) => {
          anteil[k] = summe > 0 ? sendungen[k].tonnen / summe : 1 / naechste.length;
        });
      }
      je.push({ sendungen: anBord.slice(), tonnen, anteil });
    }
    return je;
  }

  // ---------- Der Frachtbrief ----------

  /**
   * Ob die Sendungsliste im Frachtbrief aufgeklappt ist. Absichtlich
   * NICHT im Spielstand: eine Ansichtssache, die beim nächsten Öffnen
   * wieder auf "zu" stehen darf.
   */
  let etappenAufgeklappt = false;

  /**
   * Der Zusatz hinter "Frachtbrief". Ab zwei festgelegten Sendungen
   * bleibt er leer, weil direkt darunter die Zusammenfassungszeile
   * steht - und die zählt anders: Sie meint die festgelegten
   * Sendungen, die Überschrift meinte auch die angefangene mit. Zwei
   * verschiedene Zahlen übereinander sind schlimmer als keine.
   */
  function briefZusatz() {
    if (tour.geplant.length >= 2) return "";
    const zahl = tour.geplant.length + (aktuelleEtappeAlsPlan() ? 1 : 0);
    return zahl >= 2 ? ` · ${zahl} Sendungen` : "";
  }

  /**
   * Die Kopfzeile, die sich mit jeder Wahl füllt. Sie zeigt den Stand
   * der Planung und ist zugleich der Rückweg: Ein gefülltes Feld
   * antippen heißt, diesen Schritt noch einmal zu machen.
   *
   * Sobald die Tour mehrere Etappen hat, steht über den Feldern die
   * Liste der schon festgelegten - der Frachtbrief wird zum
   * Ladeverzeichnis.
   */
  function frachtbrief() {
    const s = tour.stadt;
    const istDepot = Betrieb.depotName() === s.name;

    const felder = [
      {
        schritt: null,
        marke: "Ab",
        wert: s.name,
        zusatz: istDepot ? "Depot" : s.land
      },
      {
        schritt: "fracht",
        marke: "Ladung",
        wert: frachtName(),
        zusatz: tour.art === "auftrag" && tour.auftrag ? tour.auftrag.nummer
              : tour.art === "spot" ? "Spot" : ""
      },
      {
        schritt: "ziel",
        marke: "Nach",
        wert: tour.ziel ? tour.ziel.name : "",
        zusatz: tour.ziel ? tour.ziel.land : ""
      },
      {
        schritt: "fahrzeug",
        marke: "Wagen",
        wert: tour.fahrzeug ? tour.fahrzeug.kennzeichen : "",
        zusatz: tour.fahrzeug ? `${tour.fahrzeug.marke} ${tour.fahrzeug.modell}` : ""
      }
    ];

    return `
      <div class="tour-frachtbrief">
        <div class="tour-frachtbrief-kopf">
          <!-- Die Zahl steht nur dann hier, wenn es keine
               Zusammenfassungszeile gibt. Sonst stünden zwei
               verschiedene Zahlen übereinander: Die Überschrift zählte
               die angefangene Sendung mit, die Zusammenfassung nicht. -->
          <span class="tour-frachtbrief-titel">
            ${tour.bearbeitet !== null
              ? `Sendung ${tour.bearbeitet + 1} ändern`
              : `Frachtbrief${briefZusatz()}`}
          </span>
          ${tour.bearbeitet !== null ? `
            <button class="win98-button bevel-out" id="tour-btn-aenderung-verwerfen"
                    title="Die Sendung bleibt, wie sie war">
              ↺ Änderung
            </button>`
          : tour.art ? `
            <button class="win98-button bevel-out" id="tour-btn-etappe-verwerfen"
                    title="Nur die angefangene Sendung verwerfen, die übrigen behalten">
              ↺ Sendung
            </button>`
          : (tour.geplant.length > 0 && tour.schritt !== "bereit") ? `
            <button class="win98-button bevel-out" id="tour-btn-zurueck-tour"
                    title="Ohne weitere Sendung zurück zur Durchsicht">
              &#10094; Zur Tour
            </button>` : ""}
          <button class="win98-button bevel-out" id="tour-btn-uebersicht"
                  title="Ganze Planung verwerfen, Stadtauswahl aufheben">✕</button>
        </div>
        ${etappenliste()}
        ${mengenregler()}
        ${ladungsbalken()}
        <div class="tour-frachtbrief-felder">
          ${felder.map((f) => {
            const gefuellt = Boolean(f.wert);
            const anklickbar = gefuellt && f.schritt;
            return `
              <div class="tour-bf-feld ${gefuellt ? "gefuellt" : "offen"} ${anklickbar ? "wechselbar" : ""}"
                   ${anklickbar ? `data-brief-schritt="${f.schritt}"` : ""}
                   ${anklickbar ? `title="Ändern"` : ""}>
                <span class="tour-bf-marke">${f.marke}</span>
                <span class="tour-bf-wert">${gefuellt ? f.wert : "&nbsp;"}</span>
                <span class="tour-bf-zusatz">${gefuellt ? f.zusatz : ""}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  /**
   * Die Tour im Frachtbrief - seit 0.15.38 als HALTE, nicht als
   * Sendungen.
   *
   * Vorher stand dieselbe Tour an zwei Stellen in zwei Modellen: hier
   * als Liste von Sendungen, auf der Durchsicht als Stoppfolge. Der
   * Spieler musste beide im Kopf haben. Jetzt ist es dasselbe Modell,
   * nur in zwei Auflösungen: hier eine Zeile je Halt, auf der
   * Durchsicht derselbe Halt mit allem, was dort wechselt.
   *
   * Ab zwei Sendungen ist die Liste eingeklappt. Grund: Der
   * Frachtbrief steht fest über der Auswahlliste, und jede Zeile hier
   * nimmt der Liste darunter Platz weg. Bei vier Sendungen blieb von
   * der Liste nichts mehr übrig. Aufgeklappt hat sie einen
   * Höhendeckel mit eigenem Rollbalken.
   */
  function etappenliste() {
    const sendungen = alleSendungen();
    const arbeit = inArbeitPlatz();
    const offen = aktuelleEtappeAlsPlan();
    // Eine unvollständige Sendung steht in keiner Stoppfolge - sie hat
    // ja noch kein Ziel. Sie bekommt trotzdem eine Zeile, denn sie
    // trägt den Verwerfen-Knopf.
    const unfertig = offen && !offen.nachName ? offen : null;

    if (sendungen.length === 0 && !unfertig) return "";
    if (sendungen.length === 1 && arbeit === 0 && !unfertig) return "";

    const plan = sendungen.length ? tourPlan(sendungen) : null;
    const einklappbar = sendungen.length >= 2;
    const zu = einklappbar && !etappenAufgeklappt;

    const warnungen = plan && plan.je
      ? plan.je.filter((x) => x.warnung).length
      : 0;
    const summe = sendungen.reduce((s, e) => s + e.entgelt, 0);
    const tonnen = sendungen.reduce((s, e) => s + e.tonnen, 0);

    const kopf = einklappbar ? `
      <button class="tour-etappen-schalter ${zu ? "zu" : "auf"}" id="tour-btn-etappen-klappen"
              title="${zu ? "Alle Halte zeigen" : "Liste einklappen"}">
        <span class="tour-etappen-pfeil">${zu ? "&#9656;" : "&#9662;"}</span>
        <span class="tour-etappen-summe">
          ${sendungen.length} Sendungen · ${summe.toLocaleString("de-DE")} DM · ${tonnen.toFixed(1)} t
        </span>
        ${warnungen ? `<span class="tour-etappen-hinweise">${warnungen} Hinweis${warnungen > 1 ? "e" : ""}</span>` : ""}
      </button>` : "";

    const unfertigZeile = unfertig ? `
      <li class="tour-etappe in-arbeit">
        <span class="tour-etappe-nr">…</span>
        <span class="tour-etappe-weg">${unfertig.vonName} → …</span>
        <span class="tour-etappe-geld">in Arbeit</span>
        <span class="tour-etappe-ladung">${
          unfertig.tonnen > 0 ? `${unfertig.tonnen.toFixed(1)} t ` : ""}${unfertig.gutName}</span>
        <button class="tour-etappe-weg-damit" id="tour-btn-etappe-verwerfen-liste"
                title="Angefangene Sendung verwerfen">✕</button>
      </li>` : "";

    if (!plan || !plan.machbar) {
      return `
        ${kopf}
        <div class="tour-unfahrbar">${plan ? plan.grund : "So nicht fahrbar"}</div>
        ${unfertigZeile ? `<ol class="tour-etappenliste aufgeklappt">${unfertigZeile}</ol>` : ""}
      `;
    }

    const versatz = gruppenVersatz(plan);

    const zeilen = plan.stopps.map((stopp, i) => {
      const wechsel = stopp.laden.length + stopp.abladen.length;
      const beteiligt = stopp.abladen.concat(stopp.laden);
      const w = beteiligt.some((k) => plan.je[k] && plan.je[k].warnung);
      // Welcher Halt gehört zu der Sendung, an der gerade gearbeitet
      // wird? Ohne diese Markierung verlöre man beim Umstieg von der
      // Sendungs- auf die Halteansicht die Auskunft "das hier habe ich
      // gerade in der Hand" - und eingeklappt bliebe gar nichts übrig.
      const imGriff = arbeit >= 0 && beteiligt.includes(arbeit);
      const last = i < plan.belegung.length ? plan.belegung[i].tonnen : 0;
      return {
        imGriff,
        html: `
          <li class="tour-etappe tour-halt-kurz ${w ? "mit-warnung" : ""} ${imGriff ? "in-arbeit" : ""}">
            <span class="tour-etappe-nr">${i + 1}</span>
            <span class="tour-etappe-weg">${stopp.stadt}</span>
            <span class="tour-etappe-geld">${
              i < plan.stopps.length - 1 ? `${last.toFixed(1)} t` : "Ende"}</span>
            <span class="tour-etappe-ladung">${
              stopp.abladen.length ? `▼ ${stopp.abladen.length} ` : ""}${
              stopp.laden.length ? `▲ ${stopp.laden.length}` : ""}${
              wechsel === 0 ? "nur durchfahren" : ""}</span>
            ${haltPfeile(i - versatz, plan.stopps.length - versatz)}
          </li>`
      };
    });

    // Eingeklappt bleiben die Halte stehen, an denen die Sendung
    // wechselt, an der gerade gearbeitet wird - das ist das, was man
    // in der Hand hat. Der Rest der Tour steht in der Zusammenfassung.
    const sichtbar = zu ? zeilen.filter((z) => z.imGriff) : zeilen;
    if (sichtbar.length === 0 && !unfertigZeile) return kopf;

    return `
      ${kopf}
      <ol class="tour-etappenliste ${zu ? "eingeklappt" : "aufgeklappt"}">
        ${sichtbar.map((z) => z.html).join("")}
        ${unfertigZeile}
      </ol>
    `;
  }

  /**
   * Wie viel von einer Spotware geladen wird.
   *
   * Bei einem Auftrag gibt es nichts einzustellen: 23,4 t Papier des
   * Kunden sind 23,4 t, und wer teilt, ließe den Rest liegen und
   * müsste den Termin trotzdem halten. Spotware kauft der Disponent
   * dagegen selbst ein - dort ist die Menge die eigentliche
   * Entscheidung, weil sie darüber bestimmt, was für eine Beiladung
   * noch frei bleibt. Genau das zeigt der Restplatzbalken direkt
   * darunter, und er wandert beim Schieben mit.
   */
  function mengenregler() {
    if (tour.art !== "spot" || !tour.gut) return "";
    const f = tour.fahrzeug || referenzFahrzeug();
    if (!f) return "";

    const max = spotMenge(f, tour.gut);
    if (max <= 0) return "";

    // Die Schrittweite muss zum Fahrzeug passen. Bis 0.15.38 war sie
    // fest 0,5 t bei Mindestmenge 1 t - beim 3,5-Tonner mit 1,4 t
    // Zuladung konnte der Regler damit nur den Wert 1,0 annehmen und
    // sein eigenes Maximum nicht erreichen.
    const schritt = max >= 10 ? 0.5 : max >= 3 ? 0.2 : 0.1;
    // Das Maximum auf ein Vielfaches der Schrittweite legen, sonst ist
    // der letzte Schritt nicht anfahrbar.
    const obergrenze = Math.max(schritt, Math.floor(max / schritt + 1e-9) * schritt);
    const wert = Math.min(obergrenze, tour.tonnen > 0 ? tour.tonnen : obergrenze);
    const preis = tour.ziel
      ? Math.round(Ladung.frachtpreis(tour.gut, wert,
          (Route.berechne(tour.stadt.name, tour.ziel.name) || { km: 0 }).km) * SPOT_FAKTOR)
      : 0;

    return `
      <div class="tour-mengenregler">
        <label class="tour-menge-marke" for="tour-menge">Menge</label>
        <input class="tour-menge-schieber" type="range" id="tour-menge"
               min="${schritt.toFixed(1)}" max="${obergrenze.toFixed(1)}"
               step="${schritt.toFixed(1)}" value="${wert.toFixed(1)}"
               aria-label="Ladungsmenge in Tonnen">
        <output class="tour-menge-wert" id="tour-menge-wert">${wert.toFixed(1)} t</output>
        <span class="tour-menge-max">von ${obergrenze.toFixed(1)} t${
          preis ? ` · ${preis.toLocaleString("de-DE")} DM` : ""}</span>
      </div>
    `;
  }

  /**
   * Wie voll der Auflieger ist. Bei Beiladung ist das die eigentliche
   * Grenze der Planung - und zwar zweifach: Gewicht und Laderaum
   * laufen unterschiedlich schnell voll. Fünf Tonnen Dämmstoff füllen
   * ihn, fünf Tonnen Stahl liegen in einer Ecke.
   */
  function ladungsbalken() {
    // Vor dem Fahrzeugschritt gibt es noch keinen Wagen. Statt gar
    // nichts zu zeigen, wird gegen den Wagen gerechnet, mit dem auch
    // der Zielschritt rechnet - und das wird dazugesagt.
    const f = tour.fahrzeug || referenzFahrzeug();
    if (!f) return "";
    const geschaetzt = !tour.fahrzeug;

    const alle = tour.geplant.slice();
    const offen = aktuelleEtappeAlsPlan();
    if (offen && offen.tonnen > 0 && offen.nachName) alle.push(offen);
    if (alle.length === 0) return "";

    const plan = tourPlan(alle);
    if (!plan || !plan.machbar || !plan.belegung) return "";

    const zulT = (f.zuladungKg || 24000) / 1000;
    const zulV = Ladung.ladevolumen(f);

    const lastT = (b) => b.sendungen.reduce((s, k) => s + alle[k].tonnen, 0);
    const lastV = (b) => b.sendungen.reduce((s, k) =>
      s + Ladung.volumenM3(alle[k].gut, alle[k].tonnen), 0);

    // Die Balken zeigen den vollsten Abschnitt - das ist die Grenze
    // der Tour als Ganzes.
    let maxT = 0;
    let maxV = 0;
    plan.belegung.forEach((b) => {
      maxT = Math.max(maxT, lastT(b));
      maxV = Math.max(maxV, lastV(b));
    });

    const antT = Math.min(1, maxT / zulT);
    const antV = Math.min(1, maxV / zulV);

    // Der Rest gilt dagegen NICHT für die Tour, sondern für den Ort,
    // an dem gerade geladen wird. Beides zu vermengen wäre der
    // häufigste Irrtum: Nach einem Abladestopp ist wieder Platz, auch
    // wenn der Auflieger vorher randvoll war.
    const i = plan.stopps.map((st) => st.stadt).lastIndexOf(tour.stadt.name);
    const hier = i >= 0 && i < plan.belegung.length ? plan.belegung[i] : null;
    const freiT = Math.max(0, zulT - (hier ? lastT(hier) : 0));
    const freiV = Math.max(0, zulV - (hier ? lastV(hier) : 0));

    // Welche der beiden Grenzen zuerst greift. Ohne diesen Hinweis
    // wundert man sich, warum bei halb vollem Gewicht nichts mehr
    // draufpasst: Dämmstoff füllt den Laderaum, Stahl das Gewicht.
    const engVolumen = (1 - freiV / zulV) > (1 - freiT / zulT);

    return `
      <div class="tour-ladungsstand" id="tour-ladungsstand">
        <div class="tour-restplatz ${freiT < zulT * 0.1 && freiV < zulV * 0.1 ? "voll" : ""}">
          <span class="tour-restplatz-marke">Ab ${tour.stadt.name} frei</span>
          <span class="tour-restwert ${engVolumen ? "" : "eng"}">${freiT.toFixed(1)} t</span>
          <span class="tour-restwert ${engVolumen ? "eng" : ""}">${freiV.toFixed(0)} m³</span>
          ${spaeterFrei(plan, alle, i, zulT, freiT)}
          ${geschaetzt ? `<span class="tour-restplatz-wagen">gegen ${f.kennzeichen}</span>` : ""}
        </div>
        <div class="tour-ladungsbalken-reihe">
          <span class="tour-ladungsbalken" title="Vollster Abschnitt: ${maxT.toFixed(1)} von ${zulT.toFixed(1)} t">
            <span class="tour-ladungsfuellung" style="width:${Math.round(antT * 100)}%"></span>
            <span class="tour-ladungswert">${maxT.toFixed(1)} / ${zulT.toFixed(1)} t</span>
          </span>
          <span class="tour-ladungsbalken" title="Vollster Abschnitt: ${maxV.toFixed(0)} von ${zulV} m³">
            <span class="tour-ladungsfuellung" style="width:${Math.round(antV * 100)}%"></span>
            <span class="tour-ladungswert">${maxV.toFixed(0)} / ${zulV} m³</span>
          </span>
        </div>
      </div>
    `;
  }

  /**
   * "ab Hannover 19,0 t" - der Hinweis, dass weiter hinten in der Tour
   * wieder Platz ist. Er erscheint nur, wenn er etwas ändert: Hier ist
   * es eng, dort deutlich weniger. Sonst bliebe es eine Zeile, die
   * immer dasteht und nie etwas sagt.
   */
  function spaeterFrei(plan, alle, abIndex, zulT, freiT) {
    if (abIndex < 0) return "";
    if (freiT > zulT * 0.35) return "";   // hier ist genug Platz

    let besterT = freiT;
    let besteStadt = "";
    for (let k = abIndex + 1; k < plan.belegung.length; k++) {
      const t = plan.belegung[k].sendungen.reduce((s, j) => s + alle[j].tonnen, 0);
      const frei = Math.max(0, zulT - t);
      if (frei > besterT + 2) { besterT = frei; besteStadt = plan.stopps[k].stadt; }
    }
    if (!besteStadt) return "";
    return `<span class="tour-restspaeter">ab ${besteStadt} ${besterT.toFixed(1)} t</span>`;
  }

  /** Summe über alle Sendungen der Tour. */
  function tourSumme(sendungen) {
    const f = tour.fahrzeug;
    const plan = tourPlan(sendungen);
    const erloes = sendungen.reduce((s, e) => s + e.entgelt, 0);
    if (!plan || !plan.machbar) {
      return { erloes, km: 0, leerKm: 0, sprit: 0, db: erloes, plan };
    }
    const sprit = f ? spritkostenFuer(f, plan.km) : 0;
    return { erloes, km: plan.km - plan.leerKm, leerKm: plan.leerKm,
             sprit, db: erloes - sprit, plan };
  }

  /** Kurzbezeichnung der gewählten Ladung für den Frachtbrief. */
  function frachtName() {
    if (tour.art === "auftrag" && tour.auftrag) {
      const g = Auftraege.gut(tour.auftrag);
      return `${tour.auftrag.tonnen.toFixed(1)} t ${g.name}`;
    }
    if (tour.art === "spot" && tour.gut) {
      return tour.tonnen > 0
        ? `${tour.tonnen.toFixed(1)} t ${tour.gut.name}`
        : tour.gut.name;
    }
    return "";
  }

  /** Überschrift über der jeweiligen Liste - was ist jetzt zu tun. */
  function schrittTitel(text, hinweis) {
    const nr = (SCHRITTE.find((x) => x.id === tour.schritt) || {}).nr || "";
    return `
      <div class="tour-schrittkopf">
        <span class="tour-schrittkopf-nr">${nr}</span>
        <span class="tour-schrittkopf-text">${text}</span>
        ${hinweis ? `<span class="tour-schrittkopf-hinweis">${hinweis}</span>` : ""}
      </div>
    `;
  }

  function schrittInhalt() {
    switch (tour.schritt) {
      case "fracht": return schrittFracht();
      case "ziel": return schrittZiel();
      case "fahrzeug": return schrittFahrzeug();
      case "bereit": return schrittBereit();
      default: return "";
    }
  }

  /** Fahrzeuge an einem Ort, die sofort eingesetzt werden können. */
  function verfuegbareFahrzeuge(stadtName) {
    return FuhrparkApp.fahrzeugeAn(stadtName).filter(
      (f) => f.status !== "stillstehend" && !Fahrt.istUnterwegs(f.id)
    );
  }

  function alleVerfuegbaren() {
    return FuhrparkApp.alleFahrzeuge().filter(
      (f) => f.status !== "stillstehend" && !Fahrt.istUnterwegs(f.id)
    );
  }

  /** Spritkosten einer Strecke für ein bestimmtes Fahrzeug. */
  function spritkostenFuer(fahrzeug, km) {
    return Math.round((km / 100) * fahrzeug.verbrauchBasisL100km * dieselpreis());
  }

  /** Reine Fahrzeit inklusive der vorgeschriebenen Ruhezeiten. */
  function fahrdauerStunden(km) {
    const fahrStunden = km / Fahrt.SCHNITT_STANDARD;
    const ruhe = Math.floor(fahrStunden / Fahrt.LENKZEIT_STUNDEN) * Fahrt.RUHEZEIT_STUNDEN;
    return Math.round(fahrStunden + ruhe);
  }

  function dauerText(stunden) {
    if (stunden < 24) return `${stunden} Std`;
    const tage = Math.floor(stunden / 24);
    const rest = stunden % 24;
    return rest === 0 ? `${tage} Tage` : `${tage} Tage ${rest} Std`;
  }

  /** Menge, die dieses Fahrzeug von diesem Gut mitnehmen kann. */
  function spotMenge(fahrzeug, gut) {
    // Bei Beiladung zählt, was nach den schon geplanten Sendungen noch
    // frei ist - nicht, was der leere Auflieger fassen würde.
    return Ladung.restMengeTonnen(fahrzeug, mitgeplanteLadung(), gut);
  }

  /**
   * Gegen welche Fahrzeuge geprüft wird, solange keines gewählt ist:
   * die vor Ort stehenden, sonst der ganze freie Bestand - denn wer
   * nichts vor Ort hat, kann eins anfordern.
   */
  function frachtKandidaten(stadtName) {
    const vorOrt = verfuegbareFahrzeuge(stadtName);
    return vorOrt.length ? vorOrt : alleVerfuegbaren();
  }

  /**
   * Das Fahrzeug, mit dem im Zielschritt gerechnet wird. Ein Wagen ist
   * dort noch nicht gewählt, die Erlöse hängen bei Spotladung aber an
   * der Menge. Genommen wird der Kandidat mit der größten Zuladung -
   * das ist der Richtwert, den der Fahrzeugschritt dann je Zeile genau
   * beziffert.
   */
  function referenzFahrzeug() {
    if (tour.fahrzeug) return tour.fahrzeug;
    const kandidaten = frachtKandidaten(tour.stadt.name)
      .filter((f) => !frachtHindernis(f));
    if (kandidaten.length === 0) return null;
    if (tour.art === "spot" && tour.gut) {
      return kandidaten.reduce((a, b) =>
        spotMenge(b, tour.gut) > spotMenge(a, tour.gut) ? b : a);
    }
    return kandidaten[0];
  }

  /**
   * Warum dieses Fahrzeug die gewählte Fracht nicht nehmen kann.
   * Gibt null zurück, wenn nichts dagegen spricht.
   */
  function frachtHindernis(f) {
    if (tour.art === "auftrag" && tour.auftrag) {
      const a = tour.auftrag;
      const g = Auftraege.gut(a);
      if (!Ladung.kannLaden(f, g)) return `Aufbau ${f.aufbautyp} ungeeignet`;
      const maxT = Ladung.restMengeTonnen(f, mitgeplanteLadung(), g);
      if (maxT < a.tonnen) {
        return `nur ${maxT.toFixed(1)} t möglich, gebraucht werden ${a.tonnen.toFixed(1)} t`;
      }
      return null;
    }
    if (tour.art === "spot" && tour.gut) {
      const g = tour.gut;
      if (!Ladung.kannLaden(f, g)) return `Aufbau ${f.aufbautyp} ungeeignet`;
      if (spotMenge(f, g) <= 0) return "keine Menge ladbar";
      return null;
    }
    return null;
  }

  /**
   * Was beim Verlassen der Planungsstadt schon an Bord ist. Genau das
   * ist die Grenze für die nächste Sendung.
   *
   * Der Unterschied zwischen Beiladung und Anschluss steckt allein
   * hier: Wer in derselben Stadt noch etwas dazulädt, teilt sich den
   * Auflieger mit dem, was dort aufgeladen wird. Wer am Ziel der
   * letzten Sendung weiterlädt, findet ihn leer vor - sie ist dann ja
   * längst abgeladen.
   */
  function mitgeplanteLadung() {
    if (!tour.stadt || tour.geplant.length === 0) return [];

    const plan = tourPlan(tour.geplant);
    if (!plan || !plan.machbar || !plan.belegung) {
      // Im Zweifel streng rechnen: lieber eine Sendung zu viel sperren
      // als eine Tour anbieten, die sich nicht fahren lässt.
      return tour.geplant.map((e) => ({ gut: e.gut, tonnen: e.tonnen }));
    }

    const i = plan.stopps.map((st) => st.stadt).lastIndexOf(tour.stadt.name);
    if (i < 0 || i >= plan.belegung.length) return [];

    return plan.belegung[i].sendungen.map((k) => ({
      gut: tour.geplant[k].gut,
      tonnen: tour.geplant[k].tonnen
    }));
  }

  function frachtGewaehlt() {
    return (tour.art === "auftrag" && tour.auftrag) || (tour.art === "spot" && tour.gut);
  }

  /**
   * Der Balken hinter der Schrift. Er bedeutet in jeder Liste dasselbe:
   * lang ist gut. `anteil` liegt zwischen 0 und 1, `klasse` färbt.
   *
   * Klassenname bewusst "tour-fristbalken": "tour-ablauf" gehört seit
   * jeher dem Rahmen um den Planungsablauf. Die Doppelbelegung machte
   * diesen Rahmen absolut positioniert und pointer-events: none - die
   * ganze Tourenplanung war damit tot und ließ sich nicht scrollen.
   */
  function guetebalken(anteil, klasse, titel) {
    const breite = Math.round(Math.max(0, Math.min(1, anteil)) * 100);
    return `<span class="tour-fristbalken ${klasse}"
                  style="width:${breite}%"
                  title="${titel}"></span>`;
  }

  /** Der Balken einer Auftragszeile: verbleibende Standzeit am Markt. */
  function fristbalken(a, verspaetet) {
    const rest = Auftraege.restanteil(a);
    const stunden = Auftraege.restStunden(a);

    let klasse = "tour-frist-viel";
    if (rest < 0.2) klasse = "tour-frist-knapp";
    else if (rest < 0.5) klasse = "tour-frist-mittel";
    if (verspaetet) klasse = "tour-frist-spaet";

    return guetebalken(rest, klasse, verspaetet
      ? `Liefertermin nicht zu halten · noch ${stunden} Std am Markt`
      : `Noch ${stunden} Std am Markt`);
  }

  /** Der Haken am Zeilenende: Diese Zeile ist anwählbar. */
  const ZEILENPFEIL = `<span class="tour-weiterpfeil" aria-hidden="true">&#10095;</span>`;

  // ---------- 1. Fracht ----------

  /**
   * Was geht von hier aus? Oben die festen Aufträge mit Ziel und Frist,
   * darunter das freie Warenangebot der Region, bei dem der Disponent
   * das Ziel selbst sucht.
   */
  function schrittFracht() {
    const s = tour.stadt;
    const frachten = Auftraege.fuerStadt(s);
    const angebot = Wirtschaft.angebot(s);
    const kandidaten = frachtKandidaten(s.name);
    const istDepot = Betrieb.depotName() === s.name;
    const vorOrt = verfuegbareFahrzeuge(s.name);

    return `
      ${schrittTitel(`Was soll ab ${s.name} gefahren werden?`,
        vorOrt.length
          ? `${vorOrt.length} Fahrzeug${vorOrt.length > 1 ? "e" : ""} vor Ort`
          : "kein Fahrzeug vor Ort")}

      <div class="tour-ausgang-teil">Feste Aufträge (${frachten.length})</div>
      <ul class="tour-auswahlliste tour-liste-voll">
        ${frachten.length === 0
          ? `<li class="tour-ware-leer">Zurzeit keine offenen Aufträge.</li>`
          : frachten.slice(0, 15).map((a) => frachtZeileAuftrag(a, kandidaten)).join("")}
      </ul>

      <div class="tour-ausgang-teil">Warenangebot der Region (${angebot.length})</div>
      <ul class="tour-auswahlliste tour-liste-voll">
        ${angebot.length === 0
          ? `<li class="tour-ware-leer">Die Region bietet nichts an.</li>`
          : angebot.map((g) => frachtZeileSpot(g, kandidaten)).join("")}
      </ul>

      ${!istDepot
        ? `<div class="tour-dispo-aktionen">
             <button class="win98-button bevel-out" id="tour-btn-depot-hierher">
               🏠 Depot hierher verlegen
             </button>
           </div>`
        : ""}
    `;
  }

  /**
   * Eine Auftragszeile. Geprüft wird gegen alle Fahrzeuge, die für
   * diese Stadt infrage kommen - ein Fahrzeug ist ja noch nicht
   * gewählt. Gesperrt ist die Zeile erst, wenn keines davon die Ladung
   * nehmen könnte.
   */
  function frachtZeileAuftrag(a, kandidaten) {
    const g = Auftraege.gut(a);
    const belegt = mitgeplanteLadung();
    const ladbar = kandidaten.filter((f) => Ladung.kannLaden(f, g));
    const passend = ladbar.filter((f) => Ladung.restMengeTonnen(f, belegt, g) >= a.tonnen);
    const gesperrt = passend.length === 0;

    let grund = "";
    if (ladbar.length === 0) {
      grund = "Kein passender Aufbau verfügbar";
    } else if (gesperrt) {
      const maxT = Math.max(...ladbar.map((f) => Ladung.restMengeTonnen(f, belegt, g)));
      grund = belegt.length
        ? `Neben der bisherigen Ladung nur noch ${maxT.toFixed(1)} t frei`
        : `Zuladung reicht nicht (höchstens ${maxT.toFixed(1)} t)`;
    }

    // Umgekehrt bei den Zeilen, die passen: Wieviel bliebe danach noch
    // übrig? Nur beim Beiladen von Belang - beim leeren Auflieger wäre
    // es eine Zahl, die an jeder Zeile steht und nichts unterscheidet.
    let rest = "";
    if (!gesperrt && belegt.length) {
      const frei = Math.max(...passend.map((f) => Ladung.restMengeTonnen(f, belegt, g)));
      rest = `${(frei - a.tonnen).toFixed(1)} t blieben frei`;
    }

    // Rot, wenn kein einziges passendes Fahrzeug den Termin noch
    // halten könnte - die Leeranfahrt eingerechnet.
    const verspaetet = gesperrt || !passend.some((f) => {
      const m = Auftraege.terminMachbar(a, f.standort);
      return m && m.puenktlich;
    });

    const gewaehlt = tour.art === "auftrag" && tour.auftrag && tour.auftrag.nummer === a.nummer;

    return `
      <li class="tour-auswahl tour-auftrag ${gewaehlt ? "gewaehlt" : ""} ${gesperrt ? "gesperrt" : ""}"
          data-fracht-auftrag="${a.nummer}"
          data-vorschau-art="auftrag"
          data-vorschau-gut="${g.id}"
          data-vorschau-von="${a.vonName}"
          data-vorschau-ziel="${a.nachName}">
        ${fristbalken(a, verspaetet)}
        ${gesperrt ? "" : ZEILENPFEIL}
        <span class="tour-auswahl-name">
          <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                data-auftrag-ware="${g.id}">${aufbauKurz(g.aufbau)}</span>
          → ${a.nachName}
          <span class="tour-auftrag-nummer">${a.nummer}</span>
        </span>
        <span class="tour-auswahl-zusatz">
          ${a.tonnen.toFixed(1)} t ${g.name} · ${a.km.toLocaleString("de-DE")} km ·
          <strong>${a.entgelt.toLocaleString("de-DE")} DM</strong>
        </span>
        <span class="tour-auswahl-zusatz">
          ${a.quelle === "kunde"
            ? `<span class="tour-kundenmarke">${a.kundeName}</span>`
            : `<span class="tour-boersenmarke">Frachtbörse</span>`}
          Liefern bis ${Spielzeit.formatiereMitUhrzeit(new Date(a.lieferFrist))}
          ${rest ? `<span class="tour-restmarke">${rest}</span>` : ""}
          ${grund ? `<span class="tour-warnung">${grund}</span>` : ""}
        </span>
      </li>
    `;
  }

  function frachtZeileSpot(g, kandidaten) {
    const ladbar = kandidaten.filter((f) => Ladung.kannLaden(f, g));
    const menge = ladbar.length ? Math.max(...ladbar.map((f) => spotMenge(f, g))) : 0;
    const gesperrt = menge <= 0;
    const gewaehlt = tour.art === "spot" && tour.gut && tour.gut.id === g.id;

    // Wie viele Städte diese Ware überhaupt nachfragen. Ohne Abnehmer
    // ist eine Spotladung wertlos, und das soll man sehen, bevor man
    // sie wählt.
    const abnehmer = Karte.alleStaedte().filter((z) =>
      z.name !== tour.stadt.name && Wirtschaft.bedarf(z).some((b) => b.id === g.id)).length;

    return `
      <li class="tour-auswahl ${gewaehlt ? "gewaehlt" : ""} ${gesperrt || abnehmer === 0 ? "gesperrt" : ""}"
          data-fracht-gut="${g.id}"
          data-vorschau-art="spot"
          data-vorschau-gut="${g.id}">
        ${gesperrt ? "" : ZEILENPFEIL}
        <span class="tour-auswahl-name">
          <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                data-auftrag-ware="${g.id}">${aufbauKurz(g.aufbau)}</span>
          ${g.name}
          <span class="tour-spotmarke">Spot</span>
        </span>
        <span class="tour-auswahl-zusatz">
          ${gesperrt
            ? `<span class="tour-warnung">Kein passender Aufbau verfügbar</span>`
            : `bis ${menge.toFixed(1)} t ladbar · ${g.wertProTonne.toLocaleString("de-DE")} DM je Tonne Warenwert`}
        </span>
        <span class="tour-auswahl-zusatz">
          ${g.verderblich ? `<span class="tour-ware-merkmal">Kühlung</span>` : ""}
          ${g.gefahrgut ? `<span class="tour-ware-merkmal tour-merkmal-gefahr">ADR</span>` : ""}
          ${abnehmer === 0
            ? `<span class="tour-warnung">Niemand fragt diese Ware nach</span>`
            : `<span class="tour-abnehmer">${abnehmer} Abnehmerstädte</span> · keine Frist`}
        </span>
      </li>
    `;
  }

  // ---------- 2. Ziel ----------

  /**
   * Bei Spotladung die Städte mit Bedarf, nach Deckungsbeitrag
   * sortiert. Bei einem festen Auftrag gibt der Auftraggeber das Ziel
   * vor - dann steht hier genau eine Zeile mit den Lieferbedingungen.
   *
   * Bewusst kein übersprungener Schritt: Derselbe Handgriff an
   * derselben Stelle, jedes Mal. Ein Ablauf, der je nach Frachtart mal
   * drei und mal vier Schritte hat, lässt sich nicht einüben.
   */
  function schrittZiel() {
    const s = tour.stadt;

    if (tour.art === "auftrag") {
      const a = tour.auftrag;
      const g = Auftraege.gut(a);
      const route = Route.berechne(a.vonName, a.nachName);
      const f = referenzFahrzeug();
      const sprit = f && route ? spritkostenFuer(f, route.km) : 0;

      return `
        ${schrittTitel("Ziel steht fest", "vom Auftraggeber vorgegeben")}
        <ul class="tour-auswahlliste">
          <li class="tour-auswahl gewaehlt" data-ziel="${a.nachName}"
              data-vorschau-art="ziel"
              data-vorschau-von="${a.vonName}"
              data-vorschau-ziel="${a.nachName}">
            ${ZEILENPFEIL}
            <span class="tour-auswahl-name">
              ${a.nachName}
              <span class="tour-auftrag-nummer">${STAEDTE[a.nachName] ? STAEDTE[a.nachName].land : ""}</span>
            </span>
            <span class="tour-auswahl-zusatz">
              ${a.km.toLocaleString("de-DE")} km ·
              ${dauerText(fahrdauerStunden(a.km))} ·
              <strong>${a.entgelt.toLocaleString("de-DE")} DM</strong>
            </span>
            <span class="tour-auswahl-zusatz">
              ${a.tonnen.toFixed(1)} t ${g.name} ·
              Liefern bis ${Spielzeit.formatiereMitUhrzeit(new Date(a.lieferFrist))}
              ${sprit ? ` · Sprit rund ${sprit.toLocaleString("de-DE")} DM` : ""}
            </span>
          </li>
        </ul>
        <p class="tour-anleitung">
          ${a.quelle === "kunde"
            ? `${a.kundeName} verlangt Zustellung an diesen Ort.`
            : `Der Auftrag von der Frachtbörse ist an diesen Ort gebunden.`}
          Zum Weiterfahren antippen.
        </p>
      `;
    }

    // Freier Markt: Ziel selbst wählen
    const g = tour.gut;
    const f = referenzFahrzeug();
    const menge = f ? spotMenge(f, g) : 0;

    const ziele = Karte.alleStaedte()
      .filter((z) => z.name !== s.name && Wirtschaft.bedarf(z).some((b) => b.id === g.id))
      .map((z) => zielBewerten(z, g, menge, f))
      .filter(Boolean);

    if (ziele.length === 0) {
      return `
        ${schrittTitel(`Wohin mit ${g.name}?`, "")}
        <div class="tour-ware-leer">Niemand fragt diese Ware nach.</div>
      `;
    }

    // Zwei Reiter statt zweier Listen untereinander.
    //
    // Nach Deckungsbeitrag je Tour sortiert, standen früher 25 Ziele
    // auf der iberischen Halbinsel ganz oben und alles Nahe fiel
    // heraus - Leipzig-Berlin war Platz 83 von 83 und damit unsichtbar,
    // obwohl es je Tag das bessere Geschäft ist. Jede
    // Entfernungsklasse bekommt deshalb ihre eigene Rangliste, und weil
    // immer nur eine davon sichtbar ist, passen mehr Zeilen hinein,
    // ohne dass man an der anderen vorbeiscrollen muss.
    const nah = ziele.filter((e) => e.route.km <= NAHBEREICH_KM)
      .sort((a, b) => b.dbTag - a.dbTag);
    const fern = ziele.filter((e) => e.route.km > NAHBEREICH_KM)
      .sort((a, b) => b.dbTag - a.dbTag);

    // Ein leerer Reiter wäre eine Sackgasse: Dann zeigt der andere.
    if (zielReiter === "nah" && nah.length === 0) zielReiter = "fern";
    if (zielReiter === "fern" && fern.length === 0) zielReiter = "nah";

    const gezeigt = (zielReiter === "nah" ? nah : fern).slice(0, ZIELE_JE_REITER);
    const bester = Math.max(1, ...ziele.map((e) => e.dbTag));

    return `
      ${schrittTitel(`Wohin mit ${g.name}?`,
        f ? `gerechnet mit ${menge.toFixed(1)} t` : "kein passendes Fahrzeug")}

      <div class="tour-reiterleiste">
        <button class="tour-reiter ${zielReiter === "nah" ? "aktiv" : ""}"
                data-zielreiter="nah" ${nah.length === 0 ? "disabled" : ""}>
          In der Nähe <span class="tour-reiter-zahl">${nah.length}</span>
        </button>
        <button class="tour-reiter ${zielReiter === "fern" ? "aktiv" : ""}"
                data-zielreiter="fern" ${fern.length === 0 ? "disabled" : ""}>
          Fernverkehr <span class="tour-reiter-zahl">${fern.length}</span>
        </button>
      </div>

      <div class="tour-reiterblatt">
        <div class="tour-reiter-hinweis">
          ${zielReiter === "nah"
            ? `bis ${NAHBEREICH_KM} km · abends wieder greifbar`
            : `über ${NAHBEREICH_KM} km · bindet den Wagen mehrere Tage`}
          · nach Deckungsbeitrag je Tag
        </div>
        <ul class="tour-auswahlliste">
          ${gezeigt.map((e) => zielZeile(e, bester, s)).join("")}
        </ul>
        ${(zielReiter === "nah" ? nah : fern).length > ZIELE_JE_REITER
          ? `<div class="tour-ware-leer">
               Die besten ${ZIELE_JE_REITER} von
               ${(zielReiter === "nah" ? nah : fern).length}.
             </div>`
          : ""}
      </div>
    `;
  }

  // Welcher Reiter im Zielschritt offen ist. Bleibt über den Schritt
  // hinaus stehen: Wer im Fernverkehr sucht, sucht meist weiter dort.
  let zielReiter = "nah";

  // Bis hierher gilt eine Fahrt als Nahverkehr. 400 km sind gut ein
  // Lenktag hin - man ist abends wieder am Ausgangsort oder kommt am
  // nächsten Morgen an.
  const NAHBEREICH_KM = 400;

  // Wie viele Ziele je Reiter angeboten werden. Mehr als früher je
  // Abschnitt: Es ist ja immer nur eine Liste sichtbar.
  const ZIELE_JE_REITER = 15;

  /**
   * Ein Ziel durchrechnen: Erlös, Sprit, Dauer - und daraus der
   * Deckungsbeitrag JE TAG.
   *
   * Der Deckungsbeitrag einer Tour sagt, was in die Kasse kommt; der
   * je Tag sagt, was sie wert war. Nur der zweite lässt sich zwischen
   * 180 und 2.900 km vergleichen, und nur er entspricht dem, woran ein
   * Spediteur sein Geschäft misst.
   */
  function zielBewerten(z, gut, menge, fahrzeug) {
    const route = Route.berechne(tour.stadt.name, z.name);
    if (!route) return null;

    const entgelt = Math.round(Ladung.frachtpreis(gut, menge, route.km) * SPOT_FAKTOR);
    const sprit = fahrzeug ? spritkostenFuer(fahrzeug, route.km) : 0;
    const db = entgelt - sprit;

    const aufbau = fahrzeug && fahrzeug.aufbautyp
      ? String(fahrzeug.aufbautyp).toLowerCase() : "standard";
    const stunden = Auftraege.dauerStunden(route.km)
      + Kostensaetze.standzeit("laden", aufbau)
      + Kostensaetze.standzeit("abladen", aufbau);
    const tage = Math.max(0.1, stunden / 24);

    return {
      z, route, entgelt, sprit, db,
      stunden, tage,
      dbTag: Math.round(db / tage),
      rueckfracht: rueckfrachtAngebot(z)
    };
  }

  /**
   * Wie gut die Aussicht auf eine Rückladung ist.
   *
   * Nicht die Zahl der offenen Aufträge: Die Börse erzeugt für jede
   * angesteuerte Stadt mindestens sechs, sobald man hinsieht - für
   * entfernte Städte stünde dort also immer "keine", und das wäre
   * schlicht falsch. Es zählt die Güte des Frachtplatzes: Eine
   * Millionenstadt oder ein Frachtknoten hat immer etwas, ein
   * Landstädtchen selten etwas Gutes. Dazu die Aufträge, die schon
   * offen sind.
   */
  function rueckfrachtAngebot(stadt) {
    const offene = Auftraege.offene().filter((a) => a.vonName === stadt.name).length;
    const einw = stadt.einw || 0;

    let stufe = "duenn";
    if (stadt.knoten || einw >= 1000000) stufe = "stark";
    else if (einw >= 400000) stufe = "mittel";

    const text = stufe === "stark" ? "starker Frachtplatz"
      : stufe === "mittel" ? "mittlerer Frachtplatz"
      : "dünner Frachtplatz";

    return { stufe, offene, text: offene > 0 ? `${text}, ${offene} offen` : text };
  }

  function zielZeile(e, besterDbTag, ausgangsstadt) {
    const gewaehlt = tour.ziel && tour.ziel.name === e.z.name;
    const anteil = e.dbTag / besterDbTag;
    const klasse = e.db <= 0 ? "tour-frist-spaet"
      : anteil > 0.66 ? "tour-frist-viel"
      : anteil > 0.33 ? "tour-frist-mittel" : "tour-frist-knapp";

    return `
      <li class="tour-auswahl ${gewaehlt ? "gewaehlt" : ""}"
          data-ziel="${e.z.name}"
          data-vorschau-art="ziel"
          data-vorschau-von="${ausgangsstadt.name}"
          data-vorschau-ziel="${e.z.name}">
        ${guetebalken(anteil, klasse,
            `${e.dbTag.toLocaleString("de-DE")} DM Deckungsbeitrag je Tag`)}
        ${ZEILENPFEIL}
        <span class="tour-auswahl-name">
          ${e.z.name}
          <span class="tour-auftrag-nummer">${e.z.land}</span>
        </span>
        <span class="tour-auswahl-zusatz">
          ${e.route.km.toLocaleString("de-DE")} km ·
          bindet ${dauerText(Math.round(e.stunden))} ·
          ${e.entgelt.toLocaleString("de-DE")} DM
        </span>
        <span class="tour-auswahl-zusatz">
          Deckungsbeitrag
          <strong class="${e.db > 0 ? "tour-positiv" : "tour-negativ"}">
            ${e.db.toLocaleString("de-DE")} DM</strong>
          · <strong class="tour-jetag">${e.dbTag.toLocaleString("de-DE")} DM je Tag</strong>
        </span>
        <span class="tour-auswahl-zusatz">
          Rückfracht:
          ${e.rueckfracht.stufe === "stark"
            ? `<span class="tour-rueck-gut">${e.rueckfracht.text}</span>`
            : e.rueckfracht.stufe === "mittel"
              ? `<span class="tour-rueck-mittel">${e.rueckfracht.text}</span>`
              : `<span class="tour-rueck-duenn">${e.rueckfracht.text}</span>`}
        </span>
      </li>
    `;
  }

  // ---------- 3. Fahrzeug ----------

  /**
   * Zuletzt der Wagen - und erst jetzt lässt sich die Liste sortieren
   * statt nur aufzählen: Ladung, Entfernung und Termin stehen fest,
   * also steht je Zeile, was diese Fahrt mit diesem Fahrzeug einbringt
   * und ob es den Termin hält. Wer nicht kann, steht gesperrt darunter
   * mit dem Grund.
   */
  function schrittFahrzeug() {
    const s = tour.stadt;
    const vorOrt = verfuegbareFahrzeuge(s.name);
    const passend = vorOrt.filter((f) => !frachtHindernis(f));
    const gesperrt = vorOrt.filter((f) => frachtHindernis(f));

    const bewertet = passend
      .map((f) => ({ f, ...fahrtWerte(f) }))
      .sort((a, b) => b.db - a.db);
    const besterDb = bewertet.length ? Math.max(1, bewertet[0].db) : 1;

    return `
      ${schrittTitel("Welcher Wagen fährt?",
        passend.length
          ? `${passend.length} von ${vorOrt.length} in ${s.name} geeignet`
          : `keiner in ${s.name} geeignet`)}

      ${bewertet.length
        ? `<ul class="tour-auswahlliste">
             ${bewertet.map((e) => fahrzeugZeile(e, besterDb)).join("")}
           </ul>`
        : ""}

      ${gesperrt.length
        ? `<ul class="tour-auswahlliste">
             ${gesperrt.map((f) => fahrzeugZeileGesperrt(f)).join("")}
           </ul>`
        : ""}

      ${passend.length === 0 ? anforderungsliste(s) : ""}
    `;
  }

  /**
   * Was diese Fahrt mit diesem Fahrzeug einbringt - Leeranfahrt zur
   * Ladestelle eingerechnet, denn die zahlt niemand.
   */
  function fahrtWerte(f) {
    const s = tour.stadt;
    const anfahrt = f.standort === s.name ? null : Route.berechne(f.standort, s.name);
    const anfahrtKm = anfahrt ? anfahrt.km : 0;

    if (tour.art === "auftrag") {
      const a = tour.auftrag;
      const m = Auftraege.terminMachbar(a, f.standort);
      const gesamtKm = anfahrtKm + a.km;
      const sprit = spritkostenFuer(f, gesamtKm);
      return {
        tonnen: a.tonnen, km: a.km, anfahrtKm, entgelt: a.entgelt,
        sprit, db: a.entgelt - sprit, machbarkeit: m,
        puenktlich: Boolean(m && m.puenktlich)
      };
    }

    const g = tour.gut;
    const tonnen = spotMenge(f, g);
    const route = tour.ziel ? Route.berechne(s.name, tour.ziel.name) : null;
    const km = route ? route.km : 0;
    const entgelt = Math.round(Ladung.frachtpreis(g, tonnen, km) * SPOT_FAKTOR);
    const sprit = spritkostenFuer(f, anfahrtKm + km);
    return {
      tonnen, km, anfahrtKm, entgelt, sprit, db: entgelt - sprit,
      machbarkeit: null, puenktlich: true
    };
  }

  function fahrzeugZeile(e, besterDb) {
    const f = e.f;
    const gewaehlt = tour.fahrzeug && tour.fahrzeug.id === f.id;

    // Der Balken misst hier den Deckungsbeitrag im Verhältnis zum
    // besten Wagen - und wird rot, wenn der Termin fällt. Ein
    // verspätetes Fahrzeug ist auch dann die schlechtere Wahl, wenn es
    // rechnerisch mehr einbringt.
    const klasse = !e.puenktlich ? "tour-frist-spaet"
      : e.db > besterDb * 0.66 ? "tour-frist-viel"
      : e.db > besterDb * 0.33 ? "tour-frist-mittel" : "tour-frist-knapp";

    return `
      <li class="tour-auswahl ${gewaehlt ? "gewaehlt" : ""}" data-fahrzeug="${f.id}">
        ${guetebalken(e.db / besterDb, klasse,
            `Deckungsbeitrag ${e.db.toLocaleString("de-DE")} DM`)}
        ${ZEILENPFEIL}
        <span class="tour-auswahl-name">
          <span class="tour-flottenpunkt"
                style="background:${Lackierung.cssFarbe(f.lackierung)};
                       border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"></span>
          ${f.marke} ${f.modell}
          <span class="tour-auftrag-nummer">${f.kennzeichen}</span>
        </span>
        <span class="tour-auswahl-zusatz">
          lädt ${e.tonnen.toFixed(1)} t · ${f.aufbautyp} ·
          Zustand ${Math.round(Verschleiss.gesamtzustand(f))} %
        </span>
        <span class="tour-auswahl-zusatz">
          Erlös ${e.entgelt.toLocaleString("de-DE")} DM ·
          Sprit ${e.sprit.toLocaleString("de-DE")} DM ·
          Deckungsbeitrag
          <strong class="${e.db > 0 ? "tour-positiv" : "tour-negativ"}">
            ${e.db.toLocaleString("de-DE")} DM
          </strong>
          ${e.machbarkeit && !e.puenktlich
            ? `<span class="tour-warnung">Liefertermin nicht zu halten</span>`
            : ""}
        </span>
      </li>
    `;
  }

  function fahrzeugZeileGesperrt(f) {
    return `
      <li class="tour-auswahl gesperrt" data-fahrzeug="${f.id}">
        <span class="tour-auswahl-name">
          <span class="tour-flottenpunkt"
                style="background:${Lackierung.cssFarbe(f.lackierung)};
                       border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"></span>
          ${f.marke} ${f.modell}
          <span class="tour-auftrag-nummer">${f.kennzeichen}</span>
        </span>
        <span class="tour-auswahl-zusatz">
          <span class="tour-warnung">${frachtHindernis(f)}</span>
        </span>
      </li>
    `;
  }

  /**
   * Kein passendes Fahrzeug vor Ort: die nächstgelegenen freien
   * anbieten. Die Leerfahrt kostet Sprit und Verschleiß, bringt aber
   * keinen Erlös - deshalb stehen die Kosten an jedem Vorschlag.
   *
   * Angeboten wird nur, was die gewählte Fracht auch nehmen kann. Ein
   * Kipper, der 900 km leer anrollt und dann keine Papierrollen laden
   * darf, ist kein Vorschlag, sondern eine Falle.
   */
  function anforderungsliste(stadt) {
    const kandidaten = alleVerfuegbaren()
      .filter((f) => f.standort !== stadt.name && !frachtHindernis(f))
      .map((f) => ({ f, route: Route.berechne(f.standort, stadt.name) }))
      .filter((k) => k.route && k.route.km <= ANFORDERUNG_MAX_KM)
      .sort((a, b) => a.route.km - b.route.km)
      .slice(0, ANFORDERUNG_ANZAHL);

    if (kandidaten.length === 0) {
      return `
        <div class="tour-anfordern">
          <div class="tour-warentitel">Leerfahrt anfordern</div>
          <div class="tour-ware-leer">
            Kein passendes freies Fahrzeug in Reichweite (bis
            ${ANFORDERUNG_MAX_KM.toLocaleString("de-DE")} km).
          </div>
          ${umsetzKnopf(stadt)}
        </div>
      `;
    }

    return `
      <div class="tour-anfordern">
        <div class="tour-warentitel">Leerfahrt anfordern</div>
        <p class="tour-anleitung">
          Das Fahrzeug fährt leer nach ${stadt.name}. Disponiert wird
          neu, sobald es angekommen ist - die jetzige Planung endet damit.
        </p>
        <ul class="tour-auswahlliste">
          ${kandidaten.map(({ f, route }) => `
            <li class="tour-auswahl" data-anfordern="${f.id}" data-anfordern-ziel="${stadt.name}">
              ${ZEILENPFEIL}
              <span class="tour-auswahl-name">
                <span class="tour-flottenpunkt"
                      style="background:${Lackierung.cssFarbe(f.lackierung)};
                             border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"></span>
                ${f.marke} ${f.modell}
                <span class="tour-auftrag-nummer">${f.kennzeichen}</span>
              </span>
              <span class="tour-auswahl-zusatz">
                ab ${f.standort} · ${route.km.toLocaleString("de-DE")} km leer ·
                ${dauerText(fahrdauerStunden(route.km))}
              </span>
              <span class="tour-auswahl-zusatz">
                rund ${spritkostenFuer(f, route.km).toLocaleString("de-DE")} DM Sprit ·
                ${f.aufbautyp}
              </span>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  /** Schaltfläche, um ein Fahrzeug leer in eine andere Stadt zu schicken. */
  function umsetzKnopf(stadt) {
    if (alleVerfuegbaren().length === 0) return "";
    return `
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-umsetzen="${stadt.name}">
          🚚 Anderes Fahrzeug leer hierher schicken
        </button>
      </div>
    `;
  }

  // ---------- 4. Losschicken ----------

  /**
   * Die letzte Durchsicht. Ab hier führen zwei Wege weiter: noch eine
   * Etappe anhängen oder losschicken. Die Anschlussfracht beginnt dort,
   * wo die eben geplante endet - Stadt und Fahrzeug stehen damit schon
   * fest, und der Ablauf setzt bei der Fracht wieder ein.
   */
  function schrittBereit() {
    // Die offene Sendung zählt mit, ohne schon übernommen zu sein.
    const alle = alleSendungen();
    const summe = tourSumme(alle);
    const plan = summe.plan;
    const f = tour.fahrzeug;

    // Eine nicht fahrbare Reihenfolge wird SICHTBAR gelassen, nicht
    // versteckt. Bis 0.15.37 stand hier nur "nicht fahrbar, eine
    // Sendung streichen" - solange die Reihenfolge ein Algorithmus
    // bestimmte, war das in Ordnung. Wer sie von Hand legt, muss den
    // kaputten Zustand sehen können, um ihn zu reparieren.
    if (!plan || !plan.machbar) {
      return `
        ${schrittTitel("So ist die Tour nicht fahrbar", plan ? plan.grund : "")}
        <div class="tour-unfahrbar">
          ${plan && plan.grund ? plan.grund : "Die Sendungen passen nicht zusammen."}
        </div>
        ${tour.reihenfolge ? `
          <p class="tour-anleitung">
            Die Reihenfolge stammt von Hand. Halte umsortieren oder
            zurück auf die berechnete.
          </p>
          <div class="tour-startleiste">
            <button class="win98-button bevel-out" id="tour-btn-reihenfolge-zurueck">
              ↺ Berechnete Reihenfolge
            </button>
          </div>
          ${handStoppliste(alle)}` : `
          <p class="tour-anleitung">
            Eine Sendung streichen und es noch einmal versuchen.
          </p>`}
      `;
    }

    // Bindungsdauer: fahren, ruhen und an den Rampen stehen.
    const stunden = plan.dauerStunden || Auftraege.dauerStunden(plan.km);
    const tage = Math.max(1, Math.round(stunden / 24));
    const dbTag = Math.round(summe.db / Math.max(0.1, stunden / 24));
    const letzteStadt = plan.stopps[plan.stopps.length - 1].stadt;
    const mehrere = alle.length > 1;

    return `
      ${schrittTitel(
        mehrere ? `Tour mit ${alle.length} Sendungen` : "Alles beisammen",
        "letzte Durchsicht")}

      ${tour.reihenfolge ? `
        <div class="tour-handfolge">
          Reihenfolge von Hand
          <button class="win98-button bevel-out" id="tour-btn-reihenfolge-zurueck">
            ↺ berechnete
          </button>
        </div>` : ""}

      ${stoppfolgeAnsicht(plan, alle)}

      <div class="tour-zusammenfassung">
        <dl class="fuhrpark-infoliste">
          <dt>Fahrzeug</dt><dd>${f.marke} ${f.modell} (${f.kennzeichen})</dd>
          <dt>Strecke</dt>
          <dd>${summe.km.toLocaleString("de-DE")} km beladen${
            summe.leerKm > 0
              ? ` · ${Math.round(summe.leerKm).toLocaleString("de-DE")} km leer`
              : ""}</dd>
          <dt>Bindet den Wagen</dt>
          <dd>${dauerText(Math.round(stunden))}${
            plan.standStunden ? ` · davon ${plan.standStunden.toFixed(1)} Std an Rampen` : ""}</dd>
          <dt>Entgelt</dt><dd>${summe.erloes.toLocaleString("de-DE")} DM</dd>
          <dt>Spritkosten</dt><dd>rund ${summe.sprit.toLocaleString("de-DE")} DM</dd>
          <dt>Deckungsbeitrag</dt>
          <dd class="${summe.db > 0 ? "tour-positiv" : "tour-negativ"}">
            ${summe.db.toLocaleString("de-DE")} DM</dd>
          <dt>Je Tag</dt>
          <dd class="${dbTag > 0 ? "tour-positiv" : "tour-negativ"}">
            ${dbTag.toLocaleString("de-DE")} DM</dd>
        </dl>
        ${plan.je.some((x) => x.warnungLaden || x.warnungZiel) ? `
          <div class="tour-schadenhinweis">
            Vorausgebuchte Fracht ist verbindlich. Wird ein Ladefenster
            oder ein Liefertermin verfehlt, belastet das die
            Kundenbeziehung.
          </div>` : ""}
      </div>

      <div class="tour-startleiste">
        ${alle.length >= SENDUNGEN_MAX ? `
          <span class="tour-anleitung">
            Mehr als ${SENDUNGEN_MAX} Sendungen je Tour sind nicht vorgesehen.
          </span>` : ""}
        <button class="win98-button bevel-out tour-startknopf" id="tour-btn-tour-starten">
          🚚 Losschicken
        </button>
      </div>
    `;
  }

  /**
   * Die Halte einer NICHT fahrbaren Handreihenfolge - zum Reparieren.
   * plan.stopps ist dann leer, deshalb wird hier direkt aus der
   * gemerkten Folge gruppiert.
   */
  function handStoppliste() {
    if (!tour.reihenfolge) return "";
    const gruppen = [];
    tour.reihenfolge.forEach((st) => {
      const letzte = gruppen[gruppen.length - 1];
      if (letzte && letzte.stadt === st.stadt) letzte.anzahl++;
      else gruppen.push({ stadt: st.stadt, anzahl: 1 });
    });

    return `
      <ol class="tour-stoppfolge">
        ${gruppen.map((g, i) => `
          <li class="tour-stopp">
            <div class="tour-stopp-kopf">
              <span class="tour-stopp-nr">${i + 1}</span>
              <span class="tour-stopp-stadt">${g.stadt}</span>
              ${haltPfeile(i, gruppen.length)}
            </div>
          </li>`).join("")}
      </ol>
    `;
  }

  /**
   * Die beiden Pfeile an einem Halt. `gruppe` ist die Nummer in der
   * Stationsgruppierung - siehe haltVerschieben().
   */
  function haltPfeile(gruppe, anzahl) {
    if (gruppe < 0 || anzahl < 2) return "";
    const rauf = gruppe > 0;
    const runter = gruppe < anzahl - 1;
    if (!rauf && !runter) return "";
    return `
      <span class="tour-halt-pfeile">
        <button class="tour-halt-pfeil" data-halt-hoch="${gruppe}"
                ${rauf ? "" : "disabled"} title="Früher anfahren">▲</button>
        <button class="tour-halt-pfeil" data-halt-runter="${gruppe}"
                ${runter ? "" : "disabled"} title="Später anfahren">▼</button>
      </span>
    `;
  }

  /**
   * Um wie viel die Halt-Nummer der Stoppfolge von der Gruppennummer
   * abweicht: Wird im Startort nicht geladen, steht dort ein Halt ohne
   * Station, und alles verschiebt sich um eins.
   */
  function gruppenVersatz(plan) {
    if (!plan || !plan.stopps || plan.stopps.length === 0) return 0;
    const start = plan.stopps[0];
    return (start.laden.length + start.abladen.length) > 0 ? 0 : 1;
  }

  /**
   * Die Tour so, wie sie gefahren wird: Halt für Halt, mit dem, was
   * dort auf- und abgeht. Seit 0.15.38 ist das die einzige Darstellung
   * einer Tour - der Frachtbrief zeigt dieselben Halte, nur knapper.
   * An jedem Halt hängt, was man dort tun kann: umsortieren, eine
   * Sendung ändern, streichen oder eine weitere aufnehmen.
   */
  function stoppfolgeAnsicht(plan, sendungen) {
    const versatz = gruppenVersatz(plan);
    const gruppenZahl = plan.stopps.length - versatz;
    return `
      <ol class="tour-stoppfolge">
        ${plan.stopps.map((stopp, i) => {
          const anBord = i < plan.belegung.length ? plan.belegung[i].tonnen : 0;
          const anfahrt = i > 0 ? plan.etappen[i - 1] : null;
          return `
            <li class="tour-stopp">
              ${anfahrt ? `
                <div class="tour-stopp-fahrt">
                  ${Math.round(anfahrt.route.km).toLocaleString("de-DE")} km
                  ${anfahrt.typ === "anfahrt" ? " leer" : ""}
                </div>` : ""}
              <div class="tour-stopp-kopf">
                <span class="tour-stopp-nr">${i + 1}</span>
                <span class="tour-stopp-stadt">${stopp.stadt}</span>
                ${i < plan.stopps.length - 1
                  ? `<span class="tour-stopp-last">${anBord.toFixed(1)} t an Bord</span>`
                  : ""}
                ${haltPfeile(i - versatz, gruppenZahl)}
              </div>
              ${stopp.abladen.map((k) => `
                <div class="tour-stopp-zeile ab">
                  ▼ ab ${sendungen[k].tonnen.toFixed(1)} t ${sendungen[k].gutName}
                  <span class="tour-stopp-geld">${sendungen[k].entgelt.toLocaleString("de-DE")} DM</span>
                  ${plan.je[k].warnungZiel ? `
                    <span class="tour-warnung">
                      ${plan.je[k].warnungZiel}
                      ${(i - versatz) > 0 ? `
                        <button class="tour-halt-frueher" data-halt-hoch="${i - versatz}"
                                title="Diesen Halt vorziehen">▲ früher anfahren</button>` : ""}
                    </span>` : ""}
                </div>`).join("")}
              ${stopp.laden.map((k) => `
                <div class="tour-stopp-zeile auf aenderbar"
                     data-sendung-bearbeiten="${k}" title="Antippen zum Ändern">
                  ▲ auf ${sendungen[k].tonnen.toFixed(1)} t ${sendungen[k].gutName}
                  <span class="tour-stopp-ziel">→ ${sendungen[k].nachName}</span>
                  ${plan.je[k].warnungLaden ? `<span class="tour-warnung">${plan.je[k].warnungLaden}</span>` : ""}
                  <button class="tour-stopp-weg" data-etappe-loeschen="${k}"
                          title="Sendung streichen">✕</button>
                </div>`).join("")}
              ${sendungen.length < SENDUNGEN_MAX ? `
                <button class="tour-stopp-dazu" data-ladeort="${stopp.stadt}">
                  + Sendung ab ${stopp.stadt}
                </button>` : ""}
            </li>
          `;
        }).join("")}
      </ol>
    `;
  }

  /**
   * Die gerade zusammengestellte Sendung im Format der festgelegten.
   * Gibt null zurück, solange keine Fracht gewählt ist - nach einem
   * "+ Sendung" ist das der Normalfall.
   */
  function aktuelleEtappeAlsPlan() {
    if (!tour.art) return null;
    if (tour.art === "auftrag") {
      const a = tour.auftrag;
      return {
        art: "auftrag", auftrag: a, gut: Auftraege.gut(a),
        gutName: Auftraege.gut(a).name,
        vonName: a.vonName, nachName: a.nachName,
        tonnen: a.tonnen, km: a.km, entgelt: a.entgelt
      };
    }
    const route = tour.ziel ? Route.berechne(tour.stadt.name, tour.ziel.name) : null;
    const km = route ? route.km : 0;
    return {
      art: "spot", auftrag: null, gut: tour.gut, gutName: tour.gut.name,
      vonName: tour.stadt.name, nachName: tour.ziel ? tour.ziel.name : "",
      tonnen: tour.tonnen, km,
      entgelt: Math.round(Ladung.frachtpreis(tour.gut, tour.tonnen, km) * SPOT_FAKTOR)
    };
  }

  /**
   * Zurück zur Durchsicht, ohne noch etwas dazuzuladen.
   *
   * Ohne diesen Weg war "+ Beiladung" eine Falle: Wer ihn drückte und
   * es sich anders überlegte, stand im Frachtschritt ohne gewählte
   * Fracht - und die einzige Schaltfläche, die dort hinausführte, warf
   * die ganze Tour weg.
   */
  function zurTourZurueck() {
    if (tour.bearbeitet !== null) { bearbeitungAbbrechen(); return; }
    if (tour.geplant.length === 0) return;
    etappeZuruecksetzen();
    tour.schritt = "bereit";
    hervorgehobenesGut = null;
    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
  }

  /**
   * Die angefangene Etappe verwerfen, die festgelegten behalten. Die
   * Planung steht danach wieder am Ausgangsort der verworfenen Etappe -
   * also dort, wo die letzte festgelegte endet.
   */
  function etappeVerwerfen() {
    // Wird eine bestehende Sendung bearbeitet, heißt Verwerfen: Sie
    // bleibt, wie sie war - und nicht: Sie ist weg.
    if (tour.bearbeitet !== null) { bearbeitungAbbrechen(); return; }
    etappeZuruecksetzen();
    const letzte = tour.geplant[tour.geplant.length - 1];
    if (letzte) {
      tour.stadt = STAEDTE[letzte.nachName] || tour.stadt;
      gewaehlteStadt = tour.stadt;
    }
    // Steht schon etwas fest, gehört der Blick zurück auf die Tour -
    // eine leere Frachtliste wäre nach dem Verwerfen keine Auskunft.
    tour.schritt = tour.geplant.length > 0 ? "bereit" : "fracht";
    hervorgehobenesGut = null;
    aktiveRoute = null;
    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
  }

  /**
   * Eine schon festgelegte Sendung zum Ändern aufmachen.
   *
   * Sie wird dafür aus `geplant` herausgenommen und wie eine
   * angefangene behandelt - dadurch gilt für sie derselbe Ablauf wie
   * für eine neue, und der ganze Rest des Moduls braucht keine
   * Sonderbehandlung. Ihr Platz und ihre alte Fassung werden gemerkt:
   * Wer abbricht, bekommt sie unverändert zurück.
   */
  function sendungBearbeiten(platz) {
    // Erst festschreiben, was gerade offen ist - sonst ginge es beim
    // Umschalten verloren.
    offeneSendungSichern();

    const s = tour.geplant[platz];
    if (!s) return;

    tour.geplant.splice(platz, 1);
    tour.bearbeitet = platz;
    tour.urfassung = s;

    tour.art = s.art;
    tour.auftrag = s.art === "auftrag" ? s.auftrag : null;
    tour.gut = s.gut;
    tour.tonnen = s.tonnen;
    tour.ziel = STAEDTE[s.nachName] || null;
    // Eine bestehende Menge ist immer eine gewollte - sie darf beim
    // Neuberechnen nicht aufs Maximum zurückspringen.
    tour.mengeVonHand = s.art === "spot";
    tour.machbarkeit = s.art === "auftrag" && tour.fahrzeug
      ? Auftraege.terminMachbar(s.auftrag, tour.fahrzeug.standort)
      : null;

    const ab = STAEDTE[s.vonName];
    if (ab) { tour.stadt = ab; gewaehlteStadt = ab; }

    tour.schritt = "fracht";
    hervorgehobenesGut = s.art === "spot" ? s.gut : null;
    aktiveRoute = tour.ziel ? Route.berechne(s.vonName, s.nachName) : null;

    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
    if (ab) aufStadtZentrieren(ab);
  }

  /** Die Änderung verwerfen: Die Sendung steht wieder wie vorher da. */
  function bearbeitungAbbrechen() {
    if (tour.bearbeitet === null || !tour.urfassung) return;
    tour.geplant.splice(tour.bearbeitet, 0, tour.urfassung);
    etappeZuruecksetzen();
    tour.schritt = "bereit";
    hervorgehobenesGut = null;
    aktiveRoute = null;
    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
  }

  /**
   * Noch eine Sendung, geladen in der genannten Stadt. Früher waren
   * das zwei Knöpfe - "Beiladung" ab der Planungsstadt und "Anschluss"
   * ab dem letzten Halt. Fachlich richtig, aber der Spieler musste den
   * Unterschied kennen, bevor er ihn brauchte. Jetzt ist es ein Knopf
   * und danach eine Ortswahl: Der Unterschied ist eine Stelle in der
   * Tour, kein Fachwort.
   */
  /**
   * Noch eine Sendung, geladen in der genannten Stadt.
   *
   * Bis 0.15.35 waren das zwei Knöpfe - "Beiladung" ab der
   * Planungsstadt und "Anschluss" ab dem letzten Halt. Fachlich
   * richtig, aber der Spieler musste den Unterschied kennen, bevor er
   * ihn brauchte. Seit 0.15.38 hängt der Knopf an jedem Halt der
   * Stoppfolge: Der Unterschied ist damit eine Stelle in der Tour und
   * kein Fachwort mehr.
   *
   * Der Fall "keine offene Sendung" ist der Normalfall, seit man mit
   * "Zur Tour" auf die Durchsicht zurückkehren kann, ohne etwas
   * gewählt zu haben.
   */
  function naechsteSendung(stadtName) {
    offeneSendungSichern();
    etappeZuruecksetzen();

    const stadt = STAEDTE[stadtName];
    if (stadt) {
      tour.stadt = stadt;
      gewaehlteStadt = stadt;
    }

    tour.schritt = "fracht";
    hervorgehobenesGut = null;
    dispositionAktualisieren();
    markenZeichnen();
    if (stadt) aufStadtZentrieren(stadt);
  }

  /** Wo die Tour nach allen festgelegten Sendungen endet. */
  function letzterHalt() {
    const plan = tourPlan(tour.geplant);
    if (plan && plan.machbar && plan.stopps.length) {
      return plan.stopps[plan.stopps.length - 1].stadt;
    }
    const letzte = tour.geplant[tour.geplant.length - 1];
    return letzte ? letzte.nachName : (tour.stadt ? tour.stadt.name : null);
  }

  // Dieselpreis in DM je Liter - belegt und jahresabhängig, siehe
  // js/data/kostensaetze.js und docs/kosten-1994.md. Für 1994 sind das
  // 1,14 DM; der frühere Festwert 1,05 war geschätzt und zu niedrig.
  function dieselpreis() { return Kostensaetze.dieselpreis(); }

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

  /**
   * Welche Rolle diese Stadt für das gerade Betrachtete spielt. Eine
   * Stadt kann Abnehmer der Ware sein, das feste Ziel eines Auftrags
   * oder Lieferant - der Unterschied entscheidet, ob sich eine Tour
   * dorthin lohnt, und gehört deshalb auf die Karte.
   */
  function markenRolle(stadt) {
    const v = vorschau;

    // Vorschau schlägt die Auswahl: Was unter dem Zeiger liegt, ist
    // das, was der Disponent gerade wissen will.
    if (v) {
      if (v.zielName && v.zielName === stadt.name) return "tour-marke-ziel";
      if (v.art === "spot" && v.gutId
          && Wirtschaft.bedarf(stadt).some((g) => g.id === v.gutId)) {
        return "tour-marke-empfaenger";
      }
      return "";
    }

    if (tour.ziel && tour.ziel.name === stadt.name) return "tour-marke-ziel";
    if (tour.art === "auftrag" && tour.auftrag && tour.auftrag.nachName === stadt.name) {
      return "tour-marke-ziel";
    }

    if (hervorgehobenesGut) {
      const id = hervorgehobenesGut.id;
      // Beim freien Markt sucht man Abnehmer, sonst Lieferanten.
      if (tour.schritt === "ziel" || tour.art === "spot") {
        if (Wirtschaft.bedarf(stadt).some((g) => g.id === id)) return "tour-marke-empfaenger";
      } else if (Wirtschaft.angebot(stadt).some((g) => g.id === id)) {
        return "tour-marke-lieferant";
      }
    }
    return "";
  }

  /**
   * Die Rollen der Marken nachziehen, ohne die Karte neu aufzubauen.
   * Beim Überfahren einer Liste feuert das im Sekundentakt - 165 Marken
   * jedes Mal neu zu erzeugen kostete auf einem Telefon ein Vielfaches
   * und ließe die Liste ruckeln.
   */
  function vorschauZeichnen() {
    const behaelter = fensterElement && fensterElement.querySelector("#tour-karte-marken");
    if (!behaelter) return;
    Array.from(behaelter.children).forEach((el) => {
      const stadt = STAEDTE[el.dataset.stadt];
      if (!stadt) return;
      const rolle = markenRolle(stadt);
      el.classList.toggle("tour-marke-ziel", rolle === "tour-marke-ziel");
      el.classList.toggle("tour-marke-empfaenger", rolle === "tour-marke-empfaenger");
      el.classList.toggle("tour-marke-lieferant", rolle === "tour-marke-lieferant");
    });
  }

  /** Vorschau setzen und die Karte nachziehen. */
  function vorschauSetzen(neu) {
    const vorherZiel = vorschau && vorschau.zielName;
    const neuZiel = neu && neu.zielName;
    vorschau = neu;
    vorschauZeichnen();
    // Beim festen Auftrag gehört die Strecke dazu - ohne sie sieht man
    // zwar das Ziel, aber nicht den Weg dorthin.
    if (vorherZiel !== neuZiel) routeZeichnen();
  }

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
    const behaelter = fensterElement && fensterElement.querySelector("#tour-karte-marken");
    if (!behaelter) return;

    // Gleich zu Beginn: Die Marke, zu der der Tooltip gehört, gibt es
    // nach der nächsten Zeile nicht mehr, und ein pointerout kommt für
    // ein gelöschtes Element nie.
    tooltipVerbergen();

    behaelter.innerHTML = Karte.alleStaedte()
      .map((stadt) => {
        const stufe = groessenstufe(stadt);
        // Nur Fahrzeuge, die hier auch wirklich stehen - wer unterwegs
        // ist, wird als fahrender Punkt auf der Route gezeigt.
        const fahrzeugeHier = FuhrparkApp.fahrzeugeAn(stadt.name)
          .filter((f) => !Fahrt.istUnterwegs(f.id));

        // Kann diese Stadt die gerade betrachtete Ware liefern bzw.
        // braucht sie sie? Im Zielschritt zählt der Bedarf, sonst das
        // Angebot.
        let hervorgehoben = markenRolle(stadt);

        const klassen = [
          "tour-marke",
          `tour-marke-s${stufe}`,
          stadt.knoten ? "tour-marke-knoten" : "",
          Betrieb.depotName() === stadt.name ? "tour-marke-depot" : "",
          // Städte mit eigenem Fahrzeug bekommen einen Ring, damit man
          // sie auch ohne Zoom auf der Karte wiederfindet.
          fahrzeugeHier.length > 0 ? "tour-marke-flotte" : "",
          hervorgehoben,
          gewaehlteStadt && gewaehlteStadt.name === stadt.name ? "tour-marke-gewaehlt" : ""
        ].filter(Boolean).join(" ");

        // Für jedes stehende Fahrzeug ein farbiger Punkt in seiner
        // Lackierung, nebeneinander angeordnet.
        const fahrzeugMarke = fahrzeugeHier.length > 0
          ? `<span class="tour-standortpunkte">${
              fahrzeugeHier.slice(0, 4).map((f) => `
                <span class="tour-standortpunkt"
                      style="background:${Lackierung.cssFarbe(f.lackierung)};
                             border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"
                      title="${f.kennzeichen} (${f.lackierung})"></span>
              `).join("")
            }${fahrzeugeHier.length > 4
              ? `<span class="tour-standortmehr">+${fahrzeugeHier.length - 4}</span>` : ""}</span>`
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

  /**
   * Zeichnet die hervorgehobene Route über die Karte. Die Straßen sind
   * fest im Kartenbild, deshalb wird die gewählte Verbindung als Linie
   * darübergelegt - genau entlang derselben Stützpunkte.
   */
  function routeZeichnen() {
    const svg = fensterElement && fensterElement.querySelector("#tour-route-ebene");
    const rahmen = fensterElement && fensterElement.querySelector("#tour-karte-rahmen");
    if (!svg || !rahmen) return;

    svg.setAttribute("width", rahmen.clientWidth);
    svg.setAttribute("height", rahmen.clientHeight);

    const teile = [];

    // 1. Angenommene, laufende Touren - bleiben dauerhaft sichtbar,
    //    damit man den Überblick behält. In Blau, klar unterschieden
    //    von der orangen Route in Planung.
    Fahrt.alle().forEach((t) => {
      t.etappen.forEach((e) => {
        const punkte = verlaufAlsPunkte(e.route);
        if (punkte.length < 2) return;
        const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
        const klasse = e.typ === "anfahrt" ? "tour-route-anfahrt" : "tour-route-laufend";
        teile.push(`<polyline points="${linie}" class="tour-route-kontur-duenn" />`);
        teile.push(`<polyline points="${linie}" class="${klasse}" />`);
      });
    });

    // 1b. Schon festgelegte Etappen dieser Tour - blasser als die
    //     Etappe, an der gerade gearbeitet wird.
    tour.geplant.forEach((e) => {
      const r = Route.berechne(e.vonName, e.nachName);
      if (!r) return;
      const punkte = verlaufAlsPunkte(r);
      if (punkte.length < 2) return;
      const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
      teile.push(`<polyline points="${linie}" class="tour-route-kontur-duenn" />`);
      teile.push(`<polyline points="${linie}" class="tour-route-geplant" />`);
    });

    // 1c. Vorschau: die Strecke der Zeile, über der der Zeiger steht.
    if (vorschau && vorschau.zielName && vorschau.vonName) {
      const r = Route.berechne(vorschau.vonName, vorschau.zielName);
      if (r) {
        const punkte = verlaufAlsPunkte(r);
        if (punkte.length >= 2) {
          const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
          teile.push(`<polyline points="${linie}" class="tour-route-vorschau" />`);
        }
      }
    }

    // 2. Route in Planung - liegt oben und ist kräftiger
    if (aktiveRoute && aktiveRoute.stationen.length >= 2) {
      const punkte = verlaufAlsPunkte(aktiveRoute);
      const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
      teile.push(`<polyline points="${linie}" class="tour-route-kontur" />`);
      teile.push(`<polyline points="${linie}" class="tour-route-linie" />`);

      // Kreise nur an den Städten, nicht an jedem Stützpunkt der
      // Straße - sonst wäre die Route eine Perlenkette.
      const stationen = routePunkte();
      stationen.forEach((p, i) => {
        const klasse = i === 0 ? "tour-route-start"
          : i === stationen.length - 1 ? "tour-route-ziel" : "tour-route-station";
        teile.push(`<circle cx="${p.x}" cy="${p.y}" r="${i === 0 || i === stationen.length - 1 ? 5 : 3}" class="${klasse}" />`);
      });
    }

    svg.innerHTML = teile.join("");
  }

  /**
   * Der Straßenverlauf einer Route in Bildschirmkoordinaten. Fällt auf
   * die Stationen zurück, wenn eine Verbindung keinen erfassten Verlauf
   * hat (siehe quelle: "schaetzung" im Straßennetz).
   */
  function verlaufAlsPunkte(route) {
    if (route.verlauf && route.verlauf.length >= 2) {
      return route.verlauf.map((g) => {
        const p = Karte.nachBild(g[0], g[1]);
        return { x: p.x * zoom + versatzX, y: p.y * zoom + versatzY };
      });
    }
    return stationenAlsPunkte(route.stationen);
  }

  /** Stationsnamen in Bildschirmkoordinaten umrechnen. */
  function stationenAlsPunkte(stationen) {
    return stationen.map((name) => {
      const stadt = STAEDTE[name];
      const p = Karte.nachBild(stadt.lon, stadt.lat);
      return { x: p.x * zoom + versatzX, y: p.y * zoom + versatzY };
    });
  }

  /** Bildschirmkoordinaten aller Stationen der aktiven Route. */
  function routePunkte() {
    return aktiveRoute.stationen.map((name) => {
      const stadt = STAEDTE[name];
      const p = Karte.nachBild(stadt.lon, stadt.lat);
      return { x: p.x * zoom + versatzX, y: p.y * zoom + versatzY, name };
    });
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
    const buehne = fensterElement && fensterElement.querySelector("#tour-karte-buehne");
    if (!buehne) return;
    // Der Tooltip sitzt in Rahmenkoordinaten und wandert nicht mit.
    // Nach einer Ansichtsänderung zeigt er auf die falsche Stadt.
    tooltipVerbergen();
    buehne.style.transform =
      `translate(${versatzX}px, ${versatzY}px) scale(${zoom})`;
    markenPositionieren();
    namenAktualisieren();
    routeZeichnen();
    fahrtenZeichnen();
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
    const rahmen = fensterElement && fensterElement.querySelector("#tour-karte-rahmen");
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

  /**
   * Rückt eine Stadt in die Mitte des Kartenfensters, ohne den Zoom zu
   * verändern - außer man ist so weit herausgezoomt, dass man nichts
   * erkennt. Wird aus der Flottenübersicht heraus benutzt.
   */
  function aufStadtZentrieren(stadt) {
    const rahmen = fensterElement && fensterElement.querySelector("#tour-karte-rahmen");
    if (!rahmen || !stadt) return;

    if (zoom < 1.4) zoom = Math.min(ZOOM_MAX, 1.8);

    const p = Karte.nachBild(stadt.lon, stadt.lat);
    versatzX = rahmen.clientWidth / 2 - p.x * zoom;
    versatzY = rahmen.clientHeight / 2 - p.y * zoom;

    versatzBegrenzen();
    ansichtAnwenden();
  }

  // ---------- Auswahl ----------

  function stadtWaehlen(stadt) {
    const gewechselt = !gewaehlteStadt || gewaehlteStadt.name !== stadt.name;
    gewaehlteStadt = stadt;

    // Die Karte ist der Einstieg: Eine andere Stadt antippen heißt, von
    // dort aus neu zu disponieren. Eine schon getroffene Auswahl gilt
    // für die alte Stadt und fällt damit weg.
    if (gewechselt) {
      tourZuruecksetzen();
      aktiveRoute = null;
      hervorgehobenesGut = null;
    }
    tour.stadt = stadt;

    dispositionAktualisieren();
    markenZeichnen();
  }

  /**
   * Baut den Dispositionsbereich neu auf.
   *
   * @param {object} [optionen]
   * @param {boolean} [optionen.nurListe] Karte auslassen. Der Zeittakt
   *   feuert jede Spielminute; die Marken der 165 Städte dabei jedes
   *   Mal neu zu zeichnen kostet auf einem Telefon ein Vielfaches des
   *   Listenaufbaus - und ändert nichts, solange sich weder Flotte noch
   *   Auswahl noch Hervorhebung geändert haben. Gemessen: 59 ms je
   *   Takt mit Karte, 1 ms ohne.
   */
  function dispositionAktualisieren(optionen) {
    const nurListe = Boolean(optionen && optionen.nurListe);
    // Die Zeile unter dem Zeiger gibt es nach dem Neuaufbau nicht mehr.
    vorschau = null;
    // Ohne geöffnetes Fenster gibt es nichts zu zeichnen. Seit der
    // Spielstand schon beim Seitenaufruf geladen wird, laufen Ankunfts-
    // und Nachholmeldungen durch diese Funktion, bevor es ein Fenster
    // gibt - vorher warf das hier eine Ausnahme und brach das Nachholen
    // mittendrin ab.
    if (!fensterElement) return;
    const dispo = fensterElement.querySelector("#tour-disposition");
    if (!dispo) return;

    // Scrollposition merken: Der Bereich wird bei jedem Zeittakt neu
    // aufgebaut - ohne das würde die Liste beim Blättern ständig nach
    // oben springen.
    const gescrollt = dispo.querySelector(".tour-schrittinhalt, .tour-auswahlliste");
    const scrollStand = gescrollt ? gescrollt.scrollTop : 0;
    const eigenerScroll = dispo.scrollTop;

    dispo.innerHTML = renderDisposition();

    const neuGescrollt = dispo.querySelector(".tour-schrittinhalt, .tour-auswahlliste");
    if (neuGescrollt && scrollStand > 0) neuGescrollt.scrollTop = scrollStand;
    if (eigenerScroll > 0) dispo.scrollTop = eigenerScroll;

    dispositionEreignisse(dispo);
    if (!nurListe) {
      markenZeichnen();
      routeZeichnen();
    }
    fahrtenZeichnen();
  }

  /**
   * Fahrzeug in die Planung übernehmen. Erst jetzt stehen Menge und
   * Termin fest - beides hängt am Wagen und an seinem Standort.
   */
  function fahrzeugUebernehmen(f) {
    tour.fahrzeug = f;
    if (tour.art === "auftrag" && tour.auftrag) {
      tour.tonnen = tour.auftrag.tonnen;
      tour.machbarkeit = Auftraege.terminMachbar(tour.auftrag, f.standort);
    } else if (tour.art === "spot" && tour.gut) {
      const max = spotMenge(f, tour.gut);
      // Eine von Hand eingestellte Menge bleibt stehen - sie wird nur
      // gekappt, wenn dieser Wagen weniger fasst als der bisherige.
      tour.tonnen = tour.mengeVonHand
        ? Math.min(tour.tonnen, max)
        : max;
    }
  }

  /**
   * Einen Schritt weiterschalten - aber nur, wenn er vollständig ist.
   * Es gibt keinen Weiter-Knopf mehr: Die Zeile wählt und schaltet in
   * einem Zug, und diese Funktion ist der eine Ort, an dem geprüft
   * wird, ob das erlaubt ist.
   */
  function weiterZu(schritt) {
    if (schritt === "ziel" && !frachtGewaehlt()) return;
    if (schritt === "fahrzeug" && (!frachtGewaehlt() || !tour.ziel)) return;
    if (schritt === "bereit" && (!frachtGewaehlt() || !tour.ziel || !tour.fahrzeug)) return;

    // Bei einer Anschlussetappe steht das Fahrzeug schon fest - es
    // gehört zur Tour, nicht zur einzelnen Fracht. Ein Bildschirm, der
    // nur die eine ohnehin getroffene Wahl noch einmal zeigt, wäre ein
    // Klick ohne Entscheidung.
    if (schritt === "fahrzeug" && tour.fahrzeug && tour.geplant.length > 0) {
      schritt = "bereit";
    }

    tour.schritt = schritt;
    dispositionAktualisieren();
  }

  /** Die Inhalte werden bei jedem Schritt neu erzeugt und neu verdrahtet. */
  function dispositionEreignisse(dispo) {
    // ---- Flottenübersicht: Fahrzeug auf der Karte suchen ----
    dispo.querySelectorAll("[data-fahrzeug-suchen]").forEach((el) => {
      el.addEventListener("click", () => {
        const stadt = STAEDTE[el.dataset.fahrzeugSuchen];
        if (!stadt) return;
        stadtWaehlen(stadt);
        aufStadtZentrieren(stadt);
      });
    });

    // ---- Depot ----
    const gruenden = dispo.querySelector("#tour-btn-depot-waehlen");
    if (gruenden) {
      gruenden.addEventListener("click", () => {
        Betrieb.depotSetzen(gewaehlteStadt.name);
        dispositionAktualisieren();
      });
    }

    const detailZurueck = dispo.querySelector("#tour-btn-detail-zurueck");
    if (detailZurueck) {
      detailZurueck.addEventListener("click", () => {
        umsetzZiel = null;
        warendetailsSchliessen();
      });
    }

    dispo.querySelectorAll("[data-umsetzen]").forEach((el) => {
      el.addEventListener("click", () => {
        umsetzZiel = el.dataset.umsetzen;
        dispositionAktualisieren();
      });
    });

    dispo.querySelectorAll("[data-umsetz-fahrzeug]").forEach((el) => {
      el.addEventListener("click", () => {
        const f = FuhrparkApp.alleFahrzeuge().find((x) => x.id === Number(el.dataset.umsetzFahrzeug));
        if (f) leerfahrtStarten(f, el.dataset.umsetzZiel);
      });
    });

    // Ware in der Stadtübersicht antippen -> Detailansicht
    dispo.querySelectorAll("[data-wareninfo]").forEach((el) => {
      el.addEventListener("click", () => {
        const g = GUETER_NACH_ID[el.dataset.wareninfo];
        hervorgehobenesGut = g;
        warendetailsZeigen(g);
        markenZeichnen();
      });
    });

    // Ware eines Auftrags antippen -> ebenfalls Detailfenster
    dispo.querySelectorAll("[data-auftrag-ware]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // nicht zugleich den Auftrag auswählen
        warendetailsZeigen(GUETER_NACH_ID[el.dataset.auftragWare]);
      });
    });

    // Depot verlegen
    const verlegen = dispo.querySelector("#tour-btn-depot-hierher");
    if (verlegen) {
      verlegen.addEventListener("click", () => {
        const ziel = gewaehlteStadt.name;
        if (window.confirm(
          `Depot nach ${ziel} verlegen?\n\n` +
          `Neue Fahrzeuge werden künftig dort stationiert.`
        )) {
          Betrieb.depotSetzen(ziel);
          dispositionAktualisieren();
        }
      });
    }

    // ---- Frachtbrief: gefülltes Feld antippen -> zu diesem Schritt ----
    dispo.querySelectorAll("[data-brief-schritt]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.briefSchritt;
        dispositionAktualisieren();
      });
    });

    // ---- Kartenvorschau beim Überfahren einer Zeile ----
    //
    // Fahren statt klicken: Man sieht, wohin eine Fracht ginge, bevor
    // man sich festlegt. Beim festen Auftrag leuchtet die eine
    // vorgegebene Stadt auf, bei Spotware alle mit Bedarf.
    //
    // Mit der Maus genügt das Überfahren. Auf dem Telefon gibt es
    // keinen Zeiger, der irgendwo steht - dort hält man die Zeile kurz
    // gedrückt ("Spicken"): Nach 250 ms leuchtet die Karte auf, und der
    // Klick, der die Zeile sonst auswählen würde, wird verschluckt.
    // Ohne das könnte man auf dem Telefon nur durch Auswählen sehen,
    // wohin eine Fracht ginge - also nicht vergleichen.
    dispo.querySelectorAll("[data-vorschau-art]").forEach((el) => {
      const zeigen = () => vorschauSetzen({
        art: el.dataset.vorschauArt,
        gutId: el.dataset.vorschauGut || null,
        vonName: el.dataset.vorschauVon || null,
        zielName: el.dataset.vorschauZiel || null
      });
      el.addEventListener("mouseenter", zeigen);
      el.addEventListener("mouseleave", () => {
        if (!el.dataset.gespickt) vorschauSetzen(null);
      });

      let uhr = null;
      let start = null;
      const abbrechen = () => {
        if (uhr) { clearTimeout(uhr); uhr = null; }
      };

      el.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        start = { x: e.clientX, y: e.clientY };
        abbrechen();
        uhr = setTimeout(() => {
          uhr = null;
          el.dataset.gespickt = "ja";
          el.classList.add("spickt");
          zeigen();
        }, 250);
      });

      // Wer scrollt, will nicht spicken.
      el.addEventListener("pointermove", (e) => {
        if (!start) return;
        if (Math.abs(e.clientX - start.x) > 10 || Math.abs(e.clientY - start.y) > 10) {
          abbrechen();
        }
      });

      el.addEventListener("pointerup", abbrechen);
      el.addEventListener("pointercancel", () => {
        abbrechen();
        delete el.dataset.gespickt;
        el.classList.remove("spickt");
      });
    });

    // Den Klick nach einem Spicken verschlucken - sonst wählte das
    // Loslassen die Zeile aus, die man nur ansehen wollte. Der Zuhörer
    // sitzt in der Erfassungsphase, also vor allen Zeilenzuhörern.
    if (!dispo.dataset.spickGebunden) {
      dispo.dataset.spickGebunden = "ja";
      dispo.addEventListener("click", (e) => {
        const zeile = e.target.closest("[data-vorschau-art]");
        if (zeile && zeile.dataset.gespickt) {
          delete zeile.dataset.gespickt;
          zeile.classList.remove("spickt");
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    }

    // ---- Schritt 1: Fracht ----
    //
    // Die Zeile ist der Knopf: auswählen und gleich zum Ziel weiter.
    dispo.querySelectorAll("[data-fracht-auftrag]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (el.classList.contains("gesperrt")) return;
        if (e.target.closest("[data-auftrag-ware]")) return;
        const a = Auftraege.nachNummer(el.dataset.frachtAuftrag);
        if (!a) return;
        tour.art = "auftrag";
        tour.auftrag = a;
        tour.gut = null;
        tour.ziel = null;
        tour.tonnen = a.tonnen;
        // Die Machbarkeit hängt am Standort des Fahrzeugs und wird
        // deshalb erst bei dessen Wahl gerechnet.
        tour.machbarkeit = null;
        // Das Fahrzeug gehört zur Tour, nicht zur einzelnen Fracht -
        // es bleibt stehen, solange es die neue Ladung nehmen kann.
        if (tour.fahrzeug && frachtHindernis(tour.fahrzeug)) tour.fahrzeug = null;
        hervorgehobenesGut = null;
        aktiveRoute = Route.berechne(a.vonName, a.nachName);
        weiterZu("ziel");
        routeZeichnen();
        markenZeichnen();
      });
    });

    dispo.querySelectorAll("[data-fracht-gut]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (el.classList.contains("gesperrt")) return;
        if (e.target.closest("[data-auftrag-ware]")) return;
        const g = GUETER_NACH_ID[el.dataset.frachtGut];
        if (!g) return;
        tour.art = "spot";
        tour.gut = g;
        tour.auftrag = null;
        tour.ziel = null;
        tour.machbarkeit = null;
        if (tour.fahrzeug && frachtHindernis(tour.fahrzeug)) tour.fahrzeug = null;
        // Wie viel geht drauf? Das entscheidet erst das Fahrzeug.
        tour.tonnen = tour.fahrzeug ? spotMenge(tour.fahrzeug, g) : 0;
        // Städte mit Bedarf auf der Karte aufleuchten lassen
        hervorgehobenesGut = g;
        aktiveRoute = null;
        weiterZu("ziel");
        routeZeichnen();
        markenZeichnen();
      });
    });

    // ---- Schritt 2: Ziel ----
    dispo.querySelectorAll("[data-zielreiter]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        zielReiter = el.dataset.zielreiter;
        dispositionAktualisieren();
      });
    });

    dispo.querySelectorAll("[data-ziel]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.ziel = STAEDTE[el.dataset.ziel] || null;
        aktiveRoute = tour.ziel
          ? Route.berechne(tour.stadt.name, tour.ziel.name)
          : null;
        weiterZu("fahrzeug");
        routeZeichnen();
      });
    });

    // ---- Schritt 3: Fahrzeug ----
    dispo.querySelectorAll("[data-fahrzeug]").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("gesperrt")) return;
        const id = Number(el.dataset.fahrzeug);
        const f = FuhrparkApp.alleFahrzeuge().find((x) => x.id === id) || null;
        if (!f) return;
        fahrzeugUebernehmen(f);
        weiterZu("bereit");
        routeZeichnen();
      });
    });

    // Leerfahrt anfordern: Das Fahrzeug fährt nur hin, disponiert wird
    // neu, wenn es da ist. Deshalb endet die Planung hier.
    dispo.querySelectorAll("[data-anfordern]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = Number(el.dataset.anfordern);
        const f = alleVerfuegbaren().find((x) => x.id === id);
        if (!f) return;
        const ziel = el.dataset.anfordernZiel;
        if (!window.confirm(
          `${f.kennzeichen} leer von ${f.standort} nach ${ziel} schicken?\n\n` +
          `Die Fahrt bringt keinen Erlös. Disponiert wird neu, sobald ` +
          `das Fahrzeug angekommen ist.`
        )) return;
        auswahlVerwerfen();
        leerfahrtStarten(f, ziel);
      });
    });

    // ---- Schritt 4: noch eine Sendung oder losschicken ----
    dispo.querySelectorAll("[data-ladeort]").forEach((el) => {
      el.addEventListener("click", () => naechsteSendung(el.dataset.ladeort));
    });

    // ---- Reihenfolge von Hand ----
    dispo.querySelectorAll("[data-halt-hoch]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        haltVerschieben(Number(el.dataset.haltHoch), -1);
      });
    });

    dispo.querySelectorAll("[data-halt-runter]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        haltVerschieben(Number(el.dataset.haltRunter), 1);
      });
    });

    const reiheZurueck = dispo.querySelector("#tour-btn-reihenfolge-zurueck");
    if (reiheZurueck) reiheZurueck.addEventListener("click", reihenfolgeZuruecksetzen);

    // ---- Eine Sendung ändern ----
    dispo.querySelectorAll("[data-sendung-bearbeiten]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        sendungBearbeiten(Number(el.dataset.sendungBearbeiten));
      });
    });

    dispo.querySelectorAll("[data-etappe-loeschen]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Die Nummer zählt in alleSendungen(); in `geplant` fehlt die
        // gerade bearbeitete Sendung, deshalb um eins verschoben.
        const inAllen = Number(el.dataset.etappeLoeschen);
        const arbeit = inArbeitPlatz();
        const platz = (arbeit >= 0 && inAllen > arbeit) ? inAllen - 1 : inAllen;
        tour.geplant.splice(platz, 1);
        // Die Stadt der offenen Etappe hängt an der vorigen.
        const letzte = tour.geplant[tour.geplant.length - 1];
        if (letzte) tour.stadt = STAEDTE[letzte.nachName] || tour.stadt;
        etappeZuruecksetzen();
        tour.schritt = tour.geplant.length > 0 ? "bereit" : "fracht";
        dispositionAktualisieren();
        markenZeichnen();
        routeZeichnen();
      });
    });

    // ---- Mengenregler ----
    // Beim Ziehen wird NICHT alles neu gezeichnet: Der Schieber wäre
    // sonst mitten in der Bewegung weg. Stattdessen wandern nur die
    // Anzeige und der Restplatzbalken mit, und erst beim Loslassen
    // rechnet die Liste komplett neu.
    const schieber = dispo.querySelector("#tour-menge");
    if (schieber) {
      const uebernehmen = () => {
        tour.tonnen = Number(schieber.value);
        tour.mengeVonHand = true;
      };
      schieber.addEventListener("input", () => {
        uebernehmen();
        const anzeige = dispo.querySelector("#tour-menge-wert");
        if (anzeige) anzeige.textContent = `${tour.tonnen.toFixed(1)} t`;
        const stand = dispo.querySelector("#tour-ladungsstand");
        if (stand) stand.outerHTML = ladungsbalken();
      });
      schieber.addEventListener("change", () => {
        uebernehmen();
        dispositionAktualisieren({ nurListe: true });
      });
    }

    // Nur die angefangene Etappe verwerfen - die schon festgelegten
    // bleiben stehen. Ohne das bliebe nur das Kreuz, das die ganze
    // Planung wegwirft.
    const zurTour = dispo.querySelector("#tour-btn-zurueck-tour");
    if (zurTour) zurTour.addEventListener("click", zurTourZurueck);

    const aenderungWeg = dispo.querySelector("#tour-btn-aenderung-verwerfen");
    if (aenderungWeg) aenderungWeg.addEventListener("click", bearbeitungAbbrechen);

    dispo.querySelectorAll("#tour-btn-etappe-verwerfen, #tour-btn-etappe-verwerfen-liste")
      .forEach((el) => el.addEventListener("click", (e) => {
        e.stopPropagation();
        etappeVerwerfen();
      }));

    // Sendungsliste auf- und zuklappen. Nur die Liste neu zeichnen,
    // die Karte bleibt, wie sie ist.
    const klappen = dispo.querySelector("#tour-btn-etappen-klappen");
    if (klappen) klappen.addEventListener("click", (e) => {
      e.stopPropagation();
      etappenAufgeklappt = !etappenAufgeklappt;
      dispositionAktualisieren({ nurListe: true });
    });

    const starten = dispo.querySelector("#tour-btn-tour-starten");
    if (starten) starten.addEventListener("click", tourAusfuehren);

    const protokollKnopf = dispo.querySelector("#tour-btn-protokoll");
    if (protokollKnopf) {
      protokollKnopf.addEventListener("click", () => {
        ProtokollFenster.zeigen(nachholmeldung);
      });
    }

    const nachholWeg = dispo.querySelector("#tour-btn-nachholung-weg");
    if (nachholWeg) {
      nachholWeg.addEventListener("click", () => {
        nachholmeldung = null;
        dispositionAktualisieren();
      });
    }

    const meldungWeg = dispo.querySelector("#tour-btn-meldung-weg");
    if (meldungWeg) {
      meldungWeg.addEventListener("click", () => {
        letzteAnkunft = null;
        dispositionAktualisieren();
      });
    }

    const uebersicht = dispo.querySelector("#tour-btn-uebersicht");
    if (uebersicht) {
      uebersicht.addEventListener("click", () => {
        zurueckZurUebersicht();
        markenZeichnen();
        routeZeichnen();
      });
    }

    const neueTour = dispo.querySelector("#tour-btn-neue-tour");
    if (neueTour) {
      neueTour.addEventListener("click", () => {
        aktiveRoute = null;
        hervorgehobenesGut = null;
        tourZuruecksetzen();
        dispositionAktualisieren();
      });
    }

  }

  /**
   * Führt die Tour aus. Nutzt dieselbe Verschleißrechnung wie die
   * Debug-Touren im Fuhrpark - nur mit echten Streckendaten statt
   * Zufallswerten.
   */
  /**
   * Schickt ein Fahrzeug ohne Ladung in eine andere Stadt. Nutzt
   * dieselbe Fahrtlogik, nur ohne Auftrag und ohne Erlös.
   */
  function leerfahrtStarten(fahrzeug, zielName) {
    const route = Route.berechne(fahrzeug.standort, zielName);
    if (!route) return;

    Fahrt.starten({
      fahrzeug,
      etappen: [{ typ: "umsetzfahrt", route }],
      auftragNummer: null,
      vonName: fahrzeug.standort,
      nachName: zielName,
      beiAnkunft: leerfahrtAbschliessen
    });

    umsetzZiel = null;
    dispositionAktualisieren();
    Speicher.jetztSichern();
  }

  function leerfahrtAbschliessen(eintrag) {
    const f = eintrag.fahrzeug;
    const km = eintrag.etappen[0].route.km;
    const tage = Math.max(1, Math.round(km / (Fahrt.SCHNITT_STANDARD * Fahrt.LENKZEIT_STUNDEN)));

    const ergebnis = Verschleiss.wendeTourAn(f, {
      km, tage,
      gelaende: "huegelland", strassenqualitaet: "landstrasse",
      jahreszeit: jahreszeitJetzt(), beladungProzent: 0,
      fahrverhaltenFaktor: 1.0
    });

    const kosten = Math.round(ergebnis.verbrauchL * dieselpreis());

    Historie.hinzufuegen(f, {
      art: "tour",
      text: `Leerfahrt ${eintrag.vonName} → ${eintrag.nachName}, ${km.toLocaleString("de-DE")} km`,
      km, tage,
      erloes: 0,
      kosten,
      daten: { leerfahrt: true, verbrauchL: Math.round(ergebnis.verbrauchL) }
    });

    Finanzen.leerfahrtAbgerechnet({
      fahrzeug: f,
      verbrauchL: ergebnis.verbrauchL,
      km,
      von: eintrag.vonName,
      nach: eintrag.nachName
    });

    f.standort = eintrag.nachName;
    dispositionAktualisieren();
    if (FuhrparkApp.aktualisieren) FuhrparkApp.aktualisieren();
    Speicher.jetztSichern();
  }

  /**
   * Aus einer Spotladung wird ein regulärer Auftrag gemacht. So laufen
   * Statuskette, Verschleiß, Historie und Abrechnung durch denselben
   * Weg wie bei Börsen- und Kundenaufträgen - nur ohne Kundenbindung:
   * kundeId bleibt leer, deshalb wertet zustellen() keine Treue auf.
   */
  // Laufende Nummer für Spotaufträge. Eine Zeitmarke reichte nicht mehr:
  // Bei mehreren Spotetappen einer Tour entstehen sie in derselben
  // Millisekunde und bekämen dieselbe Nummer.
  let spotZaehler = 1;

  function spotAuftragAnlegen(etappe, vorlaufStunden) {
    const g = etappe.gut;
    const route = Route.berechne(etappe.vonName, etappe.nachName);
    if (!route) return null;

    const entgelt = etappe.entgelt;
    const jetzt = Spielzeit.heute();

    // Frist großzügig: Am Spotmarkt wird ohne festen Termin verkauft.
    // Trotzdem braucht der Auftrag einen Wert, sonst gilt er sofort
    // als verspätet. Bei einer Anschlussetappe kommt der Vorlauf dazu -
    // das Fahrzeug ist ja erst in Tagen dort.
    const frist = new Date(jetzt.getTime());
    frist.setHours(frist.getHours()
      + Math.round(vorlaufStunden || 0)
      + fahrdauerStunden(route.km) * 2 + 48);

    const auftrag = {
      nummer: `S-${(spotZaehler++).toString().padStart(6, "0")}`,
      status: Auftraege.STATUS.offen,
      quelle: "spot",
      kundeId: null,
      kundeName: "Freier Markt",
      vonName: etappe.vonName,
      nachName: etappe.nachName,
      gutId: g.id,
      tonnen: etappe.tonnen,
      km: route.km,
      entgelt,
      ladeBeginn: jetzt.toISOString(),
      ladeEnde: frist.toISOString(),
      lieferFrist: frist.toISOString(),
      angelegtAm: jetzt.toISOString(),
      fahrzeugId: null,
      zugestelltAm: null,
      puenktlich: null
    };

    return Auftraege.aufnehmen(auftrag);
  }

  function tourAusfuehren() {
    const f = tour.fahrzeug;
    if (!f) return;

    // Die offene Sendung gehört dazu.
    const sendungen = alleSendungen();
    const plan = tourPlan(sendungen);
    if (!plan || !plan.machbar) return;

    // Spotware bekommt jetzt ihren Auftrag - vorher gibt es nichts,
    // worauf sich eine Buchung beziehen könnte. Der Vorlauf ist die
    // Zeit bis zur Abholung, damit eine Ladung, die erst in drei Tagen
    // geholt wird, keine Frist von heute bekommt.
    const auftraege = sendungen.map((e, i) => {
      if (e.art === "auftrag") return e.auftrag;
      const ab = plan.je[i].abholung;
      const vorlauf = ab ? (ab - Spielzeit.heute()) / 3600000 : 0;
      return spotAuftragAnlegen(e, vorlauf);
    });
    if (auftraege.some((a) => !a)) return;

    // Stoppliste in die Form bringen, die Fahrt versteht: Nummern
    // statt Indizes.
    const stopps = plan.stopps.map((st) => ({
      stadt: st.stadt,
      laden: st.laden.map((k) => ({
        auftragNummer: auftraege[k].nummer,
        gutId: auftraege[k].gutId,
        tonnen: sendungen[k].tonnen
      })),
      abladen: st.abladen.map((k) => ({
        auftragNummer: auftraege[k].nummer,
        gutId: auftraege[k].gutId,
        tonnen: sendungen[k].tonnen
      }))
    }));

    // Feste Buchung: Ab jetzt sind die Aufträge dem Fahrzeug zugeteilt
    // und stehen niemandem sonst mehr zur Verfügung.
    auftraege.forEach((a) => Auftraege.disponieren(a, f));

    Fahrt.starten({
      fahrzeug: f,
      stopps,
      etappen: plan.etappen.map((e) => ({ typ: e.typ, route: e.route })),
      auftragNummer: auftraege[0].nummer,
      vonName: stopps[0].stadt,
      nachName: stopps[stopps.length - 1].stadt,
      beiStopp: stoppErreicht,
      beiAnkunft: tourAbschliessen
    });

    aktiveRoute = null;
    hervorgehobenesGut = null;
    tourZuruecksetzen();
    tour.stadt = gewaehlteStadt;
    dispositionAktualisieren();
    Speicher.jetztSichern(); // Tourstart darf nicht verlorengehen
  }

  /**
   * Ein Stopp ist erreicht: erst die gefahrene Etappe abrechnen, dann
   * abladen und abrechnen, dann neu laden.
   *
   * Bewusst ohne jede eingefangene Umgebung - die Funktion liest alles
   * aus `t.stopps[index]`. Nur so überlebt sie das Laden eines
   * Spielstands, bei dem es die Umgebung des Tourstarts nicht mehr gibt.
   */
  function stoppErreicht(t, index) {
    const stopp = t.stopps && t.stopps[index];
    if (!stopp) return;
    const f = t.fahrzeug;

    f.standort = stopp.stadt;

    // Die eben gefahrene Etappe: Verschleiß und Verbrauch fallen je
    // Teilstrecke EINMAL an, nicht je Sendung. Sonst zahlte eine Tour
    // mit drei Sendungen den Sprit dreimal.
    if (index > 0) etappeVerbrauchen(t, index - 1);

    (stopp.abladen || []).forEach((x) => {
      const auftrag = Auftraege.nachNummer(x.auftragNummer);
      if (auftrag) sendungAbrechnen(t, auftrag, index);
    });

    (stopp.laden || []).forEach((x) => {
      const auftrag = Auftraege.nachNummer(x.auftragNummer);
      if (auftrag) Auftraege.beginnen(auftrag);
    });
  }

  /**
   * Verschleiß und Verbrauch einer gefahrenen Etappe. Der Verbrauch
   * wird an der Etappe vermerkt, damit die Sendungen ihn sich später
   * nach Tonnage teilen können.
   */
  function etappeVerbrauchen(t, i) {
    const etappe = t.etappen[i];
    if (!etappe || etappe.verbrauchL !== undefined) return;

    const f = t.fahrzeug;
    const anBord = Fahrt.ladung(t, i);
    const tonnen = anBord.reduce((summe, nr) => {
      const eintrag = ladeEintrag(t, nr);
      return summe + (eintrag ? eintrag.tonnen : 0);
    }, 0);

    const beladungProzent = Math.min(100, Math.round((tonnen * 1000 / f.zuladungKg) * 100));
    const km = etappe.route.km;
    const tage = Math.max(1, Math.round(km / (Fahrt.SCHNITT_STANDARD * Fahrt.LENKZEIT_STUNDEN)));

    const ergebnis = Verschleiss.wendeTourAn(f, {
      km, tage,
      gelaende: "huegelland", strassenqualitaet: "landstrasse",
      jahreszeit: jahreszeitJetzt(), beladungProzent,
      fahrverhaltenFaktor: 1.0
    });

    etappe.verbrauchL = ergebnis.verbrauchL;
    etappe.tonnenAnBord = tonnen;
  }

  /** Der Ladeeintrag einer Sendung - dort steht ihre Tonnage. */
  function ladeEintrag(t, nummer) {
    for (const st of t.stopps) {
      const treffer = (st.laden || []).find((x) => x.auftragNummer === nummer);
      if (treffer) return treffer;
    }
    return null;
  }

  /**
   * Zustellung einer einzelnen Sendung.
   *
   * Der Sprit ist längst je Etappe gebucht; hier wird nur noch
   * aufgeteilt: Wer die Hälfte der Tonnage stellt, trägt die Hälfte
   * der Kosten dieser Teilstrecke. Leerfahrten gehen zulasten dessen,
   * wofür sie gefahren wurden - der Sendung, die am Ende der
   * Leerstrecke zusteigt.
   */
  function sendungAbrechnen(t, auftrag, stoppIndex) {
    const f = t.fahrzeug;
    const g = Auftraege.gut(auftrag);
    const start = ladeStopp(t, auftrag.nummer);

    let verbrauchL = 0;
    let km = 0;
    let leerKm = 0;

    for (let i = 0; i < stoppIndex; i++) {
      const etappe = t.etappen[i];
      if (!etappe || etappe.verbrauchL === undefined) continue;
      const anBord = Fahrt.ladung(t, i);
      let anteil = 0;

      if (anBord.includes(auftrag.nummer)) {
        const summe = anBord.reduce((sum, nr) => {
          const e = ladeEintrag(t, nr);
          return sum + (e ? e.tonnen : 0);
        }, 0);
        anteil = summe > 0 ? auftrag.tonnen / summe : 1 / anBord.length;
        km += etappe.route.km * anteil;
      } else if (anBord.length === 0 && i === start - 1) {
        // Die Leerfahrt unmittelbar vor dem Beladen gehört zu dieser
        // Sendung, geteilt mit allem, was dort sonst noch zusteigt.
        const dazu = t.stopps[start].laden || [];
        const summe = dazu.reduce((sum, x) => sum + x.tonnen, 0);
        anteil = summe > 0 ? auftrag.tonnen / summe : 1 / Math.max(1, dazu.length);
        leerKm += etappe.route.km * anteil;
      }

      verbrauchL += etappe.verbrauchL * anteil;
    }

    const gesamtKm = Math.round(km + leerKm);
    const tage = Math.max(1, Math.round(gesamtKm / (Fahrt.SCHNITT_STANDARD * Fahrt.LENKZEIT_STUNDEN)));

    Auftraege.zustellen(auftrag);
    Finanzen.tourAbgerechnet({ auftrag, fahrzeug: f, verbrauchL, km: gesamtKm });

    const spritkosten = Math.round(verbrauchL * dieselpreis());
    const deckungsbeitrag = auftrag.entgelt - spritkosten;

    Speicher.melden(
      "ankunft",
      `${f.kennzeichen}: ${auftrag.vonName} → ${auftrag.nachName}, ` +
      `${auftrag.tonnen.toFixed(1)} t ${g.name}, ` +
      `${deckungsbeitrag.toLocaleString("de-DE")} DM Deckungsbeitrag` +
      (auftrag.puenktlich ? "" : " (verspätet)"),
      { auftrag: auftrag.nummer, fahrzeugId: f.id, deckungsbeitrag }
    );

    Historie.hinzufuegen(f, {
      art: "tour",
      text: `${auftrag.nummer}: ${auftrag.vonName} → ${auftrag.nachName}, ` +
            `${auftrag.tonnen.toFixed(1)} t ${g.name}` +
            (auftrag.puenktlich ? "" : " (verspätet)"),
      km: gesamtKm,
      tage,
      erloes: auftrag.entgelt,
      kosten: spritkosten,
      daten: {
        auftrag: auftrag.nummer,
        kunde: auftrag.kundeName,
        anfahrtKm: Math.round(leerKm), hauptlaufKm: Math.round(km),
        tonnen: auftrag.tonnen,
        puenktlich: auftrag.puenktlich,
        verbrauchL: Math.round(verbrauchL),
        deckungsbeitrag
      }
    });

    letzteAnkunft = {
      auftrag, gut: g, anfahrtKm: Math.round(leerKm), hauptlaufKm: Math.round(km), gesamtKm,
      erloes: auftrag.entgelt, spritkosten, deckungsbeitrag,
      verbrauchL: Math.round(verbrauchL),
      puenktlich: auftrag.puenktlich,
      schaden: null
    };

    dispositionAktualisieren();
    if (FuhrparkApp.aktualisieren) FuhrparkApp.aktualisieren();
  }

  /** An welchem Stopp diese Sendung zugeladen wurde. */
  function ladeStopp(t, nummer) {
    for (let i = 0; i < t.stopps.length; i++) {
      if ((t.stopps[i].laden || []).some((x) => x.auftragNummer === nummer)) return i;
    }
    return 0;
  }

  /**
   * Die Tour ist zu Ende. Abgeladen und abgerechnet ist an dieser
   * Stelle schon alles - hier bleibt, was für die ganze Fahrt gilt.
   */
  function tourAbschliessen(eintrag) {
    const f = eintrag.fahrzeug;

    const schaden = Ausfall.pruefe(f);
    if (schaden) {
      Ausfall.ausloesen(f, schaden.teil, schaden.wert);
      Historie.hinzufuegen(f, {
        art: "schaden",
        text: `Liegengeblieben in ${f.standort}: ${schaden.teil} bei ${schaden.wert.toFixed(0)}%`,
        daten: { teil: schaden.teil, wert: schaden.wert }
      });
      Speicher.melden(
        "ausfall",
        `${f.kennzeichen} liegengeblieben in ${f.standort}: ` +
        `${schaden.teil} bei ${schaden.wert.toFixed(0)} %`,
        { fahrzeugId: f.id, teil: schaden.teil }
      );
      if (letzteAnkunft) letzteAnkunft.schaden = schaden;
    }

    dispositionAktualisieren();
    if (FuhrparkApp.aktualisieren) FuhrparkApp.aktualisieren();
    Speicher.jetztSichern();
  }

  let letzteAnkunft = null;

  // Hinweis auf die Zeit, die während der Pause nachsimuliert wurde
  let nachholmeldung = null;

  // ---------- Darstellung laufender Fahrten ----------

  /**
   * Zeichnet alle unterwegs befindlichen Fahrzeuge an ihrer aktuellen
   * Position. Wird bei jedem Zeittakt und bei jeder Kartenbewegung
   * aufgerufen.
   */
  function fahrtenZeichnen() {
    const ebene = fensterElement && fensterElement.querySelector("#tour-fahrt");
    if (!ebene) return;

    const touren = Fahrt.alle();
    if (touren.length === 0) { ebene.innerHTML = ""; return; }

    // Marken statt Symbole: Sie sind auf der kleinteiligen Karte besser
    // zu erkennen und tragen die Lackierung des Fahrzeugs - so sieht man
    // auf einen Blick, welcher Lkw wo unterwegs ist.
    //
    // Ein Wagen, der ROLLT, ist ein Dreieck mit der Spitze in
    // Fahrtrichtung. Damit steht auf der Karte, wohin er unterwegs
    // ist, ohne dass man die Route verfolgen muss. Ein Wagen, der an
    // einer Rampe steht oder Ruhezeit hat, ist ein Quadrat: Er hat in
    // diesem Augenblick keine Fahrtrichtung, und eine Spitze würde
    // eine behaupten. Der Unterschied Stehen/Fahren ist damit auf der
    // Karte ablesbar, nicht nur in der Liste.
    ebene.innerHTML = touren.map((t) => {
      const p = positionAufRoute(t);
      if (!p) return "";
      const ruht = Boolean(t.ruhtBis);
      const steht = Boolean(t.stehtBis);
      const rollt = !ruht && !steht && p.winkel !== null;
      const farbe = Lackierung.cssFarbe(t.fahrzeug.lackierung);
      const rand = Lackierung.cssFarbeDunkel(t.fahrzeug.lackierung);
      const lage = rollt ? ` transform:rotate(${p.winkel.toFixed(0)}deg);` : "";
      const zustand = steht ? "An der Rampe" : ruht ? "Ruhezeit" : "unterwegs";
      return `<span class="tour-fahrzeugpunkt ${rollt ? "rollt" : "haelt"}
                           ${ruht ? "ruht" : ""} ${steht ? "steht" : ""}
                           ${Fahrt.istBeladen(t) ? "beladen" : "leer"}"
                    data-kennzeichen="${t.fahrzeug.kennzeichen}"
                    data-winkel="${rollt ? p.winkel.toFixed(0) : ""}"
                    style="left:${Math.round(p.x)}px; top:${Math.round(p.y)}px;
                           background:${farbe}; border-color:${rand};${lage}"
                    title="${t.fahrzeug.kennzeichen} (${t.fahrzeug.lackierung}): ${t.vonName} → ${t.nachName} · ${zustand}"></span>`;
    }).join("");
  }

  /**
   * Bildschirmposition eines Fahrzeugs auf seiner Route.
   * Folgt dem tatsächlichen Straßenverlauf - demselben, der auch in die
   * Karte gezeichnet ist. Vorher wurde zwischen den Städten gerade
   * abgekürzt, das Fahrzeug fuhr sichtbar neben der Straße.
   */
  function positionAufRoute(t) {
    const etappe = Fahrt.aktuelleEtappe(t);
    const verlauf = etappe.route.verlauf;
    if (!verlauf || verlauf.length < 2) return null;

    const anteil = Fahrt.etappenFortschritt(t);
    const hier = Route.punktAuf(verlauf, anteil);
    // Zweiter Punkt kurz dahinter, nur um die Blickrichtung zu kennen
    const gleich = Route.punktAuf(verlauf, Math.min(1, anteil + 0.01));
    if (!hier) return null;

    const b = Karte.nachBild(hier[0], hier[1]);
    const b2 = gleich ? Karte.nachBild(gleich[0], gleich[1]) : b;

    // Der Winkel wird ABSICHTLICH aus den Bildkoordinaten gerechnet
    // und nicht aus Länge und Breite: Die Karte ist eine
    // Plattkarte, in der ein Kurs nach Nordost weiter oben anders
    // aussieht als weiter unten. Wer geographisch peilt, bekommt eine
    // Spitze, die neben der Straße zeigt. Zoom und Versatz sind
    // gleichförmig und ändern am Winkel nichts, deshalb genügen die
    // Bildkoordinaten vor der Umrechnung.
    const dx = b2.x - b.x;
    const dy = b2.y - b.y;
    const winkel = (dx || dy) ? Math.atan2(dy, dx) * 180 / Math.PI : null;

    return {
      x: b.x * zoom + versatzX,
      y: b.y * zoom + versatzY,
      nachLinks: b2.x < b.x,
      winkel
    };
  }

  /**
   * Zurück auf die Übersicht: keine Stadt gewählt, keine Planung,
   * nur Flotte und laufende Fahrten - der Zustand beim Öffnen.
   */
  function zurueckZurUebersicht() {
    gewaehlteStadt = null;
    hervorgehobenesGut = null;
    aktiveRoute = null;
    detailGut = null;
    umsetzZiel = null;
    tourZuruecksetzen();
    dispositionAktualisieren();
  }

  /**
   * Einen Auftrag aus der Auftragsübersicht übernehmen: Disposition
   * öffnen, Ladestadt wählen, Fracht setzen und im Ablauf beim Ziel
   * einsetzen. Alles Weitere - Ziel bestätigen, Wagen wählen - gehört
   * hierher und nicht in die Liste.
   */
  function auftragUebernehmen(nummer) {
    const a = Auftraege.nachNummer(nummer);
    if (!a || a.status !== Auftraege.STATUS.offen) return;

    open();

    const stadt = STAEDTE[a.vonName];
    if (!stadt) return;

    // Eine laufende Planung gehört zu einer anderen Stadt.
    tourZuruecksetzen();
    gewaehlteStadt = stadt;
    tour.stadt = stadt;

    tour.art = "auftrag";
    tour.auftrag = a;
    tour.tonnen = a.tonnen;
    aktiveRoute = Route.berechne(a.vonName, a.nachName);
    tour.schritt = "ziel";

    dispositionAktualisieren();
    markenZeichnen();
    routeZeichnen();
    aufStadtZentrieren(stadt);
  }

  /**
   * Ein Fahrzeug auf der Karte zeigen - gerufen aus dem Fuhrpark.
   * Fährt es gerade, wird seine Strecke hervorgehoben und der
   * Ausschnitt darauf gelegt. Steht es, wird sein Standort gewählt,
   * damit man gleich von dort aus disponieren kann.
   */
  function fahrzeugZeigen(id) {
    open();

    const f = FuhrparkApp.alleFahrzeuge().find((x) => x.id === id);
    if (!f) return;

    hervorgehobenesGut = null;

    const lauf = Fahrt.fuerFahrzeug(id);
    if (lauf) {
      // Unterwegs: die Strecke hervorheben, keine Stadt auswählen -
      // disponieren lässt sich mit diesem Wagen ohnehin nicht.
      gewaehlteStadt = null;
      tourZuruecksetzen();
      const haupt = lauf.etappen.find((e) => e.typ === "hauptlauf") || lauf.etappen[0];
      aktiveRoute = haupt ? haupt.route : null;
      dispositionAktualisieren();
      if (aktiveRoute) aufRouteZentrieren(aktiveRoute);
      return;
    }

    const stadt = STAEDTE[f.standort];
    if (stadt) {
      stadtWaehlen(stadt);
      aufStadtZentrieren(stadt);
      dispositionAktualisieren();
    } else {
      dispositionAktualisieren();
    }
  }

  /**
   * Legt den Kartenausschnitt so, dass die ganze Strecke hineinpasst.
   * Ohne das läge eine Fahrt Hamburg-Lisboa zur Hälfte außerhalb.
   */
  function aufRouteZentrieren(route) {
    const rahmen = fensterElement && fensterElement.querySelector("#tour-karte-rahmen");
    const punkte = route && route.verlauf;
    if (!rahmen || !punkte || punkte.length < 2) return;

    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    punkte.forEach((p) => {
      const b = Karte.nachBild(p[0], p[1]);
      x1 = Math.min(x1, b.x); x2 = Math.max(x2, b.x);
      y1 = Math.min(y1, b.y); y2 = Math.max(y2, b.y);
    });

    const rand = 24;
    const breite = Math.max(1, x2 - x1);
    const hoehe = Math.max(1, y2 - y1);
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
      Math.min((rahmen.clientWidth - 2 * rand) / breite,
               (rahmen.clientHeight - 2 * rand) / hoehe)));

    versatzX = rahmen.clientWidth / 2 - ((x1 + x2) / 2) * zoom;
    versatzY = rahmen.clientHeight / 2 - ((y1 + y2) / 2) * zoom;
    versatzBegrenzen();
    ansichtAnwenden();
  }

  /**
   * Zurück auf die Frachtliste der Stadt. Die Stadt selbst bleibt
   * stehen - verworfen wird nur, was darauf aufbaut.
   */
  function auswahlVerwerfen() {
    hervorgehobenesGut = null;
    aktiveRoute = null;
    tourZuruecksetzen();
    tour.stadt = gewaehlteStadt;
    dispositionAktualisieren();
  }

  /** Jahreszeit aus der Spielzeit ableiten. */
  /** Berechnet die Route zwischen Start und Ziel und zeigt sie an. */
  function routeSetzen() {
    if (tour.startStadt && tour.zielStadt) {
      aktiveRoute = Route.berechne(tour.startStadt.name, tour.zielStadt.name);
    } else {
      aktiveRoute = null;
    }
    routeZeichnen();
  }

  function jahreszeitJetzt() {
    const monat = Spielzeit.heute().getMonth() + 1;
    if (monat <= 2 || monat === 12) return "winter";
    if (monat <= 5) return "fruehling";
    if (monat <= 8) return "sommer";
    return "herbst";
  }

  /** Zeigt Warendetails im Dispositionsbereich an - die Karte bleibt sichtbar. */
  function warendetailsZeigen(gut) {
    detailGut = gut;
    hervorgehobenesGut = gut;
    dispositionAktualisieren();
  }

  function warendetailsSchliessen() {
    detailGut = null;
    if (!tour.gut) hervorgehobenesGut = null;
    dispositionAktualisieren();
  }

  // ---------- Tooltip auf der Karte ----------
  //
  // Er hing an mouseover/mouseout, und das reichte an zwei Stellen
  // nicht:
  //
  //   Ein Fingertipp erzeugt ein künstliches mouseover, aber nie ein
  //   mouseout - der Finger schwebt ja nirgendwohin. Auf dem Telefon
  //   blieb der Kasten nach jedem Tipp auf eine Stadt für immer stehen.
  //
  //   markenZeichnen() ersetzt die ganze Markenebene. Wird die Marke
  //   unter dem Zeiger dabei weggeworfen, kommt ebenfalls kein
  //   mouseout. Deshalb überlebte der Kasten Verschieben, Zoomen und
  //   jeden Uhrentakt und nannte am Ende eine Stadt, die gar nicht
  //   mehr zu sehen war.
  //
  // Die Position ist außerdem in Rahmenkoordinaten gerechnet und
  // wandert beim Verschieben nicht mit. Beim Ansichtswechsel zu
  // verbergen ist also nicht nur Reparatur, sondern richtig.

  let tooltipUhr = null;

  function tooltipZeigen(text, x, y, vonSelbstSchliessen) {
    const t = fensterElement && fensterElement.querySelector("#tour-karte-tooltip");
    if (!t) return;
    if (tooltipUhr) { clearTimeout(tooltipUhr); tooltipUhr = null; }
    t.textContent = text;
    t.style.left = `${x + 12}px`;
    t.style.top = `${y + 12}px`;
    t.classList.remove("hidden");
    // Beim Finger gibt es kein Gegenstück zum Zeigen, also schließt er
    // sich selbst.
    if (vonSelbstSchliessen) tooltipUhr = setTimeout(tooltipVerbergen, 2000);
  }

  function tooltipVerbergen() {
    if (tooltipUhr) { clearTimeout(tooltipUhr); tooltipUhr = null; }
    const t = fensterElement && fensterElement.querySelector("#tour-karte-tooltip");
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
          routeSetzen();
        }
      }
      stadtWaehlen(stadt);
    });

    // Ein echter Zeiger meldet sich beim Verlassen ab, ein Finger
    // nicht. Deshalb hier unterschieden: Maus zeigt, solange sie
    // darüber steht, Finger zeigt kurz und schließt von selbst.
    const markeBeschriften = (e, vonSelbstSchliessen) => {
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
        e.clientY - r.top,
        vonSelbstSchliessen
      );
    };

    marken.addEventListener("pointerover", (e) => {
      if (e.pointerType === "touch") return;      // kommt über pointerdown
      markeBeschriften(e, false);
    });

    marken.addEventListener("pointerout", (e) => {
      if (e.target.closest(".tour-marke")) tooltipVerbergen();
    });

    // Am Finger hängt der Kasten, solange er aufliegt: aufsetzen zeigt
    // den Namen, loslassen nimmt ihn weg. Ein Tipp wählt die Stadt
    // ohnehin, und dann steht ihr Name unten im Bereich - ein Kasten,
    // der danach noch nachhängt, wäre genau der Geist, der repariert
    // werden sollte. Die Selbstausblendung bleibt als Netz für den
    // Fall, dass ein Browser das Loslassen verschluckt.
    marken.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      markeBeschriften(e, true);
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((art) => {
      marken.addEventListener(art, (e) => {
        if (e.pointerType === "touch") tooltipVerbergen();
      });
    });

    // Wer die Karte verlässt, will den Kasten nicht mehr sehen. Fängt
    // auch den Fall ab, dass die Marke unter dem Zeiger neu gezeichnet
    // und damit ersetzt wurde.
    rahmen.addEventListener("mouseleave", tooltipVerbergen);

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
        // Die Teilung neu anwenden: Beim Drehen des Telefons kann der
        // gespeicherte Anteil unter die Pixel-Untergrenze rutschen.
        teilungSetzen(kartenAnteil, false);
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

  /**
   * Verbindet die Anzeige mit der laufenden Uhr. Bei jedem Takt rücken
   * die Touren vor, das Fenster zeichnet sie neu.
   */
  /**
   * Lädt einen Spielstand und hängt die Ankunftsbehandlung ein. Liegt
   * hier, weil nur die Tourenplanung weiß, was bei einer Ankunft zu
   * tun ist - die Spielstandverwaltung ruft es auf.
   */
  function spielstandLaden(nr) {
    const ergebnis = Speicher.laden(
      nr === undefined ? Speicher.aktiver() : nr,
      { beiStopp: stoppErreicht, beiAnkunft: tourAbschliessen }
    );
    if (ergebnis && ergebnis.fehler) return ergebnis;

    if (ergebnis && ergebnis.nachgeholteStunden > 0) {
      nachholmeldung = ergebnis;
    } else {
      nachholmeldung = null;
    }

    // Eine laufende Planung bezieht sich auf die alte Welt.
    aktiveRoute = null;
    hervorgehobenesGut = null;
    detailGut = null;
    umsetzZiel = null;
    letzteAnkunft = null;
    gewaehlteStadt = null;
    tourZuruecksetzen();

    if (fensterElement && document.body.contains(fensterElement)) {
      markenZeichnen();
      dispositionAktualisieren();
    }
    FuhrparkApp.aktualisieren();
    return ergebnis;
  }

  let taktAngemeldet = false;
  function taktVerbinden() {
    if (taktAngemeldet) return;
    taktAngemeldet = true;

    let letzteZeit = Spielzeit.heute().getTime();

    // Spielstand laden, bevor Aufträge erzeugt werden - sonst würde der
    // gespeicherte Pool überschrieben.
    if (Speicher.vorhanden()) spielstandLaden();
    Speicher.automatikStarten();

    // Auftragspool füllen und regelmäßig auffrischen
    Auftraege.auffrischen();
    let letzteAuffrischung = Spielzeit.heute().getTime();

    Spielzeit.beiAenderung((jetzt) => {
      // Alle sechs Spielstunden kommen neue Aufträge herein
      if (jetzt.getTime() - letzteAuffrischung > 6 * 3600 * 1000) {
        letzteAuffrischung = jetzt.getTime();
        Auftraege.auffrischen();
      }

      const vergangeneMinuten = (jetzt.getTime() - letzteZeit) / 60000;
      letzteZeit = jetzt.getTime();
      if (vergangeneMinuten > 0) Fahrt.takt(vergangeneMinuten);

      // Zum Monatsersten die wiederkehrenden Posten buchen
      Finanzen.monatspruefung();

      if (!fensterElement || !document.body.contains(fensterElement)) return;

      fahrtenZeichnen();

      // Fortschrittsbalken nur auffrischen, wenn sie sichtbar sind
      // Nur neu aufbauen, wenn sich auch etwas ändert. Während der
      // Auftragswahl bleibt die Liste stehen, damit man in Ruhe lesen
      // und blättern kann - neue Aufträge kommen beim nächsten
      // Auffrischen dazu.
      // Ohne Karte: Im Takt ändern sich nur Fortschrittsbalken und
      // Ankunftszeiten in der Liste. Die Fahrzeugpunkte auf der Karte
      // zeichnet fahrtenZeichnen() oben ohnehin schon.
      if (!inAuswahl() && Fahrt.anzahl() > 0) {
        dispositionAktualisieren({ nurListe: true });
      }
    });

    // Die Laufbedingung ("nur wenn Fahrzeuge unterwegs sind") setzt
    // clock.js schon beim Seitenaufruf - sonst liefe die Taskleistenuhr
    // bis zum ersten Öffnen dieses Fensters frei.
    Spielzeit.starten();
  }

  // Die Uhr steht ausschließlich in der Taskleiste - ein Programm auf
  // diesem Rechner hat keine eigene Uhr, so wenig wie ein Programm
  // unter Windows 98 eine hatte. Wer wissen will, wie spät es ist,
  // schaut nach unten rechts.

  function open() {
    const ergebnis = WindowManager.open({
      id: "tourenplanung",
      title: "Disposition",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;

    if (ergebnis.wurdeNeuErstellt) {
      ereignisseBinden();
      teilerEreignisse();
      teilungLesen();
      markenZeichnen();
      // Erst die Uhr anbinden (dabei wird der Spielstand geladen),
      // dann zeichnen - sonst fehlt der Hinweis auf die Pause.
      taktVerbinden();
      dispositionAktualisieren();
      // Erst nach dem Einhängen ins Dokument steht die Fenstergröße
      // fest - vorher lässt sich weder die Ansicht noch die Teilung
      // in Pixeln begrenzen.
      setTimeout(() => {
        teilungSetzen(kartenAnteil, false);
        ansichtZuruecksetzen();
      }, 0);
    }
  }

  return {
    open,
    /** Spielstand laden - wird von der Spielstandverwaltung benutzt. */
    spielstandLaden,
    /** Stellt sicher, dass Uhr, Auftragspool und Automatik laufen. */
    starten: taktVerbinden,
    /** Ein Fahrzeug auf der Karte zeigen - benutzt der Fuhrpark. */
    fahrzeugZeigen,
    /** Einen Auftrag hier hineinreichen - benutzt die Auftragsübersicht. */
    auftragUebernehmen,
    /**
     * Rückrufe für wiederhergestellte Touren. Die Spielstandverwaltung
     * hängt sie an jede geladene Fahrt, damit an den Stopps auch nach
     * einem Neuladen ab- und aufgeladen wird.
     */
    tourRueckrufe: () => ({ beiStopp: stoppErreicht, beiAnkunft: tourAbschliessen }),
    /**
     * Nur für den Test: die Handreihenfolge lesen und setzen. Eine
     * unfahrbare Reihenfolge lässt sich über die Oberfläche nicht
     * herstellen - die Pfeile erzeugen immer gültige Folgen. Geprüft
     * werden muss der kaputte Zustand trotzdem, denn er ist der Grund,
     * warum die Tour ihn überhaupt anzeigt.
     */
    __reihenfolge: () => (tour.reihenfolge ? tour.reihenfolge.slice() : null),
    __reihenfolgeSetzen: (folge) => {
      tour.reihenfolge = folge;
      dispositionAktualisieren();
      markenZeichnen();
      routeZeichnen();
    },
    /** Von anderen Modulen aufrufbar, wenn sich die Flotte ändert. */
    aktualisieren: () => {
      if (fensterElement && document.body.contains(fensterElement)) {
        markenZeichnen();
        dispositionAktualisieren();
      }
    }
  };
})();

// Die Kennung bleibt "tourenplanung": Sie steckt in Fenster-Kennungen,
// CSS-Klassen und Tests. Umbenannt wurde, was der Spieler liest.
AppRegistry.register({
  id: "tourenplanung",
  name: "Disposition",
  open: TourenplanungApp.open
});

document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("icon-tourenplanung");
  if (icon) icon.addEventListener("click", () => TourenplanungApp.open());

  // Den Spielstand gleich beim Seitenaufruf laden, nicht erst beim
  // Öffnen der Tourenplanung.
  //
  // Vorher hing das Laden am ersten Öffnen dieses Fensters. Wer
  // zuerst den Fuhrpark öffnete, sah deshalb nicht seine Flotte,
  // sondern eine frisch angelegte Startflotte mit einem einzigen
  // Fahrzeug - die übrigen kamen erst zum Vorschein, sobald die
  // Tourenplanung den Stand nachlud. Der Fuhrpark legt seine
  // Startflotte nämlich selbst an, wenn keine da ist.
  TourenplanungApp.starten();
});
