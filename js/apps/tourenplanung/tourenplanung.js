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
  //
  // Ablauf ab 0.15.14: Ausgangspunkt ist die Stadt, nicht der
  // Auftragspool. Man wählt eine Stadt auf der Karte, drückt "Tour
  // planen" und sieht dann die Stadtseite: was von dort ausgeht und ob
  // ein Fahrzeug vor Ort steht. Von da aus Fahrzeug -> Fracht -> Ziel.
  //
  // Zwei Frachtarten:
  //   auftrag  fester Auftrag aus Börse oder von einem Kunden; Ziel,
  //            Frist und Entgelt stehen fest, der Schritt "Ziel" entfällt
  //   spot     freies Warenangebot der Region; das Ziel wählt man selbst
  //            unter allen Städten mit Bedarf, ohne Frist und ohne
  //            Kundenbindung (Spotmarkt)
  let tour = {
    schritt: "stadt",  // stadt | fahrzeug | fracht | ziel | bereit
    stadt: null,
    fahrzeug: null,
    art: null,         // "auftrag" | "spot"
    auftrag: null,     // bei art === "auftrag"
    gut: null,         // bei art === "spot"
    tonnen: 0,
    ziel: null,        // bei art === "spot"
    machbarkeit: null
  };

  function tourZuruecksetzen() {
    tour = {
      schritt: "stadt", stadt: null, fahrzeug: null, art: null,
      auftrag: null, gut: null, tonnen: 0, ziel: null, machbarkeit: null
    };
  }

  // Wird eine Ware angetippt, sollen alle Städte aufleuchten, die sie
  // liefern können.
  let hervorgehobenesGut = null;

  // Warendetails werden im selben Rahmen gezeigt statt in einem eigenen
  // Fenster - so bleibt die Karte darüber sichtbar.
  let detailGut = null;

  // Stadt, in die ein Fahrzeug leer umgesetzt werden soll
  let umsetzZiel = null;

  // Die Tourenplanung läuft nur, wenn sie ausdrücklich gestartet wurde.
  // Sonst zeigt der untere Bereich die Angaben zur gewählten Stadt.
  let planungAktiv = false;

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
            <button class="win98-button bevel-out" id="tour-btn-planung">🚚 Tour planen</button>
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
    if (umsetzZiel) return renderUmsetzen(umsetzZiel);
    if (detailGut) return renderWarendetails(detailGut);
    if (planungAktiv) return renderTourplanung();
    return renderStadtinfo();
  }

  /** Warendetails im Dispositionsbereich, mit Rückweg zur Liste. */
  function renderWarendetails(gut) {
    const lieferstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.angebot(s).some((g) => g.id === gut.id));
    const bedarfsstaedte = Karte.alleStaedte()
      .filter((s) => Wirtschaft.bedarf(s).some((g) => g.id === gut.id));
    const jeAuflieger = Math.min(25, (Ladung.LADEVOLUMEN_M3 * gut.dichteKgProM3) / 1000);

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
          <dt>Ladung je Auflieger</dt><dd>${jeAuflieger.toFixed(1)} t (90 m³, max. 25 t)</dd>
        </dl>
        <div class="tour-warentitel">Wird angeboten in ${lieferstaedte.length} Städten</div>
        <div class="gut-staedte">${lieferstaedte.map((s) => s.name).join(", ")}</div>
        <div class="tour-warentitel">Wird gebraucht in ${bedarfsstaedte.length} Städten</div>
        <div class="gut-staedte">${bedarfsstaedte.map((s) => s.name).join(", ")}</div>
      </div>
    `;
  }

  /**
   * Ständige Übersicht über die eigene Flotte. Sie beantwortet die Frage,
   * die auf der Karte am meisten Sucherei kostet: Wo steht welches
   * Fahrzeug? Freie Fahrzeuge stehen oben, ein Klick springt zur Stadt.
   */
  function fahrzeugUebersicht() {
    const flotte = FuhrparkApp.alleFahrzeuge();
    if (flotte.length === 0) return "";

    function rang(f) {
      if (Fahrt.istUnterwegs(f.id)) return 1;
      if (f.status === "stillstehend") return 2;
      return 0;
    }

    const sortiert = flotte.slice().sort((a, b) => {
      const r = rang(a) - rang(b);
      if (r !== 0) return r;
      const o = (a.standort || "").localeCompare(b.standort || "");
      if (o !== 0) return o;
      return a.kennzeichen.localeCompare(b.kennzeichen);
    });

    const frei = flotte.filter(
      (f) => f.status !== "stillstehend" && !Fahrt.istUnterwegs(f.id)
    ).length;

    return `
      <div class="tour-flotte">
        <div class="tour-warentitel">
          Eigene Fahrzeuge (${flotte.length}${frei > 0 ? `, ${frei} frei` : ""})
        </div>
        <ul class="tour-flottenliste">
          ${sortiert.map((f) => {
            const tour = Fahrt.fuerFahrzeug(f.id);
            const unterwegs = Boolean(tour);
            const steht = f.status === "stillstehend";
            const ort = unterwegs
              ? `${tour.vonName} → ${tour.nachName}`
              : f.standort || "unbekannt";
            const zielStadt = unterwegs ? tour.nachName : f.standort;
            const zustand = steht
              ? "steht"
              : unterwegs
                ? (tour.ruhtBis ? "Ruhezeit" : "unterwegs")
                : "frei";

            return `
              <li class="tour-flotteneintrag ${zustand === "frei" ? "ist-frei" : ""}"
                  data-fahrzeug-suchen="${zielStadt || ""}"
                  title="${f.kennzeichen} · ${ort}">
                <span class="tour-flottenpunkt"
                      style="background:${Lackierung.cssFarbe(f.lackierung)};
                             border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"></span>
                <span class="tour-flotten-kennzeichen">${f.kennzeichen}</span>
                <span class="tour-flotten-ort">${ort}</span>
                <span class="tour-flotten-status tour-flotten-${zustand === "Ruhezeit" ? "ruht" : zustand}">
                  ${zustand}
                </span>
              </li>
            `;
          }).join("")}
        </ul>
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
            const auftrag = Auftraege.nachNummer(t.auftragNummer);
            const frist = auftrag ? new Date(auftrag.lieferFrist) : null;
            const ankunft = Fahrt.ankunft(t);
            const zuSpaet = frist && ankunft > frist;

            return `
              <li class="tour-laufend ${ruht ? "ruht" : ""}">
                <div class="tour-laufend-kopf">
                  <span class="tour-laufend-kennzeichen">${t.fahrzeug.kennzeichen}</span>
                  <span class="tour-laufend-strecke">
                    ${auftrag ? auftrag.nummer + " · " : ""}${t.vonName} → ${t.nachName}
                  </span>
                </div>
                <div class="tour-laufend-balken">
                  <div class="tour-laufend-fuellung" style="width:${anteil}%"></div>
                </div>
                <div class="tour-laufend-info">
                  <span class="tour-status tour-status-${ruht ? "ruht" : beladen ? "beladen" : "anfahrt"}">
                    ${ruht ? "Ruhezeit" : beladen ? "beladen unterwegs" : "Anfahrt leer"}
                  </span>
                  ${Math.round(t.gesamtGefahreneKm).toLocaleString("de-DE")} von
                  ${Math.round(Fahrt.gesamtKm(t)).toLocaleString("de-DE")} km ·
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

  /** Angaben zur gewählten Stadt - der Normalzustand ohne laufende Planung. */
  function renderStadtinfo() {
    if (!gewaehlteStadt) {
      return `
        ${nachholhinweis()}
        ${ankunftsmeldung()}
        ${laufendeFahrten()}
        ${fahrzeugUebersicht()}
        <div class="tour-dispo-leer">
          Stadt auf der Karte auswählen, um Angebot und Bedarf zu sehen.<br>
          Für eine Fahrt oben auf <strong>Tour planen</strong> tippen.
        </div>
      `;
    }

    const s = gewaehlteStadt;
    const istDepot = Betrieb.depotName() === s.name;
    const angebot = Wirtschaft.angebot(s);
    const bedarf = Wirtschaft.bedarf(s);
    const fahrzeuge = FuhrparkApp.fahrzeugeAn(s.name);

    return `
      ${nachholhinweis()}
      ${ankunftsmeldung()}
      ${laufendeFahrten()}
      ${fahrzeugUebersicht()}
      <div class="tour-dispo-kopf">
        <span class="tour-dispo-stadt">${s.name}</span>
        <span class="tour-dispo-land">${s.land}</span>
        ${s.knoten ? `<span class="tour-dispo-knoten">Frachtknoten</span>` : ""}
        ${istDepot ? `<span class="tour-dispo-depot">Depot</span>` : ""}
      </div>
      <div class="tour-dispo-info">
        ${Wirtschaft.regionName(s)}
        ${s.einw ? ` · ${s.einw.toLocaleString("de-DE")} Einwohner` : ""}
        ${
          Betrieb.hatDepot() && !istDepot
            ? ` · ${Karte.strassenEntfernung(Betrieb.depot(), s).toLocaleString("de-DE")} km ab Depot`
            : ""
        }
        ${fahrzeuge.length ? ` · ${fahrzeuge.length} Fahrzeug${fahrzeuge.length > 1 ? "e" : ""} vor Ort` : ""}
      </div>

      ${ausgehendeFrachten(s)}

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

  /**
   * Offene Frachten, die von dieser Stadt abgehen. Das ist die
   * Frachtbörse aus Sicht des Verladeorts - so sieht man auf einen
   * Blick, ob sich ein Fahrzeug hier lohnt.
   */
  function ausgehendeFrachten(stadt) {
    // Bei Bedarf werden Frachten für diese Stadt nacherzeugt - sonst
    // wäre die Liste fast überall leer.
    const frachten = Auftraege.fuerStadt(stadt);
    const verfuegbar = alleVerfuegbaren();
    const passende = frachten.filter((a) =>
      verfuegbar.some((f) => Ladung.kannLaden(f, Auftraege.gut(a)))
    );

    if (frachten.length === 0) {
      return `
        <div class="tour-ausgehend">
          <div class="tour-warentitel">Ausgehende Frachten</div>
          <div class="tour-ware-leer">
            Zurzeit keine offenen Frachten ab ${stadt.name}.
          </div>
          ${umsetzKnopf(stadt)}
        </div>
      `;
    }

    return `
      <div class="tour-ausgehend">
        <div class="tour-warentitel">
          Ausgehende Frachten (${frachten.length}${
            passende.length !== frachten.length ? `, davon ${passende.length} ladbar` : ""
          })
        </div>
        <ul class="tour-frachtliste">
          ${frachten.slice(0, 12).map((a) => {
            const g = Auftraege.gut(a);
            const ladbar = verfuegbar.some((f) => Ladung.kannLaden(f, g));
            return `
              <li class="tour-fracht ${ladbar ? "" : "nicht-ladbar"}">
                <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                      data-wareninfo="${g.id}">${aufbauKurz(g.aufbau)}</span>
                <span class="tour-fracht-ziel">→ ${a.nachName}</span>
                <span class="tour-fracht-daten">
                  ${a.tonnen.toFixed(1)} t ${g.name} ·
                  ${a.km.toLocaleString("de-DE")} km ·
                  ${a.entgelt.toLocaleString("de-DE")} DM
                </span>
              </li>
            `;
          }).join("")}
        </ul>
        ${passende.length === 0 ? `
          <div class="tour-ware-leer">
            Kein Fahrzeug im Bestand kann diese Frachten laden.
          </div>
          ${umsetzKnopf(stadt)}` : ""}
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

  function renderTourplanung() {
    return `
      <div class="tour-ablauf">
        ${schrittleiste()}
        <div class="tour-schrittinhalt">${schrittInhalt()}</div>
        <div class="tour-abbruchleiste">
          <button class="win98-button bevel-out" id="tour-btn-abbrechen">
            ✕ Planung abbrechen
          </button>
        </div>
      </div>
    `;
  }

  // Ablauf angelehnt an die Disposition echter Speditionssoftware,
  // aber von der Stadt aus gedacht: Der Disponent schaut sich einen
  // Ort an, sieht was dort ausgeht und was er dafür zur Verfügung hat.
  const SCHRITTE = [
    { id: "stadt",    nr: 1, titel: "Stadt" },
    { id: "fahrzeug", nr: 2, titel: "Fahrzeug" },
    { id: "fracht",   nr: 3, titel: "Fracht" },
    { id: "ziel",     nr: 4, titel: "Ziel" },
    { id: "bereit",   nr: 5, titel: "Start" }
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

  function schrittleiste() {
    const eintrag = SCHRITTE.find((x) => x.id === tour.schritt);
    // Während der Fahrt und danach gilt der letzte Schritt als aktiv.
    const aktuellNr = eintrag ? eintrag.nr : SCHRITTE.length;
    // Bei einem festen Auftrag gibt der Auftraggeber das Ziel vor -
    // der Schritt bleibt sichtbar, ist aber nicht anwählbar.
    const zielEntfaellt = tour.art === "auftrag";

    return `
      <ol class="tour-schrittleiste">
        ${SCHRITTE.map((x) => `
          <li class="tour-schritt ${
            x.id === "ziel" && zielEntfaellt ? "entfaellt" :
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
      case "stadt": return schrittStadt();
      case "fahrzeug": return schrittFahrzeug();
      case "fracht": return schrittFracht();
      case "ziel": return schrittZiel();
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
    return Math.round(Ladung.maxMengeTonnen(fahrzeug, gut) * 10) / 10;
  }

  // ---------- 1. Stadtseite ----------

  function schrittStadt() {
    const s = tour.stadt;
    if (!s) {
      return `
        <p class="tour-anleitung">
          Eine Stadt auf der Karte antippen. Von dort aus wird disponiert.
        </p>
      `;
    }

    const istDepot = Betrieb.depotName() === s.name;
    const vorOrt = verfuegbareFahrzeuge(s.name);
    const alleHier = FuhrparkApp.fahrzeugeAn(s.name).filter((f) => !Fahrt.istUnterwegs(f.id));

    return `
      <div class="tour-stadtkopf">
        <h2 class="tour-stadtseite-name">${s.name}</h2>
        <div class="tour-stadtzeile">
          ${s.land} · ${Wirtschaft.regionName(s)}
          ${s.einw ? ` · ${s.einw.toLocaleString("de-DE")} Einwohner` : ""}
        </div>
        <div class="tour-stadtzeile">
          ${istDepot
            ? `<span class="tour-dispo-depot">Depot</span>`
            : Betrieb.hatDepot()
              ? `${Karte.strassenEntfernung(Betrieb.depot(), s).toLocaleString("de-DE")} km ab Depot`
              : ""}
          ${s.knoten ? `<span class="tour-dispo-knoten">Frachtknoten</span>` : ""}
        </div>
      </div>

      ${fahrzeugstatus(s, vorOrt, alleHier)}
      ${ausgangsuebersicht(s)}

      <div class="tour-dispo-aktionen">
        ${vorOrt.length > 0
          ? `<button class="win98-button bevel-out" id="tour-btn-weiter-fahrzeug">
               Fahrzeug wählen &#10095;
             </button>`
          : ""}
      </div>
    `;
  }

  /** Steht hier ein Fahrzeug? Die erste Frage jeder Disposition. */
  function fahrzeugstatus(stadt, vorOrt, alleHier) {
    if (vorOrt.length > 0) {
      return `
        <div class="tour-vorort tour-vorort-ja">
          <span class="tour-vorort-titel">
            ${vorOrt.length} Fahrzeug${vorOrt.length > 1 ? "e" : ""} vor Ort
          </span>
          <span class="tour-standortpunkte">
            ${vorOrt.map((f) => `
              <span class="tour-standortpunkt"
                    style="background:${Lackierung.cssFarbe(f.lackierung)};
                           border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"
                    title="${f.kennzeichen}"></span>
            `).join("")}
          </span>
          <span class="tour-vorort-kennzeichen">
            ${vorOrt.map((f) => f.kennzeichen).join(", ")}
          </span>
        </div>
      `;
    }

    const blockiert = alleHier.length - vorOrt.length;
    return `
      <div class="tour-vorort tour-vorort-nein">
        <span class="tour-vorort-titel">Kein Fahrzeug vor Ort</span>
        ${blockiert > 0
          ? `<span class="tour-vorort-kennzeichen">
               ${blockiert} Fahrzeug${blockiert > 1 ? "e" : ""} hier, aber nicht einsatzbereit
             </span>`
          : ""}
      </div>
      ${anforderungsliste(stadt)}
    `;
  }

  /**
   * Kein Fahrzeug da: die nächstgelegenen freien Fahrzeuge anbieten.
   * Die Leerfahrt kostet Sprit und Verschleiß, bringt aber keinen
   * Erlös - deshalb stehen die Kosten direkt an jedem Vorschlag.
   */
  function anforderungsliste(stadt) {
    const kandidaten = alleVerfuegbaren()
      .filter((f) => f.standort !== stadt.name)
      .map((f) => ({ f, route: Route.berechne(f.standort, stadt.name) }))
      .filter((k) => k.route && k.route.km <= ANFORDERUNG_MAX_KM)
      .sort((a, b) => a.route.km - b.route.km)
      .slice(0, ANFORDERUNG_ANZAHL);

    if (kandidaten.length === 0) {
      return `
        <div class="tour-ware-leer">
          Kein freies Fahrzeug in Reichweite (bis
          ${ANFORDERUNG_MAX_KM.toLocaleString("de-DE")} km).
        </div>
      `;
    }

    return `
      <div class="tour-anfordern">
        <div class="tour-warentitel">Leerfahrt anfordern</div>
        <p class="tour-anleitung">
          Das Fahrzeug fährt leer nach ${stadt.name}. Disponiert wird
          neu, sobald es angekommen ist.
        </p>
        <ul class="tour-auswahlliste">
          ${kandidaten.map(({ f, route }) => `
            <li class="tour-auswahl" data-anfordern="${f.id}" data-anfordern-ziel="${stadt.name}">
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

  /**
   * Was geht von hier aus? Oben die festen Aufträge mit Ziel und Frist,
   * darunter das freie Warenangebot der Region, bei dem der Disponent
   * das Ziel selbst sucht.
   */
  function ausgangsuebersicht(stadt) {
    const frachten = Auftraege.fuerStadt(stadt);
    const angebot = Wirtschaft.angebot(stadt);

    return `
      <div class="tour-ausgang">
        <div class="tour-warentitel">Ausgehend ab ${stadt.name}</div>

        <div class="tour-ausgang-teil">Feste Aufträge (${frachten.length})</div>
        ${frachten.length === 0
          ? `<div class="tour-ware-leer">Zurzeit keine offenen Aufträge.</div>`
          : `<ul class="tour-frachtliste">
              ${frachten.slice(0, 10).map((a) => {
                const g = Auftraege.gut(a);
                return `
                  <li class="tour-fracht">
                    ${ablaufBalken(a, null)}
                    <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                          data-wareninfo="${g.id}">${aufbauKurz(g.aufbau)}</span>
                    <span class="tour-fracht-ziel">→ ${a.nachName}</span>
                    <span class="tour-fracht-daten">
                      ${a.tonnen.toFixed(1)} t ${g.name} ·
                      ${a.km.toLocaleString("de-DE")} km ·
                      ${a.entgelt.toLocaleString("de-DE")} DM
                    </span>
                  </li>
                `;
              }).join("")}
            </ul>`}

        <div class="tour-ausgang-teil">Warenangebot der Region (${angebot.length})</div>
        ${warenListe(angebot)}
      </div>
    `;
  }

  // ---------- 2. Fahrzeug vor Ort wählen ----------

  function schrittFahrzeug() {
    const s = tour.stadt;
    const vorOrt = verfuegbareFahrzeuge(s.name);

    if (vorOrt.length === 0) {
      return `
        <div class="tour-ware-leer">
          In ${s.name} steht kein einsatzbereites Fahrzeug mehr.
        </div>
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" data-zurueck-schritt="stadt">&#10094; Zurück</button>
        </div>
      `;
    }

    return `
      <p class="tour-anleitung">
        Fahrzeuge in ${s.name}. Der Aufbau entscheidet, welche Fracht
        anschließend zur Wahl steht.
      </p>
      <ul class="tour-auswahlliste">
        ${vorOrt.map((f) => `
          <li class="tour-auswahl ${tour.fahrzeug && tour.fahrzeug.id === f.id ? "gewaehlt" : ""}"
              data-fahrzeug="${f.id}">
            ${weiterPfeil("fracht")}
            <span class="tour-auswahl-name">
              <span class="tour-flottenpunkt"
                    style="background:${Lackierung.cssFarbe(f.lackierung)};
                           border-color:${Lackierung.cssFarbeDunkel(f.lackierung)}"></span>
              ${f.marke} ${f.modell}
              <span class="tour-auftrag-nummer">${f.kennzeichen}</span>
            </span>
            <span class="tour-auswahl-zusatz">
              ${f.aufbautyp} · Zuladung ${(f.zuladungKg / 1000).toFixed(1)} t ·
              ${Math.round(f.kmStand).toLocaleString("de-DE")} km
            </span>
            <span class="tour-auswahl-zusatz">
              Zustand ${Math.round(Verschleiss.gesamtzustand(f))} %
            </span>
          </li>
        `).join("")}
      </ul>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="stadt">&#10094; Zurück</button>
        ${tour.fahrzeug
          ? `<button class="win98-button bevel-out" id="tour-btn-weiter-fracht">Fracht wählen &#10095;</button>`
          : ""}
      </div>
    `;
  }

  // ---------- 3. Fracht wählen ----------

  function schrittFracht() {
    const s = tour.stadt;
    const f = tour.fahrzeug;
    const frachten = Auftraege.fuerStadt(s);
    const angebot = Wirtschaft.angebot(s);

    return `
      <div class="tour-auftragskopf">
        ${f.marke} ${f.modell} (${f.kennzeichen}) · ${f.aufbautyp} ·
        bis ${(f.zuladungKg / 1000).toFixed(1)} t
      </div>

      <div class="tour-ausgang-teil">Feste Aufträge ab ${s.name}</div>
      <ul class="tour-auswahlliste tour-liste-voll">
        ${frachten.length === 0
          ? `<li class="tour-ware-leer">Zurzeit keine offenen Aufträge.</li>`
          : frachten.slice(0, 15).map((a) => frachtZeileAuftrag(a, f)).join("")}
      </ul>

      <div class="tour-ausgang-teil">Warenangebot der Region</div>
      <ul class="tour-auswahlliste tour-liste-voll">
        ${angebot.length === 0
          ? `<li class="tour-ware-leer">Die Region bietet nichts an.</li>`
          : angebot.map((g) => frachtZeileSpot(g, f)).join("")}
      </ul>

      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="fahrzeug">&#10094; Zurück</button>
        ${frachtGewaehlt()
          ? `<button class="win98-button bevel-out" id="tour-btn-weiter-ziel">
               ${tour.art === "auftrag" ? "Weiter" : "Ziel wählen"} &#10095;
             </button>`
          : ""}
      </div>
    `;
  }

  function frachtGewaehlt() {
    return (tour.art === "auftrag" && tour.auftrag) || (tour.art === "spot" && tour.gut);
  }

  /**
   * Der Ablaufbalken hinter der Schrift. Er zeigt, wie viel Standzeit
   * ein Auftrag noch hat, bevor ihn jemand anders nimmt - und färbt
   * sich rot, wenn das gewählte Fahrzeug den Liefertermin ohnehin
   * nicht mehr halten kann. So sieht man die Dringlichkeit, ohne jede
   * Zeile lesen zu müssen.
   */
  function ablaufBalken(a, fahrzeug) {
    // Klassenname bewusst "tour-fristbalken": "tour-ablauf" gehört seit
    // jeher dem Rahmen um den Planungsablauf. Die Doppelbelegung machte
    // diesen Rahmen absolut positioniert und pointer-events: none - die
    // ganze Tourenplanung war damit tot und ließ sich nicht scrollen.
    const rest = Auftraege.restanteil(a);
    const stunden = Auftraege.restStunden(a);

    let klasse = "tour-frist-viel";
    if (rest < 0.2) klasse = "tour-frist-knapp";
    else if (rest < 0.5) klasse = "tour-frist-mittel";

    // Termin nicht mehr zu halten - das schlägt alles andere.
    let verspaetet = false;
    if (fahrzeug) {
      const m = Auftraege.terminMachbar(a, fahrzeug.standort);
      verspaetet = !m || !m.puenktlich;
    }
    if (verspaetet) klasse = "tour-frist-spaet";

    const titel = verspaetet
      ? `Liefertermin nicht zu halten · noch ${stunden} Std am Markt`
      : `Noch ${stunden} Std am Markt`;

    return `<span class="tour-fristbalken ${klasse}"
                  style="width:${Math.round(rest * 100)}%"
                  title="${titel}"></span>`;
  }

  /** Pfeil am Zeilenende: auswählen und gleich weiter zum nächsten Schritt. */
  function weiterPfeil(schritt) {
    return `<button class="tour-weiterpfeil" data-weiter-schritt="${schritt}"
                    title="Auswählen und weiter">&#10095;</button>`;
  }

  function frachtZeileAuftrag(a, f) {
    const g = Auftraege.gut(a);
    const kannLaden = Ladung.kannLaden(f, g);
    const maxT = Ladung.maxMengeTonnen(f, g);
    const reicht = maxT >= a.tonnen;
    const gesperrt = !kannLaden || !reicht;
    const gruende = [];
    if (!kannLaden) gruende.push(`Aufbau ${f.aufbautyp} ungeeignet`);
    if (kannLaden && !reicht) gruende.push(`nur ${maxT.toFixed(1)} t möglich`);

    const gewaehlt = tour.art === "auftrag" && tour.auftrag && tour.auftrag.nummer === a.nummer;

    return `
      <li class="tour-auswahl tour-auftrag ${gewaehlt ? "gewaehlt" : ""} ${gesperrt ? "gesperrt" : ""}"
          data-fracht-auftrag="${a.nummer}">
        ${ablaufBalken(a, f)}
        ${gesperrt ? "" : weiterPfeil("bereit")}
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
          ${gruende.length ? `<span class="tour-warnung">${gruende.join(", ")}</span>` : ""}
        </span>
      </li>
    `;
  }

  function frachtZeileSpot(g, f) {
    const kannLaden = Ladung.kannLaden(f, g);
    const menge = kannLaden ? spotMenge(f, g) : 0;
    const gesperrt = !kannLaden || menge <= 0;
    const gewaehlt = tour.art === "spot" && tour.gut && tour.gut.id === g.id;

    return `
      <li class="tour-auswahl ${gewaehlt ? "gewaehlt" : ""} ${gesperrt ? "gesperrt" : ""}"
          data-fracht-gut="${g.id}">
        ${gesperrt ? "" : weiterPfeil("ziel")}
        <span class="tour-auswahl-name">
          <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                data-auftrag-ware="${g.id}">${aufbauKurz(g.aufbau)}</span>
          ${g.name}
          <span class="tour-spotmarke">Spot</span>
        </span>
        <span class="tour-auswahl-zusatz">
          ${gesperrt
            ? `<span class="tour-warnung">Aufbau ${f.aufbautyp} ungeeignet</span>`
            : `bis ${menge.toFixed(1)} t ladbar · ${g.wertProTonne.toLocaleString("de-DE")} DM je Tonne Warenwert`}
        </span>
        <span class="tour-auswahl-zusatz">
          ${g.verderblich ? `<span class="tour-ware-merkmal">Kühlung</span>` : ""}
          ${g.gefahrgut ? `<span class="tour-ware-merkmal tour-merkmal-gefahr">ADR</span>` : ""}
          Ziel frei wählbar, keine Frist
        </span>
      </li>
    `;
  }

  // ---------- 4. Ziel wählen (nur am freien Markt) ----------

  function schrittZiel() {
    const s = tour.stadt;
    const f = tour.fahrzeug;
    const g = tour.gut;
    const tonnen = tour.tonnen;

    const ziele = Karte.alleStaedte()
      .filter((z) => z.name !== s.name && Wirtschaft.bedarf(z).some((b) => b.id === g.id))
      .map((z) => {
        const route = Route.berechne(s.name, z.name);
        if (!route) return null;
        const entgelt = Math.round(Ladung.frachtpreis(g, tonnen, route.km) * SPOT_FAKTOR);
        const sprit = spritkostenFuer(f, route.km);
        return { z, route, entgelt, sprit, db: entgelt - sprit };
      })
      .filter(Boolean)
      .sort((a, b) => b.db - a.db);

    return `
      <div class="tour-auftragskopf">
        ${tonnen.toFixed(1)} t ${g.name} ab ${s.name} ·
        ${f.marke} ${f.modell} (${f.kennzeichen})
      </div>
      <p class="tour-anleitung">
        ${ziele.length} Städte fragen ${g.name} nach, sortiert nach
        Deckungsbeitrag. Auf der Karte pulsieren sie.
      </p>
      <ul class="tour-auswahlliste">
        ${ziele.length === 0
          ? `<li class="tour-ware-leer">Niemand fragt diese Ware nach.</li>`
          : ziele.slice(0, 25).map((e) => `
            <li class="tour-auswahl ${tour.ziel && tour.ziel.name === e.z.name ? "gewaehlt" : ""}"
                data-ziel="${e.z.name}">
              ${weiterPfeil("bereit")}
              <span class="tour-auswahl-name">
                ${e.z.name}
                <span class="tour-auftrag-nummer">${e.z.land}</span>
              </span>
              <span class="tour-auswahl-zusatz">
                ${e.route.km.toLocaleString("de-DE")} km ·
                ${dauerText(fahrdauerStunden(e.route.km))} ·
                ${e.entgelt.toLocaleString("de-DE")} DM
              </span>
              <span class="tour-auswahl-zusatz">
                Sprit rund ${e.sprit.toLocaleString("de-DE")} DM ·
                Deckungsbeitrag
                <strong class="${e.db > 0 ? "tour-positiv" : "tour-negativ"}">
                  ${e.db.toLocaleString("de-DE")} DM
                </strong>
              </span>
            </li>
          `).join("")}
      </ul>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="fracht">&#10094; Zurück</button>
        ${tour.ziel
          ? `<button class="win98-button bevel-out" id="tour-btn-weiter-bereit">Weiter &#10095;</button>`
          : ""}
      </div>
    `;
  }

  // ---------- 5. Losfahren ----------

  function schrittBereit() {
    const f = tour.fahrzeug;

    if (tour.art === "auftrag") {
      const a = tour.auftrag;
      const g = Auftraege.gut(a);
      const m = tour.machbarkeit;
      const spritkosten = spritkostenFuer(f, m.gesamtKm);
      const db = a.entgelt - spritkosten;

      return `
        <div class="tour-zusammenfassung">
          <div class="tour-zusammenfassung-titel">
            ${a.nummer}: ${a.vonName} &#10230; ${a.nachName}
          </div>
          <dl class="fuhrpark-infoliste">
            <dt>Auftraggeber</dt><dd>${a.kundeName}</dd>
            <dt>Ladung</dt><dd>${a.tonnen.toFixed(1)} t ${g.name}</dd>
            <dt>Fahrzeug</dt><dd>${f.marke} ${f.modell} (${f.kennzeichen})</dd>
            <dt>Anfahrt leer</dt><dd>${m.anfahrtKm.toLocaleString("de-DE")} km</dd>
            <dt>Hauptlauf</dt><dd>${m.hauptlaufKm.toLocaleString("de-DE")} km</dd>
            <dt>Ankunft</dt><dd>${Spielzeit.formatiereMitUhrzeit(m.ankunft)}${
              m.puenktlich ? "" : " – verspätet"
            }</dd>
            <dt>Entgelt</dt><dd>${a.entgelt.toLocaleString("de-DE")} DM</dd>
            <dt>Spritkosten</dt><dd>rund ${spritkosten.toLocaleString("de-DE")} DM</dd>
            <dt>Deckungsbeitrag</dt><dd class="${db > 0 ? "tour-positiv" : "tour-negativ"}">
              ${db.toLocaleString("de-DE")} DM</dd>
          </dl>
          ${!m.puenktlich ? `
            <div class="tour-schadenhinweis">
              Der Liefertermin ist nicht zu halten. Das belastet die
              Kundenbeziehung.
            </div>` : ""}
        </div>
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" data-zurueck-schritt="fracht">&#10094; Zurück</button>
          <button class="win98-button bevel-out" id="tour-btn-tour-starten">🚚 Losfahren</button>
        </div>
      `;
    }

    // Freier Markt
    const g = tour.gut;
    const route = Route.berechne(tour.stadt.name, tour.ziel.name);
    const entgelt = Math.round(Ladung.frachtpreis(g, tour.tonnen, route.km) * SPOT_FAKTOR);
    const spritkosten = spritkostenFuer(f, route.km);
    const db = entgelt - spritkosten;

    return `
      <div class="tour-zusammenfassung">
        <div class="tour-zusammenfassung-titel">
          Spotladung: ${tour.stadt.name} &#10230; ${tour.ziel.name}
        </div>
        <dl class="fuhrpark-infoliste">
          <dt>Auftraggeber</dt><dd>freier Markt, keine Bindung</dd>
          <dt>Ladung</dt><dd>${tour.tonnen.toFixed(1)} t ${g.name}</dd>
          <dt>Fahrzeug</dt><dd>${f.marke} ${f.modell} (${f.kennzeichen})</dd>
          <dt>Hauptlauf</dt><dd>${route.km.toLocaleString("de-DE")} km</dd>
          <dt>Fahrzeit</dt><dd>${dauerText(fahrdauerStunden(route.km))}</dd>
          <dt>Entgelt</dt><dd>${entgelt.toLocaleString("de-DE")} DM</dd>
          <dt>Spritkosten</dt><dd>rund ${spritkosten.toLocaleString("de-DE")} DM</dd>
          <dt>Deckungsbeitrag</dt><dd class="${db > 0 ? "tour-positiv" : "tour-negativ"}">
            ${db.toLocaleString("de-DE")} DM</dd>
        </dl>
      </div>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="ziel">&#10094; Zurück</button>
        <button class="win98-button bevel-out" id="tour-btn-tour-starten">🚚 Losfahren</button>
      </div>
    `;
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
        // Nur Fahrzeuge, die hier auch wirklich stehen - wer unterwegs
        // ist, wird als fahrender Punkt auf der Route gezeigt.
        const fahrzeugeHier = FuhrparkApp.fahrzeugeAn(stadt.name)
          .filter((f) => !Fahrt.istUnterwegs(f.id));

        // Kann diese Stadt die gerade betrachtete Ware liefern bzw.
        // braucht sie sie? Im Zielschritt zählt der Bedarf, sonst das
        // Angebot.
        let hervorgehoben = "";
        if (hervorgehobenesGut) {
          const id = hervorgehobenesGut.id;
          // Beim freien Markt sucht man Abnehmer, sonst Lieferanten.
          if (tour.schritt === "ziel" || tour.art === "spot") {
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
    const svg = fensterElement.querySelector("#tour-route-ebene");
    const rahmen = fensterElement.querySelector("#tour-karte-rahmen");
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
    const buehne = fensterElement.querySelector("#tour-karte-buehne");
    if (!buehne) return;
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
    gewaehlteStadt = stadt;

    // Während der Planung ist die Stadt der Ausgangspunkt. Solange man
    // noch im ersten Schritt steht, darf man sie auf der Karte wechseln -
    // danach würde das die getroffene Auswahl entwerten.
    if (planungAktiv && tour.schritt === "stadt") {
      tour.stadt = stadt;
    }

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
   * Legt die Weiter-Schaltfläche an, falls sie noch fehlt. Damit lässt
   * sich eine Auswahl bestätigen, ohne den ganzen Bereich neu zu bauen -
   * die Liste behält ihre Scrollposition.
   */
  function weiterKnopfAktualisieren(dispo, id, beschriftung, beiKlick) {
    let knopf = dispo.querySelector(id);
    if (!knopf) {
      const leiste = dispo.querySelector(".tour-dispo-aktionen")
        || (() => {
          const neu = document.createElement("div");
          neu.className = "tour-dispo-aktionen";
          dispo.querySelector(".tour-schrittinhalt").appendChild(neu);
          return neu;
        })();
      knopf = document.createElement("button");
      knopf.className = "win98-button bevel-out";
      knopf.id = id.replace("#", "");
      knopf.innerHTML = beschriftung;
      leiste.appendChild(knopf);
      knopf.addEventListener("click", beiKlick);
    }
  }

  /**
   * Markiert die gewählte Frachtzeile in beiden Listen und zieht die
   * Weiter-Schaltfläche nach. Bewusst KEIN vollständiger Neuaufbau: Der
   * würde die Liste zurück an den Anfang springen lassen.
   */
  function frachtAuswahlZeigen(dispo, zeile) {
    dispo.querySelectorAll("[data-fracht-auftrag], [data-fracht-gut]")
      .forEach((z) => z.classList.toggle("gewaehlt", z === zeile));

    weiterKnopfAktualisieren(dispo, "#tour-btn-weiter-ziel",
      tour.art === "auftrag" ? "Weiter &#10095;" : "Ziel wählen &#10095;", () => {
        tour.schritt = tour.art === "auftrag" ? "bereit" : "ziel";
        dispositionAktualisieren();
      });

    // Die Beschriftung hängt an der Frachtart und muss nachziehen,
    // wenn man von einem Auftrag auf eine Spotladung wechselt.
    const knopf = dispo.querySelector("#tour-btn-weiter-ziel");
    if (knopf) {
      knopf.innerHTML = tour.art === "auftrag"
        ? "Weiter &#10095;"
        : "Ziel wählen &#10095;";
    }

    // Ohne Neuaufbau muss auch die Schrittleiste von Hand nachziehen:
    // Bei einem festen Auftrag gibt der Auftraggeber das Ziel vor.
    const zielSchritt = dispo.querySelector('.tour-schritt[data-schritt="ziel"]');
    if (zielSchritt) {
      zielSchritt.classList.toggle("entfaellt", tour.art === "auftrag");
    }
  }

  /**
   * Klick auf den Weiter-Pfeil einer Zeile: auswählen und gleich
   * weiterschalten. Liegt als eigene Funktion vor, weil sie nur ein
   * einziges Mal am Dispositionsbereich angemeldet werden darf.
   */
  function weiterAusZeile(e) {
    const dispo = fensterElement && fensterElement.querySelector("#tour-disposition");
    if (!dispo) return;

    const pfeil = e.target.closest("[data-weiter-schritt]");
    if (!pfeil || !dispo.contains(pfeil)) return;
    const zeile = pfeil.closest(".tour-auswahl");
    if (zeile && zeile.classList.contains("gesperrt")) return;

    let ziel = pfeil.dataset.weiterSchritt;
    // Bei einem festen Auftrag gibt der Auftraggeber das Ziel vor.
    if (ziel === "ziel" && tour.art === "auftrag") ziel = "bereit";
    if (ziel === "bereit" && tour.art === "spot" && !tour.ziel) ziel = "ziel";

    // Nur weiterschalten, wenn der Schritt auch vollständig ist.
    if (ziel === "fracht" && !tour.fahrzeug) return;
    if (ziel === "ziel" && !frachtGewaehlt()) return;
    if (ziel === "bereit") {
      if (tour.art === "auftrag" && !tour.auftrag) return;
      if (tour.art === "spot" && !tour.ziel) return;
      if (!tour.art) return;
    }

    tour.schritt = ziel;
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

    // ---- Schritt 1: Stadtseite ----
    const weiterFahrzeug = dispo.querySelector("#tour-btn-weiter-fahrzeug");
    if (weiterFahrzeug) {
      weiterFahrzeug.addEventListener("click", () => {
        tour.schritt = "fahrzeug";
        dispositionAktualisieren();
      });
    }

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
        planungBeenden();
        leerfahrtStarten(f, ziel);
      });
    });

    // ---- Schritt 2: Fahrzeug vor Ort ----
    dispo.querySelectorAll("[data-fahrzeug]").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("gesperrt")) return;
        const id = Number(el.dataset.fahrzeug);
        tour.fahrzeug = FuhrparkApp.alleFahrzeuge().find((f) => f.id === id) || null;
        // Fahrzeugwechsel macht eine schon gewählte Fracht ungültig:
        // Der Aufbau entscheidet, was überhaupt geladen werden darf.
        tour.art = null;
        tour.auftrag = null;
        tour.gut = null;
        tour.ziel = null;
        tour.tonnen = 0;

        dispo.querySelectorAll("[data-fahrzeug]").forEach((z) =>
          z.classList.toggle("gewaehlt", z === el));
        weiterKnopfAktualisieren(dispo, "#tour-btn-weiter-fracht",
          "Fracht wählen &#10095;", () => {
            tour.schritt = "fracht";
            dispositionAktualisieren();
          });
      });
    });

    const weiterFracht = dispo.querySelector("#tour-btn-weiter-fracht");
    if (weiterFracht) {
      weiterFracht.addEventListener("click", () => {
        tour.schritt = "fracht";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 3: Fracht ----
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
        tour.machbarkeit = Auftraege.terminMachbar(a, tour.fahrzeug.standort);
        aktiveRoute = Route.berechne(a.vonName, a.nachName);

        frachtAuswahlZeigen(dispo, el);
        routeZeichnen();
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
        tour.tonnen = spotMenge(tour.fahrzeug, g);
        // Städte mit Bedarf auf der Karte aufleuchten lassen
        hervorgehobenesGut = g;
        aktiveRoute = null;

        frachtAuswahlZeigen(dispo, el);
        routeZeichnen();
        markenZeichnen();
      });
    });

    const weiterZiel = dispo.querySelector("#tour-btn-weiter-ziel");
    if (weiterZiel) {
      weiterZiel.addEventListener("click", () => {
        tour.schritt = tour.art === "auftrag" ? "bereit" : "ziel";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 4: Ziel (nur am freien Markt) ----
    dispo.querySelectorAll("[data-ziel]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.ziel = STAEDTE[el.dataset.ziel] || null;
        aktiveRoute = tour.ziel
          ? Route.berechne(tour.stadt.name, tour.ziel.name)
          : null;

        dispo.querySelectorAll("[data-ziel]").forEach((z) =>
          z.classList.toggle("gewaehlt", z === el));
        weiterKnopfAktualisieren(dispo, "#tour-btn-weiter-bereit",
          "Weiter &#10095;", () => {
            tour.schritt = "bereit";
            dispositionAktualisieren();
          });
        routeZeichnen();
      });
    });

    const weiterBereit = dispo.querySelector("#tour-btn-weiter-bereit");
    if (weiterBereit) {
      weiterBereit.addEventListener("click", () => {
        tour.schritt = "bereit";
        dispositionAktualisieren();
      });
    }

    // ---- Pfeil in der Zeile: auswählen und gleich weiter ----
    //
    // Bewusst am Dispositionsbereich und nicht am Pfeil selbst: Beim
    // Blasen läuft erst der Klick auf die Zeile (der auswählt), dann
    // dieser hier. Andersherum würde er weiterschalten, bevor etwas
    // gewählt ist.
    //
    // NUR EINMAL anmelden. Diese Funktion läuft bei jedem Zeittakt
    // erneut, und anders als die übrigen Zuhörer hängt dieser nicht an
    // einem frisch erzeugten Kind, sondern am Behälter selbst - der
    // bleibt bestehen. Ohne die Sperre sammelten sich mit jeder Minute
    // Spielzeit weitere Kopien an, jeder Klick löste sie alle aus, jede
    // baute neu auf: Nach kurzer Zeit stand das Fenster.
    if (!dispo.dataset.weiterGebunden) {
      dispo.dataset.weiterGebunden = "ja";
      dispo.addEventListener("click", weiterAusZeile);
    }

    // ---- Schritt 5: Losfahren ----
    const starten = dispo.querySelector("#tour-btn-tour-starten");
    if (starten) starten.addEventListener("click", tourAusfuehren);

    // ---- Zurück-Schaltflächen ----
    dispo.querySelectorAll("[data-zurueck-schritt]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.zurueckSchritt;
        dispositionAktualisieren();
      });
    });

    dispo.querySelectorAll(".tour-schritt.erledigt").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.schritt;
        dispositionAktualisieren();
      });
    });

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

    const abbrechen = dispo.querySelector("#tour-btn-abbrechen");
    if (abbrechen) abbrechen.addEventListener("click", planungBeenden);

    const neueTour = dispo.querySelector("#tour-btn-neue-tour");
    if (neueTour) {
      neueTour.addEventListener("click", () => {
        aktiveRoute = null;
        hervorgehobenesGut = null;
        tourZuruecksetzen();
        dispositionAktualisieren();
      });
    }

    // ---- Zurück-Schaltflächen ----
    dispo.querySelectorAll("[data-zurueck-schritt]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.schritt = el.dataset.zurueckSchritt;
        if (tour.schritt !== "ziel") {
          hervorgehobenesGut = null;
          aktiveRoute = null;
        }
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
  function spotAuftragAnlegen() {
    const g = tour.gut;
    const route = Route.berechne(tour.stadt.name, tour.ziel.name);
    if (!route) return null;

    const entgelt = Math.round(Ladung.frachtpreis(g, tour.tonnen, route.km) * SPOT_FAKTOR);
    const jetzt = Spielzeit.heute();

    // Frist großzügig: Am Spotmarkt wird ohne festen Termin verkauft.
    // Trotzdem braucht der Auftrag einen Wert, sonst gilt er sofort
    // als verspätet.
    const frist = new Date(jetzt.getTime());
    frist.setHours(frist.getHours() + fahrdauerStunden(route.km) * 2 + 48);

    const auftrag = {
      nummer: `S-${Date.now().toString().slice(-6)}`,
      status: Auftraege.STATUS.offen,
      quelle: "spot",
      kundeId: null,
      kundeName: "Freier Markt",
      vonName: tour.stadt.name,
      nachName: tour.ziel.name,
      gutId: g.id,
      tonnen: tour.tonnen,
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
    if (tour.art === "spot") {
      const neu = spotAuftragAnlegen();
      if (!neu) return;
      tour.auftrag = neu;
    }

    const auftrag = tour.auftrag;
    const f = tour.fahrzeug;
    const anfahrt = Route.berechne(f.standort, auftrag.vonName);
    const hauptlauf = Route.berechne(auftrag.vonName, auftrag.nachName);
    if (!hauptlauf) return;

    const etappen = [];
    if (anfahrt && anfahrt.km > 0) etappen.push({ typ: "anfahrt", route: anfahrt });
    etappen.push({ typ: "hauptlauf", route: hauptlauf });

    Auftraege.disponieren(auftrag, f);

    Fahrt.starten({
      fahrzeug: f,
      etappen,
      auftragNummer: auftrag.nummer,
      vonName: auftrag.vonName,
      nachName: auftrag.nachName,
      beiEtappenwechsel: (t) => {
        // Ladestelle erreicht - ab hier fährt das Fahrzeug beladen
        if (Fahrt.istBeladen(t)) {
          Auftraege.beginnen(auftrag);
          f.standort = auftrag.vonName;
        }
      },
      beiAnkunft: tourAbschliessen
    });

    planungAktiv = false;
    aktiveRoute = null;
    hervorgehobenesGut = null;
    tourZuruecksetzen();
    dispositionAktualisieren();
    Speicher.jetztSichern(); // Tourstart darf nicht verlorengehen
  }

  /**
   * Zustellung: Auftrag abschließen, Verschleiß buchen, Kunde bewerten.
   */
  function tourAbschliessen(eintrag) {
    const f = eintrag.fahrzeug;
    const auftrag = Auftraege.nachNummer(eintrag.auftragNummer);
    const g = Auftraege.gut(auftrag);

    const anfahrtKm = eintrag.etappen.find((e) => e.typ === "anfahrt")?.route.km || 0;
    const hauptlaufKm = eintrag.etappen.find((e) => e.typ === "hauptlauf").route.km;
    const gesamtKm = anfahrtKm + hauptlaufKm;
    const beladungProzent = Math.min(100, Math.round((auftrag.tonnen * 1000 / f.zuladungKg) * 100));
    const tage = Math.max(1, Math.round(gesamtKm / (Fahrt.SCHNITT_STANDARD * Fahrt.LENKZEIT_STUNDEN)));

    // Leerfahrt und beladene Fahrt getrennt abrechnen - die Beladung
    // wirkt sich deutlich auf Verschleiß und Verbrauch aus.
    let verbrauchL = 0;
    if (anfahrtKm > 0) {
      verbrauchL += Verschleiss.wendeTourAn(f, {
        km: anfahrtKm, tage: 1,
        gelaende: "huegelland", strassenqualitaet: "landstrasse",
        jahreszeit: jahreszeitJetzt(), beladungProzent: 0,
        fahrverhaltenFaktor: 1.0
      }).verbrauchL;
    }
    verbrauchL += Verschleiss.wendeTourAn(f, {
      km: hauptlaufKm, tage,
      gelaende: "huegelland", strassenqualitaet: "landstrasse",
      jahreszeit: jahreszeitJetzt(), beladungProzent,
      fahrverhaltenFaktor: 1.0
    }).verbrauchL;

    Auftraege.zustellen(auftrag);

    // Erlös und Fahrzeugkosten in die Buchhaltung
    Finanzen.tourAbgerechnet({ auftrag, fahrzeug: f, verbrauchL, km: gesamtKm });

    const spritkosten = Math.round(verbrauchL * dieselpreis());
    const deckungsbeitrag = auftrag.entgelt - spritkosten;

    // Fürs Abwesenheitsprotokoll: Wer nach einer Pause zurückkommt,
    // will wissen, welche Tour was gebracht hat - nicht nur wie viele.
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
        anfahrtKm, hauptlaufKm,
        tonnen: auftrag.tonnen,
        puenktlich: auftrag.puenktlich,
        verbrauchL: Math.round(verbrauchL),
        deckungsbeitrag
      }
    });

    f.standort = auftrag.nachName;

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
    }

    letzteAnkunft = {
      auftrag, gut: g, anfahrtKm, hauptlaufKm, gesamtKm,
      erloes: auftrag.entgelt, spritkosten, deckungsbeitrag,
      verbrauchL: Math.round(verbrauchL),
      puenktlich: auftrag.puenktlich,
      schaden
    };

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

    // Punkte statt Symbole: Sie sind auf der kleinteiligen Karte besser
    // zu erkennen und tragen die Lackierung des Fahrzeugs - so sieht man
    // auf einen Blick, welcher Lkw wo unterwegs ist.
    ebene.innerHTML = touren.map((t) => {
      const p = positionAufRoute(t);
      if (!p) return "";
      const ruht = Boolean(t.ruhtBis);
      const farbe = Lackierung.cssFarbe(t.fahrzeug.lackierung);
      const rand = Lackierung.cssFarbeDunkel(t.fahrzeug.lackierung);
      return `<span class="tour-fahrzeugpunkt ${ruht ? "ruht" : ""} ${Fahrt.istBeladen(t) ? "beladen" : "leer"}"
                    style="left:${Math.round(p.x)}px; top:${Math.round(p.y)}px;
                           background:${farbe}; border-color:${rand}"
                    title="${t.fahrzeug.kennzeichen} (${t.fahrzeug.lackierung}): ${t.vonName} → ${t.nachName}"></span>`;
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
    return {
      x: b.x * zoom + versatzX,
      y: b.y * zoom + versatzY,
      nachLinks: b2.x < b.x
    };
  }

  function planungBeenden() {
    planungAktiv = false;
    hervorgehobenesGut = null;
    aktiveRoute = null;
    tourZuruecksetzen();
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
    if (!planungAktiv) hervorgehobenesGut = null;
    dispositionAktualisieren();
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

    fensterElement.querySelector("#tour-btn-planung")
      .addEventListener("click", () => {
        if (!Betrieb.hatDepot()) {
          window.alert("Zuerst ein Depot gründen - Stadt auf der Karte auswählen.");
          return;
        }
        if (!gewaehlteStadt) {
          window.alert("Zuerst eine Stadt auf der Karte auswählen - von dort wird disponiert.");
          return;
        }
        planungAktiv = true;
        aktiveRoute = null;
        hervorgehobenesGut = null;
        tourZuruecksetzen();
        tour.stadt = gewaehlteStadt;
        dispositionAktualisieren();
      });

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
      tourAbschliessen
    );
    if (ergebnis && ergebnis.fehler) return ergebnis;

    if (ergebnis && ergebnis.nachgeholteStunden > 0) {
      nachholmeldung = ergebnis;
    } else {
      nachholmeldung = null;
    }

    // Eine laufende Planung bezieht sich auf die alte Welt.
    planungAktiv = false;
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
      if (!planungAktiv && Fahrt.anzahl() > 0) {
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
      title: "Tourenplanung",
      content: renderInhalt()
    });

    fensterElement = ergebnis.element;

    if (ergebnis.wurdeNeuErstellt) {
      ereignisseBinden();
      markenZeichnen();
      // Erst die Uhr anbinden (dabei wird der Spielstand geladen),
      // dann zeichnen - sonst fehlt der Hinweis auf die Pause.
      taktVerbinden();
      dispositionAktualisieren();
      // Erst nach dem Einhängen ins Dokument steht die Fenstergröße fest.
      setTimeout(ansichtZuruecksetzen, 0);
    }
  }

  return {
    open,
    /** Spielstand laden - wird von der Spielstandverwaltung benutzt. */
    spielstandLaden,
    /** Stellt sicher, dass Uhr, Auftragspool und Automatik laufen. */
    starten: taktVerbinden,
    /** Von anderen Modulen aufrufbar, wenn sich die Flotte ändert. */
    aktualisieren: () => {
      if (fensterElement && document.body.contains(fensterElement)) {
        markenZeichnen();
        dispositionAktualisieren();
      }
    }
  };
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
