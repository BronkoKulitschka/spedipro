/**
 * Startleiste im Stil von Windows 98.
 *
 * Startknopf, Liste der laufenden Programme, Uhr im Infobereich.
 * Die Uhr zeigt die echte Gerätezeit — der Spieltag steht im
 * Programmfenster, nicht hier.
 */
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon, type IconId } from "./Icon";

export interface TaskEntry {
  id: string;
  title: string;
  icon: IconId;
  active: boolean;
  minimized: boolean;
}

export interface StartEntry {
  id: string;
  label: string;
  icon: IconId;
  enabled: boolean;
}

interface Props {
  tasks: TaskEntry[];
  programs: StartEntry[];
  onTask: (id: string) => void;
  onStart: (id: string) => void;
  /** Zusätzliche Einträge unterhalb der Programme */
  extras?: { label: string; icon: IconId; onSelect: () => void }[];
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      {now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </>
  );
}

export function Taskbar({ tasks, programs, onTask, onStart, extras }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref}>
      {open && (
        <div class="start-menu" role="menu">
          <div class="start-banner">Spedipro&nbsp;95</div>
          <div class="start-items">
            {programs.map((p) => (
              <button
                key={p.id}
                type="button"
                class="start-item"
                role="menuitem"
                disabled={!p.enabled}
                onClick={() => {
                  setOpen(false);
                  onStart(p.id);
                }}
              >
                <Icon id={p.icon} size={24} />
                <span>{p.label}</span>
              </button>
            ))}
            {extras && extras.length > 0 && <div class="menu-sep" />}
            {extras?.map((e) => (
              <button
                key={e.label}
                type="button"
                class="start-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  e.onSelect();
                }}
              >
                <Icon id={e.icon} size={24} />
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div class="taskbar">
        <button
          type="button"
          class={`btn start-btn ${open ? "pressed" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span class="start-flag" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          Start
        </button>

        <div class="task-list">
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              class={`btn task-btn ${t.active && !t.minimized ? "pressed" : ""}`}
              onClick={() => onTask(t.id)}
            >
              <Icon id={t.icon} size={16} />
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        <div class="tray">
          <Clock />
        </div>
      </div>
    </div>
  );
}
