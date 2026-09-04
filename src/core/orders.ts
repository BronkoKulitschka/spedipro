/**
 * Auftragsgenerierung.
 *
 * Auftraege entstehen aus den Daten der Staedtedatenbank: order_demand
 * bestimmt, wie viel eine Stadt verschickt, industries und typical_cargo
 * bestimmen, was sie verschickt. Nichts davon ist geraten.
 *
 * Der Zufall ist gesaet und damit reproduzierbar - derselbe Spielstand
 * erzeugt dieselben Auftraege.
 */
import type { City } from "./types";
import {
  CARGO_TYPES,
  baseRatePerKm,
  cargoById,
  cargoIdFromLabel,
  type CargoType,
  type TrailerKind,
} from "./cargo";

/* ------------------------------------------------------------------ Zufall */

/** Mulberry32: klein, schnell, ausreichend gleichverteilt. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(
  rng: () => number,
  items: T[],
  weight: (item: T) => number,
): T {
  let total = 0;
  for (const i of items) total += weight(i);
  let r = rng() * total;
  for (const i of items) {
    r -= weight(i);
    if (r <= 0) return i;
  }
  return items[items.length - 1];
}

/* ------------------------------------------------------------- Entfernungen */

/** Luftlinie mit Umwegzuschlag - reicht fuer die Auftragserzeugung. */
export function roughDistance(a: City, b: City): number {
  const R = 6371;
  const p = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * p;
  const dLon = (b.longitude - a.longitude) * p;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * p) *
      Math.cos(b.latitude * p) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 1.2);
}

/** Nutzbares Volumen je Aufliegertyp - Quelle: fleet.ts, hier gespiegelt,
 *  damit die Auftragserzeugung nicht vom Fuhrpark abhaengt. */
const TRAILER_VOLUME: Record<TrailerKind, number> = {
  curtain: 90,
  box: 86,
  reefer: 82,
  tank: 32,
  silo: 38,
  lowloader: 60,
  cartrans: 120,
};

/* ----------------------------------------------------------------- Auftrag */

export type Urgency = "express" | "standard" | "flexible";

export interface Order {
  id: string;
  cargo_id: string;
  from_id: string;
  to_id: string;
  distance_km: number;
  weight_kg: number;
  volume_m3: number;
  loading_meters: number;
  /** Angebotener Erloes in Euro */
  revenue_eur: number;
  urgency: Urgency;
  /** Zahlungsziel in Tagen */
  payment_days: number;
  /** Vertragsstrafe bei Verspaetung */
  penalty_eur: number;
  /** Wie lange der Auftrag verfuegbar bleibt, in Spielstunden */
  expires_in_hours: number;
  required_trailers: TrailerKind[];
  adr: boolean;
}

const URGENCY: { kind: Urgency; weight: number; factor: number }[] = [
  { kind: "express", weight: 0.18, factor: 1.4 },
  { kind: "standard", weight: 0.62, factor: 1.0 },
  { kind: "flexible", weight: 0.2, factor: 0.85 },
];

export const URGENCY_LABEL: Record<Urgency, string> = {
  express: "Express",
  standard: "Standard",
  flexible: "Flexibel",
};

/** Frachtarten, die eine Stadt anbietet - aus typical_cargo abgeleitet. */
function cargoOf(city: City): CargoType[] {
  const list = city.typical_cargo
    .map((label) => cargoById(cargoIdFromLabel(label)))
    .filter((c): c is CargoType => c !== undefined);
  return list.length > 0 ? list : CARGO_TYPES.slice(0, 5);
}

/**
 * Zielstadt-Gewicht: Nachfrage mal Entfernungsdaempfung.
 * Ohne Daempfung waeren Fahrten quer ueber den Kontinent zu haeufig.
 */
function destinationWeight(from: City, to: City): number {
  const d = roughDistance(from, to);
  if (d < 80) return 0;
  const decay = 1 / (1 + Math.pow(d / 900, 1.8));
  return to.order_demand * decay;
}

