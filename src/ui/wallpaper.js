/* Hintergrund der Arbeitsfläche.

   Voreinstellungen im Stil der Zeit, dazu ein eigenes Bild. Das Bild
   wird vor dem Speichern verkleinert, damit der Browserspeicher nicht
   überläuft, und liegt getrennt vom Spielstand. */

const KEY = 'spedipro.wallpaper';

export const PRESETS = {
  teal:    { name: 'Türkis',      css: '#6a9a9a' },
  olive:   { name: 'Olivgrün',    css: '#5f6b3c' },
  marine:  { name: 'Marineblau',  css: '#2a4a72' },
  grau:    { name: 'Grau',        css: '#7a7a7a' },
  wein:    { name: 'Bordeaux',    css: '#6a3a44' },

  kacheln: { name: 'Kacheln',
    css: 'repeating-conic-gradient(#5f8f8f 0% 25%, #6a9a9a 0% 50%) 50% / 24px 24px' },
  karo:    { name: 'Karo',
    css: 'repeating-linear-gradient(45deg, #5c8a8a 0 8px, #6a9a9a 8px 16px)' },
  streifen:{ name: 'Streifen',
    css: 'repeating-linear-gradient(90deg, #63918f 0 3px, #6a9a9a 3px 12px)' },
  himmel:  { name: 'Verlauf',
    css: 'linear-gradient(to bottom, #4a7f9a, #8fb3a8)' },
};

const STANDARD = { art: 'preset', wert: 'teal' };

export function ladeHintergrund() {
  try {
    const roh = localStorage.getItem(KEY);
    return roh ? JSON.parse(roh) : { ...STANDARD };
  } catch {
    return { ...STANDARD };
  }
}

export function speichereHintergrund(wahl) {
  try { localStorage.setItem(KEY, JSON.stringify(wahl)); return true; }
  catch { return false; }
}

/* Auf die Arbeitsfläche und alles, was ihn mitbenutzt, anwenden. */
export function wendeAn(wahl = ladeHintergrund()) {
  const desktop = document.getElementById('desktop');
  const wurzel = document.documentElement;

  if (wahl.art === 'bild' && wahl.wert) {
    wurzel.style.setProperty('--wallpaper', `url(${wahl.wert})`);
    wurzel.style.setProperty('--wallpaper-size', 'cover');
    if (desktop) {
      desktop.style.background = `#6a9a9a url(${wahl.wert}) center / cover no-repeat`;
    }
  } else {
    const preset = PRESETS[wahl.wert] || PRESETS.teal;
    wurzel.style.setProperty('--wallpaper', 'none');
    if (desktop) desktop.style.background = preset.css;
  }
  document.body.style.background = wahl.art === 'bild'
    ? '#6a9a9a'
    : (PRESETS[wahl.wert] || PRESETS.teal).css;
}

/* Eigenes Bild einlesen, verkleinern und sichern. */
export function bildLaden(datei, fertig) {
  const leser = new FileReader();

  leser.onload = () => {
    const bild = new Image();
    bild.onload = () => {
      const MAX = 1600;
      const faktor = Math.min(1, MAX / Math.max(bild.width, bild.height));
      const w = Math.round(bild.width * faktor);
      const h = Math.round(bild.height * faktor);

      const leinwand = document.createElement('canvas');
      leinwand.width = w; leinwand.height = h;
      leinwand.getContext('2d').drawImage(bild, 0, 0, w, h);

      const daten = leinwand.toDataURL('image/jpeg', 0.82);
      const wahl = { art: 'bild', wert: daten, name: datei.name };

      if (!speichereHintergrund(wahl)) {
        fertig({ ok: false, grund: 'Das Bild ist zu groß für den Browserspeicher.' });
        return;
      }
      wendeAn(wahl);
      fertig({ ok: true, groesse: `${w} × ${h}` });
    };
    bild.onerror = () => fertig({ ok: false, grund: 'Datei ließ sich nicht lesen.' });
    bild.src = leser.result;
  };

  leser.onerror = () => fertig({ ok: false, grund: 'Datei ließ sich nicht lesen.' });
  leser.readAsDataURL(datei);
}
