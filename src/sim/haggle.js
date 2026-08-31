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
import { grenzenBonus, verstimmen, beruhigen, charakterVon,
         stimmung, zustandVon } from './clients.js';
import { GOODS, REP } from '../config.js';
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

  /* Charakter, Tagesform und Groll des Auftraggebers. Der kleinliche
     Verlader mit schlechtem Tag lässt kaum etwas zu, der großzügige im
     Hochbetrieb erstaunlich viel. */
  grenze += grenzenBonus(offer.firm.name);

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
   darüber der Abbruch. */
const TOLERANZ = 0.13;

/* ── Das Gespräch ───────────────────────────────────────────────
   Ein Verhandlungsgespräch läuft über höchstens drei Runden. In jeder
   Runde kann der Disponent fordern oder ein Argument einbringen.
   Argumente heben die Schmerzgrenze ein wenig — sie sind der Grund,
   warum sich Verhandeln lohnt, statt gleich das Höchste zu fordern. */

export const MAX_RUNDEN = 3;

export const ARGUMENTE = {
  sofort: {
    key: 'sofort',
    text: 'Wir können noch heute laden.',
    antwort: 'Das wäre in der Tat eine Hilfe.',
    wirkung: 0.05,
    moeglich: () => true,
  },
  quote: {
    key: 'quote',
    text: 'Unsere Zustellquote spricht für sich.',
    antwort: 'Ihr Ruf ist mir bekannt, das stimmt.',
    wirkung: 0.06,
    moeglich: () => S.rep >= 60,
    fehlt: 'braucht Ansehen 60',
  },
  stamm: {
    key: 'stamm',
    text: 'Wir fahren seit Längerem für Sie.',
    antwort: 'Und das durchaus zu unserer Zufriedenheit.',
    wirkung: 0.07,
    moeglich: offer => fahrtenZu(offer.firm.name) >= 3,
    fehlt: 'braucht drei Fahrten für diesen Kunden',
  },
  knapp: {
    key: 'knapp',
    text: 'Laderaum ist zurzeit knapp.',
    antwort: 'Das höre ich dieser Tage öfter.',
    wirkung: 0.05,
    moeglich: () => S.market.index >= 1.08,
    fehlt: 'braucht einen angespannten Markt',
  },
  ausstattung: {
    key: 'ausstattung',
    text: 'Für diese Ware haben wir das passende Fahrzeug.',
    antwort: 'Nicht selbstverständlich, zugegeben.',
    wirkung: 0.06,
    moeglich: offer => !!(GOODS[offer.klasse]?.braucht),
    fehlt: 'nur bei Kühlgut oder Gefahrgut',
  },
};

/* Ein neues Gespräch beginnen. */
export function beginne(offerId) {
  const offer = S.offers.find(o => o.id === offerId);
  if (!offer || offer.kind !== 'spot' || offer.verhandelt) return null;

  offer.grundpreis ??= offer.fee;

  return {
    offerId,
    runde: 1,
    fee: offer.grundpreis,
    grenze: schmerzgrenze(offer),
    genutzt: [],                 // schon vorgebrachte Argumente
    verlauf: [{
      wer: 'kunde',
      text: `Wir hätten da eine Sendung. ${fmt(offer.grundpreis)} sind dafür vorgesehen.`,
    }],
    offen: true,
    ergebnis: null,
  };
}

/* Welche Argumente jetzt noch zur Verfügung stehen. */
export function offeneArgumente(gespraech) {
  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (!offer) return [];

  return Object.values(ARGUMENTE).map(a => ({
    ...a,
    genutzt: gespraech.genutzt.includes(a.key),
    verfuegbar: a.moeglich(offer),
  }));
}

/* Ein Argument vorbringen. Kostet keine Runde, aber jedes nur einmal. */
export function argumentieren(gespraech, key) {
  const arg = ARGUMENTE[key];
  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (!arg || !offer || gespraech.genutzt.includes(key)) return gespraech;
  if (!arg.moeglich(offer)) return gespraech;

  gespraech.genutzt.push(key);
  gespraech.grenze += arg.wirkung;

  gespraech.verlauf.push({ wer: 'ich', text: arg.text });
  gespraech.verlauf.push({ wer: 'kunde', text: arg.antwort });

  return gespraech;
}

/* Die Stufen, in denen gefordert werden kann. */
export const STUFEN = [
  { key: 'wenig',  faktor: 1.05, text: 'Fünf Prozent mehr wären angemessen.' },
  { key: 'mittel', faktor: 1.12, text: 'Unter zwölf Prozent mehr rechnet sich das nicht.' },
  { key: 'viel',   faktor: 1.22, text: 'Für diese Relation brauchen wir zweiundzwanzig Prozent mehr.' },
  { key: 'kuehn',  faktor: 1.35, text: 'Fünfunddreißig Prozent — anders geht es nicht.' },
];

