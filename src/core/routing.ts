/**
 * Strassennetz als Graph und Routenberechnung.
 *
 * Der Router kennt drei Optimierungsziele. Sie liefern bewusst
 * unterschiedliche Ergebnisse - genau darin liegt der Reiz der manuellen
 * Routenplanung.
 */
import type {
  City,
  Edge,
  Optimization,
  RouteLeg,
  RouteResult,
  VehicleClass,
} from "./types";
import { CONSUMPTION, ECONOMY, applyRestPeriods } from "./economy";

export interface Graph {
  cities: Map<string, City>;
  /** Ausgehende Kanten je Stadt-ID */
  adjacency: Map<string, Edge[]>;
}

export function buildGraph(cities: City[], edges: Edge[]): Graph {
  const cityMap = new Map(cities.map((c) => [c.id, c]));
  const adjacency = new Map<string, Edge[]>();
  for (const c of cities) adjacency.set(c.id, []);

  for (const e of edges) {
    // Kanten sind ungerichtet und werden in beide Richtungen eingehaengt.
    adjacency.get(e.from)?.push(e);
    adjacency.get(e.to)?.push(e);
  }
  return { cities: cityMap, adjacency };
}

/**
 * Verbrauch auf einem Abschnitt in Litern.
 *
 * Der Klassenwert gilt für ebene Autobahn. Gebirge und Landstraße kosten
 * spürbar mehr, Fähren gar nichts - der Motor steht.
 */
export function fuelLiters(
  edge: Edge,
  vehicle: VehicleClass,
  laden: boolean,
): number {
  if (edge.type === "ferry") return 0;

  const base = laden ? vehicle.consumption_laden : vehicle.consumption_empty;
  const terrain = edge.mountain_zone
    ? (CONSUMPTION.mountain[edge.mountain_zone] ??
      CONSUMPTION.mountain_default)
    : 1;
  const roadType = edge.type === "trunk" ? CONSUMPTION.trunk : 1;

  return (edge.distance_km * base * terrain * roadType) / 100;
}

/** Kosten eines Abschnitts fuer ein bestimmtes Fahrzeug. */
export function legCost(edge: Edge, vehicle: VehicleClass, laden: boolean) {
  const km = edge.distance_km;
  const liters = fuelLiters(edge, vehicle, laden);

  const fuel =
    liters *
    ECONOMY.diesel_eur_per_liter *
    (1 + ECONOMY.adblue_surcharge);

  const toll = (km * edge.toll_ct_per_km * vehicle.toll_share) / 100;
  const ferry = edge.ferry_cost_eur;
  const hours = km / edge.avg_speed_kmh;
  const driver = hours * ECONOMY.driver_eur_per_hour;
  const wear = km * ECONOMY.maintenance_eur_per_km * edge.wear_factor;

  return { km, liters, fuel, toll, ferry, hours, driver, wear };
}

/** Gewichtsfunktion je Optimierungsziel. */
function weightFor(opt: Optimization, vehicle: VehicleClass) {
  return (edge: Edge): number => {
    const c = legCost(edge, vehicle, true);
    switch (opt) {
      case "fastest":
        return c.hours;
      case "cheapest":
        // Reine Geldkosten ohne Zeitwert: Landstrasse gewinnt gegen Maut.
        return c.fuel + c.toll + c.ferry + c.wear;
      case "balanced":
        // Geldkosten plus bewerteter Zeitaufwand.
        return c.fuel + c.toll + c.ferry + c.wear + c.driver;
    }
  };
}

/** Einfache binaere Prioritaetswarteschlange. */
class MinHeap<T> {
  private items: { key: number; value: T }[] = [];

  get size() {
    return this.items.length;
  }

  push(key: number, value: T) {
    this.items.push({ key, value });
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p].key <= this.items[i].key) break;
      [this.items[p], this.items[i]] = [this.items[i], this.items[p]];
      i = p;
    }
  }

  pop(): { key: number; value: T } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let s = i;
        if (l < this.items.length && this.items[l].key < this.items[s].key) s = l;
        if (r < this.items.length && this.items[r].key < this.items[s].key) s = r;
        if (s === i) break;
        [this.items[s], this.items[i]] = [this.items[i], this.items[s]];
        i = s;
      }
    }
    return top;
  }
}

