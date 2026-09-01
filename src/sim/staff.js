/* Personal.

   Fahrer sind eigenständige Personen, nicht Zubehör eines Fahrzeugs.
   Sie werden eingestellt, einem Fahrzeug zugeteilt, bewertet und
   gegebenenfalls entlassen.

   Der Lohn läuft täglich, unabhängig davon, ob gefahren wird — das ist
   der Grund, warum sich untätiges Personal nicht trägt. */

import { DRIVER_NAMES_M, DRIVER_NAMES_F, RULES } from '../config.js';
import { S, log, book } from '../state.js';
import { pick, fmt, esc } from '../util.js';
import { wuerfleTraits, TRAITS, lohnFaktor, istSchwaeche } from './persons.js';
import { toast } from '../ui/toast.js';

export const LOHN_BASIS = 95;        // Euro je Tag, Stufe 1
export const LOHN_JE_STUFE = 18;     // Aufschlag je Fahrerstufe
export const ABFINDUNG_TAGE = 14;    // Lohntage bei einer Entlassung

let laufendeNr = 0;

/* ── Anlegen ── */
export function neuerFahrer(erfahren = false) {
  /* Erst das Geschlecht würfeln, dann dazu passend den Namen — so
     zeigt das Bildnis später immer die richtige Person zum Namen. */
  const geschlecht = Math.random() < 0.5 ? 'w' : 'm';
  const pool = geschlecht === 'w' ? DRIVER_NAMES_F : DRIVER_NAMES_M;

  const vergeben = new Set((S.drivers || []).map(d => d.name));
  const frei = pool.filter(n => !vergeben.has(n));
  const name = frei.length ? pick(frei) : 'Aushilfe ' + (++laufendeNr);

  /* Wie viele Stärken und Schwächen — der Zufall entscheidet, was für
     ein Mensch da vor einem steht. */
  const wurf = Math.random();
  const staerken  = wurf < 0.15 ? 3 : wurf < 0.75 ? 2 : 1;
  const schwaechen = wurf < 0.15 ? 0 : wurf < 0.55 ? 1 : 2;

  const stufe = erfahren ? 1 + Math.floor(Math.random() * 3) : 1;

  return {
    id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name,
    geschlecht,
    xp: 0,
    level: stufe,
    points: stufe,
    tours: 0,
    km: 0,
    traits: wuerfleTraits(staerken, schwaechen),
    skills: { eco: 0, route: 0, deal: 0, care: 0, calm: 0 },

    /* Leistungsdaten, für die Auswertung */
    stats: { erloes: 0, diesel: 0, pannen: 0, verspaetungen: 0, tage: 0 },
    seit: S?.minutes ?? 0,
    truckNr: null,
  };
}

/* ── Lohn ── */
/* Ältere Spielstände kennen noch kein Geschlecht — dann wird es aus
   der Kennung abgeleitet, damit Name und Bildnis wenigstens ab jetzt
   stabil zusammenbleiben. */
export function geschlechtVon(d) {
  if (d.geschlecht === 'w' || d.geschlecht === 'm') return d.geschlecht;
  let h = 0;
  for (const c of d.id || '') h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h % 2 === 0 ? 'w' : 'm';
}

export const tagesLohn = d =>
  Math.round((LOHN_BASIS + (d.level - 1) * LOHN_JE_STUFE) * lohnFaktor(d));

export const lohnGesamt = () =>
  (S.drivers || []).reduce((s, d) => s + tagesLohn(d), 0);

/* ── Börse ── */
export function fuelleBoerse(anzahl = 6) {
  S.bewerber ||= [];
  while (S.bewerber.length < anzahl) {
    S.bewerber.push(neuerFahrer(Math.random() < 0.3));
  }
}

export function einstellen(id) {
  const i = (S.bewerber || []).findIndex(b => b.id === id);
  if (i === -1) return null;

  const [fahrer] = S.bewerber.splice(i, 1);
  fahrer.seit = S.minutes;
  S.drivers.push(fahrer);

  log(`👤 ${fahrer.name} eingestellt. Lohn ${fmt(tagesLohn(fahrer))} je Tag.`);
  toast('👤', `<strong>${esc(fahrer.name)}</strong> fängt bei euch an.`,
              `<span class="muted">Noch keinem Fahrzeug zugeteilt.</span>`);
  fuelleBoerse();
  return fahrer;
}

