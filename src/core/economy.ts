/**
 * Wirtschaftliche Kennwerte.
 *
 * Alle Zahlen stammen aus der recherchierten Datengrundlage
 * (SpediPro95_Wirtschaftsdaten_v1.0). Sie stehen ausschliesslich hier -
 * nirgends sonst im Code darf eine Wirtschaftszahl auftauchen.
 */
import type { VehicleClass } from "./types";

export const ECONOMY = {
  /** Netto-Einkaufspreis Diesel je Liter (Tankkarte, ohne Umsatzsteuer) */
  diesel_eur_per_liter: 1.86,
  /** AdBlue-Zuschlag auf die Kraftstoffkosten */
  adblue_surcharge: 0.03,
  /** Arbeitgeberkosten je Fahrerstunde, mittlere Erfahrungsstufe */
  driver_eur_per_hour: 24.0,
  /** Spesen je vollem Abwesenheitstag */
  per_diem_full_eur: 29.0,
  /** Spesen je An- oder Abreisetag */
  per_diem_partial_eur: 14.0,
  /** Wartungsruecklage je Kilometer bei gutem Fahrzeugzustand */
  maintenance_eur_per_km: 0.14,
  /** Be- und Entladezeit je Stopp in Stunden */
  handling_hours_per_stop: 0.75,
  /** Kuerzere Abfertigung an Logistikdrehkreuzen */
  handling_hours_hub: 0.5,
} as const;

/**
 * Verbrauchsaufschlaege.
 *
 * Ein Sattelzug verbraucht auf einer Alpenetappe deutlich mehr als in der
 * Ebene: Steigungen kosten Kraftstoff, den die Talfahrt nicht zurueckgibt.
 * Landstrassen kosten durch Anfahren und Bremsen ebenfalls mehr als eine
 * gleichmaessig befahrene Autobahn.
 */
export const CONSUMPTION = {
  /** Aufschlag je Gebirgszone */
  mountain: {
    Alpen: 1.28,
    Pyrenäen: 1.24,
    Karpaten: 1.18,
    Dinariden: 1.2,
    Skanden: 1.14,
    Apennin: 1.15,
    Kantabrien: 1.16,
    "Schottl. HL": 1.12,
  } as Record<string, number>,
  /** Falls eine Zone nicht in der Liste steht */
  mountain_default: 1.18,
  /** Landstrasse gegenueber Autobahn */
  trunk: 1.07,
} as const;

/** Lenk- und Ruhezeiten nach EU-Verordnung 561/2006. */
export const DRIVING_RULES = {
  /** Lenkzeit bis zur vorgeschriebenen Pause */
  max_hours_before_break: 4.5,
  break_hours: 0.75,
  /** Taegliche Hoechstlenkzeit */
  max_daily_driving_hours: 9,
  /** Taegliche Ruhezeit */
  daily_rest_hours: 11,
} as const;

export const VEHICLE_CLASSES: VehicleClass[] = [
  {
    id: "van",
    name: "Transporter 3,5 t",
    consumption_laden: 11,
    consumption_empty: 9,
    payload_kg: 1500,
    volume_m3: 20,
    loading_meters: 4.2,
    toll_share: 0.43,
  },
  {
    id: "rigid",
    name: "Solo-LKW 7,5 t",
    consumption_laden: 18,
    consumption_empty: 15,
    payload_kg: 7500,
    volume_m3: 45,
    loading_meters: 7.2,
    toll_share: 0.7,
  },
  {
    id: "semi",
    name: "Sattelzug 40 t",
    consumption_laden: 30,
    consumption_empty: 24,
    payload_kg: 24000,
    volume_m3: 90,
    loading_meters: 13.6,
    toll_share: 1.0,
  },
  {
    id: "roadtrain",
    name: "Gliederzug",
    consumption_laden: 34,
    consumption_empty: 27,
    payload_kg: 30000,
    volume_m3: 120,
    loading_meters: 18.0,
    toll_share: 1.0,
  },
];

export function vehicleById(id: string): VehicleClass {
  const v = VEHICLE_CLASSES.find((x) => x.id === id);
  if (!v) throw new Error(`Unbekannte Fahrzeugklasse: ${id}`);
  return v;
}

/**
 * Fuegt Pausen und Ruhezeiten in eine reine Lenkzeit ein.
 * Gibt die tatsaechlich verstrichene Zeit und die reine Ruhezeit zurueck.
 */
export function applyRestPeriods(drivingHours: number): {
  elapsed: number;
  rest: number;
} {
  const r = DRIVING_RULES;
  let remaining = drivingHours;
  let elapsed = 0;
  let rest = 0;

  while (remaining > 0) {
    // Ein Fahrertag: hoechstens 9 Stunden Lenkzeit, Pause nach 4,5 Stunden
    const today = Math.min(remaining, r.max_daily_driving_hours);
    elapsed += today;
    remaining -= today;

    const breaks = Math.max(0, Math.ceil(today / r.max_hours_before_break) - 1);
    elapsed += breaks * r.break_hours;
    rest += breaks * r.break_hours;

    if (remaining > 0) {
      elapsed += r.daily_rest_hours;
      rest += r.daily_rest_hours;
    }
  }
  return { elapsed, rest };
}
