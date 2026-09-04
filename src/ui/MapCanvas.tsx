/**
 * Europakarte auf Canvas.
 *
 * Jeder Punkt ist eine Stadt aus der Datenbank, jede Linie eine Kante aus dem
 * Strassennetz. Es wird nichts gezeichnet, was nicht in den Daten steht.
 */
import { useEffect, useRef } from "preact/hooks";
import type { City, Edge, RouteResult } from "../core/types";
import { boundsOf, project } from "../core/data";

interface Props {
  cities: City[];
  edges: Edge[];
  /** Städte der geplanten Tour in Reihenfolge */
  stops: string[];
  /** Auf der Karte angetippte Stadt, dient als Auftragsfilter */
  highlight: string | null;
  route: RouteResult | null;
  onPickCity: (city: City) => void;
}

interface View {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const COLOR = {
  sea: "#3060a8",
  road: "#b8b8a0",
  motorway: "#e8e0a8",
  ferry: "#5a8ac0",
  city: "#c04040",
  cityBig: "#e05050",
  route: "#2040d0",
  routeCasing: "#ffffff",
  start: "#008000",
  stop: "#c08000",
  end: "#c00000",
  label: "#000000",
  labelHalo: "#ffffff",
};

export function MapCanvas({
  cities,
  edges,
  stops,
  highlight,
  route,
  onPickCity,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ scale: 1, offsetX: 0, offsetY: 0 });
  const fitted = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  const cityById = useRef(new Map(cities.map((c) => [c.id, c])));
  cityById.current = new Map(cities.map((c) => [c.id, c]));

