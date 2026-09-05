/**
 * SPEDIPRO 95 — der virtuelle Rechner.
 *
 * Die Anwendung stellt einen Arbeitsplatz im Stil von Windows 98 dar:
 * Symbole auf der Arbeitsfläche, Startleiste mit Startmenü und Uhr, und
 * für jedes Modul ein eigenes Programmfenster mit eigener Menüleiste.
 *
 * Grundregel des Projekts: Nichts ist Dekoration. Jede angezeigte Zahl wird
 * aus dem Spielzustand berechnet, und was nicht installiert ist, lässt sich
 * nicht starten.
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
import {
  Button,
  Dialog,
  Win98Window,
  type Menu,
  type WindowState,
} from "./ui/Win98";
import { Icon } from "./ui/Icon";
import { Taskbar } from "./ui/Taskbar";
import { PROGRAMS, programById, type ProgramId } from "./ui/programs";
import { MapCanvas } from "./ui/MapCanvas";
import { TourPlanner, type PlanMode } from "./ui/TourPlanner";
import { FleetView } from "./ui/FleetView";
import { OrderBoard } from "./ui/OrderBoard";
import { APP_VERSION, useServiceWorker } from "./ui/serviceWorker";

/** Unter dieser Breite füllt jedes Fenster den Bildschirm. */
const NARROW = 820;

interface OpenWindow extends WindowState {
  program: ProgramId;
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return narrow;
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
  const [dialog, setDialog] = useState<{ title: string; text: string } | null>(
    null,
  );
  const [selectedIcon, setSelectedIcon] = useState<ProgramId | null>(null);

  const narrow = useNarrow();

