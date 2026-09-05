/**
 * Programmsymbol aus der Spritemap.
 *
 * Alle Symbole liegen in einer einzigen Bilddatei. Das spart Anfragen und
 * hält die Grafiken zusammen — ein Austausch betrifft genau eine Datei.
 *
 * Die Zuordnung steht in `public/assets/icons.json`. Der Aufbau (Zellgröße,
 * Spalten, Reihenfolge) wird von `scripts/build-icons.ts` erzeugt; hier
 * wird er nur gelesen.
 */

export type IconId =
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
  | "einstellungen"
  | "arbeitsplatz"
  | "papierkorb";

/**
 * Aufbau der Spritemap. Muss zu `scripts/build-icons.ts` passen — dort ist
 * die Reihenfolge festgelegt, hier wird sie gespiegelt.
 */
export const SPRITE = {
  cell: 48,
  columns: 4,
  order: [
    "fuhrpark",
    "auftraege",
    "touren",
    "karte",
    "personal",
    "werkstatt",
    "kassenbuch",
    "kunden",
    "statistik",
    "nachrichten",
    "einstellungen",
    "arbeitsplatz",
    "papierkorb",
  ] as IconId[],
};

const INDEX = new Map(SPRITE.order.map((id, i) => [id, i]));

interface Props {
  id: IconId;
  /** Kantenlänge in Bildpunkten. Vielfache von 48 bleiben scharf. */
  size?: number;
  class?: string;
}

export function Icon({ id, size = 48, class: cls }: Props) {
  const index = INDEX.get(id) ?? 0;
  const col = index % SPRITE.columns;
  const row = Math.floor(index / SPRITE.columns);
  const rows = Math.ceil(SPRITE.order.length / SPRITE.columns);
  const scale = size / SPRITE.cell;

  return (
    <span
      class={`icon ${cls ?? ""}`.trim()}
      role="presentation"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/icons.png)`,
        backgroundSize: `${SPRITE.columns * SPRITE.cell * scale}px ${rows * SPRITE.cell * scale}px`,
        backgroundPosition: `-${col * SPRITE.cell * scale}px -${row * SPRITE.cell * scale}px`,
      }}
    />
  );
}
