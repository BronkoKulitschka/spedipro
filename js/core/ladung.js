// ladung.js
// Bringt Fahrzeug und Ware zusammen: Was kann ein Fahrzeug laden, wie
// viel passt drauf, und was bringt die Fahrt ein?

const Ladung = (function () {

  // Der Fuhrpark führt Aufbauten in Klartext ("Plane"), der Güter-
  // katalog in Kennungen ("plane"). Diese Tabelle verbindet beides.
  const AUFBAU_ZUORDNUNG = {
    "Plane": "plane",
    // Ein Kastenwagen nimmt dieselbe Warengruppe wie ein Planenwagen -
    // Stückgut, Kartonware, Teile. Nur eben eine Tonne statt
    // fünfundzwanzig. Ohne diese Zeile konnte der Transporter aus
    // 0.15.39 buchstäblich nichts laden, weil sein Aufbau in keiner
    // Tabelle stand.
    "Kastenwagen": "plane",
    "Kühlkoffer": "kuehl",
    "Tank": "tank",
    "Silo": "silo",
    "Kipper": "kipper",
    "Schwerlast": "schwer",
    "Container": "container",
    "Autotransporter": "autotransporter"
  };

  // Nutzbares Ladevolumen eines Sattelaufliegers in m³. Ein
  // Standard-Planenauflieger der 90er fasst rund 90 m³.
  //
  // Bis 0.15.38 galt diese Zahl für JEDES Fahrzeug. Mit dem
  // 3,5-t-Transporter ging das nicht mehr: Der fasst rund 12 m³, also
  // ein Siebtel. Mit 90 m³ hätte er Dämmstoff in Mengen geladen, die
  // physisch nicht hineinpassen. Der Wert ist jetzt der Rückfall für
  // Fahrzeuge ohne eigene Angabe.
  const LADEVOLUMEN_M3 = 90;

  /** Laderaum dieses Fahrzeugs in m³. */
  function ladevolumen(fahrzeug) {
    return (fahrzeug && fahrzeug.ladevolumenM3) || LADEVOLUMEN_M3;
  }

  /**
   * Manche Aufbauten können mehr als ihre eigene Warengruppe:
   * Ein Kühlkoffer transportiert auch ungekühlte Trockenware, ein
   * Planenauflieger dagegen keine Kühlware.
   */
  const KANN_ZUSAETZLICH = {
    kuehl: ["plane"],
    container: ["plane"]
  };

  function aufbauVon(fahrzeug) {
    return AUFBAU_ZUORDNUNG[fahrzeug.aufbautyp] || null;
  }

  /** Kann dieses Fahrzeug diese Ware überhaupt befördern? */
  function kannLaden(fahrzeug, gut) {
    const aufbau = aufbauVon(fahrzeug);
    if (!aufbau) return false;
    if (aufbau === gut.aufbau) return true;
    return (KANN_ZUSAETZLICH[aufbau] || []).includes(gut.aufbau);
  }

  /**
   * Höchstmenge in Tonnen. Entweder begrenzt die Zuladung oder das
   * Volumen - je nachdem, was zuerst erreicht ist. Dämmstoff füllt den
   * Auflieger bei gut 5 t, Stahl erreicht die Zuladungsgrenze.
   */
  function maxMengeTonnen(fahrzeug, gut) {
    const nachGewicht = (fahrzeug.zuladungKg || 24000) / 1000;
    const nachVolumen = (ladevolumen(fahrzeug) * gut.dichteKgProM3) / 1000;
    return Math.round(Math.min(nachGewicht, nachVolumen) * 10) / 10;
  }

  /**
   * Wie viel Laderaum eine Sendung belegt. Bei Beiladung zählt nicht
   * nur das Gewicht: Fünf Tonnen Dämmstoff füllen den Auflieger, fünf
   * Tonnen Stahl liegen in einer Ecke.
   */
  function volumenM3(gut, tonnen) {
    return (tonnen * 1000) / gut.dichteKgProM3;
  }

  /**
   * Passt diese Sendung noch dazu?
   *
   * @param {object} fahrzeug
   * @param {Array} anBord  [{ gut, tonnen }] - was schon geladen ist
   * @param {object} gut
   * @param {number} tonnen
   * @returns {object} { passt, grund, freiTonnen, freiM3 }
   */
  function passtDazu(fahrzeug, anBord, gut, tonnen) {
    if (!kannLaden(fahrzeug, gut)) {
      return { passt: false, grund: `Aufbau ${fahrzeug.aufbautyp} ungeeignet`,
               freiTonnen: 0, freiM3: 0 };
    }

    const belegtT = anBord.reduce((s, x) => s + x.tonnen, 0);
    const belegtV = anBord.reduce((s, x) => s + volumenM3(x.gut, x.tonnen), 0);
    const freiTonnen = Math.round(((fahrzeug.zuladungKg || 24000) / 1000 - belegtT) * 10) / 10;
    const freiM3 = Math.round((ladevolumen(fahrzeug) - belegtV) * 10) / 10;

    if (tonnen > freiTonnen) {
      return { passt: false, grund: `nur noch ${Math.max(0, freiTonnen).toFixed(1)} t frei`,
               freiTonnen, freiM3 };
    }
    if (volumenM3(gut, tonnen) > freiM3) {
      return { passt: false, grund: `nur noch ${Math.max(0, freiM3).toFixed(0)} m³ frei`,
               freiTonnen, freiM3 };
    }
    return { passt: true, grund: "", freiTonnen, freiM3 };
  }

  /** Höchstmenge, die zusätzlich zur vorhandenen Ladung passt. */
  function restMengeTonnen(fahrzeug, anBord, gut) {
    if (!kannLaden(fahrzeug, gut)) return 0;
    const belegtT = anBord.reduce((s, x) => s + x.tonnen, 0);
    const belegtV = anBord.reduce((s, x) => s + volumenM3(x.gut, x.tonnen), 0);
    const nachGewicht = (fahrzeug.zuladungKg || 24000) / 1000 - belegtT;
    const nachVolumen = ((ladevolumen(fahrzeug) - belegtV) * gut.dichteKgProM3) / 1000;
    return Math.max(0, Math.round(Math.min(nachGewicht, nachVolumen) * 10) / 10);
  }

  /** Woran die Ladung scheitert - für die Anzeige. */
  function begrenztDurch(fahrzeug, gut) {
    const nachGewicht = (fahrzeug.zuladungKg || 24000) / 1000;
    const nachVolumen = (ladevolumen(fahrzeug) * gut.dichteKgProM3) / 1000;
    return nachVolumen < nachGewicht ? "Volumen" : "Gewicht";
  }

  // Referenzsatz: was eine KOMPLETTLADUNG auf 24 t je Kilometer
  // einbringt, vor Warenzuschlägen und vor dem Börsenabschlag.
  //
  // belegt als Obergrenze: Ein Transport München–Hannover (rund 610 km)
  // kostete unter dem Tarif 2.500 DM, also 4,10 DM je km - für die hohe
  // Tarifklasse AB und für die Zeit VOR der Freigabe zum 01.01.1994.
  // Das Spiel beginnt am 01.03.1994, zwei Monate nach der Freigabe, in
  // der einsetzenden Preiserosion. Der Ansatz liegt deshalb darunter.
  // Siehe docs/kosten-1994.md, Abschnitt 9.
  const SATZ_KOMPLETT_DM_KM = 3.4;
  const REFERENZ_TONNEN = 24;

  // Degression: Eine kleine Sendung kostet je Tonne ein Vielfaches
  // einer großen. Bis 0.15.39 rechnete das Spiel rein je Tonnen-
  // kilometer - eine 1-t-Sendung brachte ein Vierundzwanzigstel einer
  // 24-t-Sendung. Das machte den 3,5-Tonner zum Zuschussgeschäft und
  // nahm der Beiladung ihren Sinn.
  //
  // belegt: BME-Preisspiegel Stückgut und Teilladungen, Erhebung 2014,
  // rund 70 Unternehmen und über 106.000 Datensätze. Mittelwerte je
  // Sendung bis 400 km:
  //
  //     550 kg    91,87 EUR   =  167 EUR/t
  //   1.050 kg   141,38 EUR   =  135 EUR/t
  //   2.125 kg   225,02 EUR   =  106 EUR/t
  //   5.500 kg   379,48 EUR   =   69 EUR/t
  //  13.750 kg   570,34 EUR   =   41 EUR/t
  //
  // hergeleitet: Das ist eine Potenzkurve. Aus den Randpunkten
  // 0,55 t und 13,75 t folgt
  //   ln(570,34/91,87) / ln(13,75/0,55) = 1,826 / 3,219 = 0,567
  // also Preis ~ Tonnen^0,57. Die Zwischenwerte treffen damit auf
  // wenige Prozent (1,05 t: 133 statt 141; 5,5 t: 339 statt 379).
  //
  // Die Erhebung ist von 2014, nicht von 1994. Übernommen wird nur die
  // FORM der Staffel, nicht ihr Niveau - das Niveau setzt der
  // Referenzsatz oben, der aus einer Quelle von 1994 stammt. Dass die
  // Staffel selbst über zwanzig Jahre stabil ist, ist eine Annahme:
  // belegt: false. Das GFT-Tarifwerk mit der Gewichtsstaffel von 1994
  // ist online nicht greifbar (siehe docs/kosten-1994.md, Abschnitt 13).
  const DEGRESSION = 0.57;

  /**
   * Frachtpreis in DM für eine Sendung.
   *
   * Zwei Teile: eine Streckenvergütung und eine Abfertigungspauschale
   * für Be- und Entladen, Papiere, Rampenzeit. Beide folgen der
   * Gewichtsstaffel oben, die Pauschale flacher - ein Palettenplatz
   * abzufertigen kostet fast dasselbe, egal was darauf steht.
   */
  function frachtpreis(gut, tonnen, km) {
    return aufschluesselung(gut, tonnen, km).summe;
  }

  /**
   * Derselbe Preis, aber mit seinen Bestandteilen.
   *
   * Die Zahl allein sagt dem Spieler nichts darüber, warum eine
   * halbe Tonne Chemie über 200 km mehr bringt als zwei Tonnen Kies
   * über 300. Wer die Posten sieht, versteht auch, warum sich
   * Beiladung lohnt und warum ein Stammkunde mehr wert ist als die
   * Börse.
   *
   * @returns {{
   *   summe, strecke, abfertigung, anteil, satzJeKm,
   *   zuschlaege: Array<{name, faktor, grund}>, zuschlagGesamt
   * }}
   */
  function aufschluesselung(gut, tonnen, km) {
    // Die Gewichtsstaffel: eine kleine Sendung kostet je Tonne ein
    // Vielfaches einer großen. Der Anteil sagt, wie viel vom Satz
    // einer vollen Komplettladung diese Sendung trägt.
    const anteil = Math.pow(Math.max(0.1, tonnen) / REFERENZ_TONNEN, DEGRESSION);

    const zuschlaege = [];
    if (gut.verderblich) {
      zuschlaege.push({ name: "Kühlung", faktor: 1.35,
        grund: "verderbliche Ware, durchgehende Kühlkette und Zeitdruck" });
    }
    if (gut.gefahrgut) {
      zuschlaege.push({ name: "Gefahrgut", faktor: 1.4,
        grund: "Ausrüstung, Kennzeichnung und Qualifikation des Fahrers" });
    }
    if (gut.wertProTonne > 10000) {
      zuschlaege.push({ name: "Wertgut", faktor: 1.2,
        grund: "Haftungsrisiko bei über 10.000 DM je Tonne" });
    }
    const zuschlagGesamt = zuschlaege.reduce((f, z) => f * z.faktor, 1);

    const strecke = SATZ_KOMPLETT_DM_KM * anteil * km * zuschlagGesamt;
    // Be- und Entladen, Papiere, Rampenzeit. Flacher gestaffelt als
    // die Strecke: Einen Palettenplatz abzufertigen kostet fast
    // dasselbe, egal was darauf steht.
    const abfertigung = 60 + 260 * Math.pow(anteil, 0.6);

    return {
      summe: Math.round(strecke + abfertigung),
      strecke: Math.round(strecke),
      abfertigung: Math.round(abfertigung),
      anteil,
      satzJeKm: SATZ_KOMPLETT_DM_KM * anteil * zuschlagGesamt,
      zuschlaege,
      zuschlagGesamt
    };
  }

  /** Fahrzeuge, die diese Ware befördern können. */
  function passendeFahrzeuge(fahrzeuge, gut) {
    return fahrzeuge.filter((f) => kannLaden(f, gut));
  }

  /** Waren, die dieses Fahrzeug befördern kann. */
  function passendeWaren(fahrzeug, waren) {
    return waren.filter((g) => kannLaden(fahrzeug, g));
  }

  return {
    LADEVOLUMEN_M3,
    ladevolumen,
    aufbauVon,
    kannLaden,
    maxMengeTonnen,
    restMengeTonnen,
    volumenM3,
    passtDazu,
    begrenztDurch,
    frachtpreis,
    aufschluesselung,
    SATZ_KOMPLETT_DM_KM,
    REFERENZ_TONNEN,
    DEGRESSION,
    passendeFahrzeuge,
    passendeWaren
  };
})();
