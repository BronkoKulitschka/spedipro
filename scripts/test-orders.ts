import { readFileSync } from "node:fs";
import { generateOrders, revenuePerKm } from "../src/core/orders";
import { cargoById } from "../src/core/cargo";
import type { CityFile } from "../src/core/types";

const cities = (JSON.parse(readFileSync("public/data/cities.json", "utf8")) as CityFile).cities;
const home = cities.find(c => c.city === "Halle (Saale)") ?? cities.find(c => c.starting_city_suitable)!;
console.log("Heimatstandort:", home.city);

const orders = generateOrders(cities, { count: 400, seed: 12345, home, radius_km: 350 });
const byId = new Map(cities.map(c => [c.id, c]));

console.log(`\n${orders.length} Aufträge erzeugt\n`);
for (const o of orders.slice(0, 12)) {
  const c = cargoById(o.cargo_id)!;
  console.log(
    `${c.name.padEnd(20)} ${String(o.weight_kg).padStart(6)} kg ${String(o.volume_m3).padStart(5)} m³ ` +
    `${String(o.loading_meters).padStart(5)} LDM | ${byId.get(o.from_id)!.city.padEnd(14)}-> ` +
    `${byId.get(o.to_id)!.city.padEnd(14)} ${String(o.distance_km).padStart(5)} km | ` +
    `${String(o.revenue_eur).padStart(6)} EUR (${revenuePerKm(o).toFixed(2)} /km) | ${o.urgency}`
  );
}

const rk = orders.map(revenuePerKm).sort((a,b)=>a-b);
const q = (p: number) => rk[Math.floor(rk.length*p)].toFixed(2);
console.log(`\nErlös je km: min ${q(0)} | 25% ${q(.25)} | median ${q(.5)} | 75% ${q(.75)} | max ${rk[rk.length-1].toFixed(2)}`);
console.log(`Distanz Ø: ${Math.round(orders.reduce((s,o)=>s+o.distance_km,0)/orders.length)} km`);

const cargoCount = new Map<string, number>();
for (const o of orders) cargoCount.set(o.cargo_id, (cargoCount.get(o.cargo_id) ?? 0) + 1);
console.log(`Verschiedene Frachtarten: ${cargoCount.size} von 40`);
const top = [...cargoCount.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
console.log("Häufigste:", top.map(([k,v])=>`${cargoById(k)!.name} ${v}`).join(", "));

// Reproduzierbarkeit
const again = generateOrders(cities, { count: 400, seed: 12345, home, radius_km: 350 });
console.log("Reproduzierbar:", JSON.stringify(orders) === JSON.stringify(again));
