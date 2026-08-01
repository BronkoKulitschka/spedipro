/* Betriebsentwicklung.

   Die Stufe ergibt sich aus dem, was der Betrieb geleistet hat. Sie kann
   nur steigen. Freischaltungen sind dauerhaft, es gibt keinen Rückfall
   und keine Frist. */

import { LEVELS, REQ_LABEL } from '../config.js';
import { S, log } from '../state.js';
import { esc } from '../util.js';
import { toast } from '../ui/toast.js';

export const levelData = nr => LEVELS.find(l => l.nr === nr) || LEVELS[0];
export const current   = () => levelData(S.level);
export const next      = () => LEVELS.find(l => l.nr === S.level + 1) || null;

/* Aktueller Stand für eine Anforderung */
export function valueOf(key) {
  switch (key) {
    case 'tours':     return S.stats.tours;
    case 'km':        return S.stats.km;
    case 'rep':       return S.rep;
    case 'trucks':    return S.trucks.length;
    case 'contracts': return S.stats.contractsDone || 0;
    default:          return 0;
  }
}

/* Fortschritt zur nächsten Stufe, als Liste einzelner Anforderungen */
export function progress() {
  const ziel = next();
  if (!ziel) return null;

  const punkte = Object.entries(ziel.req).map(([key, soll]) => {
    const ist = valueOf(key);
    return {
      key, soll, ist,
      label: REQ_LABEL[key]?.text || key,
      einheit: REQ_LABEL[key]?.einheit || '',
      erfüllt: ist >= soll,
      anteil: Math.min(100, ist / soll * 100),
    };
  });

  return {
    level: ziel,
    punkte,
    offen: punkte.filter(p => !p.erfüllt).length,
    gesamt: punkte.length ? punkte.reduce((s, p) => s + p.anteil, 0) / punkte.length : 100,
  };
}

/* ── Freischaltungen ── */
export const frei = () => current().frei;
export const modelFrei    = key => frei().modelle.includes(key);
export const automatikFrei = () => !!frei().automatik;
export const maxVertraege  = () => frei().vertraege;

/* Ab welcher Stufe etwas verfügbar wird — für Hinweise in der Anzeige */
export function stufeFuerModell(key) {
  const l = LEVELS.find(l => l.frei.modelle.includes(key));
  return l ? l.nr : null;
}
export const stufeFuerAutomatik = () => LEVELS.find(l => l.frei.automatik)?.nr ?? null;

/* Was für die nächste Stufe noch offen ist, als kurzer Satz.
   Wird dort gebraucht, wo etwas wegen der Stufe gesperrt ist. */
export function nochOffen() {
  const p = progress();
  if (!p) return '';

  const offen = p.punkte.filter(x => !x.erfüllt);
  if (!offen.length) return 'Alle Anforderungen erfüllt.';

  const teile = offen.slice(0, 3).map(x => {
    const fehlt = Math.ceil(x.soll - x.ist);
    if (x.key === 'km') return `${fehlt.toLocaleString('de-DE')} km`;
    const wort = fehlt === 1 ? (REQ_LABEL[x.key]?.eins || x.label) : x.label;
    return `${fehlt} ${wort}`;
  });

  return teile.join(', ') + (teile.length > 1 || offen[0].soll - offen[0].ist > 1 ? ' fehlen' : ' fehlt');
}

/* ── Aufstieg ── */
export function checkLevelUp() {
  const ziel = next();
  if (!ziel) return false;

  const erfüllt = Object.entries(ziel.req).every(([key, soll]) => valueOf(key) >= soll);
  if (!erfüllt) return false;

  S.level = ziel.nr;
  log(`🏆 Aufstieg zur Stufe ${ziel.nr}: ${ziel.name}. Neu: ${ziel.text}`);

  if (!S.silent) {
    toast('🏆', `Der Betrieb ist jetzt <strong>${esc(ziel.name)}</strong>.`,
                `<span class="ok">${esc(ziel.text)}</span>`);
  }

  /* Mehrere Stufen auf einmal sind möglich, wenn lange nicht geschaut wurde */
  checkLevelUp();
  return true;
}
