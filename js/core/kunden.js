// kunden.js
// Auftraggeber der Spedition.
//
// Am Anfang gibt es nur die Frachtbörse: anonyme Einzelaufträge, die
// jeder fahren kann, zu gedrückten Preisen. Wer für denselben Kunden
// mehrfach zuverlässig fährt, baut eine Geschäftsbeziehung auf - aus
// dem Gelegenheitskunden wird ein Stammkunde mit besseren Preisen und
// regelmäßigen Aufträgen.
//
// So läuft es auch in der Praxis: Spotmarkt bringt Auslastung, aber
// wenig Marge; das Geld verdient man mit festen Kundenbeziehungen.

const Kunden = (function () {

  // Bindungsstufen. Der Aufschlag wirkt auf das Entgelt, die
  // Auftragshäufigkeit auf die Anzahl angebotener Aufträge.
  const STUFEN = [
    { ab: 0,  name: "Frachtbörse",     aufschlag: 1.00, angebote: 0 },
    { ab: 2,  name: "Gelegenheitskunde", aufschlag: 1.05, angebote: 1 },
    { ab: 6,  name: "Wiederkehrender Kunde", aufschlag: 1.12, angebote: 2 },
    { ab: 14, name: "Stammkunde",       aufschlag: 1.22, angebote: 3 },
    { ab: 30, name: "Vertragskunde",    aufschlag: 1.35, angebote: 4 }
  ];

  // Bausteine für Firmennamen. Bewusst erfunden, aber im Klang an
  // Firmierungen der Zeit angelehnt.
  const VORSILBEN = [
    "Nord", "Süd", "West", "Ost", "Rhein", "Donau", "Alpen", "Hansa",
    "Union", "Merkur", "Atlas", "Kontinental", "Euro", "Primus", "Vulkan",
    "Adler", "Falke", "Delta", "Omega", "Central"
  ];
  const BRANCHEN = {
    agrar: ["Agrarhandel", "Landhandel", "Mühlenwerke", "Raiffeisen-Kontor"],
    frische: ["Frischdienst", "Kühlhaus", "Obstgroßhandel", "Feinkost"],
    lebensmittel: ["Nahrungsmittelwerke", "Brauerei", "Konservenfabrik", "Handelshaus"],
    rohstoff: ["Bergbau", "Rohstoffhandel", "Grubenverwaltung", "Mineralien"],
    energie: ["Mineralöl", "Tanklager", "Brennstoffhandel", "Energiehandel"],
    holz: ["Sägewerk", "Holzwerke", "Papierfabrik", "Zellstoffwerk"],
    baustoff: ["Baustoffwerke", "Zementwerk", "Ziegelei", "Betonwerk"],
    metall: ["Stahlwerk", "Hüttenwerke", "Metallhandel", "Walzwerk"],
    chemie: ["Chemiewerke", "Farbenfabrik", "Kunststoffwerk", "Pharmawerk"],
    industrie: ["Maschinenbau", "Werkzeugfabrik", "Elektrowerke", "Fahrzeugbau"],
    konsum: ["Versandhaus", "Möbelwerke", "Textilwerke", "Warenhandel"],
    umschlag: ["Umschlagsgesellschaft", "Speditionslager", "Terminal", "Kontor"]
  };
  const RECHTSFORMEN = ["GmbH", "AG", "KG", "GmbH & Co. KG", "OHG", "& Söhne"];

  const kunden = {}; // id -> Kunde

  function zufaelligAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }

  /**
   * Findet oder erzeugt einen Kunden für Stadt und Warenkategorie.
   * Damit bleibt ein Auftraggeber über die Zeit derselbe, statt bei
   * jedem Auftrag neu erfunden zu werden.
   */
  function fuer(stadt, kategorie) {
    const id = `${stadt.name}|${kategorie}`;
    if (kunden[id]) return kunden[id];

    const branche = BRANCHEN[kategorie] || BRANCHEN.umschlag;
    kunden[id] = {
      id,
      name: `${zufaelligAus(VORSILBEN)} ${zufaelligAus(branche)} ${zufaelligAus(RECHTSFORMEN)}`,
      stadt: stadt.name,
      kategorie,
      gefahreneAuftraege: 0,
      puenktlich: 0,
      verspaetet: 0,
      umsatz: 0
    };
    return kunden[id];
  }

  /** Bindungsstufe eines Kunden. */
  function stufe(kunde) {
    let gefunden = STUFEN[0];
    STUFEN.forEach((s) => {
      if (kunde.gefahreneAuftraege >= s.ab) gefunden = s;
    });
    return gefunden;
  }

  /**
   * Preisaufschlag für diesen Kunden. Verspätungen drücken ihn wieder -
   * wer unzuverlässig fährt, verliert die guten Konditionen.
   */
  function preisfaktor(kunde) {
    const grund = stufe(kunde).aufschlag;
    const gesamt = kunde.puenktlich + kunde.verspaetet;
    if (gesamt === 0) return grund;

    const quote = kunde.puenktlich / gesamt;
    // Bei durchgehender Pünktlichkeit voller Aufschlag, bei vielen
    // Verspätungen fällt er bis auf den Börsenpreis zurück.
    return 1 + (grund - 1) * Math.max(0, (quote - 0.5) * 2);
  }

  /** Nach einem erledigten Auftrag: Beziehung fortschreiben. */
  function auftragErledigt(kunde, { puenktlich, entgelt }) {
    kunde.gefahreneAuftraege += 1;
    kunde.umsatz += entgelt || 0;
    if (puenktlich) kunde.puenktlich += 1;
    else kunde.verspaetet += 1;
  }

  function alle() {
    return Object.values(kunden);
  }

  /** Kunden mit Bindung - die vergeben eigene Aufträge. */
  function mitBindung() {
    return alle().filter((k) => stufe(k).angebote > 0);
  }

  function zuruecksetzen() {
    Object.keys(kunden).forEach((k) => delete kunden[k]);
  }

  return {
    STUFEN,
    fuer,
    stufe,
    preisfaktor,
    auftragErledigt,
    alle,
    mitBindung,
    zuruecksetzen
  };
})();