/** Kuerzester Weg zwischen zwei Staedten nach gewaehltem Ziel. */
export function shortestPath(
  graph: Graph,
  fromId: string,
  toId: string,
  opt: Optimization,
  vehicle: VehicleClass,
): Edge[] | null {
  if (fromId === toId) return [];
  const weight = weightFor(opt, vehicle);

  const dist = new Map<string, number>([[fromId, 0]]);
  const prev = new Map<string, { node: string; edge: Edge }>();
  const done = new Set<string>();
  const heap = new MinHeap<string>();
  heap.push(0, fromId);

  while (heap.size > 0) {
    const top = heap.pop()!;
    const node = top.value;
    if (done.has(node)) continue;
    done.add(node);
    if (node === toId) break;

    for (const edge of graph.adjacency.get(node) ?? []) {
      const next = edge.from === node ? edge.to : edge.from;
      if (done.has(next)) continue;
      const nd = top.key + weight(edge);
      if (nd < (dist.get(next) ?? Infinity)) {
        dist.set(next, nd);
        prev.set(next, { node, edge });
        heap.push(nd, next);
      }
    }
  }

  if (!prev.has(toId)) return null;

  const path: Edge[] = [];
  let cur = toId;
  while (cur !== fromId) {
    const step = prev.get(cur);
    if (!step) return null;
    path.unshift(step.edge);
    cur = step.node;
  }
  return path;
}

/**
 * Berechnet eine vollstaendige Tour ueber mehrere Stopps.
 * Alle Kennzahlen werden hier erzeugt - die Anzeigeschicht rechnet nichts.
 */
export function planRoute(
  graph: Graph,
  stopIds: string[],
  opt: Optimization,
  vehicle: VehicleClass,
): RouteResult | null {
  if (stopIds.length < 2) return null;

  const legs: RouteLeg[] = [];
  const cities: City[] = [];
  const countries = new Set<string>();
  const zones = new Set<string>();

  let distance = 0;
  let driving = 0;
  let toll = 0;
  let fuel = 0;
  let ferry = 0;
  let wear = 0;
  let liters = 0;
  let ferryCount = 0;

  const first = graph.cities.get(stopIds[0]);
  if (!first) return null;
  cities.push(first);

  for (let i = 0; i < stopIds.length - 1; i++) {
    const path = shortestPath(graph, stopIds[i], stopIds[i + 1], opt, vehicle);
    if (path === null) return null;

    let node = stopIds[i];
    for (const edge of path) {
      const nextId = edge.from === node ? edge.to : edge.from;
      const a = graph.cities.get(node);
      const b = graph.cities.get(nextId);
      if (!a || !b) return null;

      const c = legCost(edge, vehicle, true);
      legs.push({
        from: a,
        to: b,
        edge,
        distance_km: c.km,
        driving_hours: c.hours,
        toll_eur: c.toll,
        fuel_eur: c.fuel,
        ferry_eur: c.ferry,
      });

      distance += c.km;
      liters += c.liters;
      driving += c.hours;
      toll += c.toll;
      fuel += c.fuel;
      ferry += c.ferry;
      wear += c.wear;
      if (edge.type === "ferry") ferryCount++;
      edge.countries.forEach((x) => countries.add(x));
      if (edge.mountain_zone) zones.add(edge.mountain_zone);

      cities.push(b);
      node = nextId;
    }
  }

  // Be- und Entladezeit an jedem geplanten Stopp
  const stopCities = stopIds.map((id) => graph.cities.get(id)!);
  const handling = stopCities.reduce(
    (sum, c) =>
      sum +
      (c.logistics_hub
        ? ECONOMY.handling_hours_hub
        : ECONOMY.handling_hours_per_stop),
    0,
  );

  const { elapsed, rest } = applyRestPeriods(driving);
  const totalElapsed = elapsed + handling;
  const driverCost = (driving + handling) * ECONOMY.driver_eur_per_hour;

  // Spesen: volle Tage plus angebrochener Tag
  const days = Math.floor(totalElapsed / 24);
  const partial = totalElapsed % 24 > 0 ? 1 : 0;
  const perDiem =
    days * ECONOMY.per_diem_full_eur + partial * ECONOMY.per_diem_partial_eur;

  return {
    legs,
    cities,
    distance_km: distance,
    driving_hours: driving,
    elapsed_hours: totalElapsed,
    rest_hours: rest,
    toll_eur: toll,
    fuel_eur: fuel,
    fuel_liters: liters,
    ferry_eur: ferry,
    driver_eur: driverCost + perDiem,
    wear_eur: wear,
    total_cost_eur: toll + fuel + ferry + wear + driverCost + perDiem,
    countries: [...countries].sort(),
    mountain_zones: [...zones].sort(),
    ferry_count: ferryCount,
  };
}
