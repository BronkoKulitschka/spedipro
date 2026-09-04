/**
 * Datentypen des Simulationskerns.
 *
 * Dieser Ordner kennt weder Preact noch das DOM. Er bekommt Daten herein und
 * gibt Ergebnisse zurueck. Dadurch laeuft derselbe Code spaeter unveraendert
 * in der Standalone-Version und laesst sich ohne Browser testen.
 */

export interface City {
  id: string;
  city: string;
  country: string;
  iso2: string;
  latitude: number;
  longitude: number;
  /** 1 = Randlage, 5 = Megahub */
  size_class: number;
  /** Auftragsaufkommen 8-100 */
  order_demand: number;
  price_level_factor: number;
  wage_level_factor: number;
  diesel_price_factor: number;
  industries: string[];
  typical_cargo: string[];
  has_port: boolean;
  has_airport: boolean;
  logistics_hub: boolean;
  starting_city_suitable: boolean;
  unlock_region: string;
}

export type EdgeType = "motorway" | "trunk" | "ferry";

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  distance_km: number;
  avg_speed_kmh: number;
  toll_ct_per_km: number;
  ferry_cost_eur: number;
  mountain_zone: string | null;
  /** Verschleissmultiplikator: Landstrasse und Gebirge kosten mehr Substanz. */
  wear_factor: number;
  countries: string[];
}

export interface CityFile {
  schema_version: string;
  city_count: number;
  cities: City[];
}

export interface RoadFile {
  schema_version: string;
  edge_count: number;
  toll_rates_ct_per_km: Record<string, number>;
  edges: Edge[];
}

/** Fahrzeugklasse - bestimmt Verbrauch, Kapazitaet und Mautstufe. */
export interface VehicleClass {
  id: string;
  name: string;
  /** Liter je 100 km, beladen */
  consumption_laden: number;
  /** Liter je 100 km, leer */
  consumption_empty: number;
  payload_kg: number;
  volume_m3: number;
  loading_meters: number;
  /** Anteil des Landesmautsatzes, den diese Klasse zahlt */
  toll_share: number;
}

export type Optimization = "fastest" | "cheapest" | "balanced";

/** Ein Abschnitt der berechneten Route zwischen zwei benachbarten Staedten. */
export interface RouteLeg {
  from: City;
  to: City;
  edge: Edge;
  distance_km: number;
  driving_hours: number;
  toll_eur: number;
  fuel_eur: number;
  ferry_eur: number;
}

/** Ergebnis einer Routenberechnung ueber beliebig viele Stopps. */
export interface RouteResult {
  legs: RouteLeg[];
  cities: City[];
  distance_km: number;
  driving_hours: number;
  /** Fahrzeit inklusive vorgeschriebener Pausen und Ruhezeiten */
  elapsed_hours: number;
  rest_hours: number;
  toll_eur: number;
  fuel_eur: number;
  ferry_eur: number;
  driver_eur: number;
  wear_eur: number;
  total_cost_eur: number;
  countries: string[];
  mountain_zones: string[];
  ferry_count: number;
}
