import { readFileSync } from "node:fs";
import { buildGraph } from "../src/core/routing";
import { vehicleById } from "../src/core/economy";
import { createGame } from "../src/core/state";
import { truckModel, capacityOf } from "../src/core/fleet";
import { autoPlan, evaluateTour, naiveStops, optimizeStopOrder } from "../src/core/tour";
import { cargoById } from "../src/core/cargo";
import type { CityFile, RoadFile } from "../src/core/types";

const cities = (JSON.parse(readFileSync("public/data/cities.json","utf8")) as CityFile).cities;
const edges = (JSON.parse(readFileSync("public/data/roads.json","utf8")) as RoadFile).edges;
const graph = buildGraph(cities, edges);
const cityMap = new Map(cities.map(c => [c.id, c]));
const name = (id: string) => cityMap.get(id)!.city;

const home = cities.find(c => c.starting_city_suitable)!;
const g = createGame(cities, { home_id: home.id, difficulty: "normal", company_name: "Test", seed: 20260904 });
const v = g.vehicles[0];
const cap = capacityOf(v);
const cls = vehicleById(truckModel(v.model_id).class_id);
console.log(`Fahrzeug: ${cap.payload_kg/1000} t | ${cap.volume_m3} m³ | ${cap.loading_meters} LDM\n`);

// --- Einzelauftrag als Vergleichsmaßstab ---
const single = g.orders.map(o => {
  const r = evaluateTour(graph, naiveStops([o.id], g.orders), g.orders, cap, cls, "balanced");
  return { o, p: r.profit_eur };
}).sort((a,b)=>b.p-a.p);
console.log(`Bester Einzelauftrag: ${Math.round(single[0].p)} EUR (${cargoById(single[0].o.cargo_id)!.name})`);

// --- Automatik ---
const auto = autoPlan(graph, g.orders, cityMap, cap, cls, "balanced", { startCityId: home.id });
console.log(`\nAutomatik: ${auto.order_ids.length} Aufträge, ${auto.stops.length} Stopps`);
auto.stops.forEach((s, i) => {
  const l = auto.load[i];
  console.log(`  ${String(i+1).padStart(2)} ${s.action === "pickup" ? "auf " : "ab  "} ${name(s.city_id).padEnd(16)} -> ${(l.weight_kg/1000).toFixed(1).padStart(5)} t ${String(l.volume_m3).padStart(5)} m³ ${String(l.loading_meters).padStart(5)} LDM`);
});
console.log(`  Auslastung max: Gewicht ${(auto.peak.weight*100).toFixed(0)}% Volumen ${(auto.peak.volume*100).toFixed(0)}% LDM ${(auto.peak.ldm*100).toFixed(0)}%`);
console.log(`  Strecke ${Math.round(auto.route!.distance_km)} km | Erlös ${Math.round(auto.revenue_eur)} - Kosten ${Math.round(auto.cost_eur)} = ${Math.round(auto.profit_eur)} EUR`);
console.log(`  Gültig: ${auto.valid}`);

// --- Umsortierung bringt was? ---
const naive = evaluateTour(graph, naiveStops(auto.order_ids, g.orders), g.orders, cap, cls, "balanced");
console.log(`\nDieselben Aufträge unsortiert: ${naive.route ? Math.round(naive.route.distance_km)+" km" : "-"} | Gewinn ${Math.round(naive.profit_eur)} EUR | gültig ${naive.valid}`);
console.log(`Nach Umsortierung:            ${Math.round(auto.route!.distance_km)} km | Gewinn ${Math.round(auto.profit_eur)} EUR`);

// --- Überladung wird erkannt? ---
const heavy = [...g.orders].sort((a,b)=>b.weight_kg-a.weight_kg).slice(0,3);
const over = evaluateTour(graph, naiveStops(heavy.map(o=>o.id), g.orders), g.orders, cap, cls, "balanced");
console.log(`\nDrei schwerste Aufträge zusammen (${heavy.reduce((s,o)=>s+o.weight_kg,0)/1000} t):`);
console.log(`  gültig: ${over.valid}, Probleme: ${over.problems.length}`);
over.problems.slice(0,3).forEach(p => console.log(`    ${p.kind}: ${p.message}`));
