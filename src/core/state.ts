/**
 * Spielzustand.
 *
 * Eine einzige Quelle der Wahrheit. Jede Anzeige leitet sich hieraus ab -
 * nichts wird doppelt gehalten (Grundregel, Konzept Kapitel 2).
 */
import type { City } from "./types";
import type { Vehicle } from "./fleet";
import { TRUCK_MODELS, truckModel, usedPrice } from "./fleet";
import { generateOrders, makeRng, type Order } from "./orders";

export type Difficulty = "hard" | "normal" | "easy";

export interface Company {
  name: string;
  home_id: string;
  cash_eur: number;
  reputation: number;
  founded: string;
}

export interface GameState {
  seed: number;
  day: number;
  company: Company;
  vehicles: Vehicle[];
  orders: Order[];
  /** Angenommene Auftraege, noch nicht ausgeliefert */
  accepted: string[];
}

const START: Record<
  Difficulty,
  { cash: number; trucks: { model: string; age: number }[] }
> = {
  hard: { cash: 40_000, trucks: [{ model: "iveron_sway", age: 7 }] },
  normal: { cash: 90_000, trucks: [{ model: "dav_xf", age: 3 }] },
  easy: {
    cash: 220_000,
    trucks: [
      { model: "mak_tgr", age: 3 },
      { model: "volund_fh", age: 3 },
    ],
  },
};

function plate(homeIso: string, n: number): string {
  return `${homeIso}-SP ${100 + n}`;
}

export function createGame(
  cities: City[],
  opts: {
    home_id: string;
    difficulty: Difficulty;
    company_name: string;
    seed?: number;
  },
): GameState {
  const home = cities.find((c) => c.id === opts.home_id);
  if (!home) throw new Error(`Unbekannter Heimatstandort: ${opts.home_id}`);

  const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);
  const rng = makeRng(seed);
  const preset = START[opts.difficulty];
  const year = new Date().getFullYear();

  const vehicles: Vehicle[] = preset.trucks.map((t, i) => {
    const model = truckModel(t.model);
    return {
      id: `V-${i + 1}`,
      model_id: model.id,
      trailer_id: "curtain_std",
      plate: plate(home.iso2, i + 1),
      year: year - t.age,
      odometer_km: Math.round(t.age * (90_000 + rng() * 40_000)),
      condition: Math.round(96 - t.age * 4 - rng() * 8),
      status: "idle",
      location_id: home.id,
      purchase_price: usedPrice(model, t.age),
    };
  });

  const state: GameState = {
    seed,
    day: 1,
    company: {
      name: opts.company_name,
      home_id: home.id,
      cash_eur: preset.cash,
      reputation: 3,
      founded: new Date().toISOString().slice(0, 10),
    },
    vehicles,
    orders: [],
    accepted: [],
  };

  state.orders = refreshOrders(state, cities);
  return state;
}

/**
 * Auftragsboerse neu bestuecken.
 * Der Umkreis waechst mit dem Ruf - wer sich einen Namen macht, bekommt
 * Anfragen aus weiterer Entfernung.
 */
export function refreshOrders(state: GameState, cities: City[]): Order[] {
  const home = cities.find((c) => c.id === state.company.home_id);
  if (!home) return [];
  return generateOrders(cities, {
    count: 30,
    seed: state.seed + state.day * 7919,
    home,
    radius_km: 250 + state.company.reputation * 80,
    reputation: state.company.reputation,
  });
}

/** Verkaufsangebote fuer neue und gebrauchte Fahrzeuge. */
export function vehicleMarket(seed: number) {
  const rng = makeRng(seed);
  const offers: {
    model_id: string;
    age: number;
    price: number;
    odometer_km: number;
    condition: number;
  }[] = [];

  for (const model of TRUCK_MODELS) {
    for (const age of [0, 3, 7]) {
      offers.push({
        model_id: model.id,
        age,
        price: usedPrice(model, age),
        odometer_km: Math.round(age * (85_000 + rng() * 45_000)),
        condition: Math.round(98 - age * 5 - rng() * 6),
      });
    }
  }
  return offers;
}
