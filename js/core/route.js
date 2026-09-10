// route.js
// Findet den kürzesten Weg zwischen zwei Städten über das Straßennetz.
//
// Bisher wurde nur die Luftlinie mit einem Umwegfaktor geschätzt. Für
// die Anzeige der Strecke auf der Karte und für realistische
// Fahrleistungen braucht es den tatsächlichen Weg über die vorhandenen
// Verbindungen - der kann deutlich länger sein, etwa wenn ein Gebirge
// oder eine Meeresbucht umfahren werden muss.

const Route = (function () {

  // Nachbarschaftsliste, einmal aus dem Straßennetz aufgebaut
  const nachbarn = (function () {
    const karte = {};
    STRASSENNETZ.forEach((k) => {
      (karte[k.von] = karte[k.von] || []).push({ ziel: k.nach, km: k.km, typ: k.typ });
      (karte[k.nach] = karte[k.nach] || []).push({ ziel: k.von, km: k.km, typ: k.typ });
    });
    return karte;
  })();

  // Fähren kosten Wartezeit und Geld. Damit die Routensuche sie nicht
  // bevorzugt, nur weil sie kurz sind, bekommen sie einen Aufschlag.
  // Das ist ein reiner Bewertungsaufschlag - die ausgewiesene Strecke
  // bleibt die tatsächliche.
  const FAEHRE_ZUSCHLAG = 2.0;

  /**
   * Kürzester Weg zwischen zwei Städten.
   * @returns {null|{stationen: string[], km: number, abschnitte: object[], faehren: number}}
   *   null, wenn keine Verbindung besteht.
   */
  function berechne(vonName, nachName) {
    if (vonName === nachName) {
      return { stationen: [vonName], km: 0, abschnitte: [], faehren: 0 };
    }
    if (!nachbarn[vonName] || !nachbarn[nachName]) return null;

    // Dijkstra mit einfacher Auswahl des günstigsten offenen Knotens.
    // Bei 165 Städten ist das schnell genug; eine Vorrangwarteschlange
    // wäre erst bei deutlich größeren Netzen nötig.
    const kosten = { [vonName]: 0 };
    const strecke = { [vonName]: 0 };
    const vorgaenger = {};
    const offen = new Set([vonName]);
    const fertig = new Set();

    while (offen.size > 0) {
      let aktuell = null;
      let besteKosten = Infinity;
      offen.forEach((n) => {
        if (kosten[n] < besteKosten) { besteKosten = kosten[n]; aktuell = n; }
      });

      if (aktuell === null) break;
      if (aktuell === nachName) break;

      offen.delete(aktuell);
      fertig.add(aktuell);

      (nachbarn[aktuell] || []).forEach((kante) => {
        if (fertig.has(kante.ziel)) return;
        const bewertung = kante.km * (kante.typ === "faehre" ? FAEHRE_ZUSCHLAG : 1);
        const neu = kosten[aktuell] + bewertung;
        if (kosten[kante.ziel] === undefined || neu < kosten[kante.ziel]) {
          kosten[kante.ziel] = neu;
          strecke[kante.ziel] = strecke[aktuell] + kante.km;
          vorgaenger[kante.ziel] = { von: aktuell, km: kante.km, typ: kante.typ };
          offen.add(kante.ziel);
        }
      });
    }

    if (kosten[nachName] === undefined) return null;

    // Weg rückwärts zusammensetzen
    const stationen = [nachName];
    const abschnitte = [];
    let knoten = nachName;
    while (vorgaenger[knoten]) {
      const v = vorgaenger[knoten];
      abschnitte.unshift({ von: v.von, nach: knoten, km: v.km, typ: v.typ });
      stationen.unshift(v.von);
      knoten = v.von;
    }

    return {
      stationen,
      km: Math.round(strecke[nachName]),
      abschnitte,
      faehren: abschnitte.filter((a) => a.typ === "faehre").length
    };
  }

  /** Sind zwei Städte überhaupt verbunden? */
  function erreichbar(vonName, nachName) {
    return berechne(vonName, nachName) !== null;
  }

  return { berechne, erreichbar, FAEHRE_ZUSCHLAG };
})();
