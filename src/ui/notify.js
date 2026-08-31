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

/* Läuft das Spiel als installierte App? Dann hat es einen eigenen
   Eintrag in den Systemeinstellungen. */
export function alsAppInstalliert() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches
      || window.navigator?.standalone === true;
}

/* Auf GitHub Pages teilen sich alle Projekte eines Kontos dieselbe
   Herkunft. Die Erlaubnis für Benachrichtigungen gilt deshalb für die
   ganze Domäne — und kann von einer anderen dort installierten App
   verwaltet werden. Das ist keine Vermutung über eine bestimmte App,
   sondern schlicht die Lage: Bleibt die Antwort nach der Frage
   unverändert, hat etwas anderes darüber entschieden. */
export const teiltHerkunft = () =>
  typeof location !== 'undefined'
  && /\.github\.io$/.test(location.hostname)
  && location.pathname.split('/').filter(Boolean).length > 0;

const imHintergrund = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

const bereit = () => erlaubnisStand() === 'erlaubt' && imHintergrund();

/* ── Servicearbeiter ────────────────────────────────────────────
   Auf Android verlangt Chrome einen Servicearbeiter, sonst wirft
   new Notification() einen Fehler. Deshalb wird er beim Start
   angemeldet und für alle Meldungen benutzt, wenn er da ist. */
let arbeiter = null;

export async function meldeSystemAn() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    /* Der Geltungsbereich bleibt auf diesen Unterordner beschränkt,
       damit sich das Spiel nicht mit anderen Projekten auf derselben
       Adresse ins Gehege kommt. */
    arbeiter = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    return arbeiter;
  } catch {
    arbeiter = null;
    return null;
  }
}

/* Ob Benachrichtigungen überhaupt möglich sind. Braucht eine sichere
   Verbindung — über http:// verweigern die Browser sie. */
export function moeglich() {
  if (typeof Notification === 'undefined') return false;
  if (typeof window === 'undefined') return true;
  return window.isSecureContext !== false;
}

/* Warum es nicht geht, in einem Satz. */
export function warumNicht() {
  if (typeof Notification === 'undefined') {
    return 'Dieser Browser kennt keine Benachrichtigungen.';
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return 'Benachrichtigungen brauchen eine gesicherte Verbindung (https).';
  }
  return null;
}

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

export function zeigeMeldung(titel, text) {
  const optionen = {
    body: text,
    tag: 'spedipro',
    icon: './assets/trucks.png',
    badge: './assets/trucks.png',
  };

  /* Über den Servicearbeiter, wenn möglich — auf Android der einzige
     Weg, der funktioniert. */
  if (arbeiter?.showNotification) {
    try {
      arbeiter.showNotification(titel, optionen);
      return true;
    } catch { /* dann der andere Weg */ }
  }

  try {
    new Notification(titel, optionen);
    return true;
  } catch {
    return false;
  }
}

/* Für die Einstellungen: eine Meldung ohne Rücksicht auf den Modus. */
export function probemeldung() {
  if (!moeglich()) return { ok: false, grund: warumNicht() };
  if (erlaubnisStand() !== 'erlaubt') {
    return { ok: false, grund: 'Noch keine Erlaubnis erteilt.' };
  }

  const ging = zeigeMeldung('SpeditionsPro 95',
    'So sieht eine Meldung aus. Sie erscheint nur, wenn das Fenster '
    + 'im Hintergrund liegt.');

  return ging
    ? { ok: true }
    : { ok: false, grund: 'Der Browser hat die Meldung abgelehnt.' };
}

/* ── Kachelspeicher ─────────────────────────────────────────────
   Der Servicearbeiter bewahrt geladene Kartenkacheln auf. Diese
   beiden Funktionen fragen ihn danach und leeren ihn auf Wunsch. */
export function kachelZahl() {
  return new Promise(erfuellt => {
    if (!navigator.serviceWorker?.controller) return erfuellt(null);

    const kanal = ({ data }) => {
      if (data?.art === 'kachel-zahl') {
        navigator.serviceWorker.removeEventListener('message', kanal);
        erfuellt(data.zahl);
      }
    };
    navigator.serviceWorker.addEventListener('message', kanal);
    navigator.serviceWorker.controller.postMessage({ art: 'kacheln-zaehlen' });

    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', kanal);
      erfuellt(null);
    }, 1500);
  });
}

export function kachelnLeeren() {
  return new Promise(erfuellt => {
    if (!navigator.serviceWorker?.controller) return erfuellt(false);

    const kanal = ({ data }) => {
      if (data?.art === 'kacheln-geleert') {
        navigator.serviceWorker.removeEventListener('message', kanal);
        erfuellt(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', kanal);
    navigator.serviceWorker.controller.postMessage({ art: 'kacheln-leeren' });

    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', kanal);
      erfuellt(false);
    }, 2500);
  });
}

export const ARTEN = {
  panne:   { name: 'Panne',          text: 'Wenn ein Fahrzeug in die Werkstatt muss.' },
  vertrag: { name: 'Verträge',       text: 'Wenn ein Rahmenvertrag erfüllt ist oder ausläuft.' },
  stufe:   { name: 'Betriebsstufe',  text: 'Wenn der Betrieb eine Stufe aufsteigt.' },
};
