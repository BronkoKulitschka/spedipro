/* Rahmenverträge.

   Ein Verlader schreibt eine Relation über mehrere Wochen aus: feste
   Sendungszahl, fester Preis je Sendung, Abschlussprämie. Der Preis liegt
   unter dem Spotmarkt, dafür ist er planbar und ein Dieselfloater fängt
   Preissprünge teilweise auf.

   Wird ein Vertrag nicht erfüllt, passiert nichts Schlimmes — es gibt
   lediglich weniger oder keine Prämie. */

import { melde } from '../ui/notify.js';
import { CONTRACTS, RULES, REP } from '../config.js';
import { S, log, book, day } from '../state.js';
import { klasseFuer, ladung, flottenGrenze } from './goods.js';
import { pick, fmt, esc, haversine } from '../util.js';
import { repMul, addRep } from './market.js';
import { maxVertraege, checkLevelUp } from './progress.js';
import { toast } from '../ui/toast.js';

const id = () => Math.random().toString(36).slice(2, 8);

/* Grundpreis einer Sendung zu diesem Betrieb, wie im Spotmarkt gerechnet. */
export function baseFee(firm) {
  const km = firm.km * 1.28;
  return RULES.BASE_FEE + km * RULES.RATE_PER_KM * 2;
}

export function makeContractOffer() {
  if (!S.firms.length) return null;

  const firm = pick(S.firms);
  const weeks = pick(CONTRACTS.WEEKS);
  const perWeek = pick(CONTRACTS.PER_WEEK);
  const total = weeks * perWeek;

  /* Ein Rahmenvertrag läuft immer über dieselbe Ware in gleichbleibender
     Menge — der Verlader weiß ja, was er regelmäßig zu verschicken hat.
     Damit steht auch fest, welches Fahrzeug man dafür braucht.

     Drei von vier Ausschreibungen sind auf den eigenen Fuhrpark
     zugeschnitten. Die vierte darf größer sein — sie ist dann ein Grund,
     über ein weiteres Fahrzeug nachzudenken. */
  const flotte = flottenGrenze(S.trucks);
  const grenze = Math.random() < 0.75 ? flotte : null;

  const klasse = klasseFuer(firm, grenze ? grenze.kg : Infinity);
  const l = ladung(klasse, grenze);

  /* Gute Verlader zahlen mit steigendem Ansehen etwas besser. */
  const mengenFaktor = 0.72 + 0.38 * Math.min(1, l.paletten / 33);
  const perLoad = Math.round(
    baseFee(firm) * CONTRACTS.RATE * repMul() * klasse.preis * mengenFaktor / 10) * 10;

  /* Eine Relation hat zwei Enden: Beim Verlader wird geladen, beim
     Empfänger entladen. Ohne diese Unterscheidung stünde das Fahrzeug
     nach der ersten Fahrt am Ziel und könnte dort ohne einen einzigen
     Kilometer weitere Sendungen abliefern. */
  const empfaenger = suchEmpfaenger(firm);

  return {
    id: id(), firm, weeks, perWeek, total,
    empfaenger,
    perLoad,
    klasse: l.klasse,
    paletten: l.paletten,
    gewicht: l.gewicht,
    bonus: Math.round(perLoad * total * CONTRACTS.BONUS / 100) * 100,
    signIndex: S.market.index,
  };
}

export function refillContractOffers() {
  while (S.contractOffers.length < CONTRACTS.OFFERS) {
    const offer = makeContractOffer();
    if (!offer) break;
    if (S.contractOffers.some(o => o.firm.name === offer.firm.name)) break;
    S.contractOffers.push(offer);
  }
}

export const vertraegeFrei = () => maxVertraege() - S.contracts.length;

export function signContract(offerId) {
  if (vertraegeFrei() <= 0) return false;

  const i = S.contractOffers.findIndex(o => o.id === offerId);
  if (i === -1) return false;

  const [offer] = S.contractOffers.splice(i, 1);
  const contract = {
    ...offer,
    done: 0,
    startDay: day(),
    endMinutes: S.minutes + offer.weeks * 7 * 1440,
  };
  S.contracts.push(contract);

  log(`📜 Rahmenvertrag mit ${contract.firm.name}: ${contract.total} Sendungen in ${contract.weeks} Wochen.`);
  toast('📜', `Vertrag mit <strong>${esc(contract.firm.name)}</strong> unterschrieben.`,
              `<span class="muted">${contract.total} Sendungen · ${fmt(contract.perLoad)} je Fahrt</span>`);
  refillContractOffers();
  return true;
}

