/**
 * Fahrzeugmodelle und Fuhrpark.
 *
 * Die Modellnamen sind bewusst erfunden. Sie lehnen sich erkennbar an die
 * Originale an, ohne Markenrechte zu beruehren (Entscheidung A1).
 */
import type { TrailerKind } from "./cargo";
import type { VehicleClass } from "./types";
import { vehicleById } from "./economy";

export interface TruckModel {
  id: string;
  /** Herstellername, frei erfunden */
  make: string;
  model: string;
  /** Fahrzeugklasse aus economy.ts */
  class_id: string;
  /** Neupreis in Euro */
  price_new: number;
  /** Abweichung vom Klassenverbrauch, 1.0 = Klassenwert */
  consumption_factor: number;
  /** Wie robust das Modell ist: niedriger = weniger Verschleiss */
  wear_factor: number;
  /** Grafik-ID aus dem Asset-Manifest */
  asset: string;
}

export const TRUCK_MODELS: TruckModel[] = [
  {
    id: "kastor_city",
    make: "Kastor",
    model: "City 35",
    class_id: "van",
    price_new: 48_000,
    consumption_factor: 1.0,
    wear_factor: 1.0,
    asset: "truck_light_a",
  },
  {
    id: "mercur_vito",
    make: "Mercur",
    model: "Vitan 316",
    class_id: "van",
    price_new: 54_000,
    consumption_factor: 0.94,
    wear_factor: 0.92,
    asset: "truck_light_b",
  },
  {
    id: "mak_tgl",
    make: "MAK",
    model: "TGL 12.220",
    class_id: "rigid",
    price_new: 78_000,
    consumption_factor: 1.0,
    wear_factor: 1.0,
    asset: "truck_solo_a",
  },
  {
    id: "dav_lf",
    make: "DAV",
    model: "LF 260",
    class_id: "rigid",
    price_new: 82_000,
    consumption_factor: 0.96,
    wear_factor: 1.05,
    asset: "truck_solo_b",
  },
  {
    id: "mak_tgr",
    make: "MAK",
    model: "TGR 18.510",
    class_id: "semi",
    price_new: 118_000,
    consumption_factor: 1.0,
    wear_factor: 1.0,
    asset: "truck_tractor_a",
  },
  {
    id: "mercur_aktor",
    make: "Mercur",
    model: "Aktor 1851",
    class_id: "semi",
    price_new: 124_000,
    consumption_factor: 0.95,
    wear_factor: 0.9,
    asset: "truck_tractor_b",
  },
  {
    id: "skandia_s500",
    make: "Skandia",
    model: "S 500",
    class_id: "semi",
    price_new: 129_000,
    consumption_factor: 0.93,
    wear_factor: 0.85,
    asset: "truck_tractor_c",
  },
  {
    id: "volund_fh",
    make: "Völund",
    model: "FH 500",
    class_id: "semi",
    price_new: 126_000,
    consumption_factor: 0.94,
    wear_factor: 0.88,
    asset: "truck_tractor_d",
  },
  {
    id: "dav_xf",
    make: "DAV",
    model: "XF 480",
    class_id: "semi",
    price_new: 112_000,
    consumption_factor: 0.98,
    wear_factor: 1.02,
    asset: "truck_tractor_e",
  },
  {
    id: "iveron_sway",
    make: "Iveron",
    model: "S-Way 460",
    class_id: "semi",
    price_new: 105_000,
    consumption_factor: 1.04,
    wear_factor: 1.12,
    asset: "truck_vintage_a",
  },
  {
    id: "renaud_t",
    make: "Renaud",
    model: "T 460",
    class_id: "semi",
    price_new: 108_000,
    consumption_factor: 1.02,
    wear_factor: 1.08,
    asset: "truck_rigid_a",
  },
  {
    id: "mak_tgr_xxl",
    make: "MAK",
    model: "TGR 26.640 Gliederzug",
    class_id: "roadtrain",
    price_new: 152_000,
    consumption_factor: 1.0,
    wear_factor: 1.05,
    asset: "truck_rigid_b",
  },
];

export interface TrailerModel {
  id: string;
  name: string;
  kind: TrailerKind;
  price_new: number;
  payload_kg: number;
  volume_m3: number;
  loading_meters: number;
  asset: string;
}

