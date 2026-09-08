// lackierung.js
// Färbt die Kabine der LKW-Grafik zur Laufzeit um, ohne dass pro Farbe
// eine eigene Bilddatei nötig wäre.
//
// Funktionsweise: Das Sprite enthält die Kabine in genau einem Farbton
// (Rot, H≈351°) in mehreren Helligkeitsstufen. Beim Umfärben wird nur
// dieser Farbton ersetzt - Sättigung und Helligkeit jedes Pixels bleiben
// unverändert, damit alle Schattierungen und Pixelkanten erhalten
// bleiben. Grauer Auflieger, schwarze Reifen und die blaue Scheibe sind
// nicht betroffen, da sie außerhalb des Rot-Bereichs liegen.
//
// ----------------------------------------------------------------------
// GEPLANT: Designmodus (bewusst noch NICHT umgesetzt)
// ----------------------------------------------------------------------
// 1) Auflieger einfärben
//    Der Auflieger ist im aktuellen Sprite komplett grau (Sättigung 0),
//    also eindeutig von der Kabine trennbar. Zwei Wege:
//    a) Zweiter Erkennungsbereich in diesem Modul: statt "roter Farbton"
//       dann "unbunt, Helligkeit im Auflieger-Bereich". Risiko: trifft
//       auch andere graue Flächen (Felgen, Rahmen, Stoßstange).
//    b) SAUBERER: Beim Erstellen des Sprites den Auflieger in einen
//       eigenen, sonst unbenutzten Farbton legen (z.B. Grün H≈120).
//       Dann sind Kabine und Auflieger unabhängig und eindeutig
//       ansprechbar - Voraussetzung für freie Farbwahl beider Teile.
//    Empfehlung für den Designmodus: Variante b.
//
// 2) Beschriftung auf dem Auflieger (Firmenname o.ä.)
//    Umsetzbar mit derselben Canvas-Technik: nach dem Umfärben Text auf
//    die Seitenwand des Aufliegers zeichnen. Zu beachten:
//    - Die Seitenwand ist isometrisch verzerrt. Der Text muss dieselbe
//      Schrägstellung bekommen, sonst "klebt" er nicht auf der Fläche.
//      Über ctx.setTransform() mit passender Scherung lösbar.
//    - Eckpunkte der Auflieger-Seitenwand im Sprite einmal ausmessen und
//      hier als Konstanten hinterlegen (wie CALLOUT_LAYOUT im Fuhrpark).
//    - Für die Pixelart-Optik eine Pixelschrift verwenden und
//      ctx.imageSmoothingEnabled = false setzen, sonst wird der Text
//      weichgezeichnet und fällt stilistisch aus dem Bild.
//    - Ergebnis wie bisher zwischenspeichern (Cache-Schlüssel dann aus
//      Farbe UND Text zusammensetzen, nicht nur aus dem Farbton).
// ----------------------------------------------------------------------

const Lackierung = (function () {
  const QUELLE = "assets/sprites/lkw-generisch.png";

  // Erkennungsbereich für die zu ersetzenden Kabinen-Pixel.
  const MIN_SAETTIGUNG = 0.25;
  const MIN_HELLIGKEIT = 0.08;
  const HUE_UNTEN = 25;   // 0-25 Grad
  const HUE_OBEN = 340;   // 340-360 Grad

  // Vorrätige Farben. Werte sind Farbtöne in Grad (0-360).
  const FARBEN = {
    rot: 351,
    orange: 28,
    gelb: 48,
    gruen: 130,
    blau: 210,
    violett: 280
  };

  let quellBild = null;
  let quellBildGeladen = false;
  const cache = {}; // hue -> DataURL, damit nicht bei jedem Rendern neu gerechnet wird

  function bildLaden() {
    if (quellBild) return Promise.resolve(quellBild);

    return new Promise((erfuellen, ablehnen) => {
      const bild = new Image();
      bild.onload = () => {
        quellBild = bild;
        quellBildGeladen = true;
        erfuellen(bild);
      };
      bild.onerror = () => ablehnen(new Error(`Sprite nicht ladbar: ${QUELLE}`));
      bild.src = QUELLE;
    });
  }

  function rgbNachHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
    }
    h = (h * 60 + 360) % 360;
    const s = max === 0 ? 0 : d / max;
    return [h, s, max];
  }

  function hsvNachRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  /**
   * Erzeugt eine umgefärbte Fassung des Sprites.
   * @param {number} zielHue Farbton in Grad (0-360)
   * @returns {string} DataURL des umgefärbten Bildes
   */
  function umfaerben(zielHue) {
    if (!quellBildGeladen) return QUELLE; // solange nicht geladen: Original
    if (cache[zielHue]) return cache[zielHue];

    const leinwand = document.createElement("canvas");
    leinwand.width = quellBild.naturalWidth;
    leinwand.height = quellBild.naturalHeight;

    const ctx = leinwand.getContext("2d");
    ctx.drawImage(quellBild, 0, 0);

    const daten = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
    const p = daten.data;

    for (let i = 0; i < p.length; i += 4) {
      const [h, s, v] = rgbNachHsv(p[i], p[i + 1], p[i + 2]);
      const istKabinenfarbe =
        s > MIN_SAETTIGUNG && v > MIN_HELLIGKEIT && (h < HUE_UNTEN || h > HUE_OBEN);

      if (istKabinenfarbe) {
        // Sättigung und Helligkeit bleiben erhalten - nur der Farbton
        // wird getauscht. Dadurch bleiben alle Schattierungen intakt.
        const [nr, ng, nb] = hsvNachRgb(zielHue, s, v);
        p[i] = nr;
        p[i + 1] = ng;
        p[i + 2] = nb;
      }
    }

    ctx.putImageData(daten, 0, 0);
    const dataUrl = leinwand.toDataURL("image/png");
    cache[zielHue] = dataUrl;
    return dataUrl;
  }

  function farbNamen() {
    return Object.keys(FARBEN);
  }

  function hueVonName(name) {
    return FARBEN[name];
  }

  function zufaelligeFarbe() {
    const namen = farbNamen();
    return namen[Math.floor(Math.random() * namen.length)];
  }

  return {
    QUELLE,
    FARBEN,
    bildLaden,
    umfaerben,
    farbNamen,
    hueVonName,
    zufaelligeFarbe
  };
})();