/* Der Dieselfloater: steigt der Markt, steigt der Vertragspreis anteilig mit. */
export function currentRate(contract) {
  const drift = (S.market.index - contract.signIndex) * CONTRACTS.FLOATER;
  return Math.round(contract.perLoad * (1 + drift));
}

export const findContract = cid => S.contracts.find(c => c.id === cid);

/* Ein Empfänger in vernünftiger Entfernung zum Verlader.

   Zu nah wäre keine Fracht, zu weit sprengte den Rahmen. Umschlagpunkte
   sind bevorzugte Ziele — dorthin laufen die meisten Relationen. */
function suchEmpfaenger(verlader) {
  const kandidaten = [...(S.firms || []), ...(S.hubs || [])]
    .filter(z => z.name !== verlader.name)
    .map(z => ({ z, km: haversine(verlader, z) }))
    .filter(e => e.km > 25 && e.km < 450);

  if (!kandidaten.length) {
    /* Notfalls das Depot — immerhin ein anderer Ort. */
    return { name: S.depot.name, lat: S.depot.lat, lon: S.depot.lon,
             km: haversine(verlader, S.depot), kind: 'Lager' };
  }

  /* Umschlagpunkte zählen doppelt. */
  const topf = [];
  for (const e of kandidaten) {
    topf.push(e.z);
    if (e.z.art) topf.push(e.z);
  }
  return pick(topf);
}

export function registerDelivery(cid) {
  const c = findContract(cid);
  if (!c) return;
  c.done++;
}

/* Läuft täglich: abgelaufene Verträge abrechnen. */
export function settleContracts() {
  for (const c of [...S.contracts]) {
    if (S.minutes < c.endMinutes) continue;

    const quote = c.done / c.total;
    let prämie = 0;

    if (quote >= 1) {
      prämie = c.bonus;
      addRep(REP.PER_CONTRACT);
      S.stats.contractsDone = (S.stats.contractsDone || 0) + 1;
      checkLevelUp();
    } else if (quote >= CONTRACTS.PART_OK) {
      /* Teilweise erfüllt: halbe Prämie, aber der Verlader hat
         umdisponieren müssen — das spricht sich herum. */
      prämie = Math.round(c.bonus / 2);
      addRep(REP.PER_PARTIAL + REP.CONTRACT_WEAK);
    } else {
      /* Unter der Mindestquote: keine Strafe in Geld, aber der Ruf
         leidet. Wer zusagt und nicht liefert, wird beim nächsten Mal
         nicht gefragt. */
      addRep(REP.CONTRACT_FAIL);
    }

    if (prämie) book('Vertragsprämie', `${c.firm.name} · ${c.done} von ${c.total}`, prämie);

    log(`📜 Vertrag mit ${c.firm.name} beendet: ${c.done} von ${c.total} Sendungen`
      + (prämie ? `, Prämie ${fmt(prämie)}.` : ', ohne Prämie.'));

    melde('vertrag', 'Vertrag ausgelaufen',
          `${c.firm.name}: ${c.done} von ${c.total} Sendungen`
          + (prämie ? `, Prämie ${fmt(prämie)}.` : ', ohne Prämie.'));

    toast(quote >= 1 ? '🏅' : '📜',
      `Vertrag mit <strong>${esc(c.firm.name)}</strong> ist ausgelaufen.`,
      quote >= 1
        ? `<span class="ok">Vollständig erfüllt · Prämie ${fmt(prämie)}</span>`
        : prämie
          ? `<span class="warn">${c.done} von ${c.total} · halbe Prämie ${fmt(prämie)}</span>`
          : `<span class="bad">${c.done} von ${c.total} · keine Prämie, `
            + `Ansehen ${REP.CONTRACT_FAIL.toFixed(1)}</span>`);

    S.contracts.splice(S.contracts.indexOf(c), 1);
  }
  refillContractOffers();
}
