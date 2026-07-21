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
