/* Jahreszeiten im Frachtgeschäft.

   Über das Jahr schwankt die Nachfrage: das Weihnachtsgeschäft im
   Herbst, die Baustellensaison im Sommer, die Flaute im Januar. Das
   gibt dem Markt einen Bogen über die Monate statt nur täglicher
   Schwankung. */

import { now } from '../state.js';

/* Preisfaktor und Angebotsmenge je Monat, Januar bis Dezember */
const MONATE = [
  { name: 'Januar',    preis: 0.88, menge: 0.75, text: 'Nachweihnachtliche Flaute' },
  { name: 'Februar',   preis: 0.92, menge: 0.85, text: 'Ruhiges Winterhalbjahr' },
  { name: 'März',      preis: 1.00, menge: 1.00, text: 'Das Geschäft zieht an' },
  { name: 'April',     preis: 1.04, menge: 1.10, text: 'Bausaison beginnt' },
  { name: 'Mai',       preis: 1.06, menge: 1.15, text: 'Volle Auftragsbücher' },
  { name: 'Juni',      preis: 1.08, menge: 1.15, text: 'Hochsaison am Bau' },
  { name: 'Juli',      preis: 1.02, menge: 0.95, text: 'Werksferien in der Industrie' },
  { name: 'August',    preis: 1.00, menge: 0.90, text: 'Ferienzeit, ruhiger Verkehr' },
  { name: 'September', preis: 1.08, menge: 1.15, text: 'Nachholbedarf nach den Ferien' },
  { name: 'Oktober',   preis: 1.14, menge: 1.25, text: 'Vorweihnachtsgeschäft läuft an' },
  { name: 'November',  preis: 1.22, menge: 1.35, text: 'Weihnachtsgeschäft, Laderaum knapp' },
  { name: 'Dezember',  preis: 1.16, menge: 1.10, text: 'Letzte Touren vor den Feiertagen' },
];

export const saison = () => MONATE[now().getUTCMonth()];
export const saisonPreis = () => saison().preis;
export const saisonMenge = () => saison().menge;

export const saisonText = () => {
  const s = saison();
  const richtung = s.preis >= 1.10 ? '▲' : s.preis <= 0.94 ? '▼' : '▬';
  return `${richtung} ${s.name}: ${s.text}`;
};

export { MONATE };
