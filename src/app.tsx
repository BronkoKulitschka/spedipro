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
import { loadGameData } from "./core/data";
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
import { MainMenu, READY, type MenuTarget } from "./ui/MainMenu";
import { APP_VERSION, UpdateBar, useServiceWorker } from "./ui/serviceWorker";

const MOBILE_BREAKPOINT = 860;

type ViewId = "menu" | "map" | "plan" | "fleet" | "orders";

const VIEW_TITLE: Record<ViewId, string> = {
  menu: "Hauptmenü",
  map: "Europa-Karte",
  plan: "Tourenplanung",
  fleet: "Fuhrpark",
  orders: "Aufträge",
};

const NAV_LABEL: Record<ViewId, string> = {
  menu: "Start",
  map: "Karte",
  plan: "Touren",
  fleet: "Fuhrpark",
  orders: "Aufträge",
};

const NAV_GLYPH: Record<ViewId, string> = {
  menu: "⌂",
  map: "◍",
  plan: "▤",
  fleet: "▦",
  orders: "▣",
};

const VIEW_ORDER: ViewId[] = ["menu", "map", "plan", "orders", "fleet"];

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
  const [tab, setTab] = useState<ViewId>("menu");
  const [pending, setPending] = useState<string | null>(null);
  const [openSignal, setOpenSignal] = useState<{ id: string; n: number }>({
    id: "",
    n: 0,
  });
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

  /**
   * Hauptmenü: fertige Module öffnen, offene melden sich.
   * Auf dem Desktop wird ein Fenster geöffnet, auf dem Handy umgeschaltet.
   */
  const openMenu = (target: MenuTarget) => {
    if (!READY.includes(target)) {
      setPending(target);
      return;
    }
    setPending(null);
    if (isMobile) setTab(target as ViewId);
    else setOpenSignal({ id: target, n: openSignal.n + 1 });
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

  const views: Record<ViewId, ComponentChildren> = {
    menu: (
      <MainMenu
        game={game}
        cities={cities}
        edges={edges}
        tour={result}
        onOpen={openMenu}
      />
    ),
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
        {tab !== "menu" && (
          <div class="mobile-title">
            <span class="spread">{VIEW_TITLE[tab]}</span>
          </div>
        )}
        <div class={`mobile-body ${tab === "menu" ? "flush" : ""}`}>
          {views[tab]}
        </div>
        {pending && (
          <PendingNotice target={pending} onClose={() => setPending(null)} />
        )}
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
        note={`v${APP_VERSION} · ${game.orders.length} Aufträge · ${result?.order_ids.length ?? 0} in Tour`}
        openSignal={openSignal}
      />
      {pending && (
        <PendingNotice target={pending} onClose={() => setPending(null)} />
      )}
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

const PENDING_LABEL: Record<string, string> = {
  personal: "Personal",
  workshop: "Werkstatt",
  ledger: "Kassenbuch",
  customers: "Kunden",
  stats: "Statistik",
  messages: "Nachrichten",
  settings: "Einstellungen",
};

/** Meldung für Module, die es noch nicht gibt. */
function PendingNotice({
  target,
  onClose,
}: {
  target: string;
  onClose: () => void;
}) {
  return (
    <div class="update-bar raised" role="status">
      <span class="spread">
        {PENDING_LABEL[target] ?? target} ist noch nicht gebaut.
      </span>
      <Button onClick={onClose}>Schließen</Button>
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

/**
 * Desktop-Ansicht.
 *
 * Das Hauptmenü liegt als Grundebene fest im Hintergrund - es ist selbst
 * schon ein Fenster im 95er-Stil. Die Modulfenster öffnen sich darüber und
 * lassen sich verschieben, in der Größe ändern und minimieren.
 */
function Desktop({
  views,
  note,
  openSignal,
}: {
  views: Record<ViewId, ComponentChildren>;
  note: string;
  openSignal: { id: string; n: number };
}) {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 28;
    const side = Math.min(420, Math.max(340, w * 0.3));
    const make = (
      id: ViewId,
      x: number,
      y: number,
      width: number,
      z: number,
    ): WindowState => ({
      id,
      title: VIEW_TITLE[id],
      x,
      y,
      w: width,
      h: Math.max(320, h - y - 16),
      z,
      minimized: true,
      maximized: false,
    });
    return [
      make("map", Math.round(w * 0.3), 20, Math.max(460, w * 0.55), 1),
      make("plan", Math.max(24, w - side - 24), 14, side, 2),
      make("orders", Math.round(w * 0.24), 44, side, 3),
      make("fleet", Math.round(w * 0.3), 70, side, 4),
    ];
  });
  const [activeId, setActiveId] = useState<string>("");

  const patch = (id: string, p: Partial<WindowState>) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...p } : w)));

  const focus = (id: string) => {
    setActiveId(id);
    setWindows((prev) => {
      const top = Math.max(...prev.map((w) => w.z));
      return prev.map((w) => (w.id === id ? { ...w, z: top + 1 } : w));
    });
  };

  // Öffnen aus dem Hauptmenü heraus
  useEffect(() => {
    if (!openSignal.id) return;
    patch(openSignal.id, { minimized: false });
    focus(openSignal.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal.n]);

  return (
    <>
      <div class="desktop-base">{views.menu}</div>

      {windows.map((w) => (
        <Window
          key={w.id}
          state={w}
          active={activeId === w.id}
          onChange={(p) => patch(w.id, p)}
          onFocus={() => focus(w.id)}
          onClose={() => patch(w.id, { minimized: true })}
        >
          {views[w.id as ViewId]}
        </Window>
      ))}

      <div class="taskbar raised">
        {windows.map((w) => (
          <Button
            key={w.id}
            class="task-item"
            pressed={activeId === w.id && !w.minimized}
            onClick={() => {
              if (w.minimized) {
                patch(w.id, { minimized: false });
                focus(w.id);
              } else if (activeId === w.id) {
                patch(w.id, { minimized: true });
              } else {
                focus(w.id);
              }
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
