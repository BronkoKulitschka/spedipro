/* Chronik und Wochenabschluss.

   Kein Wettbewerb gegen andere, sondern die eigene Geschichte: die
   längste Tour, der beste Tag, der Fahrer mit den meisten Kilometern.
   Und am Sonntag, wenn ohnehin Fahrverbot herrscht, eine Wochenbilanz. */

import { S, log, day, now, ledgerSums, driverOf } from '../state.js';
import { fmt, num, esc } from '../util.js';
import { toast } from '../ui/toast.js';
import { saison } from './season.js';
import { topKunden } from './customers.js';

/* ── Bestwerte ─────────────────────────────────────────────────── */
export const REKORDE = {
  tourKm:    { name: 'Längste Tour',          icon: '🛣️', format: v => `${num(v)} km` },
  tourGeld:  { name: 'Wertvollste Fracht',    icon: '💎', format: v => fmt(v) },
  tagGeld:   { name: 'Bester Tag',            icon: '📈', format: v => fmt(v) },
  tagTouren: { name: 'Meiste Zustellungen an einem Tag', icon: '📦', format: v => `${v} Fahrten` },
  wocheGeld: { name: 'Beste Woche',           icon: '🏆', format: v => fmt(v) },
  paletten:  { name: 'Größte Einzelsendung',  icon: '🧱', format: v => `${v} Paletten` },
};

export function pruefeRekord(key, wert, zusatz = '') {
  if (!Number.isFinite(wert) || wert <= 0) return false;
  S.rekorde ||= {};
  const alt = S.rekorde[key];
  if (alt && alt.wert >= wert) return false;

  S.rekorde[key] = { wert, zusatz, tag: day(), datum: S.minutes };

  /* Der allererste Eintrag ist noch kein Rekord — erst ab dem zweiten
     ist es eine Verbesserung, die eine Meldung wert wäre. */
  if (alt && !S.silent) {
    const r = REKORDE[key];
    toast('🏅', `Neuer Bestwert: <strong>${esc(r.name)}</strong>`,
                `<span class="ok">${r.format(wert)}</span>${zusatz ? ` <span class="muted">· ${esc(zusatz)}</span>` : ''}`);
  }
  return true;
}

export function rekordListe() {
  return Object.entries(REKORDE).map(([key, r]) => ({
    key, ...r, eintrag: S.rekorde?.[key] || null,
  }));
}

/* ── Tageswerte, für den Bestwert „Bester Tag" ── */
export function tagAbschluss() {
  const heute = ledgerSums(day());
  pruefeRekord('tagGeld', heute.saldo);
  pruefeRekord('tagTouren', S.tagTouren || 0);
  S.tagTouren = 0;
}

/* ── Wochenabschluss ───────────────────────────────────────────── */
export function istSonntag() { return now().getUTCDay() === 0; }

export function wochenAbschluss() {
  const woche = Math.floor(S.minutes / (7 * 1440));
  if (S.woche?.nr === woche) return null;      // schon abgerechnet

  const seit = S.woche?.stand || { money: 50000, tours: 0, km: 0, rev: 0 };
  const bericht = {
    nr: woche,
    tag: day(),
    monat: saison().name,
    gewinn: S.money + (S.ruecklage || 0) - seit.money,
    touren: S.stats.tours - seit.tours,
    km: S.stats.km - seit.km,
    erloes: S.stats.revenue - seit.rev,
    fahrer: besterFahrer(),
    kunde: topKunden(1)[0] || null,
    flotte: S.trucks.length,
    ansehen: S.rep,
  };

  S.woche = {
    nr: woche,
    stand: {
      money: S.money + (S.ruecklage || 0),
      tours: S.stats.tours,
      km: S.stats.km,
      rev: S.stats.revenue,
    },
    bericht,
  };

  pruefeRekord('wocheGeld', bericht.gewinn);
  log(`📅 Wochenabschluss: ${bericht.touren} Zustellungen, ${num(bericht.km)} km, `
    + `${fmt(bericht.gewinn)} Ergebnis.`);

  return bericht;
}

function besterFahrer() {
  let best = null;
  for (const t of S.trucks) {
    if (!best || (driverOf(t).km || 0) > (best.km || 0)) {
      best = { name: driverOf(t).name, km: driverOf(t).km || 0,
               tours: driverOf(t).tours, level: driverOf(t).level };
    }
  }
  return best;
}

export const letzterBericht = () => S.woche?.bericht || null;
