import { readFileSync } from "node:fs";
import { createGame } from "../src/core/state";
import { capacityOf, consumptionOf, displayName, residualValue } from "../src/core/fleet";
import { cargoById } from "../src/core/cargo";
import { revenuePerKm } from "../src/core/orders";
import { buildGraph, planRoute } from "../src/core/routing";
import { vehicleById } from "../src/core/economy";
import { truckModel } from "../src/core/fleet";
import type { CityFile, RoadFile } from "../src/core/types";

const cities = (JSON.parse(readFileSync("public/data/cities.json","utf8")) as CityFile).cities;
const edges = (JSON.parse(readFileSync("public/data/roads.json","utf8")) as RoadFile).edges;
const home = cities.find(c => c.starting_city_suitable)!;
const g = createGame(cities, { home_id: home.id, difficulty: "normal", company_name: "Spedition Müller GmbH", seed: 20260904 });

console.log(`Firma: ${g.company.name}, Sitz ${home.city}, Kasse ${g.company.cash_eur} EUR`);
const year = new Date().getFullYear();
for (const v of g.vehicles) {
  const c = capacityOf(v);
  console.log(`  ${displayName(v)} | ${v.plate} | BJ ${v.year} | ${v.odometer_km.toLocaleString("de-DE")} km | Zustand ${v.condition}% | ${c.payload_kg/1000}t ${c.volume_m3}m³ ${c.loading_meters}LDM | ${consumptionOf(v,true).toFixed(1)} l | Restwert ${residualValue(v,year)} EUR`);
}

console.log(`\nAufträge: ${g.orders.length}`);
const graph = buildGraph(cities, edges);
const byId = new Map(cities.map(c=>[c.id,c]));
const cls = vehicleById(truckModel(g.vehicles[0].model_id).class_id);

let profit = 0, loss = 0;
for (const o of g.orders) {
  const r = planRoute(graph, [o.from_id, o.to_id], "balanced", cls);
  if (!r) { console.log("keine Route", o.id); continue; }
  const p = o.revenue_eur - r.total_cost_eur;
  p >= 0 ? profit++ : loss++;
}
console.log(`Mit echten Routenkosten: ${profit} profitabel, ${loss} defizitär (Einzelfahrt ohne Rückfracht)`);

const best = g.orders.map(o => ({o, r: planRoute(graph,[o.from_id,o.to_id],"balanced",cls)!}))
  .filter(x=>x.r).map(x=>({...x, p: x.o.revenue_eur - x.r.total_cost_eur}))
  .sort((a,b)=>b.p-a.p);
console.log("\nBeste 3:");
for (const x of best.slice(0,3))
  console.log(`  ${cargoById(x.o.cargo_id)!.name.padEnd(18)} ${byId.get(x.o.from_id)!.city} -> ${byId.get(x.o.to_id)!.city}: Erlös ${x.o.revenue_eur} - Kosten ${Math.round(x.r.total_cost_eur)} = ${Math.round(x.p)} EUR (${revenuePerKm(x.o).toFixed(2)}/km)`);
console.log("Schlechteste 3:");
for (const x of best.slice(-3))
  console.log(`  ${cargoById(x.o.cargo_id)!.name.padEnd(18)} ${byId.get(x.o.from_id)!.city} -> ${byId.get(x.o.to_id)!.city}: Erlös ${x.o.revenue_eur} - Kosten ${Math.round(x.r.total_cost_eur)} = ${Math.round(x.p)} EUR (${revenuePerKm(x.o).toFixed(2)}/km)`);
