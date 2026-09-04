/**
 * SpediPro 95
 *
 * Ausbaustufe 1: Karte, Routing, Kostenberechnung.
 * Ausbaustufe 2: Fuhrpark, Auftragsbörse.
 *
 * Grundregel des Projekts: Nichts ist Dekoration. Was noch nicht funktioniert,
 * erscheint auch nicht.
 */
import { useEffect, useMemo, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { City, Edge, Optimization } from "./core/types";
import { fmtEur, loadGameData } from "./core/data";
import { buildGraph } from "./core/routing";
import { vehicleById } from "./core/economy";
import { createGame, refreshOrders, type GameState } from "./core/state";
import { capacityOf, truckModel } from "./core/fleet";
import {
  autoPlan,
  evaluateTour,
  naiveStops,
  optimizeStopOrder,
  type TourStop,
} from "./core/tour";
import type { Order } from "./core/orders";
import { Button, Clock, Window, type WindowState } from "./ui/win95";
import { MapCanvas } from "./ui/MapCanvas";
import { TourPlanner, type PlanMode } from "./ui/TourPlanner";
import { FleetView } from "./ui/FleetView";
import { OrderBoard } from "./ui/OrderBoard";
import { APP_VERSION, UpdateBar, useServiceWorker } from "./ui/serviceWorker";

const MOBILE_BREAKPOINT = 860;

type ViewId = "map" | "plan" | "fleet" | "orders";

const VIEW_TITLE: Record<ViewId, string> = {
  map: "Europa-Karte",
  plan: "Tourenplanung",
  fleet: "Fuhrpark",
  orders: "Aufträge",
};

const NAV_LABEL: Record<ViewId, string> = {
  map: "Karte",
  plan: "Touren",
  fleet: "Fuhrpark",
  orders: "Aufträge",
};

const NAV_GLYPH: Record<ViewId, string> = {
  map: "◍",
  plan: "▤",
  fleet: "▦",
  orders: "▣",
};

const VIEW_ORDER: ViewId[] = ["map", "plan", "orders", "fleet"];

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

export function App() {
  const [cities, setCities] = useState<City[] | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameState | null>(null);

  const [stops, setStops] = useState<TourStop[]>([]);
  const [optimization, setOptimization] = useState<Optimization>("balanced");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [mode, setMode] = useState<PlanMode>("assisted");
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const [tab, setTab] = useState<ViewId>("map");
  const sw = useServiceWorker();

  useEffect(() => {
    loadGameData(import.meta.env.BASE_URL)
      .then((d) => {
        setCities(d.cities);
        setEdges(d.edges);
        // Heimatstandort: erste geeignete Stadt. Frei wählbar ab Stufe 3.
        const home =
          d.cities.find((c) => c.starting_city_suitable) ?? d.cities[0];
        setGame(
          createGame(d.cities, {
            home_id: home.id,
            difficulty: "normal",
            company_name: "Spedition Müller GmbH",
            seed: 20260904,
          }),
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const graph = useMemo(
    () => (cities ? buildGraph(cities, edges) : null),
    [cities, edges],
  );

  /** Aktuell gewähltes Fahrzeug, mit Rückfall auf das erste im Fuhrpark. */
  const vehicle = useMemo(() => {
    if (!game) return null;
    return game.vehicles.find((v) => v.id === vehicleId) ?? game.vehicles[0] ?? null;
  }, [game, vehicleId]);

  const capacity = useMemo(
    () => (vehicle ? capacityOf(vehicle) : null),
    [vehicle],
  );

  const vehicleClass = useMemo(
    () => (vehicle ? vehicleById(truckModel(vehicle.model_id).class_id) : null),
    [vehicle],
  );

  const cityMap = useMemo(
    () => new Map((cities ?? []).map((c) => [c.id, c])),
    [cities],
  );

  /** Das gesamte Tourergebnis - einzige Quelle für alle angezeigten Zahlen. */
  const result = useMemo(() => {
    if (!graph || !game || !capacity || !vehicleClass) return null;
    if (stops.length === 0) return null;
    return evaluateTour(
      graph,
      stops,
      game.orders,
      capacity,
      vehicleClass,
      optimization,
    );
  }, [graph, game, stops, capacity, vehicleClass, optimization]);

  /** Für die Karte: die Städte der Tour in Reihenfolge. */
  const routeStops = result?.route_stop_ids ?? [];

  const addOrder = (o: Order) => {
    if (!game || !capacity) return;
    const ids = [...new Set([...stops.map((s) => s.order_id), o.id])];
    setStops(
      mode === "manual"
        ? naiveStops(ids, game.orders)
        : optimizeStopOrder(
            ids,
            game.orders,
            cityMap,
            capacity,
            game.company.home_id,
          ),
    );
  };

  const removeOrder = (orderId: string) =>
    setStops((prev) => prev.filter((s) => s.order_id !== orderId));

  const moveStop = (i: number, delta: number) =>
    setStops((prev) => {
      const next = [...prev];
      const j = i + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const runAutoPlan = () => {
    if (!graph || !game || !capacity || !vehicleClass) return;
    const plan = autoPlan(
      graph,
      game.orders,
      cityMap,
      capacity,
      vehicleClass,
      optimization,
      { startCityId: game.company.home_id },
    );
    setStops(plan.stops);
  };

  const optimizeOrder = () => {
    if (!game || !capacity) return;
    setStops(
      optimizeStopOrder(
        [...new Set(stops.map((s) => s.order_id))],
        game.orders,
        cityMap,
        capacity,
        game.company.home_id,
      ),
    );
  };

  /** Karte antippen filtert die Auftragsliste auf diese Stadt. */
  const pickCity = (c: City) => {
    setCityFilter((prev) => (prev === c.id ? null : c.id));
    if (isMobile) setTab("orders");
  };

  const refresh = () => {
    if (!game || !cities) return;
    const next: GameState = { ...game, day: game.day + 1 };
    setGame({ ...next, orders: refreshOrders(next, cities) });
    setStops([]);
  };

  if (error) {
    return (
      <Shell title="SPEDIPRO 95">
        <div class="notice error">{error}</div>
      </Shell>
    );
  }

  if (!cities || !graph || !game) {
    return (
      <Shell title="SPEDIPRO 95">
        <div class="notice">Spieldaten werden geladen …</div>
      </Shell>
    );
  }

  const home = cities.find((c) => c.id === game.company.home_id);

  const companyBar = (
    <div class="company-bar raised">
      <span>
        <b>{game.company.name}</b>
      </span>
      <span>
        Sitz: <b>{home ? `${home.city} (${home.iso2})` : "–"}</b>
      </span>
      <span>
        Kontostand: <b class="good">{fmtEur(game.company.cash_eur)}</b>
      </span>
      <span>
        Ruf:{" "}
        <b class="stars">
          {"★".repeat(game.company.reputation)}
          {"☆".repeat(5 - game.company.reputation)}
        </b>
      </span>
      <span>
        Spieltag: <b>{game.day}</b>
      </span>
    </div>
  );

  const views: Record<ViewId, ComponentChildren> = {
    map: (
      <>
        <MapCanvas
          cities={cities}
          edges={edges}
          stops={routeStops}
          highlight={cityFilter}
          route={result?.route ?? null}
          onPickCity={pickCity}
        />
        <MapLegend />
      </>
    ),
    plan: (
      <TourPlanner
        cities={cities}
        orders={game.orders}
        vehicles={game.vehicles}
        vehicleId={vehicle?.id ?? ""}
        mode={mode}
        optimization={optimization}
        result={result}
        onVehicle={setVehicleId}
        onMode={setMode}
        onOptimization={setOptimization}
        onRemoveOrder={removeOrder}
        onMoveStop={moveStop}
        onClear={() => setStops([])}
        onAutoPlan={runAutoPlan}
        onOptimizeOrder={optimizeOrder}
      />
    ),
    fleet: <FleetView vehicles={game.vehicles} cities={cities} />,
    orders: (
      <OrderBoard
        orders={game.orders}
        cities={cities}
        chosen={result?.order_ids ?? []}
        cityFilter={cityFilter}
        onAdd={addOrder}
        onRefresh={refresh}
        onClearCityFilter={() => setCityFilter(null)}
      />
    ),
  };

  if (isMobile) {
    return (
      <div class="mobile-shell">
        <div class="mobile-title">
          <span class="spread">SPEDIPRO 95 · {VIEW_TITLE[tab]}</span>
          <span>{fmtEur(game.company.cash_eur)}</span>
        </div>
        <div class="mobile-body">{views[tab]}</div>
        <nav class="bottom-nav">
          {VIEW_ORDER.map((id) => (
            <Button
              key={id}
              class="nav-btn"
              pressed={tab === id}
              onClick={() => setTab(id)}
            >
              <span class="nav-glyph">{NAV_GLYPH[id]}</span>
              <span>{NAV_LABEL[id]}</span>
            </Button>
          ))}
        </nav>
        {sw.updateAvailable && (
          <UpdateBar onApply={sw.applyUpdate} onDismiss={sw.dismiss} />
        )}
      </div>
    );
  }

  return (
    <>
      <Desktop
        views={views}
        companyBar={companyBar}
        note={`v${APP_VERSION} · ${game.orders.length} Aufträge · ${result?.order_ids.length ?? 0} in Tour`}
      />
      {sw.updateAvailable && (
        <UpdateBar onApply={sw.applyUpdate} onDismiss={sw.dismiss} />
      )}
    </>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: ComponentChildren;
}) {
  return (
    <div class="mobile-shell">
      <div class="mobile-title">{title}</div>
      <div class="mobile-body">{children}</div>
    </div>
  );
}

function MapLegend() {
  return (
    <div class="map-legend raised">
      <span>
        <i class="swatch" style="background:#008000" /> Start
      </span>
      <span>
        <i class="swatch" style="background:#c08000" /> Zwischenstopp
      </span>
      <span>
        <i class="swatch" style="background:#c00000" /> Ziel
      </span>
      <span>
        <i class="swatch line-swatch" style="background:#2040d0" /> Route
      </span>
      <span>
        <i class="swatch line-swatch" style="background:#e8e0a8" /> Autobahn
      </span>
      <span>
        <i class="swatch line-swatch" style="background:#b8b8a0" /> Landstraße
      </span>
      <span>
        <i class="swatch line-swatch" style="background:#5a8ac0" /> Fähre
      </span>
    </div>
  );
}

/* ------------------------------------------------------ Fensterverwaltung */

function Desktop({
  views,
  companyBar,
  note,
}: {
  views: Record<ViewId, ComponentChildren>;
  companyBar: ComponentChildren;
  note: string;
}) {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 28;
    const side = Math.min(400, Math.max(330, w * 0.28));
    return [
      {
        id: "map",
        title: VIEW_TITLE.map,
        x: 12,
        y: 12,
        w: Math.max(420, w - side - 40),
        h: Math.max(320, h - 24),
        z: 1,
        minimized: false,
        maximized: false,
      },
      {
        id: "plan",
        title: VIEW_TITLE.plan,
        x: Math.max(440, w - side - 16),
        y: 12,
        w: side,
        h: Math.max(320, h - 24),
        z: 2,
        minimized: false,
        maximized: false,
      },
      {
        id: "orders",
        title: VIEW_TITLE.orders,
        x: 60,
        y: 60,
        w: side,
        h: Math.max(320, h - 120),
        z: 3,
        minimized: true,
        maximized: false,
      },
      {
        id: "fleet",
        title: VIEW_TITLE.fleet,
        x: 100,
        y: 90,
        w: side,
        h: Math.max(320, h - 160),
        z: 4,
        minimized: true,
        maximized: false,
      },
    ];
  });
  const [activeId, setActiveId] = useState<string>("plan");

  const patch = (id: string, p: Partial<WindowState>) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...p } : w)));

  const focus = (id: string) => {
    setActiveId(id);
    setWindows((prev) => {
      const top = Math.max(...prev.map((w) => w.z));
      return prev.map((w) => (w.id === id ? { ...w, z: top + 1 } : w));
    });
  };

  return (
    <>
      {windows.map((w) => (
        <Window
          key={w.id}
          state={w}
          active={activeId === w.id}
          onChange={(p) => patch(w.id, p)}
          onFocus={() => focus(w.id)}
        >
          {w.id === "map" ? (
            <>
              {companyBar}
              {views.map}
            </>
          ) : (
            views[w.id as ViewId]
          )}
        </Window>
      ))}

      <div class="taskbar raised">
        {windows.map((w) => (
          <Button
            key={w.id}
            class="task-item"
            pressed={activeId === w.id && !w.minimized}
            onClick={() => {
              if (w.minimized) patch(w.id, { minimized: false });
              focus(w.id);
            }}
          >
            {w.title}
          </Button>
        ))}
        <span class="stage-note spread">{note}</span>
        <Clock />
      </div>
    </>
  );
}
