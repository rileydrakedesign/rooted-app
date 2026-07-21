/**
 * Example Map Data
 *
 * A 10x10 grid of tile IDs for the garden.
 * Each number represents a different tile type.
 *
 * Tile IDs:
 * 1 = Legacy grass tile (singleTileGarden.png, 60px render) — unused in layout
 * 2 = Grass (PixelLab block, 64px pixel art)
 * 3 = Tilled soil planting bed — the only placeable tile type
 * 4 = Cobblestone path
 * 5 = Pond water — not walkable
 * 6 = Grass with wildflowers (accent)
 */

import { MapData as MapDataNew, TileMeta } from '../types/garden';

export type TileId = number;

// Legacy MapData interface for backward compatibility
export interface MapData {
  width: number;
  height: number;
  tiles: TileId[][];
  ground: number[][];  // Same as tiles, for new type compatibility
  meta: TileMeta[][];  // Tile metadata
}

/**
 * Designed garden layout (j = row, 0 = back; i = column, 0 = left).
 * - 2x2 pond in the back-left corner
 * - Two 3x3 tilled planting beds (only tiles where plants can be placed)
 * - Cobblestone path at i=5 running from the beds to the front edge
 * - Wildflower grass accents sprinkled on fixed tiles
 */
const LAYOUT: string[] = [
  '5522222222', // j=0 (back)
  '5522222622', // j=1
  '2333243332', // j=2  beds + path
  '2333243332', // j=3  beds + path
  '2333243332', // j=4  beds + path
  '2262242622', // j=5
  '2222242222', // j=6
  '2622242226', // j=7
  '2222242222', // j=8
  '2222242222', // j=9 (front)
];

function parseLayout(layout: string[]): TileId[][] {
  return layout.map((row) => row.split('').map((ch) => parseInt(ch, 10)));
}

/**
 * Generate metadata from the tile layout.
 *
 * - placeable: only tilled soil beds (tile 3) accept plants/entities
 * - walkable: everything except water (tile 5)
 */
function generateMetadata(tiles: TileId[][]): TileMeta[][] {
  return tiles.map((row) =>
    row.map((tileId) => ({
      walkable: tileId !== 5,
      placeable: tileId === 3,
      height: 0,
    }))
  );
}

const tiles = parseLayout(LAYOUT);
const meta = generateMetadata(tiles);

export const exampleMap: MapData = {
  width: 10,
  height: 10,
  tiles: tiles,
  ground: tiles,  // ground and tiles point to the same array
  meta: meta,
};

/**
 * Tile image dictionary
 * Maps tile IDs to their image sources
 */
export const TILE_IMAGES: Record<TileId, any> = {
  1: require('../../assets/images/garden/singleTileGarden.png'),
  2: require('../../assets/images/garden/tiles/grass-block-64.png'),
  3: require('../../assets/images/garden/tiles/soil-tilled-block-64.png'),
  4: require('../../assets/images/garden/tiles/path-cobble-block-64.png'),
  5: require('../../assets/images/garden/tiles/water-block-64.png'),
  6: require('../../assets/images/garden/tiles/grass-flowers-block-64.png'),
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
