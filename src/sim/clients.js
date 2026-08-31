/* Auftraggeber als Personen.

   Ein Verlader ist nicht immer gleich. Er hat einen Charakter, der sich
   nicht ändert, eine Tagesform, die schwankt, und ein Gedächtnis für
   das, was man ihm angetan hat.

   Alles hängt am Namen: Derselbe Betrieb verhält sich in einem
   Spielstand immer gleich, ohne dass etwas gespeichert werden müsste —
   nur was sich verändert (Groll, Zustand) liegt in S.kunden. */

import { S, log } from '../state.js';
import { esc, fmt } from '../util.js';
import { toast } from '../ui/toast.js';

/* ── Charakter ──────────────────────────────────────────────────
   Fest je Betrieb, aus dem Namen abgeleitet. */

export const CHARAKTERE = {
  kaufmann: {
    key: 'kaufmann', name: 'Nüchterner Kaufmann', icon: '🧮',
    text: 'Rechnet genau und verhandelt sachlich. Wenig Spielraum, aber verlässlich.',
    grenze: -0.03, nachtragend: 0.8, treue: 1.1,
  },
  grosszuegig: {
    key: 'grosszuegig', name: 'Großzügig', icon: '🎩',
    text: 'Zahlt lieber etwas mehr, als sich mit Kleinkram aufzuhalten.',
    grenze: +0.07, nachtragend: 0.7, treue: 1.0,
  },
  kleinlich: {
    key: 'kleinlich', name: 'Kleinlich', icon: '🔍',
    text: 'Feilscht um jeden Euro und nimmt Forderungen persönlich.',
    grenze: -0.05, nachtragend: 1.8, treue: 0.9,
  },
  hektisch: {
    key: 'hektisch', name: 'Immer in Eile', icon: '⏱️',
    text: 'Braucht die Ware gestern. Zahlt für Schnelligkeit, hat aber Launen.',
    grenze: +0.05, nachtragend: 1.2, treue: 0.8, launisch: 1.6,
  },
  treu: {
    key: 'treu', name: 'Beständig', icon: '🤝',
    text: 'Bleibt bei einem Spediteur, der sich bewährt hat.',
    grenze: +0.02, nachtragend: 0.6, treue: 1.5,
  },
  misstrauisch: {
    key: 'misstrauisch', name: 'Misstrauisch', icon: '🧐',
    text: 'Prüft jeden neuen Partner lange. Wer sich bewährt, hat es dann leicht.',
    grenze: -0.06, nachtragend: 1.4, treue: 1.3, langsam: true,
  },
};

const LISTE = Object.values(CHARAKTERE);

/* Eine feste Zahl je Name — dieselbe Firma, dasselbe Verhalten. */
export function namensZahl(name = '', salz = 0) {
  let h = 2166136261 ^ salz;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967295;
}

export const charakterVon = name => LISTE[Math.floor(namensZahl(name, 7) * LISTE.length)];

/* ── Zustände ───────────────────────────────────────────────────
   Vorübergehend, mit einem Ende. */

export const ZUSTAENDE = {
  betriebsurlaub: {
    key: 'betriebsurlaub', name: 'Betriebsferien', icon: '🏖️',
    text: 'Der Betrieb ruht, es wird nichts verschickt.',
    stumm: true, tage: [5, 12],
  },
  inventur: {
    key: 'inventur', name: 'Inventur', icon: '📋',
    text: 'Das Lager wird gezählt, solange geht nichts raus.',
    stumm: true, tage: [2, 4],
  },
  krank: {
    key: 'krank', name: 'Disponent krank', icon: '🤒',
    text: 'Die Vertretung entscheidet ungern und zahlt keinen Cent mehr.',
    grenze: -0.10, tage: [3, 8],
  },
  auftragsflaute: {
    key: 'auftragsflaute', name: 'Auftragsflaute', icon: '📉',
    text: 'Wenig zu verschicken, und der Preis muss stimmen.',
    grenze: -0.08, seltener: 0.4, tage: [7, 20],
  },
  hochbetrieb: {
    key: 'hochbetrieb', name: 'Hochbetrieb', icon: '📈',
    text: 'Alles muss raus, und zwar schnell. Da zählt der Preis weniger.',
    grenze: +0.12, haeufiger: 1.8, tage: [4, 12],
  },
  aerger: {
    key: 'aerger', name: 'Verstimmt', icon: '😤',
    text: 'Nach der letzten Verhandlung ist die Stimmung abgekühlt.',
    grenze: -0.12, seltener: 0.5, tage: [8, 20],
  },
  gesperrt: {
    key: 'gesperrt', name: 'Keine Zusammenarbeit', icon: '🚫',
    text: 'Der Verlader vergibt vorerst keine Fracht mehr an uns.',
    stumm: true, tage: [14, 35],
  },
};

/* ── Der Eintrag eines Kunden ── */
export function kunde(name) {
  S.kunden ||= {};
  return (S.kunden[name] ||= {
    fahrten: 0,
    groll: 0,          // 0 bis 100
    zustand: null,     // { key, bis }
    laune: 0,          // −1 bis 1, wechselt täglich
  });
}

export const zustandVon = name => {
  const k = S.kunden?.[name];
  if (!k?.zustand) return null;
  if (S.minutes >= k.zustand.bis) return null;
  return ZUSTAENDE[k.zustand.key] || null;
};

export function setzeZustand(name, key, tageMin = null) {
  const z = ZUSTAENDE[key];
  if (!z) return;

  const [a, b] = z.tage;
  const tage = tageMin ?? (a + Math.floor(Math.random() * (b - a + 1)));

  kunde(name).zustand = { key, bis: S.minutes + tage * 1440 };
  return tage;
}

