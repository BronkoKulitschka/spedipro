// ladung.js
// Bringt Fahrzeug und Ware zusammen: Was kann ein Fahrzeug laden, wie
// viel passt drauf, und was bringt die Fahrt ein?

const Ladung = (function () {

  // Der Fuhrpark führt Aufbauten in Klartext ("Plane"), der Güter-
  // katalog in Kennungen ("plane"). Diese Tabelle verbindet beides.
  const AUFBAU_ZUORDNUNG = {
    "Plane": "plane",
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
  const LADEVOLUMEN_M3 = 90;

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
    const nachVolumen = (LADEVOLUMEN_M3 * gut.dichteKgProM3) / 1000;
    return Math.round(Math.min(nachGewicht, nachVolumen) * 10) / 10;
  }

  /** Woran die Ladung scheitert - für die Anzeige. */
  function begrenztDurch(fahrzeug, gut) {
    const nachGewicht = (fahrzeug.zuladungKg || 24000) / 1000;
    const nachVolumen = (LADEVOLUMEN_M3 * gut.dichteKgProM3) / 1000;
    return nachVolumen < nachGewicht ? "Volumen" : "Gewicht";
  }

  /**
   * Frachtpreis in DM. Grundlage ist ein Satz je Tonnenkilometer, der
   * mit Warenwert, Kühlpflicht und Gefahrgut steigt. Kurze Strecken
   * bekommen einen Zuschlag, da An- und Abfahrt immer anfallen.
   *
   * ACHTUNG: plausible Größenordnung, keine belegten Tarife von 1994.
   * Der damals geltende Tarifzwang im deutschen Güterkraftverkehr
   * (GüKG, Tarife bis Mitte der 90er) wäre für eine ernsthafte
   * Wirtschaftsbilanz zu prüfen.
   */
  function frachtpreis(gut, tonnen, km) {
    const grundsatzProTkm = 0.22; // DM je Tonnenkilometer

    let faktor = 1;
    if (gut.verderblich) faktor *= 1.35;   // Kühlung, Zeitdruck
    if (gut.gefahrgut) faktor *= 1.4;      // Ausrüstung, Qualifikation
    if (gut.wertProTonne > 10000) faktor *= 1.2; // Haftungsrisiko

    const strecke = grundsatzProTkm * tonnen * km * faktor;
    const grundgebuehr = 120 + tonnen * 8; // Be- und Entladung

    return Math.round(strecke + grundgebuehr);
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
    aufbauVon,
    kannLaden,
    maxMengeTonnen,
    begrenztDurch,
    frachtpreis,
    passendeFahrzeuge,
    passendeWaren
  };
})();
