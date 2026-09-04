/**
 * Fuhrpark - Ausbaustufe 2.
 *
 * Alle Kennzahlen stammen aus fleet.ts. Diese Datei stellt nur dar.
 */
import type { City } from "../core/types";
import type { Vehicle } from "../core/fleet";
import {
  capacityOf,
  consumptionOf,
  displayName,
  residualValue,
  trailerModel,
  truckModel,
} from "../core/fleet";
import { fmtEur, fmtKm } from "../core/data";
import { KeyValues, Panel, type ValueTone } from "./win95";

interface Props {
  vehicles: Vehicle[];
  cities: City[];
}

const STATUS_LABEL: Record<Vehicle["status"], [string, ValueTone]> = {
  idle: ["verfügbar", "good"],
  on_tour: ["in Tour", "warn"],
  workshop: ["Werkstatt", "bad"],
};

function conditionTone(condition: number): ValueTone {
  if (condition >= 70) return "good";
  if (condition >= 50) return "warn";
  return "bad";
}

export function FleetView({ vehicles, cities }: Props) {
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const year = new Date().getFullYear();

  const total = vehicles.reduce((s, v) => s + residualValue(v, year), 0);
  const counts = {
    idle: vehicles.filter((v) => v.status === "idle").length,
    on_tour: vehicles.filter((v) => v.status === "on_tour").length,
    workshop: vehicles.filter((v) => v.status === "workshop").length,
  };

  return (
    <>
      <Panel title={`Fahrzeuge (${vehicles.length})`}>
        {vehicles.length === 0 ? (
          <div class="notice">Kein Fahrzeug im Bestand.</div>
        ) : (
          <div class="list">
            {vehicles.map((v) => {
              const cap = capacityOf(v);
              const [statusText, statusTone] = STATUS_LABEL[v.status];
              const loc = cityById.get(v.location_id);
              const trailer = v.trailer_id
                ? trailerModel(v.trailer_id).name
                : "ohne Auflieger";
              return (
                <div class="vehicle-row">
                  <div class="row-between">
                    <strong>{displayName(v)}</strong>
                    <span class={statusTone}>{statusText}</span>
                  </div>
                  <KeyValues
                    rows={[
                      ["Kennzeichen", v.plate, "dim"],
                      ["Baujahr", String(v.year), "dim"],
                      ["Laufleistung", fmtKm(v.odometer_km), "dim"],
                      [
                        "Zustand",
                        `${v.condition} %`,
                        conditionTone(v.condition),
                      ],
                      ["Auflieger", trailer, "dim"],
                      [
                        "Kapazität",
                        `${(cap.payload_kg / 1000).toLocaleString("de-DE")} t · ${cap.volume_m3} m³ · ${cap.loading_meters} LDM`,
                        "dim",
                      ],
                      [
                        "Verbrauch beladen",
                        `${consumptionOf(v, true).toFixed(1).replace(".", ",")} l/100 km`,
                        "dim",
                      ],
                      ["Standort", loc ? `${loc.city} (${loc.iso2})` : "–", "dim"],
                      ["Restwert", fmtEur(residualValue(v, year)), ""],
                    ]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Fuhrpark-Übersicht">
        <KeyValues
          rows={[
            ["Fahrzeuge gesamt", String(vehicles.length)],
            ["Verfügbar", String(counts.idle), "good"],
            ["In Tour", String(counts.on_tour), "warn"],
            ["In der Werkstatt", String(counts.workshop), "bad"],
            ["Fuhrparkwert", fmtEur(total)],
          ]}
        />
        <div class="stage-note">
          Fahrzeuge kaufen und Auflieger wechseln folgen in Ausbaustufe 3.
        </div>
      </Panel>
    </>
  );
}

/** Nur zur Anzeige des Modellnamens an anderer Stelle. */
export function modelLabel(modelId: string): string {
  const m = truckModel(modelId);
  return `${m.make} ${m.model}`;
}
