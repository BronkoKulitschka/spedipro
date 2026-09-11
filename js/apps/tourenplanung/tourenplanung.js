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
    schritt: "auftrag",  // auftrag | fahrzeug | bereit
    auftrag: null,
    fahrzeug: null,
    machbarkeit: null
  };

  function tourZuruecksetzen() {
    tour = { schritt: "auftrag", auftrag: null, fahrzeug: null, machbarkeit: null };
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
            <span class="tour-karte-hinweis" id="tour-karte-uhr">
              ${Spielzeit.formatiereMitUhrzeit(Spielzeit.heute())}
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
                  <button class="win98-button bevel-out tour-laufend-skip"
                          data-ueberspringen="${t.fahrzeug.id}">&#9197;</button>
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
                const kosten = Math.round((route.km / 100) * f.verbrauchBasisL100km * DIESELPREIS_DM);
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

  // Ablauf angelehnt an die Disposition echter Speditionssoftware:
  // Es liegen Aufträge vor, die auf Fahrzeuge verteilt werden - nicht
  // umgekehrt.
  const SCHRITTE = [
    { id: "auftrag",  nr: 1, titel: "Auftrag" },
    { id: "fahrzeug", nr: 2, titel: "Fahrzeug" },
    { id: "bereit",   nr: 3, titel: "Disponieren" }
  ];

  function schrittleiste() {
    const eintrag = SCHRITTE.find((x) => x.id === tour.schritt);
    // Während der Fahrt und danach gilt der letzte Schritt als aktiv.
    const aktuellNr = eintrag ? eintrag.nr : SCHRITTE.length;
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
      case "auftrag": return schrittAuftrag();
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

  // ---------- 1. Auftrag aus dem Pool ----------

  let auftragsFilter = "alle"; // alle | boerse | kunde | passend

  function schrittAuftrag() {
    let liste = Auftraege.offene();

    const verfuegbar = alleVerfuegbaren();
    if (auftragsFilter === "boerse") liste = liste.filter((a) => a.quelle === "boerse");
    if (auftragsFilter === "kunde") liste = liste.filter((a) => a.quelle === "kunde");
    if (auftragsFilter === "passend") {
      liste = liste.filter((a) =>
        verfuegbar.some((f) => Ladung.kannLaden(f, Auftraege.gut(a)))
      );
    }

    // Nach Entgelt je Kilometer sortieren - so priorisiert man auch in
    // der Praxis, weil lange Läufe zu Billigpreisen die Kapazität binden.
    liste = liste.slice().sort((a, b) => b.entgelt / b.km - a.entgelt / a.km);

    return `
      <div class="tour-filterleiste">
        ${[["alle","Alle"],["boerse","Frachtbörse"],["kunde","Kunden"],["passend","Passend zur Flotte"]]
          .map(([id, titel]) => `
            <button class="win98-button bevel-out ${auftragsFilter === id ? "aktiv" : ""}"
                    data-filter="${id}">${titel}</button>
          `).join("")}
      </div>
      <p class="tour-anleitung">
        ${liste.length} offene Aufträge, sortiert nach Ertrag je Kilometer.
      </p>
      <ul class="tour-auswahlliste">
        ${liste.slice(0, 40).map((a) => auftragsZeile(a, verfuegbar)).join("")}
      </ul>
      ${tour.auftrag ? `
        <div class="tour-dispo-aktionen">
          <button class="win98-button bevel-out" id="tour-btn-weiter-fahrzeug">
            Fahrzeug zuordnen &#10095;
          </button>
        </div>` : ""}
    `;
  }

  function auftragsZeile(a, verfuegbar) {
    const g = Auftraege.gut(a);
    const proKm = (a.entgelt / a.km).toFixed(2);
    const passt = verfuegbar.some((f) => Ladung.kannLaden(f, g));
    const ladeEnde = new Date(a.ladeEnde);
    const frist = new Date(a.lieferFrist);

    return `
      <li class="tour-auswahl tour-auftrag ${tour.auftrag && tour.auftrag.nummer === a.nummer ? "gewaehlt" : ""}"
          data-auftrag="${a.nummer}">
        <span class="tour-auswahl-name">
          <span class="tour-ware-aufbau tour-aufbau-${g.aufbau} tour-ware-info"
                data-auftrag-ware="${g.id}"
                title="Details zu ${g.name}">${aufbauKurz(g.aufbau)}</span>
          ${a.vonName} → ${a.nachName}
          <span class="tour-auftrag-nummer">${a.nummer}</span>
        </span>
        <span class="tour-auswahl-zusatz">
          ${a.tonnen.toFixed(1)} t ${g.name} · ${a.km.toLocaleString("de-DE")} km ·
          <strong>${a.entgelt.toLocaleString("de-DE")} DM</strong> (${proKm} DM/km)
        </span>
        <span class="tour-auswahl-zusatz">
          ${a.quelle === "kunde"
            ? `<span class="tour-kundenmarke">${a.kundeName}</span>`
            : `<span class="tour-boersenmarke">Frachtbörse</span>`}
          Laden bis ${Spielzeit.formatiereMitUhrzeit(ladeEnde)} ·
          Liefern bis ${Spielzeit.formatiereMitUhrzeit(frist)}
          ${!passt ? `<span class="tour-warnung">kein passendes Fahrzeug frei</span>` : ""}
        </span>
      </li>
    `;
  }

  // ---------- 2. Fahrzeug zuordnen ----------

  function schrittFahrzeug() {
    const a = tour.auftrag;
    const g = Auftraege.gut(a);

    // Vorschläge wie in der Disposition: geeignete Fahrzeuge mit
    // Anfahrtsweg (Leerkilometer) und Terminprüfung, beste zuerst.
    const vorschlaege = alleVerfuegbaren()
      .map((f) => {
        const kannLaden = Ladung.kannLaden(f, g);
        const maxT = Ladung.maxMengeTonnen(f, g);
        const reichtKapazitaet = maxT >= a.tonnen;
        const m = Auftraege.terminMachbar(a, f.standort);
        return { f, kannLaden, maxT, reichtKapazitaet, m };
      })
      .filter((v) => v.m)
      .sort((a2, b2) => {
        // Erst Eignung, dann kurze Anfahrt
        const wert = (v) => (v.kannLaden && v.reichtKapazitaet ? 0 : 1000000) + v.m.anfahrtKm;
        return wert(a2) - wert(b2);
      });

    return `
      <div class="tour-auftragskopf">
        <strong>${a.nummer}</strong> · ${a.vonName} → ${a.nachName} ·
        ${a.tonnen.toFixed(1)} t ${g.name} · ${a.entgelt.toLocaleString("de-DE")} DM
      </div>
      <p class="tour-anleitung">
        Fahrzeugvorschläge, sortiert nach Eignung und Anfahrtsweg.
        Leerkilometer kosten Sprit, bringen aber keinen Erlös.
      </p>
      <ul class="tour-auswahlliste">
        ${vorschlaege.map((v) => {
          const gesperrt = !v.kannLaden || !v.reichtKapazitaet;
          const gruende = [];
          if (!v.kannLaden) gruende.push(`Aufbau ${v.f.aufbautyp} ungeeignet`);
          if (v.kannLaden && !v.reichtKapazitaet) gruende.push(`nur ${v.maxT.toFixed(1)} t möglich`);
          if (!v.m.puenktlich) gruende.push("Termin nicht zu halten");

          return `
            <li class="tour-auswahl ${tour.fahrzeug === v.f ? "gewaehlt" : ""} ${gesperrt ? "gesperrt" : ""}"
                data-fahrzeug="${v.f.id}">
              <span class="tour-auswahl-name">
                ${v.f.marke} ${v.f.modell}
                <span class="tour-auftrag-nummer">${v.f.kennzeichen}</span>
              </span>
              <span class="tour-auswahl-zusatz">
                steht in ${v.f.standort} · Anfahrt ${v.m.anfahrtKm.toLocaleString("de-DE")} km leer ·
                ${v.f.aufbautyp} · bis ${v.maxT.toFixed(1)} t
              </span>
              <span class="tour-auswahl-zusatz">
                Ankunft ${Spielzeit.formatiereMitUhrzeit(v.m.ankunft)}
                ${v.m.puenktlich
                  ? `<span class="tour-puenktlich">${v.m.stundenPuffer} Std Puffer</span>`
                  : `<span class="tour-warnung">${Math.abs(v.m.stundenPuffer)} Std zu spät</span>`}
                ${gruende.length ? `<span class="tour-warnung">${gruende.join(", ")}</span>` : ""}
              </span>
            </li>
          `;
        }).join("")}
      </ul>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="auftrag">&#10094; Zurück</button>
        ${tour.fahrzeug ? `<button class="win98-button bevel-out" id="tour-btn-weiter-bereit">Weiter &#10095;</button>` : ""}
      </div>
    `;
  }

  // ---------- 3. Disponieren ----------

  function schrittBereit() {
    const a = tour.auftrag;
    const g = Auftraege.gut(a);
    const m = tour.machbarkeit;

    // Grobe Kostenrechnung, wie sie ein Disponent überschlägt.
    const spritkosten = Math.round(
      (m.gesamtKm / 100) * tour.fahrzeug.verbrauchBasisL100km * DIESELPREIS_DM
    );
    const deckungsbeitrag = a.entgelt - spritkosten;

    return `
      <div class="tour-zusammenfassung">
        <div class="tour-zusammenfassung-titel">
          ${a.nummer}: ${a.vonName} &#10230; ${a.nachName}
        </div>
        <dl class="fuhrpark-infoliste">
          <dt>Auftraggeber</dt><dd>${a.kundeName}</dd>
          <dt>Ladung</dt><dd>${a.tonnen.toFixed(1)} t ${g.name}</dd>
          <dt>Fahrzeug</dt><dd>${tour.fahrzeug.marke} ${tour.fahrzeug.modell} (${tour.fahrzeug.kennzeichen})</dd>
          <dt>Anfahrt leer</dt><dd>${m.anfahrtKm.toLocaleString("de-DE")} km</dd>
          <dt>Hauptlauf</dt><dd>${m.hauptlaufKm.toLocaleString("de-DE")} km</dd>
          <dt>Ankunft</dt><dd>${Spielzeit.formatiereMitUhrzeit(m.ankunft)}${
            m.puenktlich ? "" : " – verspätet"
          }</dd>
          <dt>Entgelt</dt><dd>${a.entgelt.toLocaleString("de-DE")} DM</dd>
          <dt>Spritkosten</dt><dd>rund ${spritkosten.toLocaleString("de-DE")} DM</dd>
          <dt>Deckungsbeitrag</dt><dd class="${deckungsbeitrag > 0 ? "tour-positiv" : "tour-negativ"}">
            ${deckungsbeitrag.toLocaleString("de-DE")} DM</dd>
        </dl>
        ${!m.puenktlich ? `
          <div class="tour-schadenhinweis">
            Der Liefertermin ist nicht zu halten. Das belastet die
            Kundenbeziehung.
          </div>` : ""}
      </div>
      <div class="tour-dispo-aktionen">
        <button class="win98-button bevel-out" data-zurueck-schritt="fahrzeug">&#10094; Zurück</button>
        <button class="win98-button bevel-out" id="tour-btn-tour-starten">🚚 Auftrag disponieren</button>
      </div>
    `;
  }

  // Dieselpreis in DM je Liter. Grobe Größenordnung für Mitte der 90er,
  // nicht belegt - vor einer ernsthaften Wirtschaftsbilanz prüfen.
  const DIESELPREIS_DM = 1.05;

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
        const punkte = stationenAlsPunkte(e.route.stationen);
        if (punkte.length < 2) return;
        const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
        const klasse = e.typ === "anfahrt" ? "tour-route-anfahrt" : "tour-route-laufend";
        teile.push(`<polyline points="${linie}" class="tour-route-kontur-duenn" />`);
        teile.push(`<polyline points="${linie}" class="${klasse}" />`);
      });
    });

    // 2. Route in Planung - liegt oben und ist kräftiger
    if (aktiveRoute && aktiveRoute.stationen.length >= 2) {
      const punkte = routePunkte();
      const linie = punkte.map((p) => `${p.x},${p.y}`).join(" ");
      teile.push(`<polyline points="${linie}" class="tour-route-kontur" />`);
      teile.push(`<polyline points="${linie}" class="tour-route-linie" />`);
      punkte.forEach((p, i) => {
        const klasse = i === 0 ? "tour-route-start"
          : i === punkte.length - 1 ? "tour-route-ziel" : "tour-route-station";
        teile.push(`<circle cx="${p.x}" cy="${p.y}" r="${i === 0 || i === punkte.length - 1 ? 5 : 3}" class="${klasse}" />`);
      });
    }

    svg.innerHTML = teile.join("");
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

  // ---------- Auswahl ----------

  function stadtWaehlen(stadt) {
    gewaehlteStadt = stadt;
    dispositionAktualisieren();
    markenZeichnen();
  }

  function dispositionAktualisieren() {
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
    markenZeichnen();
    routeZeichnen();
    fahrtenZeichnen();
    uhrAnzeigeAktualisieren();
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

    // ---- Schritt 1: Auftrag ----
    dispo.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        auftragsFilter = el.dataset.filter;
        dispositionAktualisieren();
      });
    });

    dispo.querySelectorAll("[data-auftrag]").forEach((el) => {
      el.addEventListener("click", () => {
        tour.auftrag = Auftraege.nachNummer(el.dataset.auftrag);
        tour.fahrzeug = null;
        aktiveRoute = Route.berechne(tour.auftrag.vonName, tour.auftrag.nachName);

        // Bewusst KEIN vollständiger Neuaufbau: Der würde die Liste
        // zurück an den Anfang springen lassen. Stattdessen nur die
        // Markierung umsetzen und die Weiter-Schaltfläche nachziehen.
        dispo.querySelectorAll("[data-auftrag]").forEach((z) =>
          z.classList.toggle("gewaehlt", z === el));
        weiterKnopfAktualisieren(dispo, "#tour-btn-weiter-fahrzeug",
          "Fahrzeug zuordnen &#10095;", () => {
            tour.schritt = "fahrzeug";
            dispositionAktualisieren();
          });
        routeZeichnen();
        markenZeichnen();
      });
    });

    const weiterFahrzeug = dispo.querySelector("#tour-btn-weiter-fahrzeug");
    if (weiterFahrzeug) {
      weiterFahrzeug.addEventListener("click", () => {
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
        tour.machbarkeit = tour.fahrzeug
          ? Auftraege.terminMachbar(tour.auftrag, tour.fahrzeug.standort)
          : null;

        dispo.querySelectorAll("[data-fahrzeug]").forEach((z) =>
          z.classList.toggle("gewaehlt", z === el));
        weiterKnopfAktualisieren(dispo, "#tour-btn-weiter-bereit",
          "Weiter &#10095;", () => {
            tour.schritt = "bereit";
            dispositionAktualisieren();
          });
      });
    });

    const weiterBereit = dispo.querySelector("#tour-btn-weiter-bereit");
    if (weiterBereit) {
      weiterBereit.addEventListener("click", () => {
        tour.schritt = "bereit";
        dispositionAktualisieren();
      });
    }

    // ---- Schritt 3: Disponieren ----
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

    dispo.querySelectorAll("[data-ueberspringen]").forEach((el) => {
      el.addEventListener("click", () => {
        fahrtUeberspringen(Number(el.dataset.ueberspringen));
        dispositionAktualisieren();
      });
    });

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

    const kosten = Math.round(ergebnis.verbrauchL * DIESELPREIS_DM);

    Historie.hinzufuegen(f, {
      art: "tour",
      text: `Leerfahrt ${eintrag.vonName} → ${eintrag.nachName}, ${km.toLocaleString("de-DE")} km`,
      km, tage,
      erloes: 0,
      kosten,
      daten: { leerfahrt: true, verbrauchL: Math.round(ergebnis.verbrauchL) }
    });

    f.standort = eintrag.nachName;
    dispositionAktualisieren();
    if (FuhrparkApp.aktualisieren) FuhrparkApp.aktualisieren();
    Speicher.jetztSichern();
  }

  function tourAusfuehren() {
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

    const spritkosten = Math.round(verbrauchL * DIESELPREIS_DM);
    const deckungsbeitrag = auftrag.entgelt - spritkosten;

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

    ebene.innerHTML = touren.map((t) => {
      const p = positionAufRoute(t);
      if (!p) return "";
      const ruht = Boolean(t.ruhtBis);
      return `<span class="tour-fahrzeug-symbol ${ruht ? "ruht" : ""} ${Fahrt.istBeladen(t) ? "beladen" : "leer"}"
                    style="left:${Math.round(p.x)}px; top:${Math.round(p.y)}px;
                           transform: translate(-50%,-50%) scaleX(${p.nachLinks ? -1 : 1})"
                    title="${t.fahrzeug.kennzeichen}: ${t.vonName} → ${t.nachName}">🚛</span>`;
    }).join("");
  }

  /** Bildschirmposition eines Fahrzeugs auf seiner Route. */
  function positionAufRoute(t) {
    const etappe = Fahrt.aktuelleEtappe(t);
    const punkte = etappe.route.stationen.map((name) => {
      const stadt = STAEDTE[name];
      const b = Karte.nachBild(stadt.lon, stadt.lat);
      return { x: b.x * zoom + versatzX, y: b.y * zoom + versatzY };
    });
    if (punkte.length < 2) return null;

    // Anteil auf die Streckenabschnitte umlegen - nach km, damit die
    // Anzeige zum tatsächlichen Fortschritt passt.
    const anteil = Fahrt.etappenFortschritt(t);
    const abschnitte = etappe.route.abschnitte;
    const gesamtKm = etappe.route.km || 1;
    let restKm = anteil * gesamtKm;
    let i = 0;
    while (i < abschnitte.length - 1 && restKm > abschnitte[i].km) {
      restKm -= abschnitte[i].km;
      i++;
    }
    const teil = abschnitte[i] && abschnitte[i].km > 0 ? restKm / abschnitte[i].km : 0;
    const a = punkte[i], b = punkte[i + 1] || punkte[i];
    return {
      x: a.x + (b.x - a.x) * teil,
      y: a.y + (b.y - a.y) * teil,
      nachLinks: b.x < a.x
    };
  }

  /**
   * Bringt eine laufende Tour sofort ans Ziel. Die Fahrzeit vergeht
   * dabei trotzdem - Überspringen darf keine Zeit sparen.
   */
  function fahrtUeberspringen(fahrzeugId) {
    const eintrag = Fahrt.fuerFahrzeug(fahrzeugId);
    if (eintrag) Fahrt.abschliessen(eintrag);
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
        planungAktiv = true;
        aktiveRoute = null;
        hervorgehobenesGut = null;
        tourZuruecksetzen();
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
  let taktAngemeldet = false;
  function taktVerbinden() {
    if (taktAngemeldet) return;
    taktAngemeldet = true;

    let letzteZeit = Spielzeit.heute().getTime();

    // Spielstand laden, bevor Aufträge erzeugt werden - sonst würde der
    // gespeicherte Pool überschrieben.
    if (Speicher.vorhanden()) {
      const ergebnis = Speicher.laden(tourAbschliessen);
      if (ergebnis && ergebnis.nachgeholteStunden > 0) {
        nachholmeldung = ergebnis;
      }
    }
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

      if (!fensterElement || !document.body.contains(fensterElement)) return;

      uhrAnzeigeAktualisieren(jetzt);

      fahrtenZeichnen();

      // Fortschrittsbalken nur auffrischen, wenn sie sichtbar sind
      // Nur neu aufbauen, wenn sich auch etwas ändert. Während der
      // Auftragswahl bleibt die Liste stehen, damit man in Ruhe lesen
      // und blättern kann - neue Aufträge kommen beim nächsten
      // Auffrischen dazu.
      if (!planungAktiv && Fahrt.anzahl() > 0) dispositionAktualisieren();
    });

    // Die Uhr läuft nur, solange Fahrzeuge unterwegs sind. Wer plant,
    // soll dabei nicht unter Zeitdruck geraten.
    Spielzeit.setzeLaufBedingung(() => Fahrt.anzahl() > 0);
    Spielzeit.starten();
  }

  /** Uhrzeit in der Kartenleiste, mit Hinweis wenn die Zeit steht. */
  function uhrAnzeigeAktualisieren(jetzt = Spielzeit.heute()) {
    if (!fensterElement) return;
    const uhr = fensterElement.querySelector("#tour-karte-uhr");
    if (!uhr) return;

    const laeuft = Spielzeit.laeuftGerade();
    uhr.textContent = Spielzeit.formatiereMitUhrzeit(jetzt) + (laeuft ? "" : " ⏸");
    uhr.classList.toggle("tour-uhr-steht", !laeuft);
    uhr.title = laeuft
      ? "Die Zeit läuft, solange Fahrzeuge unterwegs sind"
      : "Die Zeit steht still - kein Fahrzeug unterwegs";
  }

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
