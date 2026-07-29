/* Auftragsbörse: aus echten OSM-Betrieben werden Anfragen. */

import { RULES } from '../config.js';
import { S } from '../state.js';
import { pick } from '../util.js';

function makeOffer(firm) {
  /* Vor dem Routing kennen wir nur die Luftlinie. Der Preis rechnet
     Hin- und Rückweg ein, die echte Streckenlänge kommt beim Annehmen. */
  const km = firm.km * 1.28;
  return {
    id: Math.random().toString(36).slice(2, 8),
    firm,
    estKm: km,
    fee: Math.round((RULES.BASE_FEE + km * RULES.RATE_PER_KM * 2) / 10) * 10,
    jams: 0,
    realKm: null,
  };
}

export function refillOffers() {
  if (!S.firms.length) return;
  let guard = 0;
  while (S.offers.length < RULES.OFFER_COUNT && guard++ < 200) {
    const firm = pick(S.firms);
    if (S.offers.some(o => o.firm.name === firm.name)) continue;
    S.offers.push(makeOffer(firm));
  }
}

export function takeOffer(id) {
  const i = S.offers.findIndex(o => o.id === id);
  if (i === -1) return null;
  const [offer] = S.offers.splice(i, 1);
  refillOffers();
  return offer;
}
