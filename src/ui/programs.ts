/**
 * Die Programme des virtuellen Rechners.
 *
 * Jedes Modul ist ein eigenes Programm mit Dateinamen, Fenstertitel und
 * Symbol. Was nicht installiert ist, lässt sich nicht starten — der
 * Rechner meldet das wie ein echtes System.
 */
import type { IconId } from "./Icon";

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
  /** Dateiname im Stil der Zeit, steht unter dem Symbol */
  file: string;
  /** Fenstertitel des laufenden Programms */
  title: string;
  /** Kurzer Name für Arbeitsfläche und Startmenü */
  label: string;
  icon: IconId;
  installed: boolean;
}

export const PROGRAMS: Program[] = [
  {
    id: "fuhrpark",
    file: "FUHRPARK.EXE",
    title: "Fuhrpark",
    label: "Fuhrpark",
    icon: "fuhrpark",
    installed: true,
  },
  {
    id: "auftraege",
    file: "AUFTRAG.EXE",
    title: "Auftragsbörse",
    label: "Aufträge",
    icon: "auftraege",
    installed: true,
  },
  {
    id: "touren",
    file: "TOUREN.EXE",
    title: "Tourenplanung",
    label: "Tourenplanung",
    icon: "touren",
    installed: true,
  },
  {
    id: "karte",
    file: "KARTE.EXE",
    title: "Europa-Karte",
    label: "Karte",
    icon: "karte",
    installed: true,
  },
  {
    id: "personal",
    file: "PERSONAL.EXE",
    title: "Personal",
    label: "Personal",
    icon: "personal",
    installed: false,
  },
  {
    id: "werkstatt",
    file: "WERKSTAT.EXE",
    title: "Werkstatt",
    label: "Werkstatt",
    icon: "werkstatt",
    installed: false,
  },
  {
    id: "kassenbuch",
    file: "KASSE.EXE",
    title: "Kassenbuch",
    label: "Kassenbuch",
    icon: "kassenbuch",
    installed: false,
  },
  {
    id: "kunden",
    file: "KUNDEN.EXE",
    title: "Kunden",
    label: "Kunden",
    icon: "kunden",
    installed: false,
  },
  {
    id: "statistik",
    file: "STATIST.EXE",
    title: "Statistik",
    label: "Statistik",
    icon: "statistik",
    installed: false,
  },
  {
    id: "nachrichten",
    file: "POST.EXE",
    title: "Nachrichten",
    label: "Nachrichten",
    icon: "nachrichten",
    installed: false,
  },
  {
    id: "einstellungen",
    file: "SETUP.EXE",
    title: "Einstellungen",
    label: "Einstellungen",
    icon: "einstellungen",
    installed: false,
  },
];

export function programById(id: ProgramId): Program {
  const p = PROGRAMS.find((x) => x.id === id);
  if (!p) throw new Error(`Unbekanntes Programm: ${id}`);
  return p;
}