  /* ── Fensterverwaltung ────────────────────────────────────────── */

  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const patch = (id: string, p: Partial<OpenWindow>) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...p } : w)));

  const focus = (id: string) => {
    setActiveId(id);
    setWindows((prev) => {
      const top = Math.max(0, ...prev.map((w) => w.z));
      return prev.map((w) => (w.id === id ? { ...w, z: top + 1 } : w));
    });
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveId(null);
  };

  /** Programm starten oder, falls es schon läuft, nach vorn holen. */
  const launch = (id: ProgramId) => {
    const program = programById(id);
    if (!program.installed) {
      setDialog({
        title: "Programm kann nicht gestartet werden",
        text: `${program.file} wurde auf diesem Rechner nicht gefunden. Das Programm ist noch nicht installiert.`,
      });
      return;
    }

    const existing = windows.find((w) => w.program === id);
    if (existing) {
      if (existing.minimized) patch(existing.id, { minimized: false });
      focus(existing.id);
      return;
    }

    const n = windows.length;
    const top = Math.max(0, ...windows.map((w) => w.z));
    const wid = `win-${id}`;
    setWindows((prev) => [
      ...prev,
      {
        id: wid,
        program: id,
        title: program.title,
        x: 40 + (n % 6) * 28,
        y: 30 + (n % 6) * 26,
        w: Math.min(640, Math.max(320, window.innerWidth - 140)),
        h: Math.min(580, Math.max(300, window.innerHeight - 150)),
        z: top + 1,
        minimized: false,
        maximized: false,
      },
    ]);
    setActiveId(wid);
  };

  /* ── Spieldaten ───────────────────────────────────────────────── */

  useEffect(() => {
    loadGameData(import.meta.env.BASE_URL)
      .then((d) => {
        setCities(d.cities);
        setEdges(d.edges);
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

  const vehicle = useMemo(() => {
    if (!game) return null;
    return (
      game.vehicles.find((v) => v.id === vehicleId) ?? game.vehicles[0] ?? null
    );
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

  /** Einzige Quelle für alle Tourzahlen. */
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

  /* ── Tourbearbeitung ──────────────────────────────────────────── */

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
    launch("touren");
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
    setStops(
      autoPlan(
        graph,
        game.orders,
        cityMap,
        capacity,
        vehicleClass,
        optimization,
        { startCityId: game.company.home_id },
      ).stops,
    );
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

  const pickCity = (c: City) => {
    setCityFilter((prev) => (prev === c.id ? null : c.id));
    launch("auftraege");
  };

  const nextDay = () => {
    if (!game || !cities) return;
    const next: GameState = { ...game, day: game.day + 1 };
    setGame({ ...next, orders: refreshOrders(next, cities) });
    setStops([]);
  };

  const sw = useServiceWorker();

  /* ── Ladezustand ──────────────────────────────────────────────── */

  if (error || !cities || !graph || !game) {
    return (
      <div class="desktop">
        <div
          class="window"
          style="left:50%;top:40%;transform:translate(-50%,-50%);width:min(340px,90%);height:auto;min-height:0"
        >
          <div class="titlebar">
            <span class="titlebar-text">Spedipro 95</span>
          </div>
          <div class="window-body">
            <div class={`notice ${error ? "error" : ""}`}>
              {error ?? "Spieldaten werden geladen …"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const home = cities.find((c) => c.id === game.company.home_id);

  /* ── Programminhalte ──────────────────────────────────────────── */

  const content = (id: ProgramId): ComponentChildren => {
    switch (id) {
      case "karte":
        return (
          <>
            <MapCanvas
              cities={cities}
              edges={edges}
              stops={result?.route_stop_ids ?? []}
              highlight={cityFilter}
              route={result?.route ?? null}
              onPickCity={pickCity}
            />
            <div class="map-legend groove">
              <span>
                <i class="swatch" style="background:#00a800" /> Start
              </span>
              <span>
                <i class="swatch" style="background:#a8a800" /> Zwischenstopp
              </span>
              <span>
                <i class="swatch" style="background:#a80000" /> Ziel
              </span>
              <span>
                <i class="swatch line-swatch" style="background:#5555ff" /> Route
              </span>
              <span>
                <i class="swatch line-swatch" style="background:#ffff00" />{" "}
                Autobahn
              </span>
              <span>
                <i class="swatch line-swatch" style="background:#c0c0c0" />{" "}
                Landstraße
              </span>
              <span>
                <i class="swatch line-swatch" style="background:#00a8a8" /> Fähre
              </span>
            </div>
          </>
        );
      case "touren":
        return (
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
        );
      case "fuhrpark":
        return <FleetView vehicles={game.vehicles} cities={cities} />;
      case "auftraege":
        return (
          <OrderBoard
            orders={game.orders}
            cities={cities}
            chosen={result?.order_ids ?? []}
            cityFilter={cityFilter}
            onAdd={addOrder}
            onRefresh={nextDay}
            onClearCityFilter={() => setCityFilter(null)}
          />
        );
      default:
        return <div class="notice">Dieses Programm ist nicht installiert.</div>;
    }
  };

  const infoOption = {
    label: "Info …",
    onSelect: () =>
      setDialog({
        title: "Info",
        text: `Spedipro 95, Fassung ${APP_VERSION}. ${game.company.name}, Sitz ${
          home ? home.city : "unbekannt"
        }. Kontostand ${fmtEur(game.company.cash_eur)}, Spieltag ${game.day}.`,
      }),
  };

  const menusFor = (w: OpenWindow): Menu[] => {
    const datei: Menu = {
      label: "Datei",
      options: [
        { label: "Nächster Spieltag", shortcut: "F5", onSelect: nextDay },
        {
          label: "Beenden",
          separatorBefore: true,
          onSelect: () => closeWindow(w.id),
        },
      ],
    };
    const hilfe: Menu = { label: "?", options: [infoOption] };

    if (w.program === "touren") {
      return [
        datei,
        {
          label: "Tour",
          options: [
            { label: "Automatisch planen", onSelect: runAutoPlan },
            { label: "Reihenfolge optimieren", onSelect: optimizeOrder },
            {
              label: "Tour leeren",
              separatorBefore: true,
              onSelect: () => setStops([]),
            },
          ],
        },
        hilfe,
      ];
    }

    if (w.program === "karte") {
      return [
        datei,
        {
          label: "Ansicht",
          options: [
            {
              label: "Filter aufheben",
              disabled: cityFilter === null,
              onSelect: () => setCityFilter(null),
            },
          ],
        },
        hilfe,
      ];
    }

    return [datei, hilfe];
  };

  return (
    <div
      class="desktop"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).classList.contains("desktop-icons")) {
          setSelectedIcon(null);
        }
      }}
    >
      <div class="desktop-icons">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            type="button"
            class={[
              "desk-icon",
              selectedIcon === p.id ? "selected" : "",
              p.installed ? "" : "pending",
            ]
              .join(" ")
              .trim()}
            title={
              p.installed
                ? `${p.file} starten`
                : `${p.file} — nicht installiert`
            }
            onClick={() => {
              // Erstes Antippen wählt aus, das zweite startet. Ein echter
              // Doppelklick ist auf Berührungsgeräten unzuverlässig.
              if (selectedIcon === p.id) launch(p.id);
              else setSelectedIcon(p.id);
            }}
            onDblClick={() => launch(p.id)}
          >
            <Icon id={p.icon} size={48} />
            <span class="desk-label">{p.label}</span>
          </button>
        ))}
      </div>

      {windows.map((w) => (
        <Win98Window
          key={w.id}
          state={w}
          active={activeId === w.id}
          fullscreen={narrow}
          menus={menusFor(w)}
          onChange={(p) => patch(w.id, p)}
          onFocus={() => focus(w.id)}
          onClose={() => closeWindow(w.id)}
        >
          {content(w.program)}
        </Win98Window>
      ))}

      {dialog && (
        <Dialog
          title={dialog.title}
          message={dialog.text}
          onClose={() => setDialog(null)}
        />
      )}

      {sw.updateAvailable && (
        <div class="update-bar raised">
          <span class="spread">Eine neue Fassung ist bereit.</span>
          <Button onClick={sw.applyUpdate}>Jetzt laden</Button>
          <Button onClick={sw.dismiss}>Später</Button>
        </div>
      )}

      <Taskbar
        tasks={windows.map((w) => ({
          id: w.id,
          title: w.title,
          icon: programById(w.program).icon,
          active: activeId === w.id,
          minimized: w.minimized,
        }))}
        programs={PROGRAMS.map((p) => ({
          id: p.id,
          label: p.label,
          icon: p.icon,
          enabled: p.installed,
        }))}
        extras={[
          {
            label: "Nächster Spieltag",
            icon: "einstellungen",
            onSelect: nextDay,
          },
        ]}
        onTask={(id) => {
          const w = windows.find((x) => x.id === id);
          if (!w) return;
          if (activeId === id && !w.minimized) patch(id, { minimized: true });
          else {
            patch(id, { minimized: false });
            focus(id);
          }
        }}
        onStart={(id) => launch(id as ProgramId)}
      />
    </div>
  );
}
