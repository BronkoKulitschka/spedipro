/**
 * Programm-Manager.
 *
 * Die Schaltzentrale des virtuellen Rechners. Jedes Modul ist ein eigenes
 * Programm; ein Doppelklick auf das Symbol startet es in einem eigenen
 * Fenster.
 *
 * Kennzahlen im Kopfbereich stammen aus dem Spielzustand und werden hier
 * nur dargestellt.
 */
import { useState } from "preact/hooks";
import type { GameState } from "../core/state";
import type { City } from "../core/types";
import { fmtEur } from "../core/data";

export type ProgramId =
  | "fuhrpark"
  | "auftraege"
  | "touren"
  | "karte"
  | "personal"
  | "werkstatt"
  | "kassenbuch"
  | "kunden"
  | "statistik"
  | "nachrichten"
  | "einstellungen";

export interface Program {
  id: ProgramId;
  /** Dateiname im Stil der Zeit — er steht unter dem Symbol */
  file: string;
  /** Fenstertitel des laufenden Programms */
  title: string;
  icon: string;
  ready: boolean;
}

export const PROGRAMS: Program[] = [
  {
    id: "fuhrpark",
    file: "FUHRPARK.EXE",
    title: "Fuhrpark",
    icon: "fuhrpark",
    ready: true,
  },
  {
    id: "auftraege",
    file: "AUFTRAG.EXE",
    title: "Auftragsbörse",
    icon: "auftraege",
    ready: true,
  },
  {
    id: "touren",
    file: "TOUREN.EXE",
    title: "Tourenplanung",
    icon: "touren",
    ready: true,
  },
  {
    id: "karte",
    file: "KARTE.EXE",
    title: "Europa-Karte",
    icon: "karte",
    ready: true,
  },
  {
    id: "personal",
    file: "PERSONAL.EXE",
    title: "Personal",
    icon: "personal",
    ready: false,
  },
  {
    id: "werkstatt",
    file: "WERKSTAT.EXE",
    title: "Werkstatt",
    icon: "werkstatt",
    ready: false,
  },
  {
    id: "kassenbuch",
    file: "KASSE.EXE",
    title: "Kassenbuch",
    icon: "kassenbuch",
    ready: false,
  },
  {
    id: "kunden",
    file: "KUNDEN.EXE",
    title: "Kunden",
    icon: "kunden",
    ready: false,
  },
  {
    id: "statistik",
    file: "STATIST.EXE",
    title: "Statistik",
    icon: "statistik",
    ready: false,
  },
  {
    id: "nachrichten",
    file: "POST.EXE",
    title: "Nachrichten",
    icon: "nachrichten",
    ready: false,
  },
  {
    id: "einstellungen",
    file: "SETUP.EXE",
    title: "Einstellungen",
    icon: "einstellungen",
    ready: false,
  },
];

export function programById(id: ProgramId): Program {
  const p = PROGRAMS.find((x) => x.id === id);
  if (!p) throw new Error(`Unbekanntes Programm: ${id}`);
  return p;
}

interface Props {
  game: GameState;
  home: City | undefined;
  onLaunch: (id: ProgramId) => void;
}

export function ProgramManager({ game, home, onLaunch }: Props) {
  const [selected, setSelected] = useState<ProgramId | null>(null);
  const stars = Math.max(0, Math.min(5, game.company.reputation));

  /**
   * Ein Klick wählt aus, der zweite startet — wie in Windows 3.11.
   * Auf Berührungsgeräten ist ein echter Doppelklick unzuverlässig, deshalb
   * genügt hier das erneute Antippen desselben Symbols.
   */
  const activate = (id: ProgramId) => {
    if (selected === id) {
      onLaunch(id);
      return;
    }
    setSelected(id);
  };

  return (
    <>
      <div class="pm-status">
        <span>
          <b>{game.company.name}</b>
        </span>
        {home && (
          <span class="dim">
            Sitz: {home.city} ({home.iso2})
          </span>
        )}
        <span class="field-group">
          Kasse:
          <b class={game.company.cash_eur < 0 ? "bad" : "good"}>
            {fmtEur(game.company.cash_eur)}
          </b>
        </span>
        <span class="field-group">
          Ruf:
          <span class="pm-stars" role="img" aria-label={`${stars} von 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span class={`pm-star ${i < stars ? "" : "off"}`} />
            ))}
          </span>
        </span>
        <span class="dim">Tag {game.day}</span>
      </div>

      <div class="group-window">
        <div class="group-title">Spedipro 95</div>
        <div class="group-grid">
          {PROGRAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              class={[
                "prog-icon",
                selected === p.id ? "selected" : "",
                p.ready ? "" : "pending",
              ]
                .join(" ")
                .trim()}
              title={
                p.ready
                  ? `${p.title} starten`
                  : `${p.file} — Programm noch nicht installiert`
              }
              onClick={() => activate(p.id)}
              onDblClick={() => onLaunch(p.id)}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/icons/${p.icon}.png`}
                alt=""
                width={32}
                height={32}
              />
              <span class="prog-label">{p.file}</span>
            </button>
          ))}
        </div>
      </div>

      <div class="stage-note">
        Symbol antippen wählt aus, erneutes Antippen startet das Programm.
      </div>
    </>
  );
}