export const TRAILER_MODELS: TrailerModel[] = [
  {
    id: "curtain_std",
    name: "Planenauflieger",
    kind: "curtain",
    price_new: 32_000,
    payload_kg: 24_000,
    volume_m3: 90,
    loading_meters: 13.6,
    asset: "trailer_curtain",
  },
  {
    id: "box_std",
    name: "Kofferauflieger",
    kind: "box",
    price_new: 38_000,
    payload_kg: 23_000,
    volume_m3: 86,
    loading_meters: 13.6,
    asset: "trailer_box",
  },
  {
    id: "reefer_std",
    name: "Kühlauflieger",
    kind: "reefer",
    price_new: 58_000,
    payload_kg: 22_000,
    volume_m3: 82,
    loading_meters: 13.2,
    asset: "trailer_reefer",
  },
  {
    id: "tank_std",
    name: "Tankauflieger",
    kind: "tank",
    price_new: 65_000,
    payload_kg: 26_000,
    volume_m3: 32,
    loading_meters: 13.6,
    asset: "trailer_tank",
  },
  {
    id: "silo_std",
    name: "Siloauflieger",
    kind: "silo",
    price_new: 61_000,
    payload_kg: 26_000,
    volume_m3: 38,
    loading_meters: 13.6,
    asset: "trailer_silo",
  },
  {
    id: "lowloader_std",
    name: "Tieflader",
    kind: "lowloader",
    price_new: 72_000,
    payload_kg: 28_000,
    volume_m3: 60,
    loading_meters: 13.6,
    asset: "trailer_lowloader",
  },
  {
    id: "cartrans_std",
    name: "Autotransporter",
    kind: "cartrans",
    price_new: 88_000,
    payload_kg: 15_000,
    volume_m3: 120,
    loading_meters: 18.0,
    asset: "trailer_cartrans",
  },
];

export type VehicleStatus = "idle" | "on_tour" | "workshop";

/** Ein konkretes Fahrzeug im Besitz des Spielers. */
export interface Vehicle {
  id: string;
  model_id: string;
  trailer_id: string | null;
  plate: string;
  /** Baujahr als Jahreszahl */
  year: number;
  odometer_km: number;
  /** Zustand 0-100 */
  condition: number;
  status: VehicleStatus;
  /** Stadt-ID des aktuellen Standorts */
  location_id: string;
  purchase_price: number;
}

export function truckModel(id: string): TruckModel {
  const m = TRUCK_MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`Unbekanntes Fahrzeugmodell: ${id}`);
  return m;
}

export function trailerModel(id: string): TrailerModel {
  const m = TRAILER_MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`Unbekannter Aufliegertyp: ${id}`);
  return m;
}

export function displayName(v: Vehicle): string {
  const m = truckModel(v.model_id);
  return `${m.make} ${m.model}`;
}

/**
 * Wirksame Kapazitaet: der Auflieger begrenzt, sofern einer angehaengt ist.
 * Ohne Auflieger gilt die Kapazitaet der Fahrzeugklasse.
 */
export function capacityOf(v: Vehicle): {
  payload_kg: number;
  volume_m3: number;
  loading_meters: number;
} {
  const cls: VehicleClass = vehicleById(truckModel(v.model_id).class_id);
  if (!v.trailer_id) {
    return {
      payload_kg: cls.payload_kg,
      volume_m3: cls.volume_m3,
      loading_meters: cls.loading_meters,
    };
  }
  const t = trailerModel(v.trailer_id);
  return {
    payload_kg: Math.min(cls.payload_kg, t.payload_kg),
    volume_m3: t.volume_m3,
    loading_meters: t.loading_meters,
  };
}

/** Verbrauch je 100 km unter Beruecksichtigung von Modell und Zustand. */
export function consumptionOf(v: Vehicle, laden: boolean): number {
  const m = truckModel(v.model_id);
  const cls = vehicleById(m.class_id);
  const base = laden ? cls.consumption_laden : cls.consumption_empty;
  // Unter 70 % Zustand steigt der Verbrauch spuerbar.
  const conditionPenalty = v.condition >= 70 ? 1 : 1 + (70 - v.condition) / 200;
  return base * m.consumption_factor * conditionPenalty;
}

/** Restwert nach Alter und Laufleistung. */
export function residualValue(v: Vehicle, currentYear: number): number {
  const m = truckModel(v.model_id);
  const age = Math.max(0, currentYear - v.year);
  const byAge = Math.pow(0.85, age);
  const byKm = Math.max(0.25, 1 - v.odometer_km / 1_600_000);
  const byCondition = 0.6 + (v.condition / 100) * 0.4;
  return Math.round(m.price_new * byAge * byKm * byCondition);
}

/** Gebrauchtpreis eines Modells nach Alter. */
export function usedPrice(model: TruckModel, ageYears: number): number {
  return Math.round(model.price_new * Math.pow(0.85, ageYears));
}
