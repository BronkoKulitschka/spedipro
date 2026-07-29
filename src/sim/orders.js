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

const id = () => Math.random().toString(36).slice(2, 8);

function baseFee(firm) {
  const km = firm.km * 1.28;
  return RULES.BASE_FEE + km * RULES.RATE_PER_KM * 2;
}

/* ── Die drei Auftragsarten ── */
function spotOffer(firm) {
  const fee = baseFee(firm) * S.market.index * repMul();
  return {
    id: id(), kind: 'spot', firm,
    estKm: firm.km * 1.28,
    fee: Math.round(fee / 10) * 10,
  };
}

function contractOffer(contract) {
  return {
    id: id(), kind: 'vertrag', firm: contract.firm,
    contractId: contract.id,
    estKm: contract.firm.km * 1.28,
    fee: currentRate(contract),
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
    fee: Math.round(baseFee(firm) * rate * repMul() / 10) * 10,
  };
}

/* ── Auffüllen ── */
export function refillOffers() {
  if (!S.firms.length) return;

  /* Jeder laufende Vertrag hält höchstens eine Sendung offen. */
  for (const c of S.contracts) {
    const offen = S.offers.filter(o => o.contractId === c.id).length;
    const übrig = c.total - c.done - offen;
    if (offen === 0 && übrig > 0) S.offers.push(contractOffer(c));
  }

  /* Partneraufträge: höchstens zwei gleichzeitig. */
  const partnerOffen = S.offers.filter(o => o.kind === 'partner').length;
  if (partnerOffen < 2 && S.partners.length && Math.random() < 0.5) {
    S.offers.push(partnerOffer(pick(S.firms)));
  }

  /* Der Rest ist Spotmarkt. Am Wochenende kommt weniger herein. */
  const ziel = Math.max(3, Math.round(RULES.OFFER_COUNT * supplyToday()));
  let guard = 0;
  while (S.offers.length < ziel && guard++ < 200) {
    const firm = pick(S.firms);
    if (S.offers.some(o => o.firm.name === firm.name)) continue;
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
