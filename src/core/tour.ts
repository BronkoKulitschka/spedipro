/**
 * Sammelladung - das Herzstück des Spiels.
 *
 * Ein Auftrag ist keine Fahrt, sondern zwei Punkte: aufnehmen und abliefern.
 * Eine Tour ist eine Folge solcher Punkte. Der Laderaum muss an jedem
 * einzelnen Punkt reichen, nicht nur im Durchschnitt.
 *
 * Diese Datei kennt weder Preact noch das DOM.
 */
import type { City, Optimization, RouteResult, VehicleClass } from "./types";
import type { Graph } from "./routing";
import { planRoute } from "./routing";
import { cargoById, type TrailerKind } from "./cargo";
import type { Order } from "./orders";

export type StopAction = "pickup" | "dropoff";

export interface TourStop {
  city_id: string;
  action: StopAction;
  order_id: string;
}

/** Ladungszustand nach einem Stopp. */
export interface LoadSnapshot {
  weight_kg: number;
  volume_m3: number;
  loading_meters: number;
}

export interface Capacity {
  payload_kg: number;
  volume_m3: number;
  loading_meters: number;
}

export type ProblemKind =
  | "over_weight"
  | "over_volume"
  | "over_ldm"
  | "dropoff_before_pickup"
  | "trailer_mismatch"
  | "adr_conflict"
  | "temperature_conflict";

export interface Problem {
  kind: ProblemKind;
  /** Index des Stopps, an dem das Problem auftritt; -1 = betrifft die Tour */
  stop_index: number;
  order_id?: string;
  message: string;
}

export interface TourPlan {
  stops: TourStop[];
  order_ids: string[];
  /** Ladungszustand nach jedem Stopp, gleiche Länge wie stops */
  load: LoadSnapshot[];
  /** Höchste Auslastung über die gesamte Tour, als Anteil 0-1 */
  peak: { weight: number; volume: number; ldm: number };
  problems: Problem[];
  valid: boolean;
}

export interface TourResult extends TourPlan {
  route: RouteResult | null;
  revenue_eur: number;
  cost_eur: number;
  profit_eur: number;
  /** Städte in Reihenfolge, Duplikate zusammengefasst */
  route_stop_ids: string[];
}

/* --------------------------------------------------------- Verträglichkeit */

/** Aufliegertypen, die zu allen gewählten Aufträgen passen. */
export function commonTrailers(orders: Order[]): TrailerKind[] {
  if (orders.length === 0) return [];
  let set = new Set(orders[0].required_trailers);
  for (const o of orders.slice(1)) {
    set = new Set(o.required_trailers.filter((t) => set.has(t)));
  }
  return [...set];
}

function compatibilityProblems(orders: Order[]): Problem[] {
  const problems: Problem[] = [];

  if (orders.length > 1 && commonTrailers(orders).length === 0) {
    problems.push({
      kind: "trailer_mismatch",
      stop_index: -1,
      message: "Kein Auflieger passt zu allen gewählten Ladungen.",
    });
  }

  const hasAdr = orders.some((o) => o.adr);
  const hasFood = orders.some((o) => {
    const c = cargoById(o.cargo_id);
    return c?.temperature === "chilled";
  });
  if (hasAdr && hasFood) {
    problems.push({
      kind: "adr_conflict",
      stop_index: -1,
      message: "Gefahrgut darf nicht mit Lebensmitteln zusammen fahren.",
    });
  }

  const temps = new Set(
    orders
      .map((o) => cargoById(o.cargo_id)?.temperature)
      .filter((t): t is "chilled" | "pharma" => t === "chilled" || t === "pharma"),
  );
  if (temps.size > 1) {
    problems.push({
      kind: "temperature_conflict",
      stop_index: -1,
      message:
        "Kühlware und Pharma brauchen verschiedene Temperaturzonen und passen nicht zusammen.",
    });
  }

  return problems;
}

/* ------------------------------------------------------------ Kapazitäten */

/**
 * Prüft eine Stoppfolge und berechnet den Ladungszustand Schritt für Schritt.
 * Das ist die zentrale Regel der Sammelladung: An keinem Punkt der Tour darf
 * eine der drei Grenzen überschritten werden.
 */
