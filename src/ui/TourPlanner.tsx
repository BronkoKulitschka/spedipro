/**
 * Tourenplanung mit Sammelladung - Ausbaustufe 3.
 *
 * Drei Stufen, pro Tour umschaltbar:
 *   Automatik   - das System wählt Aufträge und Reihenfolge
 *   Assistiert  - der Spieler wählt Aufträge, das System ordnet
 *   Manuell     - der Spieler ordnet die Stopps selbst
 *
 * Alle Zahlen stammen aus tour.ts. Diese Datei rechnet nichts.
 */
import type { City, Optimization } from "../core/types";
import type { Order } from "../core/orders";
import type { Capacity, TourResult } from "../core/tour";
import type { Vehicle } from "../core/fleet";
import { capacityOf, displayName } from "../core/fleet";
import { cargoById } from "../core/cargo";
import { fmtEur, fmtHours, fmtKm } from "../core/data";
import { Button, KeyValues, Panel, type ValueTone } from "./win95";

export type PlanMode = "auto" | "assisted" | "manual";

const MODE_LABEL: Record<PlanMode, string> = {
  auto: "Automatik",
  assisted: "Assistiert",
  manual: "Manuell",
};

const OPT_LABEL: Record<Optimization, string> = {
  fastest: "Schnellste",
  cheapest: "Günstigste",
  balanced: "Ausgewogen",
};

interface Props {
  cities: City[];
  orders: Order[];
  vehicles: Vehicle[];
  vehicleId: string;
  mode: PlanMode;
  optimization: Optimization;
  result: TourResult | null;
  onVehicle: (id: string) => void;
  onMode: (m: PlanMode) => void;
  onOptimization: (o: Optimization) => void;
  onRemoveOrder: (orderId: string) => void;
  onMoveStop: (index: number, delta: number) => void;
  onClear: () => void;
  onAutoPlan: () => void;
  onOptimizeOrder: () => void;
}

/** Auslastungsbalken. Der erste, der Rot erreicht, blockiert die Zuladung. */
function LoadBar({
  label,
  share,
  detail,
}: {
  label: string;
  share: number;
  detail: string;
}) {
  const pct = Math.min(100, Math.round(share * 100));
  const tone = share > 1 ? "over" : share > 0.9 ? "high" : "ok";
  return (
    <div class="loadbar">
      <div class="loadbar-head">
        <span>{label}</span>
        <span class={`loadbar-pct ${tone}`}>{Math.round(share * 100)} %</span>
      </div>
      <div class="loadbar-track sunken">
        <div class={`loadbar-fill ${tone}`} style={`width:${pct}%`} />
      </div>
      <div class="loadbar-detail">{detail}</div>
    </div>
  );
}

