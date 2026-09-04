/**
 * Statische Übersichtskarte für das Hauptmenü.
 *
 * Bewusst ohne Zoom, Verschieben und Klick: Sie zeigt den Stand, sie ist
 * kein Werkzeug. Die Ansicht passt sich beim Ändern der Fenstergröße an,
 * sonst verändert sie sich nicht.
 *
 * Gezeichnet wird ausschließlich, was in den Daten steht - Städte aus der
 * Datenbank, Straßen aus dem Netz, Routen aus der geplanten Tour.
 */
import { useEffect, useRef } from "preact/hooks";
import type { City, Edge, RouteResult } from "../core/types";
import { boundsOf, project } from "../core/data";

interface Props {
  cities: City[];
  edges: Edge[];
  route: RouteResult | null;
  stops: string[];
  homeId: string;
}

const COLOR = {
  sea: "#3060a8",
  road: "#a8a894",
  motorway: "#d8d0a0",
  route: "#2040d0",
  routeCasing: "#ffffff",
  city: "#b03838",
  cityBig: "#e05050",
  home: "#800080",
  start: "#008000",
  end: "#c00000",
};

export function StaticMap({ cities, edges, route, stops, homeId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // Feste Einpassung auf den gesamten Datenbereich, ohne Zoomstufe.
      const b = boundsOf(cities);
      const pad = 6;
      const scale = Math.min(
        (w - pad * 2) / (b.maxX - b.minX),
        (h - pad * 2) / (b.maxY - b.minY),
      );
      const offsetX = (w - (b.maxX - b.minX) * scale) / 2 - b.minX * scale;
      const offsetY = (h - (b.maxY - b.minY) * scale) / 2 - b.minY * scale;

      const toScreen = (lat: number, lon: number) => {
        const p = project(lat, lon);
        return { x: p.x * scale + offsetX, y: p.y * scale + offsetY };
      };

      ctx.fillStyle = COLOR.sea;
      ctx.fillRect(0, 0, w, h);

      const byId = new Map(cities.map((c) => [c.id, c]));

      // Straßennetz, nur Hauptachsen - sonst wird es bei dieser Größe Brei.
      for (const e of edges) {
        if (e.type === "ferry") continue;
        const a = byId.get(e.from);
        const bb = byId.get(e.to);
        if (!a || !bb) continue;
        if (e.type !== "motorway" && Math.min(a.size_class, bb.size_class) < 4)
          continue;
        const p1 = toScreen(a.latitude, a.longitude);
        const p2 = toScreen(bb.latitude, bb.longitude);
        ctx.strokeStyle = e.type === "motorway" ? COLOR.motorway : COLOR.road;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Städte
      for (const c of cities) {
        if (c.size_class < 4) continue;
        const p = toScreen(c.latitude, c.longitude);
        ctx.fillStyle = c.size_class >= 5 ? COLOR.cityBig : COLOR.city;
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
      }

      // Geplante Tour
      if (route && route.legs.length > 0) {
        for (const pass of [0, 1]) {
          ctx.strokeStyle = pass === 0 ? COLOR.routeCasing : COLOR.route;
          ctx.lineWidth = pass === 0 ? 4 : 2;
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

      // Stopps der Tour
      stops.forEach((id, i) => {
        const c = byId.get(id);
        if (!c) return;
        const p = toScreen(c.latitude, c.longitude);
        ctx.fillStyle =
          i === 0 ? COLOR.start : i === stops.length - 1 ? COLOR.end : "#c08000";
        ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(p.x) - 3.5, Math.round(p.y) - 3.5, 7, 7);
      });

      // Firmensitz
      const home = byId.get(homeId);
      if (home) {
        const p = toScreen(home.latitude, home.longitude);
        ctx.fillStyle = COLOR.home;
        ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 3, 6, 6);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(p.x) - 3.5, Math.round(p.y) - 3.5, 7, 7);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [cities, edges, route, stops, homeId]);

  return (
    <div class="static-map" ref={wrapRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
