/**
 * Isometric Math Utilities
 *
 * Provides coordinate conversion and depth sorting for isometric tile rendering.
 * Tiles are diamond-shaped with 2:1 ratio (64x32).
 */

// Tile dimensions (2:1 diamond ratio for grid spacing)
// Sized to fit 16x16 grid perfectly on screen
// Grid width = 15 * TILE_WIDTH ≈ 360px (fits ~375px phone screen)
export const TILE_WIDTH = 24;
export const TILE_HEIGHT = 12;

// Actual rendered tile image size (maintains 1:1 aspect ratio of source image)
// The tile image is 1024x1024, so we render it as a square
// Scaled proportionally to tile spacing
export const TILE_RENDER_SIZE = 36; // Square: 36x36 pixels

export interface GridCoord {
  i: number; // Column
  j: number; // Row
}

// Legacy compatibility - maps old GridPosition to new GridCoord
export interface GridPosition {
  x: number; // Maps to 'i' (column)
  y: number; // Maps to 'j' (row)
}

// Convert legacy GridPosition to GridCoord
export function gridPosToCoord(pos: GridPosition): GridCoord {
  return { i: pos.x, j: pos.y };
}

// Convert GridCoord to legacy GridPosition
export function coordToGridPos(coord: GridCoord): GridPosition {
  return { x: coord.i, y: coord.j };
}

export interface ScreenCoord {
  x: number;
  y: number;
}

/**
 * Convert grid coordinates to screen coordinates
 *
 * Isometric projection formula:
 * x = (i - j) * (TILE_WIDTH / 2)
 * y = (i + j) * (TILE_HEIGHT / 2)
 *
 * @param i - Grid column (horizontal right)
 * @param j - Grid row (horizontal left)
 * @param originX - Camera/viewport X offset
 * @param originY - Camera/viewport Y offset
 * @returns Screen position where tile should be drawn
 */
export function gridToScreen(
  i: number,
  j: number,
  originX: number = 0,
  originY: number = 0
): ScreenCoord {
  'worklet';

  const x = (i - j) * (TILE_WIDTH / 2) + originX;
  const y = (i + j) * (TILE_HEIGHT / 2) + originY;

  return { x, y };
}

/**
 * Convert screen coordinates to grid coordinates (approximate)
 *
 * Inverse isometric projection:
 * i = (x / (TILE_WIDTH/2) + y / (TILE_HEIGHT/2)) / 2
 * j = (y / (TILE_HEIGHT/2) - x / (TILE_WIDTH/2)) / 2
 *
 * @param x - Screen X coordinate
 * @param y - Screen Y coordinate
 * @param originX - Camera/viewport X offset
 * @param originY - Camera/viewport Y offset
 * @returns Grid coordinates (rounded to nearest tile)
 */
export function screenToGrid(
  x: number,
  y: number,
  originX: number = 0,
  originY: number = 0
): GridCoord {
  'worklet';

  // Adjust for origin offset
  const adjustedX = x - originX;
  const adjustedY = y - originY;

  // Inverse projection
  const i = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
  const j = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;

  // Round to nearest tile
  return {
    i: Math.round(i),
    j: Math.round(j),
  };
}

/**
 * Generate depth sorting key for sprites/objects
 *
 * Objects further back (higher i+j) should render first.
 * The k parameter allows for vertical layering within the same tile.
 *
 * @param i - Grid column
 * @param j - Grid row
 * @param k - Vertical layer (default 0)
 * @returns Sorting key (higher = render later/on top)
 */
export function depthKey(i: number, j: number, k: number = 0): number {
  'worklet';

  // Base depth is sum of grid coords (back to front)
  // Multiply by 100 to leave room for k layering
  // Add k for vertical stacking
  return (i + j) * 100 + k;
}

/**
 * Calculate visible tile bounds for culling
 *
 * Given camera position and viewport dimensions, determine which tiles
 * are visible and should be rendered.
 *
 * @param cameraX - Camera X position
 * @param cameraY - Camera Y position
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @returns Object with min/max i and j coordinates
 */
export function getVisibleTileBounds(
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): {
  minI: number;
  maxI: number;
  minJ: number;
  maxJ: number;
} {
  'worklet';

  // Convert viewport corners to grid coordinates
  // Top-left corner
  const topLeft = screenToGrid(0, 0, cameraX, cameraY);

  // Top-right corner
  const topRight = screenToGrid(viewportWidth, 0, cameraX, cameraY);

  // Bottom-left corner
  const bottomLeft = screenToGrid(0, viewportHeight, cameraX, cameraY);

  // Bottom-right corner
  const bottomRight = screenToGrid(viewportWidth, viewportHeight, cameraX, cameraY);

  // Find bounds with padding for safety
  const padding = 2;
  const minI = Math.floor(Math.min(topLeft.i, topRight.i, bottomLeft.i, bottomRight.i)) - padding;
  const maxI = Math.ceil(Math.max(topLeft.i, topRight.i, bottomLeft.i, bottomRight.i)) + padding;
  const minJ = Math.floor(Math.min(topLeft.j, topRight.j, bottomLeft.j, bottomRight.j)) - padding;
  const maxJ = Math.ceil(Math.max(topLeft.j, topRight.j, bottomLeft.j, bottomRight.j)) + padding;

  return { minI, maxI, minJ, maxJ };
}

/**
 * Clamp grid coordinates to valid map bounds
 *
 * @param coord - Grid coordinate to clamp
 * @param mapWidth - Map width in tiles
 * @param mapHeight - Map height in tiles
 * @returns Clamped coordinate
 */
export function clampToMap(
  coord: GridCoord,
  mapWidth: number,
  mapHeight: number
): GridCoord {
  'worklet';

  return {
    i: Math.max(0, Math.min(mapWidth - 1, coord.i)),
    j: Math.max(0, Math.min(mapHeight - 1, coord.j)),
  };
}

/**
 * Check if coordinates are within map bounds
 *
 * @param i - Grid column
 * @param j - Grid row
 * @param mapWidth - Map width in tiles
 * @param mapHeight - Map height in tiles
 * @returns True if coordinates are valid
 */
export function isInBounds(
  i: number,
  j: number,
  mapWidth: number,
  mapHeight: number
): boolean {
  'worklet';

  return i >= 0 && i < mapWidth && j >= 0 && j < mapHeight;
}

/**
 * Check if a GridPosition is valid (legacy compatibility)
 */
export function isValidPosition(pos: GridPosition): boolean {
  // Map size is now 16x16
  return pos.x >= 0 && pos.x < 16 && pos.y >= 0 && pos.y < 16;
}

/**
 * Get all valid grid positions (legacy compatibility)
 * Returns positions for a 16x16 grid to match exampleMap
 */
export function getAllPositions(): GridPosition[] {
  const positions: GridPosition[] = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      positions.push({ x, y });
    }
  }
  return positions;
}
