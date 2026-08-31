/* Preisverhandlung.

   Jede Spotanfrage kommt mit einem Vorschlag des Verladers. Wer mehr
   will, verhandelt: Der Schieberegler wählt die Forderung, der Verlader
   antwortet.

   Wovon seine Bereitschaft abhängt:

     Ansehen         wer einen Namen hat, bekommt mehr
     Marktlage       bei knappem Laderaum sitzt der Spediteur am Hebel
     Kundschaft      Stammkunden zahlen lieber als neu zu suchen
     Güterart        Gefahrgut und Kühlgut haben wenig Alternativen
     Entfernung      lange Läufe sind schwerer zu vergeben
     Dringlichkeit   je Anfrage ausgewürfelt, sichtbar als Hinweis

   Übertreiben kostet: Über der Schmerzgrenze ist die Anfrage weg und
   der Kunde nachtragend. Darunter passiert höchstens nichts. */

import { S, log } from '../state.js';
import { GOODS } from '../config.js';
import { fahrtenZu, stufeVon } from './customers.js';

/* Wie weit sich der Preis überhaupt schieben lässt */
export const MAX_AUFSCHLAG = 0.60;      // 60 % über dem Vorschlag

/* Dringlichkeit: wird einmal je Anfrage bestimmt und bleibt. */
export const DRINGLICHKEIT = {
  normal: { name: 'planbar',     icon: '📋', toleranz: 0.00,
            text: 'Kein Zeitdruck. Der Verlader kann sich umsehen.' },
  eilig:  { name: 'eilig',       icon: '⏱️', toleranz: 0.12,
            text: 'Soll bald weg. Das schwächt seine Verhandlungsposition.' },
  sofort: { name: 'dringend',    icon: '🔥', toleranz: 0.22,
            text: 'Muss sofort raus. Da zählt der Preis wenig.' },
};

export function wuerfleDringlichkeit() {
  const w = Math.random();
  return w < 0.62 ? 'normal' : w < 0.88 ? 'eilig' : 'sofort';
}

/* ── Schmerzgrenze ─────────────────────────────────────────────────
   Bis zu welchem Aufschlag der Verlader mitgeht, bevor er abspringt.
   Das Ergebnis ist ein Anteil: 0.25 heißt „bis 25 % über Vorschlag". */
export function schmerzgrenze(offer) {
  let grenze = 0.10;                      // ein wenig geht immer

  /* Ansehen: 50 ist neutral, 100 bringt gut zwölf Punkte dazu */
  grenze += (S.rep - 50) / 100 * 0.25;

  /* Marktlage: bei knappem Laderaum zahlt man, was verlangt wird */
  grenze += (S.market.index - 1) * 0.35;

  /* Stammkundschaft */
  const stufe = stufeVon(fahrtenZu(offer.firm?.name));
  grenze += (stufe.rate - 1) * 0.8;

  /* Güter mit wenig Alternativen */
  const g = GOODS[offer.klasse];
  if (g?.braucht) grenze += 0.14;
  if (g?.preis >= 1.15) grenze += 0.05;

  /* Lange Läufe sind schwerer zu vergeben */
  const km = offer.estKm || 0;
  if (km > 500) grenze += 0.10;
  else if (km > 250) grenze += 0.05;

  /* Dringlichkeit */
  grenze += DRINGLICHKEIT[offer.eile || 'normal'].toleranz;

  return Math.max(0.03, Math.min(MAX_AUFSCHLAG, grenze));
}

/* Wie der Verlader eine Forderung aufnimmt.
   anteil ist der Aufschlag über dem Vorschlag, also 0 bis MAX_AUFSCHLAG. */
export function einschaetzung(offer, anteil) {
  const grenze = schmerzgrenze(offer);

  if (anteil <= grenze * 0.55) {
    return { stufe: 'sicher', text: 'Das geht durch.', farbe: 'ok' };
  }
  if (anteil <= grenze) {
    return { stufe: 'knapp', text: 'Er wird schlucken, aber ungern.', farbe: 'ok' };
  }
  if (anteil <= grenze + 0.10) {
    return { stufe: 'riskant', text: 'Kann schiefgehen.', farbe: 'warn' };
  }
  return {
    stufe: 'zuviel',
    text: 'So verliert man den Auftrag.',
    farbe: 'bad',
  };
}

/* Die Verhandlung führen.

   Unterhalb der Grenze wird angenommen. Darüber entscheidet der Zufall,
   und zwar mit steigender Wahrscheinlichkeit gegen dich. Erst deutlich
   über der Grenze ist die Anfrage sicher verloren. */
export function verhandle(offer, anteil) {
  const grenze = schmerzgrenze(offer);
  const neuerPreis = Math.round(offer.grundpreis * (1 + anteil) / 10) * 10;

  if (anteil <= grenze) {
    return { ok: true, preis: neuerPreis, text: 'Der Verlader ist einverstanden.' };
  }

  const drueber = anteil - grenze;

  /* Bis zehn Punkte darüber: es kann klappen. */
  if (drueber <= 0.10 && Math.random() > drueber / 0.10) {
    return {
      ok: true, preis: neuerPreis,
      text: 'Nach kurzem Zögern nimmt er an.',
    };
  }

  /* Abgelehnt. Bei mäßiger Übertreibung bleibt die Anfrage bestehen —
     zum ursprünglichen Preis. Wer es zu weit treibt, verliert sie. */
  const verloren = drueber > 0.18;

  if (verloren) {
    log(`💬 ${offer.firm.name} bricht die Verhandlung ab — die Forderung war zu hoch.`);
    S.verstimmt ||= {};
    S.verstimmt[offer.firm.name] = (S.verstimmt[offer.firm.name] || 0) + 1;
  }

  return {
    ok: false,
    verloren,
    preis: offer.grundpreis,
    text: verloren
      ? 'Der Verlader vergibt die Fracht anderweitig.'
      : 'Er lehnt ab, bleibt aber beim ursprünglichen Preis.',
  };
}

/* Verstimmte Kunden zahlen eine Weile schlechter. Das verwächst sich. */
export function verstimmung(name) {
  const zahl = S.verstimmt?.[name] || 0;
  return zahl ? Math.max(0.88, 1 - zahl * 0.04) : 1;
}

export function beruhige() {
  if (!S.verstimmt) return;
  for (const name of Object.keys(S.verstimmt)) {
    S.verstimmt[name] -= 1;
    if (S.verstimmt[name] <= 0) delete S.verstimmt[name];
  }
}
