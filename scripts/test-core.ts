import { readFileSync } from "node:fs";
import { buildGraph, planRoute } from "../src/core/routing";
import { vehicleById } from "../src/core/economy";
import type { CityFile, RoadFile, Optimization } from "../src/core/types";

const cities = (JSON.parse(readFileSync("public/data/cities.json", "utf8")) as CityFile).cities;
const edges = (JSON.parse(readFileSync("public/data/roads.json", "utf8")) as RoadFile).edges;
const g = buildGraph(cities, edges);
const byName = new Map(cities.map(c => [c.city, c.id]));
const semi = vehicleById("semi");

const tests: [string, string[]][] = [
  ["Hamburg -> Rom", ["Hamburg", "Rom"]],
  ["Hamburg -> München -> Verona -> Rom", ["Hamburg", "München", "Verona", "Rom"]],
  ["Duisburg -> Mailand", ["Duisburg", "Mailand"]],
  ["Rotterdam -> Barcelona", ["Rotterdam", "Barcelona"]],
];

for (const [label, names] of tests) {
  console.log(`\n=== ${label} ===`);
  for (const opt of ["fastest", "cheapest", "balanced"] as Optimization[]) {
    const ids = names.map(n => byName.get(n)!);
    const r = planRoute(g, ids, opt, semi);
    if (!r) { console.log(opt, "keine Route"); continue; }
    console.log(
      `${opt.padEnd(9)} ${String(Math.round(r.distance_km)).padStart(5)} km | ` +
      `Fahrt ${r.driving_hours.toFixed(1).padStart(5)} h | ` +
      `gesamt ${r.elapsed_hours.toFixed(1).padStart(5)} h | ` +
      `Maut ${Math.round(r.toll_eur).toString().padStart(4)} | ` +
      `Sprit ${Math.round(r.fuel_eur).toString().padStart(4)} | ` +
      `Fahrer ${Math.round(r.driver_eur).toString().padStart(4)} | ` +
      `Gesamt ${Math.round(r.total_cost_eur).toString().padStart(5)} EUR | ` +
      `${r.countries.join(",")}`
    );
  }
}

// Erloes-Gegenprobe fuer Hamburg -> Rom
const r = planRoute(g, [byName.get("Hamburg")!, byName.get("Rom")!], "balanced", semi)!;
const rate = r.distance_km > 1500 ? 1.25 : r.distance_km > 700 ? 1.40 : 1.70;
const erloes = r.distance_km * rate * 1.15; // Maschinen
console.log(`\nErloes bei ${rate} EUR/km x 1,15 (Maschinen): ${Math.round(erloes)} EUR`);
console.log(`Ergebnis Hinfahrt: ${Math.round(erloes - r.total_cost_eur)} EUR`);
