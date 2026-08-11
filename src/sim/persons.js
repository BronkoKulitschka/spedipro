/* Fahrerpersönlichkeiten.

   Jeder Fahrer bekommt beim Einstellen zwei Züge. Sie wirken auf die
   Arbeit, aber nie streng: ein Zug ist ein leichter Vorteil oder ein
   leichter Nachteil, kein Hindernis. Zusammen mit den Fertigkeiten
   ergibt das Fahrer, die sich unterschiedlich anfühlen. */

import { pick } from '../util.js';

export const TRAITS = {
  frueh: {
    key: 'frueh', name: 'Frühaufsteher', icon: '🌅',
    text: 'Fährt morgens am liebsten, abends lässt die Konzentration nach.',
    tempo: h => (h >= 4 && h < 12 ? 1.08 : h >= 19 ? 0.93 : 1),
  },
  nacht: {
    key: 'nacht', name: 'Nachtfahrer', icon: '🌙',
    text: 'Nachts frei, ausgeruht und schnell. Vormittags eher zäh.',
    tempo: h => (h >= 21 || h < 5 ? 1.12 : h >= 8 && h < 12 ? 0.95 : 1),
  },
  langstrecke: {
    key: 'langstrecke', name: 'Langstreckenfahrer', icon: '🛣️',
    text: 'Blüht auf langen Läufen auf, Kurzstrecke langweilt.',
    tempoKm: km => (km > 300 ? 1.07 : km < 80 ? 0.96 : 1),
  },
  nahverkehr: {
    key: 'nahverkehr', name: 'Nahverkehrsprofi', icon: '🏘️',
    text: 'Kennt jede Einfahrt. Auf kurzen Strecken kaum zu schlagen.',
    tempoKm: km => (km < 120 ? 1.10 : km > 400 ? 0.96 : 1),
    rampe: 0.82,
  },
  sparsam: {
    key: 'sparsam', name: 'Sparfuchs', icon: '🪙',
    text: 'Fährt vorausschauend, spart Diesel ohne Aufhebens.',
    diesel: 0.94,
  },
  zuegig: {
    key: 'zuegig', name: 'Zügig unterwegs', icon: '💨',
    text: 'Hält gut Tempo, braucht dafür aber mehr Diesel.',
    tempoAllg: 1.06, diesel: 1.07,
  },
  sorgsam: {
    key: 'sorgsam', name: 'Sorgsam', icon: '🧰',
    text: 'Pflegt das Fahrzeug, kontrolliert vor jeder Fahrt.',
    panne: 0.75, rampe: 1.08,
  },
  redselig: {
    key: 'redselig', name: 'Redselig', icon: '💬',
    text: 'Kennt an jeder Rampe jemanden. Gut fürs Geschäft, kostet Zeit.',
    rampe: 1.15, ansehen: 1.6,
  },
  puenktlich: {
    key: 'puenktlich', name: 'Pünktlich', icon: '⏱️',
    text: 'War noch nie zu spät. Die Kundschaft weiß das zu schätzen.',
    ansehen: 1.5,
  },
  ruhig: {
    key: 'ruhig', name: 'Die Ruhe selbst', icon: '🧘',
    text: 'Bringt nichts aus der Fassung, auch kein Stau.',
    stau: 0.8,
  },
  lernwillig: {
    key: 'lernwillig', name: 'Lernwillig', icon: '📚',
    text: 'Nimmt aus jeder Fahrt etwas mit.',
    xp: 1.25,
  },
  gemuetlich: {
    key: 'gemuetlich', name: 'Gemütlich', icon: '🐢',
    text: 'Hat es nicht eilig. Dafür geht nie etwas kaputt.',
    tempoAllg: 0.94, panne: 0.7, diesel: 0.96,
  },

  /* ── Schwächen ──────────────────────────────────────────────
     Jeder Mensch hat welche. Sie machen niemanden unbrauchbar, aber
     sie kosten — und irgendwann steht die Frage im Raum, ob es das
     wert ist. */
  langsam: {
    key: 'langsam', name: 'Trödelt', icon: '🐌', schwaeche: true,
    text: 'Kommt schwer in die Gänge. Braucht für alles etwas länger.',
    tempoAllg: 0.90, rampe: 1.2,
  },
  schwerfuss: {
    key: 'schwerfuss', name: 'Bleifuß', icon: '⛽', schwaeche: true,
    text: 'Fährt mit zu viel Gas. Der Verbrauch spricht Bände.',
    diesel: 1.18, panne: 1.15,
  },
  unachtsam: {
    key: 'unachtsam', name: 'Unachtsam', icon: '💥', schwaeche: true,
    text: 'Kleine Schäden häufen sich. Die Werkstatt kennt ihn gut.',
    panne: 1.6,
  },
  muerrisch: {
    key: 'muerrisch', name: 'Mürrisch', icon: '😠', schwaeche: true,
    text: 'An der Rampe schon aufgefallen. Kunden beschweren sich.',
    ansehen: 0.4, rampe: 1.1,
  },
  orientierungslos: {
    key: 'orientierungslos', name: 'Verfährt sich', icon: '🧭', schwaeche: true,
    text: 'Findet nichts auf Anhieb. Umwege gehören dazu.',
    tempoAllg: 0.93, diesel: 1.10,
  },
  hektisch: {
    key: 'hektisch', name: 'Hektisch', icon: '😰', schwaeche: true,
    text: 'Staus bringen ihn aus der Fassung.',
    stau: 1.5, diesel: 1.06,
  },
  faul: {
    key: 'faul', name: 'Dienst nach Vorschrift', icon: '🛋️', schwaeche: true,
    text: 'Keine Minute mehr als nötig. Lernt auch wenig dazu.',
    xp: 0.7, rampe: 1.15,
  },
  teuer: {
    key: 'teuer', name: 'Fordernd', icon: '💸', schwaeche: true,
    text: 'Hat seinen Wert im Blick und lässt sich das bezahlen.',
    lohn: 1.35,
  },
};

