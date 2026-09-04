/**
 * Pixelschrift als Bauteil.
 *
 * Zeichnet auf ein Canvas, damit die Kanten unabhängig von Geräteauflösung
 * und Zoomstufe hart bleiben. Für Bildschirmleser steht der Text zusätzlich
 * als aria-label bereit.
 */
import { useEffect, useRef } from "preact/hooks";
import { GLYPH_H, drawText, measure } from "./pixelFont";

interface Props {
  text: string;
  /** Vergrößerungsfaktor der Schriftpixel */
  scale?: number;
  color?: string;
  /** Zusätzliche CSS-Klasse für die Umhüllung */
  class?: string;
}

export function PixelText({ text, scale = 2, color, class: cls }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  const w = measure(text) * scale;
  const h = GLYPH_H * scale;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    // Farbe aus dem Stylesheet lesen, damit die Palette an einer Stelle bleibt.
    const fromStyle = getComputedStyle(canvas)
      .getPropertyValue("--pixel-ink")
      .trim();
    const resolved = color ?? (fromStyle || "#000080");

    drawText(ctx, text, 0, 0, scale, resolved);
  }, [text, scale, color, w, h]);

  return (
    <canvas
      ref={ref}
      class={cls}
      style={`width:${w}px;height:${h}px`}
      role="img"
      aria-label={text}
    />
  );
}
