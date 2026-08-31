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
