/**
 * Frachtkatalog.
 *
 * Die 40 Frachtarten stammen aus der Staedtedatenbank. Jede bekommt hier
 * physikalische Eigenschaften und einen Erloesfaktor. Diese Datei ist die
 * einzige Quelle fuer Frachteigenschaften.
 */

export type TrailerKind =
  | "curtain"
  | "box"
  | "reefer"
  | "tank"
  | "silo"
  | "lowloader"
  | "cartrans";

export interface CargoType {
  id: string;
  name: string;
  /** Erloesfaktor gegenueber der Basisrate */
  factor: number;
  /** Dichte in kg je Kubikmeter - entscheidet, ob Gewicht oder Volumen limitiert */
  kg_per_m3: number;
  /** Stapelbare Ware braucht nur die halbe Stellflaeche */
  stackable: boolean;
  /** Zulaessige Aufliegertypen; der erste ist der Standard */
  trailers: TrailerKind[];
  /** Gefahrgut: braucht ADR-Schein, nicht mit Lebensmitteln kombinierbar */
  adr: boolean;
  /** Temperaturgefuehrt: belegt den gesamten Auflieger */
  temperature: "none" | "chilled" | "pharma";
}

const C = (
  id: string,
  name: string,
  factor: number,
  kg_per_m3: number,
  stackable: boolean,
  trailers: TrailerKind[],
  adr = false,
  temperature: CargoType["temperature"] = "none",
): CargoType => ({
  id,
  name,
  factor,
  kg_per_m3,
  stackable,
  trailers,
  adr,
  temperature,
});

export const CARGO_TYPES: CargoType[] = [
  // Allgemeine Ladung
  C("palettenware", "Palettenware", 1.0, 280, true, ["curtain", "box"]),
  C("stueckgut", "Stückgut", 1.0, 220, true, ["curtain", "box"]),
  C("container", "Container", 1.05, 400, false, ["curtain"]),
  C("importwaren", "Importwaren", 1.05, 260, true, ["curtain", "box"]),
  C("konsumgueter", "Konsumgüter", 1.0, 200, true, ["curtain", "box"]),

  // Lebensmittel
  C("lebensmittel", "Lebensmittel", 1.3, 320, true, ["reefer", "box"], false, "chilled"),
  C("kuehlware", "Kühlware", 1.35, 340, true, ["reefer"], false, "chilled"),
  C("frischfisch", "Frischfisch", 1.4, 380, false, ["reefer"], false, "chilled"),
  C("getraenke", "Getränke", 0.95, 620, true, ["curtain"]),
  C("wein_spirituosen", "Wein & Spirituosen", 1.2, 560, true, ["curtain", "box"]),

  // Agrar
  C("getreide", "Getreide", 0.8, 750, false, ["silo", "curtain"]),
  C("obst_gemuese", "Obst & Gemüse", 1.25, 300, true, ["reefer"], false, "chilled"),
  C("duengemittel", "Düngemittel", 0.85, 900, true, ["curtain", "silo"]),

  // Fahrzeuge
  C("fahrzeuge", "Fahrzeuge", 1.35, 180, false, ["cartrans"]),
  C("autoteile", "Autoteile", 1.15, 340, true, ["curtain", "box"]),
  C("reifen", "Reifen", 1.05, 150, false, ["curtain", "box"]),

  // Chemie und Energie
  C("chemikalien", "Chemikalien", 1.6, 950, false, ["tank"], true),
  C("kunststoffe", "Kunststoffe", 1.1, 240, true, ["curtain", "box"]),
  C("gefahrgut", "Gefahrgut", 1.7, 800, false, ["tank", "box"], true),
  C("mineraloel", "Mineralöl", 1.5, 840, false, ["tank"], true),

  // Metall
  C("stahlcoils", "Stahlcoils", 0.95, 1900, false, ["curtain"]),
  C("metallteile", "Metallteile", 1.0, 1200, true, ["curtain"]),
  C("baustahl", "Baustahl", 0.9, 1500, false, ["curtain"]),
  C("baustoffe", "Baustoffe", 0.85, 1100, true, ["curtain"]),
  C("zement", "Zement", 0.8, 1400, false, ["silo"]),

  // Maschinen
  C("maschinenteile", "Maschinenteile", 1.15, 520, false, ["curtain", "box"]),
  C("industrieanlagen", "Industrieanlagen", 1.3, 700, false, ["lowloader", "curtain"]),
  C("werkzeuge", "Werkzeuge", 1.1, 480, true, ["curtain", "box"]),

  // Elektronik
  C("elektrogeraete", "Elektrogeräte", 1.25, 190, true, ["box", "curtain"]),
  C("elektronikbauteile", "Elektronikbauteile", 1.3, 160, true, ["box"]),
  C("weisse_ware", "Weiße Ware", 1.2, 130, false, ["box", "curtain"]),

  // Pharma
  C("pharmaprodukte", "Pharmaprodukte", 1.55, 210, true, ["reefer"], false, "pharma"),
  C("medizintechnik", "Medizintechnik", 1.45, 180, false, ["box"], false, "pharma"),

  // Papier und Holz
  C("papierrollen", "Papierrollen", 0.9, 700, false, ["curtain"]),
  C("zellstoff", "Zellstoff", 0.85, 500, true, ["curtain"]),
  C("verpackungsmaterial", "Verpackungsmaterial", 0.9, 110, true, ["curtain", "box"]),
  C("moebel", "Möbel", 1.05, 120, false, ["curtain", "box"]),
  C("holzwaren", "Holzwaren", 0.95, 450, true, ["curtain"]),

  // Textil
  C("textilien", "Textilien", 1.05, 140, true, ["curtain", "box"]),
  C("bekleidung", "Bekleidung", 1.15, 100, true, ["box", "curtain"]),
];

const BY_ID = new Map(CARGO_TYPES.map((c) => [c.id, c]));

export function cargoById(id: string): CargoType | undefined {
  return BY_ID.get(id);
}

/**
 * Wandelt einen Frachtnamen aus der Staedtedatenbank in eine Katalog-ID.
 * Die Datenbank schreibt "Obst & Gemüse", der Katalog fuehrt "obst_gemuese".
 */
export function cargoIdFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s*&\s*/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-z_]/g, "");
}

/** Basisrate je Kilometer, fallend mit der Entfernung. */
export function baseRatePerKm(distanceKm: number): number {
  if (distanceKm < 300) return 2.2;
  if (distanceKm < 700) return 1.7;
  if (distanceKm < 1500) return 1.4;
  return 1.25;
}