/* Züge, die sich widersprechen und nicht zusammen auftreten sollen */
const UNVERTRAEGLICH = [
  ['frueh', 'nacht'],
  ['langstrecke', 'nahverkehr'],
  ['zuegig', 'gemuetlich'],
  ['sparsam', 'zuegig'],
  ['sparsam', 'schwerfuss'],
  ['zuegig', 'langsam'],
  ['gemuetlich', 'hektisch'],
  ['sorgsam', 'unachtsam'],
  ['ruhig', 'hektisch'],
  ['puenktlich', 'langsam'],
  ['redselig', 'muerrisch'],
  ['lernwillig', 'faul'],
  ['route', 'orientierungslos'],
];

function passtZu(vorhanden, kandidat) {
  return !UNVERTRAEGLICH.some(([a, b]) =>
    (vorhanden.includes(a) && kandidat === b) || (vorhanden.includes(b) && kandidat === a));
}

export const STAERKEN  = Object.keys(TRAITS).filter(k => !TRAITS[k].schwaeche);
export const SCHWAECHEN = Object.keys(TRAITS).filter(k =>  TRAITS[k].schwaeche);

/* Ein Fahrer bekommt Stärken und Schwächen. Wie viele, hängt vom Zufall
   ab — mancher Bewerber ist eine Perle, mancher ein Griff ins Klo. */
export function wuerfleTraits(staerken = 2, schwaechen = 1) {
  const gewaehlt = [];

  const ziehe = (topf, anzahl) => {
    let schutz = 0;
    let gezogen = 0;
    while (gezogen < anzahl && schutz++ < 60) {
      const k = pick(topf);
      if (gewaehlt.includes(k) || !passtZu(gewaehlt, k)) continue;
      gewaehlt.push(k);
      gezogen++;
    }
  };

  ziehe(STAERKEN, staerken);
  ziehe(SCHWAECHEN, schwaechen);
  return gewaehlt;
}

export const istSchwaeche = key => !!TRAITS[key]?.schwaeche;
export const staerkenVon  = d => (d.traits || []).filter(k => !istSchwaeche(k)).map(k => TRAITS[k]).filter(Boolean);
export const schwaechenVon = d => (d.traits || []).filter(istSchwaeche).map(k => TRAITS[k]).filter(Boolean);

export const traitsVon = driver => (driver.traits || []).map(k => TRAITS[k]).filter(Boolean);

/* ── Wirkung ──────────────────────────────────────────────────────
   Alle Faktoren werden multipliziert. Fehlt ein Wert, gilt 1. */
function faktor(driver, feld, arg) {
  let f = 1;
  for (const t of traitsVon(driver)) {
    const w = t[feld];
    if (typeof w === 'function') f *= w(arg);
    else if (typeof w === 'number') f *= w;
  }
  return f;
}

export const tempoFaktor = (driver, stunde, streckeKm) =>
  faktor(driver, 'tempo', stunde) *
  faktor(driver, 'tempoKm', streckeKm) *
  faktor(driver, 'tempoAllg');

export const dieselFaktor  = driver => faktor(driver, 'diesel');
export const panneFaktor   = driver => faktor(driver, 'panne');
export const rampeFaktor   = driver => faktor(driver, 'rampe');
export const ansehenFaktor = driver => faktor(driver, 'ansehen');
export const stauFaktor    = driver => faktor(driver, 'stau');
export const xpFaktor      = driver => faktor(driver, 'xp');
export const lohnFaktor    = driver => faktor(driver, 'lohn');