export function entlassen(id) {
  const i = (S.drivers || []).findIndex(d => d.id === id);
  if (i === -1) return false;

  const fahrer = S.drivers[i];
  const truck = S.trucks.find(t => t.driverId === id);
  if (truck && truck.phase !== 'idle') return false;    // nicht mitten in der Fahrt

  const abfindung = tagesLohn(fahrer) * ABFINDUNG_TAGE;
  book('Personal', `Abfindung ${fahrer.name}`, -abfindung);

  if (truck) truck.driverId = null;
  S.drivers.splice(i, 1);

  log(`👤 ${fahrer.name} entlassen. Abfindung ${fmt(abfindung)}.`);
  toast('👋', `<strong>${esc(fahrer.name)}</strong> verlässt den Betrieb.`,
              `<span class="warn">Abfindung ${fmt(abfindung)}</span>`);
  return true;
}

/* ── Zuteilung ── */
export const fahrerVon = truck => (S.drivers || []).find(d => d.id === truck?.driverId) || null;
export const fahrzeugVon = fahrer => S.trucks.find(t => t.driverId === fahrer?.id) || null;
export const freieFahrer = () => (S.drivers || []).filter(d => !S.trucks.some(t => t.driverId === d.id));
export const leereFahrzeuge = () => S.trucks.filter(t => !t.driverId);

export function zuteilen(fahrerId, truckNr) {
  const fahrer = S.drivers.find(d => d.id === fahrerId);
  const truck = S.trucks.find(t => t.nr === truckNr);
  if (!fahrer || !truck) return false;
  if (truck.phase !== 'idle') return false;

  /* Bisherige Zuteilungen lösen */
  const altesFahrzeug = fahrzeugVon(fahrer);
  if (altesFahrzeug && altesFahrzeug.phase !== 'idle') return false;
  if (altesFahrzeug) altesFahrzeug.driverId = null;

  truck.driverId = fahrer.id;
  log(`${fahrer.name} übernimmt LKW ${truck.nr}.`);
  return true;
}

export function abziehen(truckNr) {
  const truck = S.trucks.find(t => t.nr === truckNr);
  if (!truck || truck.phase !== 'idle') return false;
  truck.driverId = null;
  return true;
}

/* ── Bewertung ─────────────────────────────────────────────────────
   Eine Zahl von 0 bis 100, aus dem, was der Fahrer tatsächlich
   geleistet hat. Ohne Fahrten gibt es kein Urteil. */
export function bewertung(d) {
  const s = d.stats || {};
  if (!d.tours) return null;

  const proFahrt = s.erloes / d.tours;
  const spritAnteil = s.erloes > 0 ? s.diesel / s.erloes : 0.5;
  const pannenQuote = s.pannen / Math.max(1, d.tours);

  /* Bezugsgrößen aus dem laufenden Betrieb */
  let punkte = 50;
  punkte += Math.min(25, (proFahrt - 400) / 20);       // Erlös je Fahrt
  punkte -= Math.min(25, (spritAnteil - 0.18) * 180);  // Spritanteil
  punkte -= Math.min(20, pannenQuote * 260);           // Pannen
  punkte += Math.min(10, d.level * 2);                 // Erfahrung

  return Math.max(0, Math.min(100, Math.round(punkte)));
}

export const urteil = wert =>
  wert === null ? 'noch kein Urteil'
  : wert >= 80 ? 'ausgezeichnet'
  : wert >= 65 ? 'gut'
  : wert >= 50 ? 'brauchbar'
  : wert >= 35 ? 'schwach'
  : 'ein Fall für ein Gespräch';

/* Was am meisten ins Gewicht fällt — für die Auswertung. */
export function auffaelligkeiten(d) {
  const raus = [];
  const s = d.stats || {};

  for (const k of d.traits || []) {
    if (istSchwaeche(k)) raus.push({ art: 'schwaeche', text: TRAITS[k].name, icon: TRAITS[k].icon });
  }

  if (d.tours >= 5) {
    const anteil = s.erloes > 0 ? s.diesel / s.erloes : 0;
    if (anteil > 0.28) raus.push({ art: 'zahl', text: 'hoher Spritanteil', icon: '⛽' });
    if (s.pannen / d.tours > 0.12) raus.push({ art: 'zahl', text: 'häufige Pannen', icon: '🔧' });
    if (s.erloes / d.tours < 350) raus.push({ art: 'zahl', text: 'geringer Erlös je Fahrt', icon: '📉' });
  }

  return raus;
}
