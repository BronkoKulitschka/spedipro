/**
 * Tourenplanung - Ausbaustufe 1.
 *
 * Alle Kennzahlen kommen aus planRoute(). Diese Datei rechnet nichts selbst,
 * sie stellt nur dar.
 */
import type { City, Optimization, RouteResult, VehicleClass } from "../core/types";
import { VEHICLE_CLASSES } from "../core/economy";
import { fmtEur, fmtHours, fmtKm } from "../core/data";
import { Button, KeyValues, Panel } from "./win95";

interface Props {
  cities: City[];
  stops: string[];
  route: RouteResult | null;
  optimization: Optimization;
  vehicle: VehicleClass;
  onRemoveStop: (index: number) => void;
  onMoveStop: (index: number, delta: number) => void;
  onClearStops: () => void;
  onOptimization: (o: Optimization) => void;
  onVehicle: (id: string) => void;
}

const OPT_LABEL: Record<Optimization, string> = {
  fastest: "Schnellste",
  cheapest: "Günstigste",
  balanced: "Ausgewogen",
};

export function RoutePlanner({
  cities,
  stops,
  route,
  optimization,
  vehicle,
  onRemoveStop,
  onMoveStop,
  onClearStops,
  onOptimization,
  onVehicle,
}: Props) {
  const byId = new Map(cities.map((c) => [c.id, c]));

  return (
    <>
      <Panel title="Fahrzeug und Ziel">
        <div class="row" style="margin-bottom:6px">
          <select
            class="field"
            value={vehicle.id}
            onChange={(e) => onVehicle((e.currentTarget as HTMLSelectElement).value)}
            aria-label="Fahrzeugklasse"
          >
            {VEHICLE_CLASSES.map((v) => (
              <option value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div class="row">
          {(Object.keys(OPT_LABEL) as Optimization[]).map((o) => (
            <Button
              class="spread"
              pressed={optimization === o}
              onClick={() => onOptimization(o)}
            >
              {OPT_LABEL[o]}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title={`Routen-Stops (${stops.length})`} bodyClass="">
        {stops.length === 0 ? (
          <div class="notice">
            Stadt auf der Karte antippen, um sie als Stopp hinzuzufügen.
          </div>
        ) : (
          <div class="list" style="max-height:190px">
            {stops.map((id, i) => {
              const c = byId.get(id);
              if (!c) return null;
              const dotClass =
                i === 0
                  ? "dot-start"
                  : i === stops.length - 1 && stops.length > 1
                    ? "dot-end"
                    : "dot-stop";
              return (
                <div class="list-item">
                  <span class="stop-index">{i + 1}</span>
                  <span class={`dot ${dotClass}`} />
                  <span class="spread">
                    {c.city} ({c.iso2})
                  </span>
                  <Button
                    class="btn-sys"
                    title="Nach oben"
                    aria-label={`${c.city} nach oben`}
                    disabled={i === 0}
                    onClick={() => onMoveStop(i, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    class="btn-sys"
                    title="Nach unten"
                    aria-label={`${c.city} nach unten`}
                    disabled={i === stops.length - 1}
                    onClick={() => onMoveStop(i, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    class="btn-sys"
                    title="Entfernen"
                    aria-label={`${c.city} entfernen`}
                    onClick={() => onRemoveStop(i)}
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {stops.length > 0 && (
          <div class="row" style="margin-top:6px">
            <Button class="spread" onClick={onClearStops}>
              Alle entfernen
            </Button>
          </div>
        )}
      </Panel>

      <Panel title="Kalkulation">
        {!route ? (
          <div class="notice">
            Mindestens zwei Stopps wählen, dann wird gerechnet.
          </div>
        ) : (
          <>
            <KeyValues
              rows={[
                ["Strecke", fmtKm(route.distance_km)],
                ["Reine Fahrzeit", fmtHours(route.driving_hours)],
                ["Pausen und Ruhezeit", fmtHours(route.rest_hours), "dim"],
                ["Dauer gesamt", fmtHours(route.elapsed_hours)],
              ]}
            />
            <hr class="sep" />
            <KeyValues
              rows={[
                ["Kraftstoff", fmtEur(route.fuel_eur), "bad"],
                ["Maut", fmtEur(route.toll_eur), "bad"],
                ...(route.ferry_eur > 0
                  ? ([["Fähren", fmtEur(route.ferry_eur), "bad"]] as [
                      string,
                      string,
                      "bad",
                    ][])
                  : []),
                ["Fahrer inkl. Spesen", fmtEur(route.driver_eur), "bad"],
                ["Wartungsrücklage", fmtEur(route.wear_eur), "bad"],
              ]}
            />
            <hr class="sep" />
            <KeyValues
              rows={[
                ["Kosten gesamt", fmtEur(route.total_cost_eur), "bad"],
                [
                  "Kosten je km",
                  `${(route.total_cost_eur / route.distance_km)
                    .toFixed(2)
                    .replace(".", ",")} €`,
                  "dim",
                ],
              ]}
            />
            <hr class="sep" />
            <KeyValues
              rows={[
                ["Länder", route.countries.join(", ") || "–", "dim"],
                [
                  "Gebirge",
                  route.mountain_zones.join(", ") || "keine",
                  route.mountain_zones.length > 0 ? "warn" : "dim",
                ],
                [
                  "Fähren",
                  route.ferry_count === 0 ? "keine" : String(route.ferry_count),
                  route.ferry_count > 0 ? "warn" : "dim",
                ],
                ["Abschnitte", String(route.legs.length), "dim"],
              ]}
            />
          </>
        )}
      </Panel>
    </>
  );
}
