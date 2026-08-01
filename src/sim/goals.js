/* Sparziele.

   Große Anschaffungen, auf die man wochenlang hinarbeitet. Man legt
   Geld beiseite, der Balken füllt sich — und der Balken ist der
   eigentliche Antrieb, nicht das Ziel selbst.

   Zurückgelegtes Geld ist nicht weg: es lässt sich jederzeit wieder
   aus der Rücklage nehmen. */

import { S, log, book } from '../state.js';
import { fmt, esc } from '../util.js';
import { toast } from '../ui/toast.js';

export const ZIELE = {
  halle: {
    key: 'halle', name: 'Eigene Halle', icon: '🏭', preis: 60000,
    text: 'Ein trockener Platz für die Fahrzeuge und eine eigene Rampe.',
    wirkung: 'Fixkosten je Fahrzeug sinken um 8 %.',
    stufe: 3,
  },
  werkstatt: {
    key: 'werkstatt', name: 'Eigene Werkstatt', icon: '🔧', preis: 95000,
    text: 'Ein Meister und zwei Hebebühnen im Hof.',
    wirkung: 'Werkstattzeiten halbieren sich, Rechnungen sinken um 40 %.',
    stufe: 4,
  },
  tankstelle: {
    key: 'tankstelle', name: 'Betriebstankstelle', icon: '⛽', preis: 45000,
    text: 'Diesel im Großeinkauf, direkt auf dem Hof.',
    wirkung: 'Dieselkosten sinken um 12 %.',
    stufe: 3,
  },
  buero: {
    key: 'buero', name: 'Disposition mit Personal', icon: '🏢', preis: 75000,
    text: 'Zwei Disponenten, die selbst Fracht einwerben.',
    wirkung: 'Mehr Anfragen, bessere Sätze am Spotmarkt.',
    stufe: 4,
  },
  depot2: {
    key: 'depot2', name: 'Zweites Depot', icon: '📍', preis: 180000,
    text: 'Ein zweiter Standort, von dem aus gefahren wird.',
    wirkung: 'Vorgemerkt für eine spätere Fassung.',
    stufe: 5,
  },
};

export const zielDaten = key => ZIELE[key];
export const offeneZiele = () => Object.values(ZIELE).filter(z => !S.gebaut?.includes(z.key));
export const gebaut = key => !!S.gebaut?.includes(key);

/* ── Rücklage ── */
export function zurueckLegen(betrag) {
  const b = Math.min(Math.round(betrag), S.money);
  if (b <= 0) return 0;
  book('Rücklage', 'auf die Seite gelegt', -b);
  S.ruecklage = (S.ruecklage || 0) + b;
  return b;
}

export function entnehmen(betrag) {
  const b = Math.min(Math.round(betrag), S.ruecklage || 0);
  if (b <= 0) return 0;
  S.ruecklage -= b;
  book('Rücklage', 'aus der Rücklage entnommen', b);
  return b;
}

/* Anteil am gewählten Ziel */
export function fortschritt() {
  if (!S.sparziel) return null;
  const ziel = ZIELE[S.sparziel];
  if (!ziel) return null;
  const da = S.ruecklage || 0;
  return {
    ziel,
    da,
    fehlt: Math.max(0, ziel.preis - da),
    anteil: Math.min(100, da / ziel.preis * 100),
    fertig: da >= ziel.preis,
  };
}

export function setzeZiel(key) {
  if (!ZIELE[key]) return false;
  S.sparziel = key;
  log(`🎯 Neues Sparziel: ${ZIELE[key].name} für ${fmt(ZIELE[key].preis)}.`);
  return true;
}

export function bauen() {
  const f = fortschritt();
  if (!f || !f.fertig) return false;

  S.ruecklage -= f.ziel.preis;
  S.gebaut = [...(S.gebaut || []), f.ziel.key];
  S.sparziel = null;

  log(`🏗️ ${f.ziel.name} fertiggestellt. ${f.ziel.wirkung}`);
  toast(f.ziel.icon, `<strong>${esc(f.ziel.name)}</strong> ist fertig.`,
                     `<span class="ok">${esc(f.ziel.wirkung)}</span>`);
  return true;
}

/* ── Wirkung des Gebauten ── */
export const fixRabatt    = () => (gebaut('halle') ? 0.92 : 1);
export const dieselRabatt = () => (gebaut('tankstelle') ? 0.88 : 1);
export const werkstattRabatt = () => (gebaut('werkstatt') ? 0.60 : 1);
export const werkstattZeit   = () => (gebaut('werkstatt') ? 0.5 : 1);
export const mehrAnfragen    = () => (gebaut('buero') ? 1.35 : 1);
export const besserePreise   = () => (gebaut('buero') ? 1.05 : 1);
