/**
 * Auftragsbörse - Ausbaustufe 2.
 *
 * Zeigt die von orders.ts erzeugten Auftraege. Der Erloes je Kilometer wird
 * berechnet, nicht gespeichert.
 */
import { useMemo, useState } from "preact/hooks";
import type { City } from "../core/types";
import { cargoById } from "../core/cargo";
import { URGENCY_LABEL, revenuePerKm, type Order } from "../core/orders";
import { fmtEur, fmtKm } from "../core/data";
import { Button, KeyValues, Panel, type ValueTone } from "./Win98";

interface Props {
  orders: Order[];
  cities: City[];
  /** Bereits in der Tour enthaltene Aufträge */
  chosen: string[];
  /** Filter auf eine auf der Karte angetippte Stadt */
  cityFilter: string | null;
  onAdd: (order: Order) => void;
  onRefresh: () => void;
  onClearCityFilter: () => void;
}

type SortKey = "revenue" | "per_km" | "distance";

const SORT_LABEL: Record<SortKey, string> = {
  per_km: "€/km",
  revenue: "Erlös",
  distance: "Strecke",
};

const URGENCY_TONE: Record<Order["urgency"], ValueTone> = {
  express: "bad",
  standard: "dim",
  flexible: "good",
};

export function OrderBoard({
  orders,
  cities,
  chosen,
  cityFilter,
  onAdd,
  onRefresh,
  onClearCityFilter,
}: Props) {
  const [sort, setSort] = useState<SortKey>("per_km");
  const [onlyGood, setOnlyGood] = useState(false);
  const cityById = useMemo(
    () => new Map(cities.map((c) => [c.id, c])),
    [cities],
  );

  const visible = useMemo(() => {
    let list = orders.slice();
    if (cityFilter) {
      list = list.filter(
        (o) => o.from_id === cityFilter || o.to_id === cityFilter,
      );
    }
    if (onlyGood) list = list.filter((o) => revenuePerKm(o) >= 1.6);
    list.sort((a, b) => {
      switch (sort) {
        case "revenue":
          return b.revenue_eur - a.revenue_eur;
        case "distance":
          return a.distance_km - b.distance_km;
        case "per_km":
          return revenuePerKm(b) - revenuePerKm(a);
      }
    });
    return list;
  }, [orders, sort, onlyGood, cityFilter]);

  return (
    <>
      <Panel title="Filter">
        <div class="row" style="margin-bottom:6px">
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <Button
              class="spread"
              pressed={sort === k}
              onClick={() => setSort(k)}
            >
              {SORT_LABEL[k]}
            </Button>
          ))}
        </div>
        <div class="row">
          <Button
            class="spread"
            pressed={onlyGood}
            onClick={() => setOnlyGood(!onlyGood)}
          >
            Nur lukrative
          </Button>
          <Button class="spread" onClick={onRefresh}>
            Aktualisieren
          </Button>
        </div>
      </Panel>

      {cityFilter && (
        <div class="filter-chip raised">
          <span class="spread">
            Nur Aufträge mit{" "}
            <b>{cityById.get(cityFilter)?.city ?? cityFilter}</b>
          </span>
          <Button onClick={onClearCityFilter}>Filter aufheben</Button>
        </div>
      )}

      <Panel title={`Verfügbare Aufträge (${visible.length})`}>
        {visible.length === 0 ? (
          <div class="notice">Keine Aufträge, die zum Filter passen.</div>
        ) : (
          <div class="list">
            {visible.map((o) => {
              const cargo = cargoById(o.cargo_id);
              const from = cityById.get(o.from_id);
              const to = cityById.get(o.to_id);
              if (!cargo || !from || !to) return null;
              const perKm = revenuePerKm(o);
              return (
                <div class="order-row">
                  <div class="row-between">
                    <strong>{cargo.name}</strong>
                    <span class={URGENCY_TONE[o.urgency]}>
                      {URGENCY_LABEL[o.urgency]}
                    </span>
                  </div>
                  <div class="route-line">
                    <span class="dot dot-start" /> {from.city} ({from.iso2})
                    <span class="arrow">→</span>
                    <span class="dot dot-end" /> {to.city} ({to.iso2})
                  </div>
                  <KeyValues
                    rows={[
                      [
                        "Ladung",
                        `${(o.weight_kg / 1000).toLocaleString("de-DE")} t · ${o.volume_m3} m³ · ${o.loading_meters} LDM`,
                        "dim",
                      ],
                      ["Strecke", fmtKm(o.distance_km), "dim"],
                      ["Erlös", fmtEur(o.revenue_eur), "good"],
                      [
                        "Erlös je km",
                        `${perKm.toFixed(2).replace(".", ",")} €`,
                        perKm >= 1.6 ? "good" : perKm >= 1.2 ? "warn" : "bad",
                      ],
                      ["Zahlungsziel", `${o.payment_days} Tage`, "dim"],
                      ["Vertragsstrafe", fmtEur(o.penalty_eur), "bad"],
                      ...(o.adr
                        ? ([["Hinweis", "ADR-Schein nötig", "warn"]] as [
                            string,
                            string,
                            ValueTone,
                          ][])
                        : []),
                    ]}
                  />
                  <Button
                    class="order-plan"
                    disabled={chosen.includes(o.id)}
                    onClick={() => onAdd(o)}
                    title="Diese Ladung der Tour hinzufügen"
                  >
                    {chosen.includes(o.id)
                      ? "Bereits in der Tour"
                      : "Zur Tour hinzufügen"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <div class="stage-note">
          Stadt auf der Karte antippen filtert diese Liste.
        </div>
      </Panel>
    </>
  );
}