export interface GenerateOptions {
  /** Wie viele Auftraege erzeugt werden sollen */
  count: number;
  /** Saat fuer reproduzierbaren Zufall */
  seed: number;
  /** Nur Staedte in diesem Umkreis als Startort, in km */
  radius_km?: number;
  /** Bezugspunkt fuer den Umkreis */
  home?: City;
  /** Regionaler Marktfaktor, wechselt woechentlich */
  market_factor?: number;
  /** Ruf des Spielers, 0-5 Sterne */
  reputation?: number;
}

export function generateOrders(
  cities: City[],
  opts: GenerateOptions,
): Order[] {
  const rng = makeRng(opts.seed);
  const market = opts.market_factor ?? 1.0;
  const repBonus = 1 + ((opts.reputation ?? 3) / 5) * 0.2;

  const sources =
    opts.home && opts.radius_km
      ? cities.filter(
          (c) => roughDistance(opts.home!, c) <= opts.radius_km! ,
        )
      : cities;

  const pool = sources.length > 0 ? sources : cities;
  const orders: Order[] = [];

  for (let i = 0; i < opts.count; i++) {
    const from = pickWeighted(rng, pool, (c) => c.order_demand);

    const candidates = cities.filter((c) => c.id !== from.id);
    const to = pickWeighted(rng, candidates, (c) =>
      destinationWeight(from, c),
    );
    if (destinationWeight(from, to) === 0) continue;

    const cargo = pickWeighted(rng, cargoOf(from), () => 1);
    const distance = roughDistance(from, to);

    // Ladungsgroesse: teils Teilladung, teils Komplettladung.
    // Das Volumen richtet sich nach dem groessten zulaessigen Auflieger -
    // sonst entstuenden Tankladungen, die in keinen Tank passen.
    const maxVolume = Math.max(
      ...cargo.trailers.map((t) => TRAILER_VOLUME[t]),
    );
    const maxLdm = 13.6;
    const fillGrade = 0.25 + rng() * 0.75;
    const volume = Math.round(maxVolume * fillGrade * 10) / 10;
    const weight = Math.min(
      24_000,
      Math.round((volume * cargo.kg_per_m3) / 100) * 100,
    );
    // Stapelbare Ware braucht nur die halbe Stellflaeche
    const ldm =
      Math.round(
        (volume / maxVolume) * maxLdm * (cargo.stackable ? 0.55 : 1) * 10,
      ) / 10;

    const urgency = pickWeighted(rng, URGENCY, (u) => u.weight);

    // Teilladungen zahlen anteilig, aber mit Zuschlag - der Aufwand je
    // Auftrag bleibt gleich, egal wie viel geladen wird.
    const shareOfTruck = Math.max(
      volume / maxVolume,
      ldm / maxLdm,
      weight / 24_000,
    );
    // In der Praxis kostet eine 30-Prozent-Ladung rund die Haelfte einer
    // Komplettladung: Abfertigung, Anfahrt und Abrechnung bleiben gleich.
    // Ohne diesen Zuschlag waere keine Teilladung je fahrbar.
    const partialSurcharge = 1 + (1 - shareOfTruck) * 0.85;

    const revenue = Math.round(
      distance *
        baseRatePerKm(distance) *
        cargo.factor *
        urgency.factor *
        shareOfTruck *
        partialSurcharge *
        market *
        repBonus *
        (0.92 + rng() * 0.16),
    );

    const paymentDays = [14, 30, 30, 60][Math.floor(rng() * 4)];
    const penalty = Math.round(
      revenue * (urgency.kind === "express" ? 0.4 : 0.2),
    );

    orders.push({
      id: `A-${(opts.seed % 100000).toString(36)}-${i.toString(36)}`,
      cargo_id: cargo.id,
      from_id: from.id,
      to_id: to.id,
      distance_km: distance,
      weight_kg: weight,
      volume_m3: volume,
      loading_meters: ldm,
      revenue_eur: revenue,
      urgency: urgency.kind,
      payment_days: paymentDays,
      penalty_eur: penalty,
      expires_in_hours: 2 + Math.floor(rng() * 10),
      required_trailers: cargo.trailers,
      adr: cargo.adr,
    });
  }

  return orders;
}

/** Erloes je Kilometer - die Kennzahl, nach der Disponenten sortieren. */
export function revenuePerKm(order: Order): number {
  return order.revenue_eur / order.distance_km;
}
