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
   Charakter, an dem sich das Bild festmachen ließe — nur der Name,
   und Namen wiederholen sich nie. Deshalb bekommt jeder Fahrer über
   eine feste Streuung seiner Kennung eines von acht Bildnissen
   zugewiesen. Derselbe Fahrer zeigt so immer dasselbe Gesicht, ohne
   dass etwas gespeichert werden müsste. */

const FAHRER_SLOTS = 8;
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

  for (let i = 0; i < FAHRER_SLOTS; i++) {
    const bild = new Image();
    bild.onload = () => {
      fEinzelne.add(i);
      if (fZustand === 'sinnbild') fZustand = 'einzeln';
      beiAenderung?.();
    };
    bild.src = `./assets/fahrer-${i}.png`;
  }
}

/* Ein Bildplatz von 0 bis 7, fest aus der Kennung abgeleitet. */
export function fahrerSlot(kennung = '') {
  let h = 2166136261;
  for (let i = 0; i < kennung.length; i++) {
    h ^= kennung.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  return (h >>> 0) % FAHRER_SLOTS;
}

const FAHRER_SINNBILD = ['👨‍✈️', '👩‍✈️', '🧔', '👱‍♀️', '🧑🏾', '👩🏽', '🧑‍🦰', '👴'];

/* Liefert das Bild für einen Fahrer, anhand seiner Kennung. */
export function fahrerBild(kennung) {
  pruefeFahrer();
  const slot = fahrerSlot(kennung);

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
   Ein Bild je Fahrzeugklasse: Fahrerhaus, Außenkontur und Räder von
   oben, die Ladefläche leer. Die Stellplätze zeichnet das Spiel selbst
   darüber — das Bild liefert nur den Rahmen, keine Farbe.

   Klassen ohne eigenes Bild fallen auf das ähnlichste zurück, bis
   weitere Rahmen entstehen. */

const RAHMEN_ERSATZ = {
  kastenwagen: 'kurier', maxi: 'kurier',
  leicht: 'siebenhalb',
  motorwagen: 'verteiler',
  jumbo: 'fern', kuehlzug: 'fern', schwer: 'fern',
};

/* Lage der Ladefläche im Bild, als Anteil von Breite und Höhe, dazu das
   Seitenverhältnis des Bildes selbst. kastenwagen … schwer nutzen den
   Rahmen von rahmen-fern.png als Beispiel, bis eigene Bilder für jede
   Klasse vorliegen — deshalb steht der Eintrag hier bewusst nur einmal. */
const RAHMEN_DATEN = {
  fern: {
    flaeche: { x1: 0.309, x2: 0.936, y1: 0.179, y2: 0.717 },
    seitenverhaeltnis: 2178 / 722,
  },
};

const rahmenGeprueft = new Map();   // key -> 'da' | 'fehlt' | 'prueft'

function pruefeRahmen(key) {
  if (!RAHMEN_DATEN[key] || rahmenGeprueft.has(key)) return;
  rahmenGeprueft.set(key, 'prueft');

  const bild = new Image();
  bild.onload = () => { rahmenGeprueft.set(key, 'da'); beiAenderung?.(); };
  bild.onerror = () => { rahmenGeprueft.set(key, 'fehlt'); };
  bild.src = `./assets/rahmen-${key}.png`;
}

/* Liefert { url, flaeche, seitenverhaeltnis } oder null, wenn (noch)
   kein Rahmen vorliegt. */
export function rahmenVon(modelKey) {
  const ersatz = RAHMEN_ERSATZ[modelKey];
  const key = rahmenGeprueft.get(modelKey) === 'da' ? modelKey
            : rahmenGeprueft.get(ersatz) === 'da' ? ersatz
            : null;

  pruefeRahmen(modelKey);
  if (ersatz) pruefeRahmen(ersatz);

  if (!key) return null;
  return { url: `./assets/rahmen-${key}.png`, ...RAHMEN_DATEN[key] };
}
