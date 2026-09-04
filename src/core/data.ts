/** Laden der Spieldaten und Hilfsfunktionen fuer Karte und Anzeige. */
import type { City, CityFile, RoadFile, Edge } from "./types";

export interface GameData {
  cities: City[];
  edges: Edge[];
  tollRates: Record<string, number>;
}

export async function loadGameData(base: string): Promise<GameData> {
  const [cityRes, roadRes] = await Promise.all([
    fetch(`${base}data/cities.json`),
    fetch(`${base}data/roads.json`),
  ]);
  if (!cityRes.ok || !roadRes.ok) {
    throw new Error("Spieldaten konnten nicht geladen werden.");
  }
  const cityFile: CityFile = await cityRes.json();
  const roadFile: RoadFile = await roadRes.json();
  return {
    cities: cityFile.cities,
    edges: roadFile.edges,
    tollRates: roadFile.toll_rates_ct_per_km,
  };
}

/**
 * Mercator-Projektion. Sie haelt Winkel korrekt, wodurch Laenderumrisse
 * vertraut aussehen - bei einer Europakarte der entscheidende Punkt.
 */
export function project(lat: number, lon: number): { x: number; y: number } {
  const rad = (lat * Math.PI) / 180;
  return {
    x: lon,
    y: -Math.log(Math.tan(Math.PI / 4 + rad / 2)) * (180 / Math.PI),
  };
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function boundsOf(cities: City[]): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of cities) {
    const p = project(c.latitude, c.longitude);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY };
}

/** Zahlformat mit deutschem Tausenderpunkt. */
const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtKm = (v: number) => `${nf0.format(Math.round(v))} km`;
export const fmtEur = (v: number) => `${nf0.format(Math.round(v))} €`;
export const fmtEur2 = (v: number) => `${nf2.format(v)} €`;

export function fmtHours(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh}:${String(mm).padStart(2, "0")} h`;
}
