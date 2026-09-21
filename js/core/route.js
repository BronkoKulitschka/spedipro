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
      // Der Verlauf wird für die Gegenrichtung umgedreht, damit eine
      // Route immer vom Start zum Ziel gelesen werden kann.
      const weg = k.weg || null;
      (karte[k.von] = karte[k.von] || []).push({
        ziel: k.nach, km: k.km, typ: k.typ, weg
      });
      (karte[k.nach] = karte[k.nach] || []).push({
        ziel: k.von, km: k.km, typ: k.typ, weg: weg ? weg.slice().reverse() : null
      });
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
          vorgaenger[kante.ziel] = {
            von: aktuell, km: kante.km, typ: kante.typ, weg: kante.weg
          };
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
      abschnitte.unshift({
        von: v.von, nach: knoten, km: v.km, typ: v.typ, weg: v.weg
      });
      stationen.unshift(v.von);
      knoten = v.von;
    }

    return {
      stationen,
      km: Math.round(strecke[nachName]),
      abschnitte,
      faehren: abschnitte.filter((a) => a.typ === "faehre").length,
      verlauf: verlaufBauen(abschnitte, stationen)
    };
  }

  /**
   * Der durchgehende Verlauf der ganzen Route als [lon, lat]-Punkte.
   *
   * Dasselbe, was auch in die Karte gezeichnet wurde: Routenlinie und
   * gemalte Straße stammen aus derselben Quelle und können deshalb
   * nicht auseinanderlaufen. Verbindungen ohne erfassten Verlauf
   * (siehe quelle: "schaetzung" im Straßennetz) steuern nur ihre beiden
   * Endpunkte bei - dort bleibt es bei einer geraden Linie.
   */
  function verlaufBauen(abschnitte, stationen) {
    if (abschnitte.length === 0) {
      const s = STAEDTE[stationen[0]];
      return s ? [[s.lon, s.lat]] : [];
    }

    const punkte = [];
    abschnitte.forEach((a) => {
      const teil = a.weg && a.weg.length >= 2
        ? a.weg
        : [ortPunkt(a.von), ortPunkt(a.nach)].filter(Boolean);
      teil.forEach((p, i) => {
        // Den Übergabepunkt zwischen zwei Abschnitten nicht doppeln
        if (i === 0 && punkte.length > 0) return;
        punkte.push(p);
      });
    });
    return punkte;
  }

  function ortPunkt(name) {
    const s = STAEDTE[name];
    return s ? [s.lon, s.lat] : null;
  }

  /**
   * Punkt auf dem Verlauf nach einer bestimmten Fahrstrecke.
   * Damit läuft das Fahrzeugsymbol der Straße entlang statt über Land
   * abzukürzen.
   * @param {Array} verlauf Punkte aus berechne().verlauf
   * @param {number} anteil 0 bis 1
   */
  function punktAuf(verlauf, anteil) {
    if (!verlauf || verlauf.length === 0) return null;
    if (verlauf.length === 1) return verlauf[0];

    const laengen = [];
    let gesamt = 0;
    for (let i = 1; i < verlauf.length; i++) {
      const d = abstand(verlauf[i - 1], verlauf[i]);
      laengen.push(d);
      gesamt += d;
    }
    if (gesamt <= 0) return verlauf[0];

    let rest = Math.max(0, Math.min(1, anteil)) * gesamt;
    for (let i = 0; i < laengen.length; i++) {
      if (rest <= laengen[i] || i === laengen.length - 1) {
        const t = laengen[i] > 0 ? rest / laengen[i] : 0;
        const a = verlauf[i];
        const b = verlauf[i + 1];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      rest -= laengen[i];
    }
    return verlauf[verlauf.length - 1];
  }

  /** Entfernung zweier [lon, lat]-Punkte in km. */
  function abstand(a, b) {
    const mitte = ((a[1] + b[1]) / 2) * Math.PI / 180;
    const dx = (b[0] - a[0]) * Math.cos(mitte);
    const dy = b[1] - a[1];
    return Math.hypot(dx, dy) * 111.195;
  }

  /** Sind zwei Städte überhaupt verbunden? */
  function erreichbar(vonName, nachName) {
    return berechne(vonName, nachName) !== null;
  }

  return { berechne, erreichbar, punktAuf, FAEHRE_ZUSCHLAG };
})();
