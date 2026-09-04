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
import { buildGraph, planRoute } from "./core/routing";
import { vehicleById } from "./core/economy";
import { createGame, refreshOrders, type GameState } from "./core/state";
import { truckModel } from "./core/fleet";
import type { Order } from "./core/orders";
import { Button, Clock, Window, type WindowState } from "./ui/win95";
import { MapCanvas } from "./ui/MapCanvas";
import { RoutePlanner } from "./ui/RoutePlanner";
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

  const [stops, setStops] = useState<string[]>([]);
  const [optimization, setOptimization] = useState<Optimization>("balanced");
  const [vehicleId, setVehicleId] = useState("semi");

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

  const vehicle = useMemo(() => vehicleById(vehicleId), [vehicleId]);

  const route = useMemo(() => {
    if (!graph || stops.length < 2) return null;
    return planRoute(graph, stops, optimization, vehicle);
  }, [graph, stops, optimization, vehicle]);

  const pickCity = (c: City) =>
    setStops((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));

  const removeStop = (i: number) =>
    setStops((prev) => prev.filter((_, idx) => idx !== i));

  const moveStop = (i: number, delta: number) =>
    setStops((prev) => {
      const next = [...prev];
      const j = i + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  /** Auftrag in die Tourenplanung übernehmen und dorthin wechseln. */
  const planOrder = (o: Order) => {
    setStops([o.from_id, o.to_id]);
    if (game && game.vehicles.length > 0) {
      setVehicleId(truckModel(game.vehicles[0].model_id).class_id);
    }
    setTab("plan");
  };

  const refresh = () => {
    if (!game || !cities) return;
    const next: GameState = { ...game, day: game.day + 1 };
    setGame({ ...next, orders: refreshOrders(next, cities) });
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
          stops={stops}
          route={route}
          onPickCity={pickCity}
        />
        <MapLegend />
      </>
    ),
    plan: (
      <RoutePlanner
        cities={cities}
        stops={stops}
        route={route}
        optimization={optimization}
        vehicle={vehicle}
        onRemoveStop={removeStop}
        onMoveStop={moveStop}
        onClearStops={() => setStops([])}
        onOptimization={setOptimization}
        onVehicle={setVehicleId}
      />
    ),
    fleet: <FleetView vehicles={game.vehicles} cities={cities} />,
    orders: (
      <OrderBoard
        orders={game.orders}
        cities={cities}
        onPlan={planOrder}
        onRefresh={refresh}
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
        note={`v${APP_VERSION} · ${cities.length} Städte · ${edges.length} Strecken · ${game.orders.length} Aufträge`}
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