export function checkTour(
  stops: TourStop[],
  orders: Order[],
  capacity: Capacity,
): TourPlan {
  const byId = new Map(orders.map((o) => [o.id, o]));
  const orderIds = [...new Set(stops.map((s) => s.order_id))];
  const used = orderIds
    .map((id) => byId.get(id))
    .filter((o): o is Order => o !== undefined);

  const problems: Problem[] = compatibilityProblems(used);
  const load: LoadSnapshot[] = [];
  const pickedUp = new Set<string>();

  let w = 0;
  let v = 0;
  let l = 0;
  let peakW = 0;
  let peakV = 0;
  let peakL = 0;

  stops.forEach((stop, i) => {
    const o = byId.get(stop.order_id);
    if (!o) {
      load.push({ weight_kg: w, volume_m3: v, loading_meters: l });
      return;
    }

    if (stop.action === "pickup") {
      w += o.weight_kg;
      v += o.volume_m3;
      l += o.loading_meters;
      pickedUp.add(o.id);
    } else {
      if (!pickedUp.has(o.id)) {
        problems.push({
          kind: "dropoff_before_pickup",
          stop_index: i,
          order_id: o.id,
          message: "Abliefern vor dem Aufnehmen ist nicht möglich.",
        });
      }
      w -= o.weight_kg;
      v -= o.volume_m3;
      l -= o.loading_meters;
    }

    w = Math.max(0, Math.round(w));
    v = Math.max(0, Math.round(v * 10) / 10);
    l = Math.max(0, Math.round(l * 10) / 10);

    peakW = Math.max(peakW, w);
    peakV = Math.max(peakV, v);
    peakL = Math.max(peakL, l);

    if (w > capacity.payload_kg) {
      problems.push({
        kind: "over_weight",
        stop_index: i,
        order_id: o.id,
        message: `Zuladung überschritten: ${(w / 1000).toFixed(1)} t von ${(
          capacity.payload_kg / 1000
        ).toFixed(1)} t.`,
      });
    }
    if (v > capacity.volume_m3) {
      problems.push({
        kind: "over_volume",
        stop_index: i,
        order_id: o.id,
        message: `Volumen überschritten: ${v.toFixed(1)} m³ von ${capacity.volume_m3} m³.`,
      });
    }
    if (l > capacity.loading_meters) {
      problems.push({
        kind: "over_ldm",
        stop_index: i,
        order_id: o.id,
        message: `Lademeter überschritten: ${l.toFixed(1)} von ${capacity.loading_meters}.`,
      });
    }

    load.push({ weight_kg: w, volume_m3: v, loading_meters: l });
  });

  return {
    stops,
    order_ids: orderIds,
    load,
    peak: {
      weight: capacity.payload_kg > 0 ? peakW / capacity.payload_kg : 0,
      volume: capacity.volume_m3 > 0 ? peakV / capacity.volume_m3 : 0,
      ldm: capacity.loading_meters > 0 ? peakL / capacity.loading_meters : 0,
    },
    problems,
    valid: problems.length === 0,
  };
}

/* ------------------------------------------------------ Route und Ergebnis */

/** Aufeinanderfolgende Stopps in derselben Stadt zusammenfassen. */
export function routeStopIds(stops: TourStop[]): string[] {
  const ids: string[] = [];
  for (const s of stops) {
    if (ids[ids.length - 1] !== s.city_id) ids.push(s.city_id);
  }
  return ids;
}

export function evaluateTour(
  graph: Graph,
  stops: TourStop[],
  orders: Order[],
  capacity: Capacity,
  vehicle: VehicleClass,
  optimization: Optimization,
): TourResult {
  const plan = checkTour(stops, orders, capacity);
  const ids = routeStopIds(stops);
  const route = ids.length >= 2 ? planRoute(graph, ids, optimization, vehicle) : null;

  const byId = new Map(orders.map((o) => [o.id, o]));
  const revenue = plan.order_ids.reduce(
    (s, id) => s + (byId.get(id)?.revenue_eur ?? 0),
    0,
  );
  const cost = route?.total_cost_eur ?? 0;

  return {
    ...plan,
    route,
    route_stop_ids: ids,
    revenue_eur: revenue,
    cost_eur: cost,
    profit_eur: revenue - cost,
  };
}

/* --------------------------------------------------------- Automatikplanung */

