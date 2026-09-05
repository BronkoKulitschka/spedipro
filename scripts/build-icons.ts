/**
 * Baut die Spritemap der Programmsymbole.
 *
 *   assets-src/icons/<name>.png   →   public/assets/icons.png
 *                                     public/assets/icons.json
 *
 * Aufruf:  npm run icons
 *
 * Jede Quelldatei muss genau CELL × CELL Pixel groß sein und Transparenz
 * mitbringen. Fehlt eine Datei oder stimmt die Größe nicht, bricht das
 * Skript ab und nennt den Grund — lieber gar keine Spritemap als eine
 * verschobene.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { PNG } from "pngjs";

/** Kantenlänge einer Zelle in Pixeln. */
const CELL = 48;
/** Spalten des Rasters. Die Zeilenzahl ergibt sich aus der Anzahl der Symbole. */
const COLUMNS = 4;

const SRC = "assets-src/icons";
const OUT_PNG = "public/assets/icons.png";
const OUT_JSON = "public/assets/icons.json";

/**
 * Reihenfolge im Raster. Sie ist Teil der Schnittstelle: Wer die Spritemap
 * von Hand zeichnet, muss sich daran halten.
 */
const ORDER = [
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
];

function main() {
  const rows = Math.ceil(ORDER.length / COLUMNS);
  const sheet = new PNG({
    width: COLUMNS * CELL,
    height: rows * CELL,
    colorType: 6,
  });
  sheet.data.fill(0);

  ORDER.forEach((name, index) => {
    const path = `${SRC}/${name}.png`;
    if (!existsSync(path)) {
      throw new Error(`Fehlende Quelldatei: ${path}`);
    }
    const src = PNG.sync.read(readFileSync(path));
    if (src.width !== CELL || src.height !== CELL) {
      throw new Error(
        `${path}: ${src.width}×${src.height} statt ${CELL}×${CELL} Pixel.`,
      );
    }

    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    PNG.bitblt(src, sheet, 0, 0, CELL, CELL, col * CELL, row * CELL);
  });

  writeFileSync(OUT_PNG, PNG.sync.write(sheet));

  const manifest = {
    schema_version: "1.0",
    description:
      "Spritemap der Programmsymbole. Reihenfolge zeilenweise von links oben.",
    cell: CELL,
    columns: COLUMNS,
    rows,
    sheet: "icons.png",
    icons: Object.fromEntries(
      ORDER.map((name, i) => [
        name,
        { column: i % COLUMNS, row: Math.floor(i / COLUMNS) },
      ]),
    ),
  };
  writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 1) + "\n");

  console.log(
    `${ORDER.length} Symbole → ${OUT_PNG} (${sheet.width}×${sheet.height} px, ${COLUMNS}×${rows})`,
  );
}

main();