/* Eine Forderung stellen. Verbraucht eine Runde. */
export function fordern(gespraech, stufenKey) {
  const stufe = STUFEN.find(s => s.key === stufenKey);
  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (!stufe || !offer || !gespraech.offen) return gespraech;

  const verlangt = offer.grundpreis * stufe.faktor;
  gespraech.verlauf.push({ wer: 'ich', text: stufe.text });

  /* Innerhalb der Schmerzgrenze: angenommen. */
  if (stufe.faktor <= gespraech.grenze) {
    gespraech.fee = Math.round(verlangt / 10) * 10;
    gespraech.verlauf.push({
      wer: 'kunde',
      text: `Einverstanden. ${fmt(gespraech.fee)}, dann machen wir das so.`,
    });
    schliesse(gespraech, 'angenommen');
    return gespraech;
  }

  /* Knapp darüber: ein Gegenangebot. */
  if (stufe.faktor <= gespraech.grenze + TOLERANZ) {
    const mitte = gespraech.grenze + (stufe.faktor - gespraech.grenze) * 0.35;
    gespraech.fee = Math.round(offer.grundpreis * mitte / 10) * 10;
    gespraech.verlauf.push({
      wer: 'kunde',
      text: `So weit kann ich nicht gehen. ${fmt(gespraech.fee)} wären möglich.`,
    });

    gespraech.runde++;
    if (gespraech.runde > MAX_RUNDEN) {
      gespraech.verlauf.push({
        wer: 'kunde',
        text: 'Mehr kann ich nicht tun. Nehmen Sie es oder lassen Sie es.',
      });
      schliesse(gespraech, 'gegenangebot');
    }
    return gespraech;
  }

  /* Deutlich darüber: der Verlader bricht ab. */
  gespraech.verlauf.push({
    wer: 'kunde',
    text: 'Das ist außerhalb jeder Verhältnismäßigkeit. Wir vergeben die '
        + 'Fracht anderweitig.',
  });
  schliesse(gespraech, 'abgebrochen');
  return gespraech;
}

/* Das aktuelle Angebot annehmen. */
export function annehmen(gespraech) {
  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (!offer) return gespraech;

  offer.fee = gespraech.fee;
  offer.verhandelt = true;

  if (gespraech.fee > offer.grundpreis) {
    log(`💬 ${offer.firm.name} zahlt ${fmt(offer.fee)} statt ${fmt(offer.grundpreis)}.`);
  }

  /* Ein Geschäft, das zustande kommt, glättet die Wogen. */
  beruhigen(offer.firm.name, 2);
  gespraech.offen = false;
  gespraech.ergebnis = 'angenommen';
  return gespraech;
}

/* Das Gespräch ohne Ergebnis verlassen — die Anfrage bleibt, aber
   verhandeln lässt sie sich nicht noch einmal. */
export function verlassen(gespraech) {
  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (offer) {
    offer.fee = gespraech.fee;
    offer.verhandelt = true;
  }
  gespraech.offen = false;
  gespraech.ergebnis = gespraech.ergebnis || 'beendet';
  return gespraech;
}

function schliesse(gespraech, ergebnis) {
  gespraech.offen = false;
  gespraech.ergebnis = ergebnis;

  const offer = S.offers.find(o => o.id === gespraech.offerId);
  if (!offer) return;

  if (ergebnis === 'abgebrochen') {
    /* Die Fracht ist weg — und der Verlader merkt es sich. Wie sehr,
       hängt von seinem Charakter ab: Der Kleinliche nimmt es persönlich,
       der Großzügige zuckt mit den Schultern. Beim dritten Mal ist
       Schluss. */
    S.offers = S.offers.filter(o => o.id !== gespraech.offerId);
    addRep(REP.HAGGLE_BREAK);

    const folge = verstimmen(offer.firm.name);

    const eintrag = S.kunden[offer.firm.name];
    if (eintrag && eintrag.fahrten > 0) eintrag.fahrten -= 1;

    log(`💬 ${offer.firm.name} bricht die Verhandlung ab.`);

    if (!S.silent && folge !== 'gesperrt') {
      toast('❌', `<strong>${esc(offer.firm.name)}</strong> winkt ab.`,
        folge === 'verstimmt'
          ? '<span class="bad">Die Stimmung ist merklich abgekühlt.</span>'
          : '<span class="bad">Die Fracht geht an jemand anderen.</span>');
    }
    return;
  }

  /* Angenommen oder letztes Gegenangebot: der Preis steht, der
     Disponent muss ihn noch bestätigen. */
  offer.fee = gespraech.fee;
}

/* Eine Einschätzung vor der Forderung — bewusst ungenau. */
export function aussicht(gespraech, faktor) {
  const abstand = faktor - gespraech.grenze;

  if (abstand <= -0.08) return { stufe: 'sicher',  text: 'geht bestimmt durch' };
  if (abstand <= 0)     return { stufe: 'gut',     text: 'dürfte durchgehen' };
  if (abstand <= 0.06)  return { stufe: 'knapp',   text: 'knapp' };
  if (abstand <= TOLERANZ) return { stufe: 'riskant', text: 'hoch gegriffen' };
  return { stufe: 'zuviel', text: 'zu viel' };
}
