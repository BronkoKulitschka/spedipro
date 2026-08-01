/* Auftragsbörse: Spotmarkt, Vertragssendungen und Partneraufträge.

   Drei Arten liegen gemischt in derselben Liste:
     spot     — freier Markt, Preis schwankt mit der Marktlage
     vertrag  — Sendung aus einem laufenden Rahmenvertrag, fester Preis
     partner  — Fracht einer befreundeten Spedition, zahlt etwas besser */

import { RULES, CONTRACTS } from '../config.js';
import { S } from '../state.js';
import { pick } from '../util.js';
import { repMul, supplyToday } from './market.js';
import { currentRate } from './contracts.js';
import { levelOf, pickPartner } from './partners.js';
import { current } from './progress.js';
import { hubsFor } from '../data/hubs.js';
import { klasseFuer, ladung, flottenGrenze } from './goods.js';
import { rateFuer } from './customers.js';
import { saisonPreis, saisonMenge } from './season.js';
import { mehrAnfragen, besserePreise } from './goals.js';

const id = () => Math.random().toString(36).slice(2, 8);

function baseFee(firm) {
  const km = firm.km * 1.28;
  return RULES.BASE_FEE + km * RULES.RATE_PER_KM * 2;
}

/* ── Die drei Auftragsarten ── */
/* Eine Sendung bekommt Klasse, Menge und Gewicht. Der Preis richtet
   sich nach Strecke, Klasse und Menge — eine Komplettladung bringt mehr
   als ein paar Paletten, aber nicht proportional. */
function mitLadung(basis, firm, faktor = 1) {
  const flotte = flottenGrenze(S.trucks);

  /* Bei kleinem Fuhrpark fast alles zuschneiden, bei großem öfter
     etwas Größeres anbieten — als Anreiz für das nächste Fahrzeug. */
  const anteil = S.trucks.length <= 2 ? 0.88 : 0.7;
  const grenze = Math.random() < anteil ? flotte : null;

  const klasse = klasseFuer(firm, grenze ? grenze.kg : Infinity);
  const l = ladung(klasse, grenze);

  /* Stückgut kostet je Palette mehr als eine Komplettladung — der
     Sockel sorgt dafür, dass sich auch kleine Sendungen tragen. */
  const mengenFaktor = 0.72 + 0.38 * Math.min(1, l.paletten / 33);
  const fee = basis * klasse.preis * mengenFaktor * faktor;

  return { ...l, fee: Math.round(fee / 10) * 10 };
}

function spotOffer(firm) {
  const bonus = firm.bonus || 1;
  const basis = baseFee(firm) * bonus * S.market.index * repMul()
              * saisonPreis() * rateFuer(firm.name) * besserePreise();
  return {
    id: id(), kind: 'spot', firm,
    estKm: firm.km * 1.28,
    ...mitLadung(basis, firm),
  };
}

/* Ziele für den Spotmarkt: Betriebe im Umkreis und Umschlagpunkte im
   ganzen Land. Etwa jede dritte Anfrage geht in den Fernverkehr. */
function pickZiel() {
  if (!S.hubs?.length) return pick(S.firms);
  return Math.random() < 0.35 ? pick(S.hubs) : pick(S.firms);
}

function contractOffer(contract) {
  const l = mitLadung(currentRate(contract), contract.firm);
  return {
    id: id(), kind: 'vertrag', firm: contract.firm,
    contractId: contract.id,
    estKm: contract.firm.km * 1.28,
    ...l,
    fee: currentRate(contract),          // im Vertrag steht ein fester Satz
  };
}

function partnerOffer(firm) {
  const partner = pickPartner();
  const rate = levelOf(partner).rate;
  return {
    id: id(), kind: 'partner', firm,
    partnerKey: partner.key,
    partnerName: partner.name,
    estKm: firm.km * 1.28,
    ...mitLadung(baseFee(firm) * rate * repMul(), firm),
  };
}

/* ── Auffüllen ── */
export function refillOffers() {
  if (!S.firms.length && !S.hubs?.length) return;
  if (!S.hubs?.length) S.hubs = hubsFor(S.depot);

  /* Jeder laufende Vertrag hält höchstens eine Sendung offen. */
  for (const c of S.contracts) {
    const offen = S.offers.filter(o => o.contractId === c.id).length;
    const übrig = c.total - c.done - offen;
    if (offen === 0 && übrig > 0) S.offers.push(contractOffer(c));
  }

  /* Partneraufträge: höchstens zwei gleichzeitig. */
  const partnerOffen = S.offers.filter(o => o.kind === 'partner').length;
  const partnerTakt = current().nr >= 4 ? 0.75 : 0.5;
  if (partnerOffen < 2 && S.partners.length && Math.random() < partnerTakt) {
    S.offers.push(partnerOffer(pick(S.firms)));
  }

  /* Der Rest ist Spotmarkt. Am Wochenende kommt weniger herein. */
  const ziel = Math.max(3, Math.round(
    RULES.OFFER_COUNT * supplyToday() * saisonMenge() * mehrAnfragen()));
  let guard = 0;
  while (S.offers.length < ziel && guard++ < 200) {
    const firm = pickZiel();
    if (!firm || S.offers.some(o => o.firm.name === firm.name)) continue;
    S.offers.push(spotOffer(firm));
  }
}

/* Spotangebote altern: alte verschwinden, damit die Liste lebt. */
export function refreshSpot() {
  const behalten = S.offers.filter(o => o.kind !== 'spot' || Math.random() > 0.35);
  S.offers = behalten;
  refillOffers();
}

export function takeOffer(offerId) {
  const i = S.offers.findIndex(o => o.id === offerId);
  if (i === -1) return null;
  const [offer] = S.offers.splice(i, 1);
  refillOffers();
  return offer;
}

export const KIND_LABEL = {
  spot:    { icon: '🏷️', text: 'Spotmarkt' },
  vertrag: { icon: '📜', text: 'Vertrag' },
  partner: { icon: '🤝', text: 'Partner' },
};
