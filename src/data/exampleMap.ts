/**
 * Example Map Data
 *
 * A 30x30 grid of tile IDs for the garden.
 * Each number represents a different tile type.
 *
 * Tile IDs:
 * 1 = Grass tile (singleTileGarden.png)
 */

export type TileId = number;

export interface MapData {
  width: number;
  height: number;
  tiles: TileId[][];
}

/**
 * Generate a 30x30 map filled with grass tiles
 */
function generateGrassMap(width: number, height: number): TileId[][] {
  const tiles: TileId[][] = [];

  for (let j = 0; j < height; j++) {
    const row: TileId[] = [];
    for (let i = 0; i < width; i++) {
      // All tiles are grass (ID 1)
      row.push(1);
    }
    tiles.push(row);
  }

  return tiles;
}

/**
 * Example 10x10 garden map (optimized for performance)
 */
export const exampleMap: MapData = {
  width: 10,
  height: 10,
  tiles: generateGrassMap(10, 10),
};

/**
 * Tile image dictionary
 * Maps tile IDs to their image sources
 */
export const TILE_IMAGES: Record<TileId, any> = {
  1: require('../../assets/images/garden/singleTileGarden.png'),
};

/**
 * Get tile ID at specific grid position
 * Returns 0 (empty) if out of bounds
 */
export function getTileAt(map: MapData, i: number, j: number): TileId {
  if (j < 0 || j >= map.height || i < 0 || i >= map.width) {
    return 0; // Out of bounds
  }
  return map.tiles[j][i];
}
