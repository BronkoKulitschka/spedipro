/* Stammkunden.

   Ein Betrieb, den man oft beliefert, wird zum Stammkunden: bessere
   Sätze, eigene Anfragen. Wie bei den Partnerspeditionen kann nichts
   verloren gehen — die Beziehung wächst nur. */

import { S, log } from '../state.js';
import { esc } from '../util.js';
import { toast } from '../ui/toast.js';

export const STUFEN = [
  { ab: 0,  name: 'neu',          rate: 1.00 },
  { ab: 3,  name: 'bekannt',      rate: 1.06 },
  { ab: 8,  name: 'Stammkunde',   rate: 1.14 },
  { ab: 18, name: 'Hauskunde',    rate: 1.24 },
];

export const stufeVon = anzahl => {
  let out = STUFEN[0];
  for (const s of STUFEN) if (anzahl >= s.ab) out = s;
  return out;
};

export const naechsteStufe = anzahl => {
  const i = STUFEN.indexOf(stufeVon(anzahl));
  return STUFEN[i + 1] || null;
};

/* Wie oft wurde dieser Betrieb schon beliefert? */
export const fahrtenZu = name => S.kunden?.[name]?.fahrten || 0;
export const rateFuer  = name => stufeVon(fahrtenZu(name)).rate;

export function registriereFahrt(firma) {
  S.kunden ||= {};
  const eintrag = S.kunden[firma.name] ||= { fahrten: 0, art: firma.kind || firma.art };

  const vorher = stufeVon(eintrag.fahrten);
  eintrag.fahrten++;
  eintrag.zuletzt = S.minutes;
  const nachher = stufeVon(eintrag.fahrten);

  if (nachher !== vorher) {
    log(`🏢 ${firma.name} führt euch jetzt als ${nachher.name}.`);
    if (!S.silent) {
      toast('🏢', `<strong>${esc(firma.name)}</strong> zählt euch zu den ${esc(nachher.name)}n.`,
                  `<span class="ok">+${Math.round((nachher.rate - 1) * 100)} % auf Fracht dorthin</span>`);
    }
  }
}

/* Die wichtigsten Kunden, für die Übersicht */
export function topKunden(anzahl = 12) {
  return Object.entries(S.kunden || {})
    .map(([name, k]) => ({ name, ...k, stufe: stufeVon(k.fahrten) }))
    .sort((a, b) => b.fahrten - a.fahrten)
    .slice(0, anzahl);
}
