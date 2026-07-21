/**
 * Occupancy System
 *
 * Tracks which tiles are occupied by entities using a Map for O(1) lookups.
 * Each tile position (i, j, k) can be occupied by at most one entity.
 */

import { TileCoord } from '../types/garden';

/**
 * Build an occupancy map from a list of placed entities.
 *
 * This is the ONLY way occupancy should be produced in app state: derive it
 * from the entities array (pure function) instead of mutating a long-lived
 * map inside state updaters.
 */
export function buildOccupancy(
  entities: Array<{ id: string; tile: TileCoord }>
): OccupancyMap {
  const occupancy = new OccupancyMap();
  for (const entity of entities) {
    occupancy.occupy(entity.tile, entity.id);
  }
  return occupancy;
}

/**
 * Generate a unique string key for a tile coordinate
 *
 * Format: "i,j,k"
 * Example: "3,5,0" for tile at (i=3, j=5, k=0)
 */
export function key(i: number, j: number, k: number): string {
  return `${i},${j},${k}`;
}

/**
 * Generate key from TileCoord object
 */
export function keyFromCoord(tile: TileCoord): string {
  return key(tile.i, tile.j, tile.k);
}

/**
 * Occupancy Map
 *
 * Maps tile keys to entity IDs.
 * This provides O(1) lookups for checking if a tile is occupied.
 */
export class OccupancyMap {
  private map: Map<string, string>;

  constructor() {
    this.map = new Map();
  }

  /**
   * Check if a tile is occupied
   *
   * @param tile - Tile coordinate to check
   * @param ignoreEntityId - Optional entity ID to ignore (useful when checking if dragged entity can move)
   * @returns True if occupied (by an entity other than ignoreEntityId)
   */
  isOccupied(tile: TileCoord, ignoreEntityId?: string): boolean {
    const tileKey = keyFromCoord(tile);
    const occupyingEntityId = this.map.get(tileKey);

    if (!occupyingEntityId) {
      return false; // Not occupied
    }

    if (ignoreEntityId && occupyingEntityId === ignoreEntityId) {
      return false; // Occupied by ignored entity, so treat as unoccupied
    }

    return true; // Occupied by another entity
  }

  /**
   * Mark a tile as occupied by an entity
   *
   * @param tile - Tile coordinate to occupy
   * @param entityId - ID of the entity occupying the tile
   * @returns false if the tile was already occupied by a different entity
   *          (the occupancy is left unchanged), true otherwise
   */
  occupy(tile: TileCoord, entityId: string): boolean {
    const tileKey = keyFromCoord(tile);
    const existing = this.map.get(tileKey);

    if (existing && existing !== entityId) {
      console.warn(
        `Tile ${tileKey} is already occupied by entity ${existing}, cannot place ${entityId}`
      );
      return false;
    }

    this.map.set(tileKey, entityId);
    return true;
  }

  /**
   * Clear a tile (remove occupancy)
   *
   * @param tile - Tile coordinate to clear
   */
  clear(tile: TileCoord): void {
    const tileKey = keyFromCoord(tile);
    this.map.delete(tileKey);
  }

  /**
   * Clear all tiles occupied by a specific entity
   *
   * Useful when moving an entity - clear its old position first.
   *
   * @param entityId - ID of entity to remove from all tiles
   */
  clearEntity(entityId: string): void {
    const keysToDelete: string[] = [];

    // Find all tiles occupied by this entity
    this.map.forEach((occupyingId, tileKey) => {
      if (occupyingId === entityId) {
        keysToDelete.push(tileKey);
      }
    });

    // Delete them
    keysToDelete.forEach((tileKey) => this.map.delete(tileKey));
  }

  /**
   * Get the entity ID occupying a tile
   *
   * @param tile - Tile coordinate to check
   * @returns Entity ID or undefined if not occupied
   */
  getOccupant(tile: TileCoord): string | undefined {
    const tileKey = keyFromCoord(tile);
    return this.map.get(tileKey);
  }

  /**
   * Get all occupied tiles and their occupants
   *
   * @returns Array of [tileKey, entityId] pairs
   */
  getAllOccupied(): Array<[string, string]> {
    return Array.from(this.map.entries());
  }

  /**
   * Clear all occupancy data
   */
  clearAll(): void {
    this.map.clear();
  }

  /**
   * Get total number of occupied tiles
   */
  size(): number {
    return this.map.size;
  }
}
