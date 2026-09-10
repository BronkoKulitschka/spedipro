// wirtschaft.js
// Leitet für jede Stadt ab, welche Waren dort angeboten werden und
// welche gebraucht werden.
//
// Quellen der Ableitung:
//   1. Wirtschaftsregion (regionen.js) - der Hauptanteil
//   2. Hafeneigenschaft - Frachtknoten an der Küste schlagen zusätzlich
//      Container und Stückgut um
//   3. Einwohnerzahl - je größer die Stadt, desto mehr Verbrauchsgüter
//      werden gebraucht und desto mehr Abfall und Altpapier fällt an
//
// Das Ergebnis ist bewusst gleichbleibend: dieselbe Stadt liefert immer
// dieselbe Liste. Schwankendes Angebot gehört in die Auftragserzeugung,
// nicht in die Grundstruktur der Wirtschaft.

const Wirtschaft = (function () {

  // Waren, die jede größere Stadt braucht - unabhängig von der Region.
  // Menschen essen, heizen und bauen überall.
  const GRUNDBEDARF = [
    "konserven", "bier", "konsumgueter", "diesel", "benzin", "heizoel",
    "zement", "kies", "stueckgut"
  ];

  // Zusätzlicher Bedarf ab bestimmten Stadtgrößen
  const BEDARF_AB_MITTEL = ["moebel", "hausgeraete", "textilien", "papier"];
  const BEDARF_AB_GROSS = ["neuwagen", "elektronik", "arzneimittel", "ziegel", "glas"];

  // Was Städte selbst hervorbringen, einfach weil dort Menschen wohnen
  const STADT_ERZEUGT = ["altpapier", "abfall", "schrott"];

  function regionVon(stadt) {
    const id = STADT_REGION[stadt.name] || LAND_STANDARD[stadt.land];
    return REGIONEN_NACH_ID[id] || null;
  }

  /** Grobe Größenklasse: 1 klein bis 4 Millionenstadt. */
  function groessenklasse(stadt) {
    const ew = stadt.einw || 0;
    if (ew >= 1000000) return 4;
    if (ew >= 400000) return 3;
    if (ew >= 120000) return 2;
    return 1;
  }

  /**
   * Waren, die in dieser Stadt für den Abtransport bereitstehen.
   * @returns {Array<object>} Einträge aus dem Güterkatalog
   */
  function angebot(stadt) {
    const region = regionVon(stadt);
    const ids = new Set(region ? region.erzeugt : []);

    // Häfen schlagen zusätzlich um, was per Schiff hereinkommt
    if (stadt.knoten) {
      ids.add("container");
      ids.add("stueckgut");
    }

    // Ab mittlerer Größe fallen Reststoffe in nennenswerter Menge an
    if (groessenklasse(stadt) >= 2) {
      STADT_ERZEUGT.forEach((id) => ids.add(id));
    }

    return [...ids].map((id) => GUETER_NACH_ID[id]).filter(Boolean);
  }

  /**
   * Waren, die in dieser Stadt gebraucht werden.
   * @returns {Array<object>} Einträge aus dem Güterkatalog
   */
  function bedarf(stadt) {
    const region = regionVon(stadt);
    const klasse = groessenklasse(stadt);
    const ids = new Set(region ? region.braucht : []);

    if (klasse >= 2) GRUNDBEDARF.forEach((id) => ids.add(id));
    if (klasse >= 3) BEDARF_AB_MITTEL.forEach((id) => ids.add(id));
    if (klasse >= 4) BEDARF_AB_GROSS.forEach((id) => ids.add(id));

    // Was eine Stadt selbst im Überfluss erzeugt, muss sie nicht
    // zusätzlich beziehen - sonst entstünden unsinnige Aufträge
    // (Ruhrgebiet bestellt Kohle im Ruhrgebiet).
    const eigenes = new Set((region ? region.erzeugt : []));
    eigenes.forEach((id) => ids.delete(id));

    return [...ids].map((id) => GUETER_NACH_ID[id]).filter(Boolean);
  }

  /** Name der Wirtschaftsregion, für die Anzeige. */
  function regionName(stadt) {
    const region = regionVon(stadt);
    return region ? region.name : "unbekannt";
  }

  /**
   * Prüft, ob eine Ware von A nach B überhaupt sinnvoll ist: A muss sie
   * anbieten, B sie brauchen. Grundlage für die spätere
   * Auftragserzeugung.
   */
  function istHandelbar(warenId, von, nach) {
    return (
      angebot(von).some((g) => g.id === warenId) &&
      bedarf(nach).some((g) => g.id === warenId)
    );
  }

  /** Alle Waren, die zwischen zwei Städten transportiert werden könnten. */
  function moeglicheLadungen(von, nach) {
    const bedarfIds = new Set(bedarf(nach).map((g) => g.id));
    return angebot(von).filter((g) => bedarfIds.has(g.id));
  }

  return {
    angebot,
    bedarf,
    regionVon,
    regionName,
    groessenklasse,
    istHandelbar,
    moeglicheLadungen
  };
})();
