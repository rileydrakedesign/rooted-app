/**
 * Placement Rules
 *
 * Validation logic for entity placement on the tile map.
 * Determines whether an entity can be placed at a given tile.
 */

import { MapData, TileCoord, Entity } from '../types/garden';
import { OccupancyMap } from './occupancy';

/**
 * Validation result with optional reason for failure
 */
export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Check if a tile coordinate is within map bounds
 *
 * @param map - Map data containing width and height
 * @param tile - Tile coordinate to check
 * @returns True if tile is within bounds
 */
export function isTileInBounds(map: MapData, tile: TileCoord): boolean {
  return (
    tile.i >= 0 &&
    tile.i < map.width &&
    tile.j >= 0 &&
    tile.j < map.height &&
    tile.k >= 0 // k must be non-negative
  );
}

/**
 * Check if a tile allows entity placement
 *
 * Checks the tile's metadata to see if placement is allowed.
 *
 * @param map - Map data containing tile metadata
 * @param tile - Tile coordinate to check
 * @returns True if tile allows placement
 */
export function isTilePlaceable(map: MapData, tile: TileCoord): boolean {
  // First check bounds
  if (!isTileInBounds(map, tile)) {
    return false;
  }

  // Check metadata
  const meta = map.meta[tile.j][tile.i];
  return meta.placeable;
}

/**
 * Check if an entity can be placed at a target tile
 *
 * Performs comprehensive validation:
 * - Bounds checking
 * - Tile placeability
 * - Occupancy checking
 * - Custom game rules (e.g., no front row placement)
 *
 * @param map - Map data
 * @param occupancy - Occupancy tracker
 * @param entity - Entity to place
 * @param targetTile - Target tile coordinate
 * @returns Validation result with reason if invalid
 */
export function canPlaceEntity(
  map: MapData,
  occupancy: OccupancyMap,
  entity: Entity,
  targetTile: TileCoord
): ValidationResult {
  // Check bounds
  if (!isTileInBounds(map, targetTile)) {
    return {
      ok: false,
      reason: `Tile (${targetTile.i}, ${targetTile.j}, ${targetTile.k}) is out of bounds`,
    };
  }

  // Check tile placeability
  if (!isTilePlaceable(map, targetTile)) {
    return {
      ok: false,
      reason: `Tile (${targetTile.i}, ${targetTile.j}) does not allow placement`,
    };
  }

  // Check occupancy (ignore the entity being placed if it's already on the map)
  if (occupancy.isOccupied(targetTile, entity.id)) {
    const occupant = occupancy.getOccupant(targetTile);
    return {
      ok: false,
      reason: `Tile (${targetTile.i}, ${targetTile.j}, ${targetTile.k}) is occupied by ${occupant}`,
    };
  }

  // Custom game rule: No placement on front row (j = height - 1)
  // This keeps the front row clear for visual clarity
  if (targetTile.j >= map.height - 1) {
    return {
      ok: false,
      reason: 'Cannot place entities on the front row',
    };
  }

  // All checks passed
  return { ok: true };
}

/**
 * Get all valid placement tiles for an entity
 *
 * Useful for AI placement or highlighting valid areas.
 *
 * @param map - Map data
 * @param occupancy - Occupancy tracker
 * @param entity - Entity to place
 * @returns Array of valid tile coordinates
 */
export function getValidPlacementTiles(
  map: MapData,
  occupancy: OccupancyMap,
  entity: Entity
): TileCoord[] {
  const validTiles: TileCoord[] = [];

  // Check all tiles at ground level (k=0)
  for (let j = 0; j < map.height; j++) {
    for (let i = 0; i < map.width; i++) {
      const tile: TileCoord = { i, j, k: 0 };
      const result = canPlaceEntity(map, occupancy, entity, tile);
      if (result.ok) {
        validTiles.push(tile);
      }
    }
  }

  return validTiles;
}

/**
 * Find the nearest valid tile to a target position
 *
 * Useful for snapping invalid placements to the nearest valid spot.
 *
 * @param map - Map data
 * @param occupancy - Occupancy tracker
 * @param entity - Entity to place
 * @param target - Target tile (may be invalid)
 * @returns Nearest valid tile or null if none found
 */
export function findNearestValidTile(
  map: MapData,
  occupancy: OccupancyMap,
  entity: Entity,
  target: TileCoord
): TileCoord | null {
  const validTiles = getValidPlacementTiles(map, occupancy, entity);

  if (validTiles.length === 0) {
    return null;
  }

  // Find closest tile using Manhattan distance
  let nearestTile = validTiles[0];
  let minDistance = Math.abs(target.i - nearestTile.i) + Math.abs(target.j - nearestTile.j);

  for (const tile of validTiles) {
    const distance = Math.abs(target.i - tile.i) + Math.abs(target.j - tile.j);
    if (distance < minDistance) {
      minDistance = distance;
      nearestTile = tile;
    }
  }

  return nearestTile;
}
