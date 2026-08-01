/* Ladung: Güterklasse, Menge, Gewicht.

   Jede Anfrage bekommt eine Klasse aus dem Güterverzeichnis und eine
   Menge in Europaletten. Aus der Klasse ergibt sich das Gewicht — und
   damit, ob ein Fahrzeug an der Nutzlast oder am Platz scheitert. */

import { GOODS, TRUCK_MODELS, EQUIPMENT } from '../config.js';
import { pick } from '../util.js';

const KLASSEN = Object.values(GOODS);

/* Umschlagpunkte bringen anderes Gut als ein Gewerbegebiet. */
const NACH_ZIEL = {
  Seehafen:     ['stueckgut', 'metall', 'chemie', 'maschinen', 'nahrung', 'papier'],
  Binnenhafen:  ['steine', 'bau', 'metall', 'agrar', 'chemie'],
  Flughafen:    ['stueckgut', 'maschinen', 'kuehlgut', 'papier'],
  Güterbahnhof: ['stueckgut', 'metall', 'bau', 'papier', 'maschinen'],
  Baumarkt:     ['bau', 'stueckgut', 'moebel'],
  Möbelhaus:    ['moebel', 'stueckgut'],
  Werk:         ['metall', 'maschinen', 'chemie', 'papier'],
  Lager:        ['stueckgut', 'nahrung', 'moebel', 'papier'],
  Industrie:    ['metall', 'chemie', 'bau', 'maschinen'],
};

/* maxKg begrenzt die Auswahl auf Güter, von denen wenigstens eine
   Palette auf das größte Fahrzeug im Hof passt. Sonst entstehen
   Sendungen, die niemand fahren kann — eine Palette Schotter wiegt
   1,5 Tonnen und passt auf keinen Transporter. */
export function klasseFuer(ziel, maxKg = Infinity) {
  const moeglich = KLASSEN.filter(k => k.kgProPalette <= maxKg);
  const auswahl = (NACH_ZIEL[ziel?.art] || NACH_ZIEL[ziel?.kind] || [])
    .map(k => GOODS[k])
    .filter(k => k.kgProPalette <= maxKg);

  if (auswahl.length && Math.random() < 0.85) return pick(auswahl);
  return pick(moeglich.length ? moeglich : KLASSEN);
}

/* Sendungsgröße: vom Stückgut bis zur Komplettladung.

   grenze begrenzt die Sendung auf das, was der eigene Fuhrpark tragen
   kann. Ohne diese Rücksicht läge die Börse voll mit Ladungen, für die
   niemand ein Fahrzeug hat. */
export function ladung(klasse, grenze = null) {
  const wurf = Math.random();
  let paletten;

  if (wurf < 0.45)      paletten =  2 + Math.floor(Math.random() * 6);   // Stückgut
  else if (wurf < 0.80) paletten =  8 + Math.floor(Math.random() * 9);   // Teilladung
  else                  paletten = 17 + Math.floor(Math.random() * 17);  // Komplettladung

  /* Schweres Gut kommt nie als Vollpalettenzug — das wäre über 40 Tonnen. */
  paletten = Math.min(paletten, Math.floor(26000 / klasse.kgProPalette));

  if (grenze) {
    paletten = Math.min(paletten, grenze.paletten,
                        Math.floor(grenze.kg / klasse.kgProPalette));
  }

  paletten = Math.max(1, paletten);

  return {
    klasse: klasse.key,
    paletten,
    gewicht: Math.round(paletten * klasse.kgProPalette),
  };
}

/* Die größte Kapazität im eigenen Fuhrpark */
export function flottenGrenze(trucks) {
  let paletten = 0, kg = 0;
  for (const t of trucks) {
    const k = kapazitaet(t);
    paletten = Math.max(paletten, k.paletten);
    kg = Math.max(kg, k.kg);
  }
  return paletten ? { paletten, kg } : null;
}

/* ── Kapazität eines Fahrzeugs ── */
export function kapazitaet(truck) {
  const m = TRUCK_MODELS[truck.model] || TRUCK_MODELS.kurier;
  /* Nachgerüstete Kühlung kostet Nutzlast, fest verbaute steckt schon
     im Leergewicht des Fahrzeugs. */
  const nachgeruestet = truck.equip?.includes('kuehl') && !m.kuehlfest;
  return {
    paletten: m.paletten,
    kg: Math.round(m.nutzlast * (nachgeruestet ? 0.92 : 1)),
    volumen: m.volumen,
  };
}

/* Kann dieses Fahrzeug Kühlgut fahren? */
export function kannKuehlen(truck) {
  const m = TRUCK_MODELS[truck.model];
  return !!(m?.kuehlfest || truck.equip?.includes('kuehl'));
}

/* Was eine Liste von Sendungen zusammen wiegt und belegt */
export function summe(sendungen) {
  return sendungen.reduce((s, o) => ({
    paletten: s.paletten + (o.paletten || 0),
    kg: s.kg + (o.gewicht || 0),
  }), { paletten: 0, kg: 0 });
}

/* Passt die Sendung noch dazu? Liefert einen Grund, wenn nicht. */
export function passt(truck, bisher, neu) {
  const kap = kapazitaet(truck);
  const g = GOODS[neu.klasse];

  if (g?.braucht === 'kuehl' && !kannKuehlen(truck)) {
    return { ok: false, grund: 'Kühlaufbau fehlt' };
  }
  if (g?.braucht === 'adr' && !truck.equip?.includes('adr')) {
    return { ok: false, grund: 'ADR-Ausrüstung fehlt' };
  }

  const s = summe([...bisher, neu]);
  if (s.paletten > kap.paletten) {
    return { ok: false, grund: `nur ${kap.paletten} Stellplätze` };
  }
  if (s.kg > kap.kg) {
    return { ok: false, grund: `Nutzlast ${(kap.kg / 1000).toFixed(1)} t überschritten` };
  }
  return { ok: true };
}

export const klasseVon = key => GOODS[key] || GOODS.stueckgut;
