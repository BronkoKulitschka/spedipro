// karte.js
// Rechnet zwischen echten Koordinaten (Breite/Länge) und Bildpunkten auf
// der Europakarte um - in beide Richtungen, damit sowohl Städte gesetzt
// als auch Klicks auf der Karte zugeordnet werden können.
//
// Projektion: gleichwinklige Zylinderprojektion mit Breitenkorrektur.
// Die Längengrade werden mit cos(Bezugsbreite) gestaucht, sonst wäre
// Europa unnatürlich in die Breite gezogen. Bewusst einfach gehalten:
// umkehrbar, schnell, und für einen Kartenausschnitt dieser Größe
// ausreichend genau.
//
// WICHTIG: Diese Werte müssen exakt zu denen passen, mit denen
// assets/sprites/europa.png gerendert wurde. Wird die Karte neu
// erzeugt, müssen sie mitgeändert werden.

const Karte = (function () {
  const BILD = "assets/sprites/europa.png";
  const BILD_BREITE = 700;
  const BILD_HOEHE = 990;

  const LON_MIN = -11.0;
  const LON_MAX = 31.5;
  const LAT_MIN = 34.5;
  const LAT_MAX = 71.5;

  /** Echte Koordinaten -> Bildpunkt (in Pixeln des Originalbildes). */
  function nachBild(lon, lat) {
    return {
      x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * BILD_BREITE,
      y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * BILD_HOEHE
    };
  }

  /** Bildpunkt -> echte Koordinaten. */
  function nachKoordinaten(x, y) {
    return {
      lon: LON_MIN + (x / BILD_BREITE) * (LON_MAX - LON_MIN),
      lat: LAT_MAX - (y / BILD_HOEHE) * (LAT_MAX - LAT_MIN)
    };
  }

  /**
   * Luftlinie zwischen zwei Städten in km (Haversine).
   * Für Fahrstrecken ist ein Umwegfaktor nötig - siehe strassenEntfernung().
   */
  function luftlinie(a, b) {
    const R = 6371;
    const rad = (g) => (g * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /**
   * Geschätzte Straßenentfernung. Straßen verlaufen nie schnurgerade -
   * je nach Gelände und Netzdichte liegt die Fahrstrecke in Europa
   * typischerweise 15-30 % über der Luftlinie. Hier pauschal 1,2.
   *
   * GEPLANT: Sobald es ein Streckennetz mit echten Verbindungen gibt,
   * sollte diese Schätzung durch die tatsächliche Routenlänge ersetzt
   * werden - inklusive Fährverbindungen, die hier gar nicht abgebildet
   * sind (z.B. Festland nach Großbritannien oder Skandinavien).
   */
  const UMWEGFAKTOR = 1.2;

  function strassenEntfernung(a, b) {
    return Math.round(luftlinie(a, b) * UMWEGFAKTOR);
  }

  /** Alle Städte als Liste (das Datenobjekt ist nach Namen abgelegt). */
  function alleStaedte() {
    return Object.values(STAEDTE);
  }

  /** Stadt am Bildpunkt finden - für Klicks auf die Karte. */
  function stadtBeiBildpunkt(x, y, radiusPx = 8) {
    let beste = null;
    let besteEntfernung = radiusPx;

    alleStaedte().forEach((stadt) => {
      const p = nachBild(stadt.lon, stadt.lat);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= besteEntfernung) {
        besteEntfernung = d;
        beste = stadt;
      }
    });

    return beste;
  }

  return {
    BILD,
    BILD_BREITE,
    BILD_HOEHE,
    nachBild,
    nachKoordinaten,
    luftlinie,
    strassenEntfernung,
    alleStaedte,
    stadtBeiBildpunkt
  };
})();
