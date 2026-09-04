/**
 * SpediPro 95 - Ausbaustufe 1: Karte, Routing, Kostenberechnung.
 *
 * Grundregel des Projekts: Nichts ist Dekoration. Was noch nicht funktioniert,
 * erscheint auch nicht. Deshalb gibt es hier bewusst nur zwei Fenster.
 */
import { useEffect, useMemo, useState } from "preact/hooks";
import type { City, Edge, Optimization } from "./core/types";
import { loadGameData } from "./core/data";
import { buildGraph, planRoute } from "./core/routing";
import { vehicleById } from "./core/economy";
import { Button, Clock, Window, type WindowState } from "./ui/win95";
import { MapCanvas } from "./ui/MapCanvas";
import { RoutePlanner } from "./ui/RoutePlanner";

const MOBILE_BREAKPOINT = 860;

type MobileTab = "map" | "plan";

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

  const [stops, setStops] = useState<string[]>([]);
  const [optimization, setOptimization] = useState<Optimization>("balanced");
  const [vehicleId, setVehicleId] = useState("semi");

  const isMobile = useIsMobile();
  const [tab, setTab] = useState<MobileTab>("map");

  useEffect(() => {
    loadGameData(import.meta.env.BASE_URL)
      .then((d) => {
        setCities(d.cities);
        setEdges(d.edges);
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

  /* ------------------------------------------------------------- Ladezustand */

  if (error) {
    return (
      <div class="mobile-shell">
        <div class="mobile-title">SPEDIPRO 95</div>
        <div class="mobile-body">
          <div class="notice error">{error}</div>
        </div>
      </div>
    );
  }

  if (!cities || !graph) {
    return (
      <div class="mobile-shell">
        <div class="mobile-title">SPEDIPRO 95</div>
        <div class="mobile-body">
          <div class="notice">Kartendaten werden geladen …</div>
        </div>
      </div>
    );
  }

  const mapView = (
    <MapCanvas
      cities={cities}
      edges={edges}
      stops={stops}
      route={route}
      onPickCity={pickCity}
    />
  );

  const legend = (
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

  const planner = (
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
  );

  /* ----------------------------------------------------------------- Mobil */

  if (isMobile) {
    return (
      <div class="mobile-shell">
        <div class="mobile-title">
          <span class="spread">
            SPEDIPRO 95 · {tab === "map" ? "KARTE" : "TOURENPLANUNG"}
          </span>
          <span>{cities.length} Städte</span>
        </div>

        <div class="mobile-body">
          {tab === "map" ? (
            <>
              {mapView}
              {legend}
            </>
          ) : (
            planner
          )}
        </div>

        <nav class="bottom-nav">
          <Button
            class="nav-btn"
            pressed={tab === "map"}
            onClick={() => setTab("map")}
          >
            <span class="nav-glyph">◍</span>
            <span>Karte</span>
          </Button>
          <Button
            class="nav-btn"
            pressed={tab === "plan"}
            onClick={() => setTab("plan")}
          >
            <span class="nav-glyph">▤</span>
            <span>Touren</span>
          </Button>
        </nav>
      </div>
    );
  }

  /* --------------------------------------------------------------- Desktop */

  return (
    <Desktop
      mapView={
        <>
          {mapView}
          {legend}
        </>
      }
      planner={planner}
      cityCount={cities.length}
      edgeCount={edges.length}
    />
  );
}

/* ------------------------------------------------------ Fensterverwaltung */

function Desktop({
  mapView,
  planner,
  cityCount,
  edgeCount,
}: {
  mapView: preact.ComponentChildren;
  planner: preact.ComponentChildren;
  cityCount: number;
  edgeCount: number;
}) {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 28;
    const planW = Math.min(380, Math.max(320, w * 0.28));
    return [
      {
        id: "map",
        title: "Europa-Karte",
        x: 12,
        y: 12,
        w: Math.max(420, w - planW - 40),
        h: Math.max(320, h - 24),
        z: 1,
        minimized: false,
        maximized: false,
      },
      {
        id: "plan",
        title: "Tourenplanung",
        x: Math.max(440, w - planW - 16),
        y: 12,
        w: planW,
        h: Math.max(320, h - 24),
        z: 2,
        minimized: false,
        maximized: false,
      },
    ];
  });
  const [activeId, setActiveId] = useState("plan");

  const patch = (id: string, p: Partial<WindowState>) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...p } : w)));

  const focus = (id: string) => {
    setActiveId(id);
    setWindows((prev) => {
      const top = Math.max(...prev.map((w) => w.z));
      return prev.map((w) => (w.id === id ? { ...w, z: top + 1 } : w));
    });
  };

  const content: Record<string, preact.ComponentChildren> = {
    map: mapView,
    plan: planner,
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
          {content[w.id]}
        </Window>
      ))}

      <div class="taskbar raised">
        <Button disabled title="Kommt in Ausbaustufe 2">
          Start
        </Button>
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
        <span class="stage-note spread">
          Ausbaustufe 1 · {cityCount} Städte · {edgeCount} Strecken
        </span>
        <Clock />
      </div>
    </>
  );
}
