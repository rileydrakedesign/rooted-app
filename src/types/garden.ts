/**
 * Garden Types
 *
 * Core type definitions for the tile-based garden system.
 * Designed for isometric tile placement with vertical layering.
 */

/**
 * TileCoord - 3D grid coordinate
 *
 * i: Column (X axis in isometric view - right direction)
 * j: Row (Y axis in isometric view - down-left direction)
 * k: Vertical layer (Z axis - height/stacking on same tile)
 */
export interface TileCoord {
  i: number;
  j: number;
  k: number;
}

/**
 * Plant - a friend's plant as rendered in the garden.
 *
 * The client-side twin of a `plants` row (id === the friend's id).
 */
export interface Plant {
  id: string;
  friendName: string;
  plantType: 'cactus' | 'sunflower' | 'fern' | 'rose' | 'succulent' | 'ivy' | 'monstera' | 'bamboo' | 'ficus';
  stage: 1 | 2 | 3 | 4; // Growth stages
  hydration: number; // 0-100
  position: TileCoord; // Grid tile the plant stands on (the only position it stores)
  image?: any; // Sprite asset (always resolved via plantCatalog for DB rows)

  // Streak state (Batch 7) — DB commits are authoritative; these mirror the
  // plants row after sync_streaks() rolled it forward at load time.
  streak: number; // consecutive satisfied cadence periods
  streakBest: number;
  prestigeLevel: number; // milestones past the ×2.0 tier cap
  windowStart: string; // ISO — current cadence window opened here
  windowSatisfied: boolean; // this window already has a logged connection
  brokenAt: string | null; // ISO deadline the streak broke at (restore window arms from here)
  brokenCount: number; // streak value at break time (what a restore brings back)
  cadenceDays: number; // 7 / 14 / 30 — the plant's period length

  /**
   * The DB plants.id (Batch 10) — needed only for plant_attachments writes.
   * Everything else keys off Plant.id === Friend.id; never surface this in UI.
   */
  dbPlantId: string;
  /** Equipped cosmetics by slot (slot = shop category for v1). */
  attachments: PlantAttachment[];

  /** Linking (Batch 13): non-null when this plant is grafted to a friend's
   *  reciprocal plant. Streak fields then mirror the SHARED streak. */
  linkId: string | null;
  partnerUserId: string | null;
}

export interface PlantAttachment {
  slot: string; // 'pot' | 'nameplate' | 'accessory' | 'bloom'
  sku: string;
}

/**
 * TileMeta - Metadata for a single tile
 *
 * Defines the properties and capabilities of each tile in the map.
 */
export interface TileMeta {
  walkable: boolean;   // Can characters move through this tile?
  placeable: boolean;  // Can entities be placed on this tile?
  height: number;      // Visual height offset for rendering (future use)
}

/**
 * MapData - Complete map structure
 *
 * Combines tile IDs with metadata for full map definition.
 */
export interface MapData {
  width: number;        // Map width in tiles
  height: number;       // Map height in tiles
  ground: number[][];   // 2D array of tile IDs [j][i]
  meta: TileMeta[][];   // 2D array of tile metadata [j][i]
}

/**
 * Entity - Any object that can be placed on the map
 *
 * Currently supports 'character' kind (plants), but designed
 * to be extensible for other entity types in the future.
 */
export interface Entity {
  id: string;           // Unique identifier
  kind: 'character';    // Entity type (currently only 'character')
  tile: TileCoord;      // Current position in 3D grid
  spriteId: string;     // Reference to sprite asset
}