  /** Weltkoordinate -> Bildschirmkoordinate */
  const toScreen = (lat: number, lon: number) => {
    const p = project(lat, lon);
    const v = view.current;
    return { x: p.x * v.scale + v.offsetX, y: p.y * v.scale + v.offsetY };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Erstmalige Einpassung auf den Datenbereich
    if (!fitted.current) {
      const b = boundsOf(cities);
      const pad = 24;
      const scale = Math.min(
        (w - pad * 2) / (b.maxX - b.minX),
        (h - pad * 2) / (b.maxY - b.minY),
      );
      view.current = {
        scale,
        offsetX: pad - b.minX * scale,
        offsetY: pad - b.minY * scale,
      };
      fitted.current = true;
    }

    ctx.fillStyle = COLOR.sea;
    ctx.fillRect(0, 0, w, h);

    const zoom = view.current.scale;

    // Strassennetz
    for (const e of edges) {
      const a = cityById.current.get(e.from);
      const b = cityById.current.get(e.to);
      if (!a || !b) continue;
      const p1 = toScreen(a.latitude, a.longitude);
      const p2 = toScreen(b.latitude, b.longitude);
      if (
        (p1.x < 0 && p2.x < 0) ||
        (p1.x > w && p2.x > w) ||
        (p1.y < 0 && p2.y < 0) ||
        (p1.y > h && p2.y > h)
      )
        continue;

      if (e.type === "ferry") {
        ctx.strokeStyle = COLOR.ferry;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
      } else if (e.type === "motorway") {
        ctx.strokeStyle = COLOR.motorway;
        ctx.lineWidth = zoom > 12 ? 2 : 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = COLOR.road;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Berechnete Route: heller Rand darunter, damit sie sich abhebt
    if (route && route.legs.length > 0) {
      for (const pass of [0, 1]) {
        ctx.strokeStyle = pass === 0 ? COLOR.routeCasing : COLOR.route;
        ctx.lineWidth = pass === 0 ? 5 : 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        route.legs.forEach((leg, i) => {
          const p1 = toScreen(leg.from.latitude, leg.from.longitude);
          const p2 = toScreen(leg.to.latitude, leg.to.longitude);
          if (i === 0) ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        });
        ctx.stroke();
      }
    }

    // Staedte
    for (const c of cities) {
      if (zoom < 9 && c.size_class < 3) continue;
      const p = toScreen(c.latitude, c.longitude);
      if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) continue;

      const size = c.size_class >= 5 ? 5 : c.size_class >= 4 ? 4 : 3;
      ctx.fillStyle = c.size_class >= 4 ? COLOR.cityBig : COLOR.city;
      ctx.fillRect(
        Math.round(p.x - size / 2),
        Math.round(p.y - size / 2),
        size,
        size,
      );
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(p.x - size / 2) - 0.5,
        Math.round(p.y - size / 2) - 0.5,
        size + 1,
        size + 1,
      );
    }

    // Gewaehlte Stopps hervorheben
    stops.forEach((id, i) => {
      const c = cityById.current.get(id);
      if (!c) return;
      const p = toScreen(c.latitude, c.longitude);
      const color =
        i === 0
          ? COLOR.start
          : i === stops.length - 1 && stops.length > 1
            ? COLOR.end
            : COLOR.stop;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(p.x) - 5, Math.round(p.y) - 5, 10, 10);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(p.x) - 5.5, Math.round(p.y) - 5.5, 11, 11);
    });

    // Angetippte Stadt hervorheben
    if (highlight) {
      const c = cityById.current.get(highlight);
      if (c) {
        const p = toScreen(c.latitude, c.longitude);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(p.x) - 8.5, Math.round(p.y) - 8.5, 17, 17);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(p.x) - 10.5, Math.round(p.y) - 10.5, 21, 21);
      }
    }

    // Beschriftungen: nur so viele, wie lesbar bleiben
    ctx.font = "bold 11px 'MS Sans Serif', Tahoma, sans-serif";
    ctx.textBaseline = "middle";
    const labelled = cities
      .filter((c) => c.size_class >= (zoom > 14 ? 3 : zoom > 9 ? 4 : 5))
      .concat(stops.map((id) => cityById.current.get(id)!).filter(Boolean));

    const seen = new Set<string>();
    for (const c of labelled) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const p = toScreen(c.latitude, c.longitude);
      if (p.x < 0 || p.x > w - 20 || p.y < 8 || p.y > h - 8) continue;
      const x = p.x + 7;
      ctx.strokeStyle = COLOR.labelHalo;
      ctx.lineWidth = 3;
      ctx.strokeText(c.city, x, p.y);
      ctx.fillStyle = COLOR.label;
      ctx.fillText(c.city, x, p.y);
    }
  };

  /** Naechstgelegene Stadt zu einem Klickpunkt, mit Trefferradius. */
  const cityAt = (sx: number, sy: number): City | null => {
    let best: City | null = null;
    let bestDist = 18;
    for (const c of cities) {
      const p = toScreen(c.latitude, c.longitude);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  };

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, edges, stops, highlight, route]);

  const zoomBy = (factor: number, cx?: number, cy?: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const px = cx ?? wrap.clientWidth / 2;
    const py = cy ?? wrap.clientHeight / 2;
    const v = view.current;
    const next = Math.max(2, Math.min(160, v.scale * factor));
    const k = next / v.scale;
    view.current = {
      scale: next,
      offsetX: px - (px - v.offsetX) * k,
      offsetY: py - (py - v.offsetY) * k,
    };
    draw();
  };

  const onPointerDown = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.current.scale,
      };
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = wrapRef.current!.getBoundingClientRect();
      const target = pinch.current.scale * (dist / pinch.current.dist);
      zoomBy(
        target / view.current.scale,
        (a.x + b.x) / 2 - rect.left,
        (a.y + b.y) / 2 - rect.top,
      );
      moved.current = true;
      return;
    }

    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    view.current.offsetX += dx;
    view.current.offsetY += dy;
    draw();
  };

  const onPointerUp = (e: PointerEvent) => {
    const start = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!start || moved.current) return;

    const rect = wrapRef.current!.getBoundingClientRect();
    const city = cityAt(e.clientX - rect.left, e.clientY - rect.top);
    if (city) onPickCity(city);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = wrapRef.current!.getBoundingClientRect();
    zoomBy(
      e.deltaY < 0 ? 1.2 : 1 / 1.2,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
  };

  return (
    <div class="map-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      <div class="map-tools">
        <button
          type="button"
          class="btn"
          title="Heranzoomen"
          onClick={() => zoomBy(1.4)}
        >
          +
        </button>
        <button
          type="button"
          class="btn"
          title="Wegzoomen"
          onClick={() => zoomBy(1 / 1.4)}
        >
          −
        </button>
        <button
          type="button"
          class="btn"
          title="Ansicht zurücksetzen"
          onClick={() => {
            fitted.current = false;
            draw();
          }}
        >
          ◇
        </button>
      </div>
    </div>
  );
}
