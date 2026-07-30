/* Hintergrund der Arbeitsfläche.

   Voreinstellungen im Stil der Zeit, dazu ein eigenes Bild. Das Bild
   wird vor dem Speichern verkleinert, damit der Browserspeicher nicht
   überläuft, und liegt getrennt vom Spielstand. */

const KEY = 'spedipro.wallpaper';

export const PRESETS = {
  teal:    { name: 'Türkis',     css: '#6a9a9a' },
  olive:   { name: 'Olivgrün',   css: '#5f6b3c' },
  marine:  { name: 'Marineblau', css: '#2a4a72' },
  grau:    { name: 'Grau',       css: '#7a7a7a' },
  wein:    { name: 'Bordeaux',   css: '#6a3a44' },

  kacheln: { name: 'Kacheln',
             css: 'repeating-conic-gradient(#5f8f8f 0% 25%, #6a9a9a 0% 50%)',
             size: '24px 24px' },
  karo:    { name: 'Karo',
             css: 'repeating-linear-gradient(45deg, #5c8a8a 0 8px, #6a9a9a 8px 16px)',
             size: 'auto' },
  streifen:{ name: 'Streifen',
             css: 'repeating-linear-gradient(90deg, #63918f 0 3px, #6a9a9a 3px 12px)',
             size: 'auto' },
  himmel:  { name: 'Verlauf',
             css: 'linear-gradient(to bottom, #4a7f9a, #8fb3a8)',
             size: 'cover' },
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

/* Jede Voreinstellung wird als Bildebene ausgedrückt — auch die
   einfarbigen. So lässt sich derselbe Wert überall einsetzen, ob als
   Arbeitsfläche oder als Fläche hinter einer Zeile. */
function alsEbene(wahl) {
  if (wahl.art === 'bild' && wahl.wert) {
    return { bild: `url("${wahl.wert}")`, groesse: 'cover', kachel: false };
  }

  const preset = PRESETS[wahl.wert] || PRESETS.teal;
  const css = preset.css.trim();

  /* Reine Farbe in einen Verlauf fassen, damit sie eine Bildebene ist. */
  const bild = css.startsWith('#') ? `linear-gradient(${css}, ${css})` : css;
  return { bild, groesse: preset.size || 'auto', kachel: true };
}

export function wendeAn(wahl = ladeHintergrund()) {
  const { bild, groesse, kachel } = alsEbene(wahl);
  const wurzel = document.documentElement;

  wurzel.style.setProperty('--wp-ebene', bild);
  wurzel.style.setProperty('--wp-size', groesse);

  const desktop = document.getElementById('desktop');
  if (desktop) {
    desktop.style.backgroundColor = '#6a9a9a';
    desktop.style.backgroundImage = bild;
    desktop.style.backgroundSize = groesse;
    desktop.style.backgroundPosition = 'center';
    desktop.style.backgroundRepeat = kachel ? 'repeat' : 'no-repeat';
  }

  document.body.style.background = '#6a9a9a';
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