/** Grobe Entfernung zwischen zwei Städten für die Heuristik. */
function dist(a: City, b: City): number {
  const R = 6371;
  const p = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * p;
  const dLon = (b.longitude - a.longitude) * p;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * p) * Math.cos(b.latitude * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Sortiert die Stopps neu, ohne die Auftragsauswahl zu ändern.
 *
 * Verfahren: günstigste Einfügung. Jeder Auftrag wird an der Stelle
 * eingesetzt, an der er den geringsten Umweg verursacht - unter Wahrung der
 * Regel, dass Aufnehmen vor Abliefern kommt und der Laderaum nie überläuft.
 *
 * Das Ergebnis ist bewusst gut, aber nicht optimal. Die letzten zehn bis
 * fünfzehn Prozent holt nur heraus, wer selbst plant (Konzept 14.7).
 */
export function optimizeStopOrder(
  orderIds: string[],
  orders: Order[],
  cities: Map<string, City>,
  capacity: Capacity,
  startCityId?: string,
): TourStop[] {
  const byId = new Map(orders.map((o) => [o.id, o]));
  const chosen = orderIds
    .map((id) => byId.get(id))
    .filter((o): o is Order => o !== undefined);
  if (chosen.length === 0) return [];

  const legLength = (stops: TourStop[]): number => {
    let sum = 0;
    const ids = routeStopIds(stops);
    if (startCityId && ids[0] !== startCityId) ids.unshift(startCityId);
    for (let i = 0; i < ids.length - 1; i++) {
      const a = cities.get(ids[i]);
      const b = cities.get(ids[i + 1]);
      if (a && b) sum += dist(a, b);
    }
    return sum;
  };

  // Längster Auftrag bildet das Gerüst, die übrigen werden eingefügt.
  const sorted = [...chosen].sort((a, b) => b.distance_km - a.distance_km);
  let stops: TourStop[] = [
    { city_id: sorted[0].from_id, action: "pickup", order_id: sorted[0].id },
    { city_id: sorted[0].to_id, action: "dropoff", order_id: sorted[0].id },
  ];

  for (const o of sorted.slice(1)) {
    let best: TourStop[] | null = null;
    let bestLen = Infinity;

    for (let p = 0; p <= stops.length; p++) {
      for (let d = p + 1; d <= stops.length + 1; d++) {
        const trial = [...stops];
        trial.splice(p, 0, {
          city_id: o.from_id,
          action: "pickup",
          order_id: o.id,
        });
        trial.splice(d, 0, {
          city_id: o.to_id,
          action: "dropoff",
          order_id: o.id,
        });

        const check = checkTour(trial, orders, capacity);
        if (!check.valid) continue;

        const len = legLength(trial);
        if (len < bestLen) {
          bestLen = len;
          best = trial;
        }
      }
    }
    // Passt der Auftrag nirgends hinein, bleibt er außen vor.
    if (best) stops = best;
  }

  return stops;
}

/**
 * Automatik: wählt Aufträge selbst aus und ordnet sie.
 *
 * Für jeden der bestbewerteten Aufträge wird eine gierige Tour aufgebaut und
 * die beste davon behalten. Der Umweg über mehrere Startpunkte ist nötig,
 * weil der lukrativste Einzelauftrag oft den Laderaum allein füllt und damit
 * jede Kombination verhindert.
 *
 * Das Ergebnis ist bewusst solide, aber nicht optimal: Die Automatik sucht
 * keine eleganten Ketten und wartet nie auf ein besseres Angebot. Die letzten
 * zehn bis fünfzehn Prozent holt nur heraus, wer selbst plant.
 */
export function autoPlan(
  graph: Graph,
  candidates: Order[],
  cities: Map<string, City>,
  capacity: Capacity,
  vehicle: VehicleClass,
  optimization: Optimization,
  opts: { startCityId?: string; maxOrders?: number; seeds?: number } = {},
): TourResult {
  const maxOrders = opts.maxOrders ?? 6;
  const seedCount = opts.seeds ?? 8;

  const ranked = [...candidates].sort(
    (a, b) => b.revenue_eur / b.distance_km - a.revenue_eur / a.distance_km,
  );

  const build = (seed: Order): TourResult | null => {
    const picked: string[] = [];
    let best: TourResult | null = null;

    // Der Startauftrag zuerst, danach die Rangliste der Reihe nach.
    for (const o of [seed, ...ranked.filter((x) => x.id !== seed.id)]) {
      if (picked.length >= maxOrders) break;

      const stops = optimizeStopOrder(
        [...picked, o.id],
        candidates,
        cities,
        capacity,
        opts.startCityId,
      );
      if (stops.length === 0) continue;
      if (!new Set(stops.map((s) => s.order_id)).has(o.id)) continue;

      const result = evaluateTour(
        graph,
        stops,
        candidates,
        capacity,
        vehicle,
        optimization,
      );
      if (!result.valid || !result.route) continue;

      // Nur übernehmen, wenn der Zusatzauftrag den Gewinn wirklich erhöht.
      if (!best || result.profit_eur > best.profit_eur) {
        best = result;
        picked.push(o.id);
      }
    }
    return best;
  };

  let overall: TourResult | null = null;
  for (const seed of ranked.slice(0, seedCount)) {
    const candidate = build(seed);
    if (candidate && (!overall || candidate.profit_eur > overall.profit_eur)) {
      overall = candidate;
    }
  }

  return (
    overall ?? {
      stops: [],
      order_ids: [],
      load: [],
      peak: { weight: 0, volume: 0, ldm: 0 },
      problems: [],
      valid: true,
      route: null,
      route_stop_ids: [],
      revenue_eur: 0,
      cost_eur: 0,
      profit_eur: 0,
    }
  );
}

/** Stoppfolge aus einer Auftragsliste, ohne Umsortierung. */
export function naiveStops(orderIds: string[], orders: Order[]): TourStop[] {
  const byId = new Map(orders.map((o) => [o.id, o]));
  const stops: TourStop[] = [];
  for (const id of orderIds) {
    const o = byId.get(id);
    if (!o) continue;
    stops.push({ city_id: o.from_id, action: "pickup", order_id: o.id });
  }
  for (const id of orderIds) {
    const o = byId.get(id);
    if (!o) continue;
    stops.push({ city_id: o.to_id, action: "dropoff", order_id: o.id });
  }
  return stops;
}
