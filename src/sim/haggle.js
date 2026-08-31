/* Preisverhandlung.

   Jede Spotanfrage hat einen Spielraum, den der Verlader nicht nennt.
   Man kann fordern, was man für angemessen hält — und erfährt erst
   danach, ob es zu viel war.

   Drei Ausgänge:

     angenommen     der Verlader zahlt, was du verlangst
     gegenangebot   er bietet weniger, du kannst annehmen oder lassen
     abgelehnt      die Anfrage ist weg, die Beziehung leidet etwas

   Verloren geht nur bei echter Übertreibung. Wer maßvoll fordert,
   riskiert nichts — das entspricht auch der Wirklichkeit: Ein
   Verlader, der einen guten Spediteur kennt, legt bei zehn Prozent
   nicht auf. */

import { S, log } from '../state.js';
import { addRep } from './market.js';
import { fmt, esc } from '../util.js';
import { fahrtenZu, stufeVon } from './customers.js';
import { toast } from '../ui/toast.js';

/* Wie weit man höchstens gehen kann, ohne alles zu verlieren. */
export const MAX_FORDERUNG = 1.45;

/* Was der Verlader klaglos zahlt — hängt davon ab, wie gut er dich
   kennt, wie es um dein Ansehen steht und wie eng der Markt gerade ist. */
export function schmerzgrenze(offer) {
  /* Der genannte Preis ist immer drin — verhandelt wird über das,
     was darüber hinausgeht. Deshalb beginnt die Grenze über 1,0. */
  let grenze = 1.10;

  /* Ein knapper Markt macht Verlader nachgiebig. */
  grenze += (S.market.index - 1) * 0.25;

  /* Ansehen: zwischen 0 und 100 bis zu vierzehn Prozent mehr. */
  grenze += (S.rep / 100) * 0.14;

  /* Stammkundschaft zahlt lieber mehr, als den Spediteur zu wechseln. */
  const beziehung = stufeVon(fahrtenZu(offer.firm.name));
  grenze += (beziehung.rate - 1) * 0.6;

  /* Umschlagpunkte sind terminlich gebunden und zahlen eher. */
  if (offer.firm.hub) grenze += 0.05;

  /* Ein fester Zufallsanteil je Anfrage — sonst wäre es Rechnen statt
     Verhandeln. Aus der Kennung abgeleitet, damit derselbe Auftrag
     nicht bei jedem Blick anders reagiert. */
  grenze += streuung(offer.id) * 0.10;

  /* Unter dem genannten Preis wird nie verhandelt: Wer den Listenpreis
     fordert, bekommt ihn auch. */
  return Math.max(1.02, grenze);
}

/* Gleichverteilter Wert zwischen −1 und 1, fest je Kennung.

   Die schlichte Multiplikation mit 31 verteilt ähnliche Kennungen zu
   dicht — bei fortlaufenden Nummern landete alles im selben Bereich.
   Deshalb eine ordentliche Durchmischung mit Verschiebungen. */
function streuung(id = '') {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;

  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/* Oberhalb der Schmerzgrenze folgt zunächst ein Gegenangebot, erst
   darüber die Absage. */
const TOLERANZ = 0.13;

/* Wie ein Verlader auf eine Forderung reagiert.
   faktor ist das Vielfache des ursprünglichen Preises. */
export function reaktion(offer, faktor) {
  const grenze = schmerzgrenze(offer);

  if (faktor <= grenze) {
    return { art: 'angenommen', fee: Math.round(offer.grundpreis * faktor / 10) * 10 };
  }

  if (faktor <= grenze + TOLERANZ) {
    /* Der Verlader trifft sich auf halbem Weg zwischen seinem
       Höchstpreis und der Forderung. */
    const mitte = grenze + (faktor - grenze) * 0.35;
    return {
      art: 'gegenangebot',
      fee: Math.round(offer.grundpreis * mitte / 10) * 10,
      gefordert: Math.round(offer.grundpreis * faktor / 10) * 10,
    };
  }

  return { art: 'abgelehnt' };
}

/* Eine Einschätzung vor der Forderung — bewusst ungenau, sonst wäre
   die Verhandlung entschieden, bevor sie beginnt. */
export function aussicht(offer, faktor) {
  const grenze = schmerzgrenze(offer);
  const abstand = faktor - grenze;

  if (abstand <= -0.08) return { stufe: 'sicher',   text: 'geht bestimmt durch' };
  if (abstand <= 0)     return { stufe: 'gut',      text: 'dürfte durchgehen' };
  if (abstand <= 0.06)  return { stufe: 'knapp',    text: 'knapp — vielleicht ein Gegenangebot' };
  if (abstand <= TOLERANZ) return { stufe: 'riskant', text: 'ziemlich hoch gegriffen' };
  return { stufe: 'zuviel', text: 'so viel zahlt hier niemand' };
}

/* Die Verhandlung durchführen. Ändert das Angebot oder entfernt es. */
export function verhandle(offerId, faktor) {
  const offer = S.offers.find(o => o.id === offerId);
  if (!offer || offer.kind !== 'spot' || offer.verhandelt) return null;

  offer.grundpreis ??= offer.fee;
  const ergebnis = reaktion(offer, faktor);
  offer.verhandelt = true;

  if (ergebnis.art === 'angenommen') {
    offer.fee = ergebnis.fee;
    log(`💬 ${offer.firm.name} zahlt ${fmt(offer.fee)} statt ${fmt(offer.grundpreis)}.`);
    if (!S.silent) {
      toast('🤝', `<strong>${esc(offer.firm.name)}</strong> geht mit.`,
                  `<span class="ok">${fmt(offer.fee)} statt ${fmt(offer.grundpreis)}</span>`);
    }
    return ergebnis;
  }

  if (ergebnis.art === 'gegenangebot') {
    offer.fee = ergebnis.fee;
    log(`💬 ${offer.firm.name} bietet ${fmt(ergebnis.fee)} statt der geforderten `
      + `${fmt(ergebnis.gefordert)}.`);
    if (!S.silent) {
      toast('💬', `<strong>${esc(offer.firm.name)}</strong> hält dagegen.`,
                  `<span class="warn">${fmt(ergebnis.fee)} statt ${fmt(ergebnis.gefordert)}</span>`);
    }
    return ergebnis;
  }

  /* Abgelehnt: Die Anfrage ist weg, und der Verlader merkt es sich.
     Der Schaden bleibt klein — es soll ärgern, nicht bestrafen. */
  S.offers = S.offers.filter(o => o.id !== offerId);
  addRep(-0.4);

  S.kunden ||= {};
  const eintrag = S.kunden[offer.firm.name];
  if (eintrag && eintrag.fahrten > 0) eintrag.fahrten -= 1;

  log(`💬 ${offer.firm.name} lehnt ab und vergibt die Fracht anderweitig.`);
  if (!S.silent) {
    toast('❌', `<strong>${esc(offer.firm.name)}</strong> winkt ab.`,
                '<span class="bad">Die Fracht geht an jemand anderen.</span>');
  }
  return ergebnis;
}
