/* Fahrzeugbilder auf der Karte.

   Drei Stufen, in dieser Reihenfolge:

     1. assets/trucks.png — ein Bild mit allen Fahrzeugen in einem
        Raster von vier Spalten und drei Zeilen. Jedes Feld 64 × 64.
     2. assets/truck-<klasse>.png — ein Bild je Fahrzeugklasse.
     3. Das Sinnbild 🚛, wenn nichts davon vorliegt.

   Geprüft wird einmal beim ersten Zeichnen. Fehlt eine Datei, wird
   still auf die nächste Stufe zurückgefallen. */

/* Lage im Raster: Spalte, Zeile — von links oben. */
export const RASTER = {
  kastenwagen: [0, 0], kurier:     [1, 0], maxi:       [2, 0], leicht:  [3, 0],
  siebenhalb:  [0, 1], verteiler:  [1, 1], motorwagen: [2, 1], fern:    [3, 1],
  jumbo:       [0, 2], kuehlzug:   [1, 2], schwer:     [2, 2],
};

export const SPALTEN = 4;
export const ZEILEN  = 3;
export const FELD    = 64;      // Bildpunkte je Feld in der Vorlage

const BLATT = './assets/trucks.png';

let zustand = 'ungeprueft';     // ungeprueft | blatt | einzeln | sinnbild
let einzelne = new Set();
let beiAenderung = null;

export function onBildBereit(fn) { beiAenderung = fn; }

/* Prüft einmalig, was vorhanden ist. */
function pruefe() {
  if (zustand !== 'ungeprueft') return;
  zustand = 'sinnbild';

  const blatt = new Image();
  blatt.onload = () => {
    /* Angenommen wird jedes Bild, das sich sinnvoll in vier Spalten und
       drei Zeilen teilen lässt. Eine strenge Prüfung des Seitenver-
       hältnisses hat sich als zu eng erwiesen: Bildgeneratoren liefern
       gern quadratische Bilder, in denen das Raster trotzdem sauber
       liegt — nur mit mehr Rand oben und unten. */
    if (blatt.width >= SPALTEN * 8 && blatt.height >= ZEILEN * 8) {
      zustand = 'blatt';
      document.documentElement.classList.add('lkw-blatt');
      document.documentElement.style.setProperty('--lkw-blatt', `url(${BLATT})`);
      beiAenderung?.();
    }
  };
  blatt.src = BLATT;

  /* Unabhängig davon nach Einzelbildern schauen. */
  for (const klasse of Object.keys(RASTER)) {
    const bild = new Image();
    bild.onload = () => {
      einzelne.add(klasse);
      if (zustand === 'sinnbild') zustand = 'einzeln';
      beiAenderung?.();
    };
    bild.src = `./assets/truck-${klasse}.png`;
  }
}

/* Liefert den Inhalt für die Marke eines Fahrzeugs. */
export function fahrzeugBild(modelKey) {
  pruefe();

  if (zustand === 'blatt' && RASTER[modelKey]) {
    const [sp, ze] = RASTER[modelKey];
    /* Bei background-size in Prozent bezieht sich die Position auf den
       verbleibenden Platz — daher die Teilung durch Spalten minus eins. */
    const x = SPALTEN > 1 ? (sp / (SPALTEN - 1)) * 100 : 0;
    const y = ZEILEN  > 1 ? (ze / (ZEILEN  - 1)) * 100 : 0;

    /* Bildquelle direkt am Element, nicht über eine Stilvariable —
       das ist unabhängig davon, ob die Variable schon gesetzt ist. */
    return `<span class="lkw-feld" style="`
         + `background-image:url('${BLATT}');`
         + `background-position:${x}% ${y}%"></span>`;
  }

  if (einzelne.has(modelKey)) {
    return `<img src="./assets/truck-${modelKey}.png" alt="" class="lkw-bild">`;
  }

  return '🚛';
}

export const bildZustand = () => zustand;

/* Kennzeichnet den aktuellen Bildstand. Ändert er sich, müssen die
   Marken auf der Karte neu aufgebaut werden. */
export const bildStand = () => zustand + ':' + einzelne.size;


/* ── Gesichter der Auftraggeber ─────────────────────────────────
   Dieselbe Vorgehensweise wie bei den Fahrzeugen: ein Sammelbild mit
   sechs Feldern in drei Spalten und zwei Zeilen, oder einzelne
   Dateien. Fehlt beides, bleibt es beim Sinnbild des Charakters. */

