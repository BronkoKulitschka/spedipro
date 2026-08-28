/* Benachrichtigungen des Browsers.

   Meldungen, die auch dann ankommen, wenn das Fenster im Hintergrund
   liegt. Im Vordergrund wäre das aufdringlich — dort genügen die
   Einblendungen unten rechts.

   Für fertige Touren gibt es drei Möglichkeiten:

     sofort       jedes Mal, wenn ein Fahrzeug seine Tour beendet hat
     stuendlich   einmal je Stunde, aber nur wenn in dieser Zeit keine
                  neue Tour disponiert wurde — also als Erinnerung,
                  dass Fahrzeuge unbeschäftigt herumstehen
     aus          gar nicht

   Die Erlaubnis muss der Browser erteilen, und er fragt nur auf eine
   unmittelbare Nutzerhandlung hin. Deshalb wird sie in den
   Einstellungen per Knopf angefordert, nicht ungefragt beim Start. */

const KEY = 'spedipro.notify';

export const MODI = {
  sofort: {
    name: 'Bei jeder fertigen Tour',
    text: 'Sobald ein Fahrzeug seine Tour beendet hat.',
  },
  stuendlich: {
    name: 'Stündlich, wenn nichts disponiert wurde',
    text: 'Einmal je Stunde, aber nur wenn in dieser Zeit keine neue Tour '
        + 'gestartet wurde. Erinnert daran, dass Fahrzeuge stehen.',
  },
  aus: {
    name: 'Keine Benachrichtigungen',
    text: 'Nur die Einblendungen im Fenster.',
  },
};

const STANDARD = {
  modus: 'stuendlich',
  panne: true,       // Fahrzeug in der Werkstatt
  vertrag: true,     // Vertrag erfüllt oder ausgelaufen
  stufe: true,       // neue Betriebsstufe
};

export function ladeEinstellung() {
  try {
    const roh = localStorage.getItem(KEY);
    const wahl = roh ? { ...STANDARD, ...JSON.parse(roh) } : { ...STANDARD };
    if (!MODI[wahl.modus]) wahl.modus = STANDARD.modus;
    return wahl;
  } catch {
    return { ...STANDARD };
  }
}

export function speichereEinstellung(wahl) {
  try { localStorage.setItem(KEY, JSON.stringify(wahl)); return true; }
  catch { return false; }
}

/* Was der Browser dazu sagt */
export function erlaubnisStand() {
  if (typeof Notification === 'undefined') return 'nicht-unterstuetzt';
  return { granted: 'erlaubt', denied: 'verweigert' }[Notification.permission] || 'ungefragt';
}

export async function frageErlaubnis() {
  if (typeof Notification === 'undefined') return 'nicht-unterstuetzt';
  try {
    const antwort = await Notification.requestPermission();
    return { granted: 'erlaubt', denied: 'verweigert' }[antwort] || 'ungefragt';
  } catch {
    return 'verweigert';
  }
}

const imHintergrund = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

const bereit = () => erlaubnisStand() === 'erlaubt' && imHintergrund();

/* ── Die stündliche Erinnerung ──────────────────────────────────
   Gemessen wird echte Zeit, nicht Spielzeit: Es geht darum, den
   Spieler zu erreichen, nicht den Betrieb abzubilden. */
const STUNDE = 60 * 60 * 1000;
const TAKT = 5 * 60 * 1000;      // alle fünf Minuten nachsehen

let letzteDisposition = Date.now();
let letzteErinnerung = 0;
let wecker = null;

/* Von startTour aufgerufen: Es wurde etwas disponiert, die Uhr
   für die Erinnerung beginnt von vorn. */
export function merkeDisposition() {
  letzteDisposition = Date.now();
}

/* Wie viele Fahrzeuge stehen unbeschäftigt herum? Wird von außen
   gesetzt, damit dieses Modul den Spielzustand nicht kennen muss. */
let zaehleFreie = () => 0;
export function setzeFreieZaehler(fn) { zaehleFreie = fn; }

function pruefeErinnerung() {
  const wahl = ladeEinstellung();
  if (wahl.modus !== 'stuendlich') return;
  if (!bereit()) return;

  const jetzt = Date.now();
  if (jetzt - letzteDisposition < STUNDE) return;
  if (jetzt - letzteErinnerung < STUNDE) return;

  const frei = zaehleFreie();
  if (!frei) return;

  letzteErinnerung = jetzt;
  zeigeMeldung('Fahrzeuge stehen still',
    frei === 1
      ? 'Ein Fahrzeug wartet seit einer Stunde auf einen Auftrag.'
      : `${frei} Fahrzeuge warten seit einer Stunde auf Aufträge.`);
}

export function starteErinnerung() {
  clearInterval(wecker);
  wecker = setInterval(pruefeErinnerung, TAKT);
}

/* ── Melden ─────────────────────────────────────────────────────
   Mehrere Meldungen kurz nacheinander werden zusammengefasst, damit
   bei fünf gleichzeitig ankommenden Fahrzeugen nicht fünfmal
   geklingelt wird. */
let sammler = null;
let gesammelt = [];

export function melde(art, titel, text) {
  const wahl = ladeEinstellung();

  /* Fertige Touren hängen am Modus, alles andere an eigenen Häkchen. */
  if (art === 'zustellung') {
    if (wahl.modus !== 'sofort') return;
  } else if (wahl.modus === 'aus' || !wahl[art]) {
    return;
  }

  if (!bereit()) return;

  gesammelt.push({ titel, text });
  clearTimeout(sammler);
  sammler = setTimeout(() => {
    const liste = gesammelt;
    gesammelt = [];
    if (liste.length === 1) zeigeMeldung(liste[0].titel, liste[0].text);
    else zeigeMeldung(`${liste.length} Meldungen`,
      liste.slice(0, 4).map(m => `${m.titel}: ${m.text}`).join('\n')
      + (liste.length > 4 ? `\n… und ${liste.length - 4} weitere` : ''));
  }, 1200);
}

function zeigeMeldung(titel, text) {
  try {
    new Notification(titel, { body: text, tag: 'spedipro', icon: './assets/trucks.png' });
  } catch {
    /* Manche Browser lehnen Benachrichtigungen ohne Servicearbeiter ab.
       Dann bleibt es bei den Einblendungen im Fenster. */
  }
}

/* Für die Einstellungen: eine Meldung ohne Rücksicht auf den Modus. */
export function probemeldung() {
  if (erlaubnisStand() !== 'erlaubt') return false;
  zeigeMeldung('SpeditionsPro 95',
    'So sieht eine Meldung aus. Sie erscheint nur, wenn das Fenster '
    + 'im Hintergrund liegt.');
  return true;
}

export const ARTEN = {
  panne:   { name: 'Panne',          text: 'Wenn ein Fahrzeug in die Werkstatt muss.' },
  vertrag: { name: 'Verträge',       text: 'Wenn ein Rahmenvertrag erfüllt ist oder ausläuft.' },
  stufe:   { name: 'Betriebsstufe',  text: 'Wenn der Betrieb eine Stufe aufsteigt.' },
};
