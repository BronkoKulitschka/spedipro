/* Befreundete Speditionen.

   Sie sind keine Konkurrenz um Aufträge, sondern geben eigene Fracht an
   Subunternehmer weiter — so, wie es im Speditionsgewerbe üblich ist. Wer
   für sie fährt, steigt in ihrer Gunst und bekommt häufiger und besser
   bezahlte Anfragen. Ein Nachteil entsteht nie. */

import { PARTNERS, PARTNER_LEVELS } from '../config.js';
import { S, log } from '../state.js';
import { pick, esc } from '../util.js';
import { toast } from '../ui/toast.js';

export function initPartners() {
  return PARTNERS.map(p => ({
    ...p,
    delivered: 0,
    trucks: 8 + Math.floor(Math.random() * 30),
    umsatz: 400000 + Math.floor(Math.random() * 900000),
  }));
}

export const levelOf = partner => {
  let out = PARTNER_LEVELS[0];
  for (const l of PARTNER_LEVELS) if (partner.delivered >= l.ab) out = l;
  return out;
};

export const findPartner = key => S.partners.find(p => p.key === key);

export const nextLevel = partner => {
  const i = PARTNER_LEVELS.indexOf(levelOf(partner));
  return PARTNER_LEVELS[i + 1] || null;
};

/* Wer gerade am ehesten etwas abzugeben hat. */
export function pickPartner() {
  const gewichtet = [];
  for (const p of S.partners) {
    const chance = levelOf(p).chance;
    for (let i = 0; i < Math.round(chance * 10); i++) gewichtet.push(p);
  }
  return gewichtet.length ? pick(gewichtet) : pick(S.partners);
}

export function registerPartnerLoad(key) {
  const p = findPartner(key);
  if (!p) return;

  const vorher = levelOf(p);
  p.delivered++;
  const nachher = levelOf(p);

  if (nachher !== vorher) {
    log(`🤝 ${p.name} stuft euch hoch: ${nachher.name}.`);
    toast('🤝', `<strong>${esc(p.name)}</strong> arbeitet jetzt enger mit euch.`,
                `<span class="ok">Stufe: ${nachher.name} · +${Math.round((nachher.rate - 1) * 100)} % auf Partnerfracht</span>`);
  }
}

/* Die Branche wächst leise vor sich hin. Reine Kulisse, ohne Wirkung
   auf den Spieler. */
export function growIndustry() {
  for (const p of S.partners) {
    if (Math.random() < 0.25) p.trucks += Math.random() < 0.7 ? 1 : -1;
    p.trucks = Math.max(5, p.trucks);
    p.umsatz = Math.round(p.umsatz * (1 + (Math.random() - 0.45) * 0.02));
  }
}