export const GESICHTER = {
  kaufmann:     [0, 0], grosszuegig:  [1, 0], kleinlich:    [2, 0],
  hektisch:     [0, 1], treu:         [1, 1], misstrauisch: [2, 1],
};

const G_SPALTEN = 3;
const G_ZEILEN  = 2;
const G_BLATT   = './assets/gesichter.png';

let gZustand = 'ungeprueft';
let gEinzelne = new Set();

function pruefeGesichter() {
  if (gZustand !== 'ungeprueft') return;
  gZustand = 'sinnbild';

  const blatt = new Image();
  blatt.onload = () => {
    if (blatt.width >= G_SPALTEN * 16 && blatt.height >= G_ZEILEN * 16) {
      gZustand = 'blatt';
      beiAenderung?.();
    }
  };
  blatt.src = G_BLATT;

  for (const key of Object.keys(GESICHTER)) {
    const bild = new Image();
    bild.onload = () => {
      gEinzelne.add(key);
      if (gZustand === 'sinnbild') gZustand = 'einzeln';
      beiAenderung?.();
    };
    bild.src = `./assets/gesicht-${key}.png`;
  }
}

/* Liefert das Bild eines Charakters, oder null wenn keines vorliegt. */
export function gesichtVon(charakterKey) {
  pruefeGesichter();

  if (gZustand === 'blatt' && GESICHTER[charakterKey]) {
    const [sp, ze] = GESICHTER[charakterKey];
    const x = G_SPALTEN > 1 ? (sp / (G_SPALTEN - 1)) * 100 : 0;
    const y = G_ZEILEN  > 1 ? (ze / (G_ZEILEN  - 1)) * 100 : 0;

    return `<span class="gesicht-feld" style="`
         + `background-image:url('${G_BLATT}');`
         + `background-position:${x}% ${y}%"></span>`;
  }

  if (gEinzelne.has(charakterKey)) {
    return `<img src="./assets/gesicht-${charakterKey}.png" alt="" class="gesicht-bild">`;
  }

  return null;
}

export const gesichtStand = () => gZustand + ':' + gEinzelne.size;


/* ── Gesichter der Fahrer ───────────────────────────────────────
   Anders als bei den Auftraggebern gibt es hier keinen festen
   Charakter, an dem sich das Bild festmachen ließe — nur der Name.
   Damit ein Bildnis nicht dem falschen Geschlecht zugeordnet wird,
   ist das Sammelbild in zwei Hälften geteilt: obere Reihe weiblich,
   untere Reihe männlich, je vier Personen. Innerhalb der passenden
   Hälfte entscheidet eine feste Streuung der Kennung, welche der
   vier es wird — derselbe Fahrer zeigt so immer dasselbe Gesicht,
   ohne dass etwas gespeichert werden müsste. */

const FAHRER_JE_GESCHLECHT = 4;
const F_SPALTEN = 4;
const F_ZEILEN  = 2;
const F_BLATT   = './assets/fahrer.png';

let fZustand = 'ungeprueft';
let fEinzelne = new Set();

function pruefeFahrer() {
  if (fZustand !== 'ungeprueft') return;
  fZustand = 'sinnbild';

  const blatt = new Image();
  blatt.onload = () => {
    if (blatt.width >= F_SPALTEN * 16 && blatt.height >= F_ZEILEN * 16) {
      fZustand = 'blatt';
      beiAenderung?.();
    }
  };
  blatt.src = F_BLATT;

  for (let i = 0; i < F_SPALTEN * F_ZEILEN; i++) {
    const bild = new Image();
    bild.onload = () => {
      fEinzelne.add(i);
      if (fZustand === 'sinnbild') fZustand = 'einzeln';
      beiAenderung?.();
    };
    bild.src = `./assets/fahrer-${i}.png`;
  }
}

/* Ein Platz innerhalb der vier Bilder eines Geschlechts, fest aus der
   Kennung abgeleitet. */