/* ── Tagesform ──────────────────────────────────────────────────
   Wechselt täglich, unabhängig vom Charakter. Manche Leute haben
   eben schlechte Tage. */
export function neuerTag() {
  S.kunden ||= {};

  for (const [name, k] of Object.entries(S.kunden)) {
    const c = charakterVon(name);
    const schwung = (c.launisch || 1) * 0.5;
    k.laune = (Math.random() * 2 - 1) * schwung;

    /* Groll verfliegt langsam. */
    if (k.groll > 0) k.groll = Math.max(0, k.groll - 1.2);

    /* Abgelaufene Zustände aufräumen. */
    if (k.zustand && S.minutes >= k.zustand.bis) k.zustand = null;
  }

  /* Bei einigen Betrieben ändert sich etwas. */
  wuerfleZustaende();
}

function wuerfleZustaende() {
  const alle = [...(S.firms || []), ...(S.hubs || [])];
  if (!alle.length) return;

  /* Etwa drei Betriebe je Tag prüfen — nicht alle, sonst wäre ständig
     irgendwo etwas los. */
  for (let i = 0; i < 3; i++) {
    const firma = alle[Math.floor(Math.random() * alle.length)];
    const k = kunde(firma.name);
    if (k.zustand && S.minutes < k.zustand.bis) continue;

    const wurf = Math.random();
    let key = null;

    if (wurf < 0.06) key = 'betriebsurlaub';
    else if (wurf < 0.11) key = 'inventur';
    else if (wurf < 0.17) key = 'krank';
    else if (wurf < 0.25) key = 'auftragsflaute';
    else if (wurf < 0.34) key = 'hochbetrieb';
    if (!key) continue;

    const tage = setzeZustand(firma.name, key);

    /* Nur bei Kunden melden, mit denen man wirklich zu tun hat. */
    if (k.fahrten >= 3 && !S.silent) {
      const z = ZUSTAENDE[key];
      toast(z.icon, `<strong>${esc(firma.name)}</strong>: ${esc(z.name)}`,
                    `<span class="muted">${esc(z.text)} Etwa ${tage} Tage.</span>`);
    }
  }
}

/* ── Wirkung auf die Verhandlung ── */
export function grenzenBonus(name) {
  const k = kunde(name);
  const c = charakterVon(name);
  const z = zustandVon(name);

  let bonus = c.grenze + (k.laune || 0) * 0.05;
  if (z?.grenze) bonus += z.grenze;

  /* Groll drückt spürbar: Wer sich geärgert hat, gibt weniger nach. */
  bonus -= (k.groll / 100) * 0.25;

  return bonus;
}

/* Vergibt dieser Betrieb gerade überhaupt Fracht? */
export function vergibtFracht(name) {
  const z = zustandVon(name);
  return !z?.stumm;
}

/* Wie häufig fragt er an? */
export function anfrageFaktor(name) {
  const z = zustandVon(name);
  const k = kunde(name);

  let f = 1;
  if (z?.stumm) return 0;
  if (z?.seltener) f *= z.seltener;
  if (z?.haeufiger) f *= z.haeufiger;

  /* Wer verärgert ist, fragt seltener. */
  f *= 1 - (k.groll / 100) * 0.6;

  return Math.max(0, f);
}

/* ── Gedächtnis ─────────────────────────────────────────────────
   Eine überzogene Verhandlung wird nicht vergessen. Beim ersten Mal
   ist es ein Ärgernis, beim dritten ist Schluss. */
export function verstimmen(name, staerke = 18) {
  const k = kunde(name);
  const c = charakterVon(name);

  k.groll = Math.min(100, k.groll + staerke * c.nachtragend);

  if (k.groll >= 70 && !zustandVon(name)) {
    const tage = setzeZustand(name, 'gesperrt');
    log(`🚫 ${name} vergibt vorerst keine Fracht mehr an uns (${tage} Tage).`);
    if (!S.silent) {
      toast('🚫', `<strong>${esc(name)}</strong> bricht die Zusammenarbeit ab.`,
                  `<span class="bad">Etwa ${tage} Tage keine Anfragen von dort.</span>`);
    }
    return 'gesperrt';
  }

  if (k.groll >= 35 && !zustandVon(name)) {
    setzeZustand(name, 'aerger');
    return 'verstimmt';
  }

  return 'gemerkt';
}

/* Eine faire Zusammenarbeit besänftigt. */
export function beruhigen(name, staerke = 3) {
  const k = kunde(name);
  k.groll = Math.max(0, k.groll - staerke);

  /* Nach genug Fahrten verzeiht auch ein Verstimmter. */
  if (k.groll < 20 && S.kunden[name]?.zustand?.key === 'aerger') {
    k.zustand = null;
  }
}

/* Wie steht der Kunde zu uns? Für die Anzeige. */
export function stimmung(name) {
  const k = kunde(name);
  const z = zustandVon(name);

  if (z?.key === 'gesperrt') return { stufe: 'gesperrt', text: 'arbeitet nicht mit uns' };
  if (k.groll >= 50) return { stufe: 'boese',   text: 'verärgert' };
  if (k.groll >= 25) return { stufe: 'kuehl',   text: 'abgekühlt' };
  if (k.laune > 0.3)  return { stufe: 'gut',    text: 'gut gelaunt' };
  if (k.laune < -0.3) return { stufe: 'mies',   text: 'schlecht gelaunt' };
  return { stufe: 'normal', text: 'sachlich' };
}