export function TourPlanner({
  cities,
  orders,
  vehicles,
  vehicleId,
  mode,
  optimization,
  result,
  onVehicle,
  onMode,
  onOptimization,
  onRemoveOrder,
  onMoveStop,
  onClear,
  onAutoPlan,
  onOptimizeOrder,
}: Props) {
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  const cap: Capacity | null = vehicle ? capacityOf(vehicle) : null;

  const peak = result?.peak ?? { weight: 0, volume: 0, ldm: 0 };
  const profitTone: ValueTone = !result
    ? ""
    : result.profit_eur > 0
      ? "good"
      : "bad";

  return (
    <>
      <Panel title="Fahrzeug">
        {vehicles.length === 0 ? (
          <div class="notice">Kein Fahrzeug im Fuhrpark.</div>
        ) : (
          <select
            class="field"
            value={vehicleId}
            onChange={(e) => onVehicle((e.currentTarget as HTMLSelectElement).value)}
            aria-label="Fahrzeug"
          >
            {vehicles.map((v) => (
              <option value={v.id}>
                {displayName(v)} · {v.plate}
              </option>
            ))}
          </select>
        )}
      </Panel>

      <Panel title="Planungsstufe">
        <div class="row" style="margin-bottom:6px">
          {(Object.keys(MODE_LABEL) as PlanMode[]).map((m) => (
            <Button class="spread" pressed={mode === m} onClick={() => onMode(m)}>
              {MODE_LABEL[m]}
            </Button>
          ))}
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
        {mode === "auto" && (
          <Button class="wide" onClick={onAutoPlan} style="margin-top:6px">
            Tour automatisch erstellen
          </Button>
        )}
        {mode === "assisted" && (
          <Button class="wide" onClick={onOptimizeOrder} style="margin-top:6px">
            Reihenfolge optimieren
          </Button>
        )}
        <div class="stage-note">
          {mode === "auto" &&
            "Wählt Aufträge und Reihenfolge selbst. Erreicht bewusst nicht das Optimum."}
          {mode === "assisted" &&
            "Aufträge aus der Auftragsliste hinzufügen, die Reihenfolge übernimmt das System."}
          {mode === "manual" &&
            "Stopps von Hand sortieren. Hier holt gute Planung die letzten Prozente heraus."}
        </div>
      </Panel>

      {cap && (
        <Panel title="Auslastung">
          <LoadBar
            label="Gewicht"
            share={peak.weight}
            detail={`max. ${(peak.weight * cap.payload_kg / 1000).toFixed(1).replace(".", ",")} t von ${(cap.payload_kg / 1000).toFixed(0)} t`}
          />
          <LoadBar
            label="Volumen"
            share={peak.volume}
            detail={`max. ${(peak.volume * cap.volume_m3).toFixed(1).replace(".", ",")} m³ von ${cap.volume_m3} m³`}
          />
          <LoadBar
            label="Lademeter"
            share={peak.ldm}
            detail={`max. ${(peak.ldm * cap.loading_meters).toFixed(1).replace(".", ",")} von ${cap.loading_meters} LDM`}
          />
        </Panel>
      )}

      <Panel title={`Ladungen (${result?.order_ids.length ?? 0})`}>
        {!result || result.order_ids.length === 0 ? (
          <div class="notice">
            In der Auftragsliste auf „Zur Tour hinzufügen" tippen.
          </div>
        ) : (
          <div class="list">
            {result.order_ids.map((id) => {
              const o = orderById.get(id);
              if (!o) return null;
              const cargo = cargoById(o.cargo_id);
              return (
                <div class="list-item">
                  <span class="spread">
                    {cargo?.name} · {(o.weight_kg / 1000).toFixed(1).replace(".", ",")} t
                    · {o.loading_meters} LDM
                  </span>
                  <span class="good">{fmtEur(o.revenue_eur)}</span>
                  <Button
                    class="btn-sys"
                    title="Ladung entfernen"
                    aria-label="Ladung entfernen"
                    onClick={() => onRemoveOrder(id)}
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {result && result.order_ids.length > 0 && (
          <Button class="wide" onClick={onClear} style="margin-top:6px">
            Tour leeren
          </Button>
        )}
      </Panel>

      {result && result.stops.length > 0 && (
        <Panel title={`Stopps (${result.stops.length})`}>
          <div class="list">
            {result.stops.map((s, i) => {
              const city = cityById.get(s.city_id);
              const o = orderById.get(s.order_id);
              const cargo = o ? cargoById(o.cargo_id) : undefined;
              const load = result.load[i];
              return (
                <div class="stop-row">
                  <div class="row">
                    <span class="stop-index">{i + 1}</span>
                    <span
                      class={`dot ${s.action === "pickup" ? "dot-start" : "dot-end"}`}
                    />
                    <span class="spread">
                      {city?.city} ({city?.iso2})
                    </span>
                    <span class="dim">
                      {s.action === "pickup" ? "aufnehmen" : "abliefern"}
                    </span>
                    {mode === "manual" && (
                      <>
                        <Button
                          class="btn-sys"
                          title="Nach oben"
                          aria-label="Stopp nach oben"
                          disabled={i === 0}
                          onClick={() => onMoveStop(i, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          class="btn-sys"
                          title="Nach unten"
                          aria-label="Stopp nach unten"
                          disabled={i === result.stops.length - 1}
                          onClick={() => onMoveStop(i, 1)}
                        >
                          ↓
                        </Button>
                      </>
                    )}
                  </div>
                  <div class="stop-detail">
                    {cargo?.name} · an Bord danach{" "}
                    {(load.weight_kg / 1000).toFixed(1).replace(".", ",")} t ·{" "}
                    {load.volume_m3} m³ · {load.loading_meters} LDM
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {result && result.problems.length > 0 && (
        <Panel title={`Probleme (${result.problems.length})`}>
          <ul class="problems">
            {result.problems.map((p) => (
              <li>
                {p.stop_index >= 0 && <b>Stopp {p.stop_index + 1}: </b>}
                {p.message}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Kalkulation">
        {!result || !result.route ? (
          <div class="notice">
            Mindestens eine Ladung wählen, dann wird gerechnet.
          </div>
        ) : (
          <>
            <KeyValues
              rows={[
                ["Strecke", fmtKm(result.route.distance_km)],
                ["Reine Fahrzeit", fmtHours(result.route.driving_hours)],
                [
                  "Pausen und Ruhezeit",
                  fmtHours(result.route.rest_hours),
                  "dim",
                ],
                ["Dauer gesamt", fmtHours(result.route.elapsed_hours)],
                [
                  "Verbrauch",
                  `${Math.round(result.route.fuel_liters).toLocaleString("de-DE")} l · ${(
                    (result.route.fuel_liters / result.route.distance_km) *
                    100
                  )
                    .toFixed(1)
                    .replace(".", ",")} l/100 km`,
                  "dim",
                ],
              ]}
            />
            <hr class="sep" />
            <KeyValues
              rows={[
                ["Kraftstoff", fmtEur(result.route.fuel_eur), "bad"],
                ["Maut", fmtEur(result.route.toll_eur), "bad"],
                ...(result.route.ferry_eur > 0
                  ? ([["Fähren", fmtEur(result.route.ferry_eur), "bad"]] as [
                      string,
                      string,
                      ValueTone,
                    ][])
                  : []),
                ["Fahrer inkl. Spesen", fmtEur(result.route.driver_eur), "bad"],
                ["Wartungsrücklage", fmtEur(result.route.wear_eur), "bad"],
                ["Kosten gesamt", fmtEur(result.cost_eur), "bad"],
              ]}
            />
            <hr class="sep" />
            <KeyValues
              rows={[
                ["Erlös", fmtEur(result.revenue_eur), "good"],
                ["Ergebnis", fmtEur(result.profit_eur), profitTone],
                [
                  "je Kilometer",
                  `${(result.profit_eur / result.route.distance_km)
                    .toFixed(2)
                    .replace(".", ",")} €`,
                  profitTone,
                ],
                ...(result.route.mountain_zones.length > 0
                  ? ([
                      [
                        "Gebirge",
                        result.route.mountain_zones.join(", "),
                        "warn",
                      ],
                    ] as [string, string, ValueTone][])
                  : []),
              ]}
            />
            {!result.valid && (
              <div class="notice error" style="padding:6px 0 0">
                Diese Tour ist nicht fahrbar. Siehe Probleme oben.
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
