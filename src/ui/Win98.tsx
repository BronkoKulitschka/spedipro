/**
 * Oberflächenbausteine im Stil von Windows 98.
 *
 * Rein darstellend: Diese Bauteile berechnen nichts und halten keine
 * Spielwerte (Grundregel, Konzept Kapitel 2).
 */
import type { ComponentChildren, JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/* ─────────────────────────────────────────────── Schaltfläche */

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

/* ───────────────────────────────────────── Beschrifteter Rahmen */

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

/* ──────────────────────────────────────────────── Kennzahlen */

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

/* ──────────────────────────────────────────────── Menüleiste */

export interface MenuOption {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
}

export interface Menu {
  label: string;
  options: MenuOption[];
}

export function MenuBar({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div class="menubar" ref={ref} role="menubar">
      {menus.map((m, i) => (
        <div style="position:relative" key={m.label}>
          <button
            type="button"
            class={`menu-item ${open === i ? "open" : ""}`}
            aria-haspopup="true"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {m.label}
          </button>
          {open === i && (
            <div class="menu-popup" role="menu">
              {m.options.map((o) => (
                <>
                  {o.separatorBefore && <div class="menu-sep" />}
                  <button
                    type="button"
                    class="menu-option"
                    role="menuitem"
                    disabled={o.disabled}
                    onClick={() => {
                      setOpen(null);
                      o.onSelect?.();
                    }}
                  >
                    <span>{o.label}</span>
                    {o.shortcut && <span class="shortcut">{o.shortcut}</span>}
                  </button>
                </>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────── Fenster */

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
  /** Auf schmalen Geräten füllt jedes Fenster den Bildschirm. */
  fullscreen?: boolean;
  menus?: Menu[];
  onChange: (patch: Partial<WindowState>) => void;
  onFocus: () => void;
  onClose?: () => void;
  children: ComponentChildren;
}

/**
 * Verschiebbares Fenster. Titel linksbündig, rechts die drei Schaltflächen
 * Verkleinern, Vergrößern und Schließen — der Aufbau von Windows 98.
 */
export function Win98Window({
  state,
  active,
  fullscreen,
  menus,
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
    if (fullscreen || (state.maximized && mode === "move")) return;
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
          x: Math.max(-40, Math.min(window.innerWidth - 90, d.origX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 70, d.origY + dy)),
        });
      } else {
        onChange({
          w: Math.max(260, d.origW + dx),
          h: Math.max(170, d.origH + dy),
        });
      }
    },
    [onChange],
  );

  const end = () => {
    drag.current = null;
  };

  if (state.minimized) return null;

  const geometry =
    fullscreen || state.maximized
      ? { zIndex: state.z }
      : {
          left: `${state.x}px`,
          top: `${state.y}px`,
          width: `${state.w}px`,
          height: `${state.h}px`,
          zIndex: state.z,
        };

  return (
    <div
      class={[
        "window",
        active ? "" : "inactive",
        fullscreen ? "fullscreen" : state.maximized ? "maximized" : "",
      ]
        .join(" ")
        .trim()}
      style={geometry}
      onPointerDown={onFocus}
    >
      <div
        class="titlebar"
        onPointerDown={begin("move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDblClick={() =>
          !fullscreen && onChange({ maximized: !state.maximized })
        }
      >
        <span class="titlebar-text">{state.title}</span>

        <div class="titlebar-right">
          <button
            type="button"
            class="sysbtn"
            title="Minimieren"
            aria-label="Minimieren"
            disabled={fullscreen}
            onClick={() => onChange({ minimized: true })}
          >
            <span class="bar" />
          </button>
          <button
            type="button"
            class="sysbtn"
            title={state.maximized ? "Wiederherstellen" : "Maximieren"}
            aria-label={state.maximized ? "Wiederherstellen" : "Maximieren"}
            disabled={fullscreen}
            onClick={() => onChange({ maximized: !state.maximized })}
          >
            {state.maximized ? (
              <span class="glyph">❐</span>
            ) : (
              <span class="box" />
            )}
          </button>
          <button
            type="button"
            class="sysbtn"
            title="Schließen"
            aria-label="Schließen"
            disabled={!onClose}
            onClick={() => onClose?.()}
          >
            <span class="glyph">✕</span>
          </button>
        </div>
      </div>

      {menus && menus.length > 0 && <MenuBar menus={menus} />}

      <div class="window-body">{children}</div>

      {!fullscreen && !state.maximized && (
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

/* ───────────────────────────────────────────────────── Dialog */

export function Dialog({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div class="dialog-veil" role="dialog" aria-modal="true" aria-label={title}>
      <div class="dialog">
        <div class="titlebar">
          <span class="titlebar-text">{title}</span>
        </div>
        <div class="dialog-body">
          <span class="sign" aria-hidden="true">
            i
          </span>
          <span>{message}</span>
        </div>
        <div class="dialog-buttons">
          <Button onClick={onClose} autofocus>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
