/**
 * Hauptmenü.
 *
 * Aufbau von oben nach unten:
 *   Kopfzeile · Firmenname · Kontostand und Ruf · statische Karte
 *   — zusammen etwa die halbe Höhe —
 *   3×3-Raster der Module, darunter mittig die Einstellungen.
 *
 * Die Icons sind Platzhalter unter public/assets/tiles/ und lassen sich
 * ersetzen, ohne dass hier etwas geändert werden muss.
 */
import type { City, Edge } from "../core/types";
import type { GameState } from "../core/state";
import type { TourResult } from "../core/tour";
import { fmtEur } from "../core/data";
import { PixelText } from "./PixelText";
import { StaticMap } from "./StaticMap";

export type MenuTarget =
  | "fleet"
  | "orders"
  | "plan"
  | "personal"
  | "workshop"
  | "ledger"
  | "customers"
  | "stats"
  | "messages"
  | "settings";

interface Tile {
  id: MenuTarget;
  label: string;
  icon: string;
}

/** Reihenfolge wie festgelegt: drei Reihen zu drei, dann die Einstellungen. */
const TILES: Tile[] = [
  { id: "fleet", label: "Fuhrpark", icon: "tile_fuhrpark" },
  { id: "orders", label: "Aufträge", icon: "tile_auftraege" },
  { id: "plan", label: "Tourenplanung", icon: "tile_touren" },
  { id: "personal", label: "Personal", icon: "tile_personal" },
  { id: "workshop", label: "Werkstatt", icon: "tile_werkstatt" },
  { id: "ledger", label: "Kassenbuch", icon: "tile_kassenbuch" },
  { id: "customers", label: "Kunden", icon: "tile_kunden" },
  { id: "stats", label: "Statistik", icon: "tile_statistik" },
  { id: "messages", label: "Nachrichten", icon: "tile_nachrichten" },
];

const SETTINGS: Tile = {
  id: "settings",
  label: "Einstellungen",
  icon: "tile_einstellungen",
};

/** Module, die es bereits gibt. Der Rest meldet sich als noch nicht fertig. */
export const READY: MenuTarget[] = ["fleet", "orders", "plan"];

interface Props {
  game: GameState;
  cities: City[];
  edges: Edge[];
  tour: TourResult | null;
  onOpen: (target: MenuTarget) => void;
}

function MenuButton({
  tile,
  ready,
  onOpen,
}: {
  tile: Tile;
  ready: boolean;
  onOpen: (t: MenuTarget) => void;
}) {
  return (
    <button
      type="button"
      class={`menu-tile ${ready ? "" : "pending"}`}
      onClick={() => onOpen(tile.id)}
      aria-label={tile.label}
    >
      <img
        class="menu-tile-icon"
        src={`${import.meta.env.BASE_URL}assets/tiles/${tile.icon}.png`}
        alt=""
        width={96}
        height={64}
      />
      <PixelText text={tile.label} scale={2} class="menu-tile-label" />
    </button>
  );
}

export function MainMenu({ game, cities, edges, tour, onOpen }: Props) {
  const home = cities.find((c) => c.id === game.company.home_id);
  const stars = Math.max(0, Math.min(5, game.company.reputation));

  return (
    <div class="menu-window">
      {/* Kopfzeile: nur der Name, keine Schaltflächen */}
      <div class="menu-titlebar">
        <PixelText text="Spedipro" scale={3} color="#ffffff" />
      </div>

      <div class="menu-upper">
        <div class="menu-company groove">
          <PixelText text={game.company.name} scale={2} />
          {home && (
            <PixelText
              text={`${home.city} (${home.iso2})`}
              scale={1}
              color="#606060"
              class="menu-company-home"
            />
          )}
        </div>

        <div class="menu-figures groove">
          <div class="menu-figure">
            <PixelText text="Kontostand" scale={1} color="#606060" />
            <PixelText
              text={fmtEur(game.company.cash_eur)}
              scale={3}
              color={game.company.cash_eur < 0 ? "#c00000" : "#008000"}
            />
          </div>
          <div class="menu-figure">
            <PixelText text="Ruf" scale={1} color="#606060" />
            <div class="menu-stars" role="img" aria-label={`${stars} von 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <span class={`pixel-star ${i < stars ? "on" : "off"}`} />
              ))}
            </div>
          </div>
        </div>

        <div class="menu-map groove">
          <StaticMap
            cities={cities}
            edges={edges}
            route={tour?.route ?? null}
            stops={tour?.route_stop_ids ?? []}
            homeId={game.company.home_id}
          />
          <div class="menu-map-caption">
            <PixelText
              text={
                tour && tour.route
                  ? `Aktive Tour: ${tour.order_ids.length} Ladungen`
                  : "Keine aktive Tour"
              }
              scale={1}
              color="#606060"
            />
          </div>
        </div>
      </div>

      <div class="menu-lower">
        <div class="menu-grid">
          {TILES.map((t) => (
            <MenuButton
              key={t.id}
              tile={t}
              ready={READY.includes(t.id)}
              onOpen={onOpen}
            />
          ))}
        </div>
        <div class="menu-settings-row">
          <MenuButton
            tile={SETTINGS}
            ready={READY.includes(SETTINGS.id)}
            onOpen={onOpen}
          />
        </div>
      </div>
    </div>
  );
}