function fahrerBasis(kennung = '') {
  let h = 2166136261;
  for (let i = 0; i < kennung.length; i++) {
    h ^= kennung.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  return (h >>> 0) % FAHRER_JE_GESCHLECHT;
}

/* Der Bildplatz von 0 bis 7 im Sammelbild: 0–3 weiblich (obere
   Reihe), 4–7 männlich (untere Reihe). */
export function fahrerSlot(kennung = '', geschlecht = 'w') {
  return fahrerBasis(kennung) + (geschlecht === 'm' ? FAHRER_JE_GESCHLECHT : 0);
}

const FAHRER_SINNBILD_W = ['👩‍✈️', '👱‍♀️', '👩🏽', '👩🏾'];
const FAHRER_SINNBILD_M = ['🧔', '👨‍✈️', '🧑‍🦰', '👴'];
const FAHRER_SINNBILD = [...FAHRER_SINNBILD_W, ...FAHRER_SINNBILD_M];

/* Liefert das Bild für einen Fahrer, passend zu Kennung und
   Geschlecht. Ohne Angabe des Geschlechts gilt weiblich als
   Voreinstellung — kommt nur bei sehr alten Spielständen vor. */
export function fahrerBild(kennung, geschlecht = 'w') {
  pruefeFahrer();
  const slot = fahrerSlot(kennung, geschlecht);

  if (fZustand === 'blatt') {
    const sp = slot % F_SPALTEN, ze = Math.floor(slot / F_SPALTEN);
    const x = F_SPALTEN > 1 ? (sp / (F_SPALTEN - 1)) * 100 : 0;
    const y = F_ZEILEN  > 1 ? (ze / (F_ZEILEN  - 1)) * 100 : 0;

    return `<span class="fahrer-feld" style="`
         + `background-image:url('${F_BLATT}');`
         + `background-position:${x}% ${y}%"></span>`;
  }

  if (fEinzelne.has(slot)) {
    return `<img src="./assets/fahrer-${slot}.png" alt="" class="fahrer-bildnis">`;
  }

  return FAHRER_SINNBILD[slot];
}

export const FAHRER_SPALTEN = F_SPALTEN;
export const FAHRER_ZEILEN = F_ZEILEN;


/* ── Fahrzeugrahmen für das Ladeschema ────────────────────────────
   Fahrerhaus, Außenkontur und Räder von oben, die Ladefläche leer.
   Die Stellplätze zeichnet das Spiel selbst darüber — das Bild liefert
   nur den Rahmen, keine Farbe.

   Mehrere Fahrzeugklassen mit ähnlichem Aufbau teilen sich ein
   gemeinsames Blatt — dieselbe Idee wie bei den Gesichtern, nur mit
   Zeilen statt eines Rasters, weil ein Fahrzeug von oben breit und
   flach ist, kein Quadrat. Jede Zeile zeigt ein Fahrzeug in voller
   Blattbreite; welche Zeile zu welcher Klasse gehört, steht in
   RAHMEN_KLASSEN. */

/* Ein Blatt aus mehreren Fahrzeugen untereinander.

   WICHTIG: Die Zeilen sind in der Praxis unterschiedlich hoch — ein
   von einer KI erzeugtes Bild hält sich nicht an ein starres Raster,
   jedes Fahrzeug bekommt so viel Platz, wie es braucht. Ein erster
   Versuch mit angenommener Gleichverteilung (Bildhöhe geteilt durch
   Zeilenzahl) schnitt mitten durch die nächste Fahrerkabine.

   grenzen: reihen+1 Werte, als Anteil der Gesamthöhe — die Ränder
     zwischen den Zeilen, gelegt in die Lücke zwischen zwei Fahrzeugen.
   flaechen: ein Eintrag je Zeile mit der Lage der Ladefläche darin,
     x als Anteil der Bildbreite, y als Anteil der ZEILENEIGENEN Höhe
     (0 = oberer Rand der Zeile, 1 = unterer Rand). */
const RAHMEN_BLAETTER = {
  fern: {
    reihen: 1,
    seitenverhaeltnis: 2178 / 722,
    grenzen: [0, 1],
    flaechen: [{ x1: 0.309, x2: 0.936, y1: 0.179, y2: 0.717 }],
  },
  klein: {
    reihen: 4,
    seitenverhaeltnis: 1008 / 1560,       // Breite durch Gesamthöhe des Blatts
    grenzen: [0, 0.2077, 0.4372, 0.6808, 1],
    flaechen: [
      { x1: 0.406, x2: 0.735, y1: 0.111, y2: 0.929 },   // Kastenwagen
      { x1: 0.365, x2: 0.816, y1: 0.089, y2: 0.894 },   // Kurier
      { x1: 0.259, x2: 0.851, y1: 0.105, y2: 0.913 },   // Maxi (ohne Ladebordwand)
      { x1: 0.312, x2: 0.866, y1: 0.088, y2: 0.759 },   // Kompakt 5.0
    ],
  },
  solo: {
    reihen: 3,
    seitenverhaeltnis: 1024 / 1536,
    grenzen: [0, 0.3294, 0.6354, 1],
    flaechen: [
      { x1: 0.282, x2: 0.930, y1: 0.188, y2: 0.909 },   // Nahverkehr 7.5 (ohne Rampe)
      { x1: 0.257, x2: 0.936, y1: 0.130, y2: 0.874 },   // Verteiler 12
      { x1: 0.217, x2: 0.957, y1: 0.121, y2: 0.764 },   // Solo 18
    ],
  },
  sattelzug: {
    reihen: 3,
    seitenverhaeltnis: 1024 / 1536,
    grenzen: [0, 0.3555, 0.5944, 1],
    flaechen: [
      { x1: 0.267, x2: 0.977, y1: 0.489, y2: 0.859 },   // Jumbo 40
      { x1: 0.317, x2: 0.979, y1: 0.237, y2: 0.801 },   // Thermo 40 (ohne Kälteaggregat)
      { x1: 0.367, x2: 0.981, y1: 0.177, y2: 0.435 },   // Schwerlast 620
    ],
  },
};

/* Welche Zeile welches Blattes zu welcher Fahrzeugklasse gehört.
   index ist null-basiert, von oben nach unten. */
const RAHMEN_KLASSEN = {
  fern: { blatt: 'fern', index: 0 },

  kastenwagen: { blatt: 'klein', index: 0 },
  kurier:      { blatt: 'klein', index: 1 },
  maxi:        { blatt: 'klein', index: 2 },
  leicht:      { blatt: 'klein', index: 3 },

  siebenhalb:  { blatt: 'solo', index: 0 },
  verteiler:   { blatt: 'solo', index: 1 },
  motorwagen:  { blatt: 'solo', index: 2 },

  jumbo:       { blatt: 'sattelzug', index: 0 },
  kuehlzug:    { blatt: 'sattelzug', index: 1 },
  schwer:      { blatt: 'sattelzug', index: 2 },
};

/* Klassen ohne eigene Zeile fallen auf die ähnlichste zurück, bis das
   passende Blatt vorliegt. */
/* Alle elf Klassen haben inzwischen eine eigene Zeile — die
   Ersatzliste bleibt als Absicherung stehen, greift aber nicht mehr. */
const RAHMEN_ERSATZ = {};

const rahmenGeprueft = new Map();   // blattKey -> 'da' | 'fehlt' | 'prueft'

function pruefeRahmenBlatt(blattKey) {
  if (!RAHMEN_BLAETTER[blattKey] || rahmenGeprueft.has(blattKey)) return;
  rahmenGeprueft.set(blattKey, 'prueft');

  const bild = new Image();
  bild.onload = () => { rahmenGeprueft.set(blattKey, 'da'); beiAenderung?.(); };
  bild.onerror = () => { rahmenGeprueft.set(blattKey, 'fehlt'); };
  bild.src = `./assets/rahmen-${blattKey}.png`;
}

/* Liefert { url, flaeche, seitenverhaeltnis, reihen, index } oder null,
   wenn (noch) kein passendes Blatt vorliegt. */
export function rahmenVon(modelKey) {
  const eigene = RAHMEN_KLASSEN[modelKey];
  const ersatzKlasse = RAHMEN_ERSATZ[modelKey];
  const ersatz = ersatzKlasse ? RAHMEN_KLASSEN[ersatzKlasse] : null;

  const gefunden = eigene && rahmenGeprueft.get(eigene.blatt) === 'da' ? eigene
                 : ersatz && rahmenGeprueft.get(ersatz.blatt) === 'da' ? ersatz
                 : null;

  if (eigene) pruefeRahmenBlatt(eigene.blatt);
  if (ersatz) pruefeRahmenBlatt(ersatz.blatt);

  if (!gefunden) return null;
  const blatt = RAHMEN_BLAETTER[gefunden.blatt];
  return {
    url: `./assets/rahmen-${gefunden.blatt}.png`,
    reihen: blatt.reihen,
    seitenverhaeltnis: blatt.seitenverhaeltnis,
    grenzen: blatt.grenzen,
    index: gefunden.index,
    flaeche: blatt.flaechen[gefunden.index],
  };
}
