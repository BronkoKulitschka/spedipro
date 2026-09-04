/**
 * Oberflaechenbausteine im Windows-95-Stil.
 *
 * Alle Bausteine sind rein darstellend. Sie berechnen nichts und speichern
 * keine Spielwerte - siehe Grundregel im Konzept.
 */
import type { ComponentChildren, JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/* -------------------------------------------------------------- Schaltflaeche */

export function Button(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean },
) {
  const { pressed, class: cls, children, ...rest } = props;
  return (
    <button
      type="button"
      class={["btn", pressed ? "pressed" : "", cls ?? ""].join(" ").trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ Beschrifteter Rahmen */

export function Panel({
  title,
  children,
  bodyClass,
}: {
  title: string;
  children: ComponentChildren;
  bodyClass?: string;
}) {
  return (
    <fieldset class="panel">
      <legend>{title}</legend>
      <div class={`panel-body ${bodyClass ?? ""}`}>{children}</div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ Kennzahlen */

export type ValueTone = "" | "good" | "bad" | "warn" | "dim";

export function KeyValues({
  rows,
}: {
  rows: [label: string, value: string, tone?: ValueTone][];
}) {
  return (
    <dl class="kv">
      {rows.map(([label, value, tone]) => (
        <>
          <dt>{label}</dt>
          <dd class={tone ?? ""}>{value}</dd>
        </>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------------- Fenster */

export interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

interface WindowProps {
  state: WindowState;
  active: boolean;
  onChange: (patch: Partial<WindowState>) => void;
  onFocus: () => void;
  onClose?: () => void;
  children: ComponentChildren;
}

/**
 * Verschiebbares, groessenveraenderliches Fenster.
 * Zeiger-Ereignisse statt Maus-Ereignisse, damit Touch und Stift mitspielen.
 */
export function Window({
  state,
  active,
  onChange,
  onFocus,
  onClose,
  children,
}: WindowProps) {
  const drag = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const begin = (mode: "move" | "resize") => (e: PointerEvent) => {
    if (state.maximized && mode === "move") return;
    onFocus();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: state.x,
      origY: state.y,
      origW: state.w,
      origH: state.h,
    };
  };

  const move = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.mode === "move") {
        onChange({
          x: Math.max(0, Math.min(window.innerWidth - 80, d.origX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 60, d.origY + dy)),
        });
      } else {
        onChange({
          w: Math.max(260, d.origW + dx),
          h: Math.max(160, d.origH + dy),
        });
      }
    },
    [onChange],
  );

  const end = () => {
    drag.current = null;
  };

  if (state.minimized) return null;

  return (
    <div
      class={[
        "window",
        active ? "" : "inactive",
        state.maximized ? "maximized" : "",
      ]
        .join(" ")
        .trim()}
      style={
        state.maximized
          ? { zIndex: state.z }
          : {
              left: `${state.x}px`,
              top: `${state.y}px`,
              width: `${state.w}px`,
              height: `${state.h}px`,
              zIndex: state.z,
            }
      }
      onPointerDown={onFocus}
    >
      <div
        class="titlebar"
        onPointerDown={begin("move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDblClick={() => onChange({ maximized: !state.maximized })}
      >
        <span class="titlebar-text">{state.title}</span>
        <div class="titlebar-buttons">
          <Button
            class="btn-sys"
            title="Minimieren"
            aria-label="Minimieren"
            onClick={() => onChange({ minimized: true })}
          >
            _
          </Button>
          <Button
            class="btn-sys"
            title={state.maximized ? "Wiederherstellen" : "Maximieren"}
            aria-label={state.maximized ? "Wiederherstellen" : "Maximieren"}
            onClick={() => onChange({ maximized: !state.maximized })}
          >
            {state.maximized ? "\u2750" : "\u2610"}
          </Button>
          {onClose && (
            <Button
              class="btn-sys"
              title="Schließen"
              aria-label="Schließen"
              onClick={onClose}
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      <div class="window-body">{children}</div>

      {!state.maximized && (
        <div
          class="resize-grip"
          onPointerDown={begin("resize")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Fensteruhr */

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return <div class="clock sunken">{time}</div>;
}
