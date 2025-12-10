/**
 * Isometric Garden Coordinate System Utilities
 *
 * Converts between grid coordinates (logical 6x6 grid) and screen coordinates
 * for isometric (2:1 diamond) projection
 */

export interface GridPosition {
  x: number; // 0-5
  y: number; // 0-5
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export const GRID_SIZE = 4; // 4x4 grid (adjust to match your garden)
export const MIN_ZOOM = 1.0; // No zoom out - default view is closest
export const MAX_ZOOM = 1.6; // Max zoom still shows garden corners

// Manual calibration values - adjust these to match your garden background image
export const GRID_CONFIG = {
  // Origin point - where grid position (0,0) should be on screen
  originXOffset: 0, // Horizontal offset from center (positive = right, negative = left)
  originYOffset: 100, // Vertical offset from center (positive = down, negative = up)

  // Tile dimensions - size of each isometric tile
  tileWidth: 80, // Width of diamond tile
  tileHeight: 40, // Height of diamond tile (typically tileWidth / 2 for isometric)
};

/**
 * Get the grid origin point in screen coordinates
 * This is where grid position (0,0) maps to on screen
 */
export function getGridOrigin(screenWidth: number, screenHeight: number): ScreenPosition {
  'worklet';
  return {
    x: screenWidth / 2 + GRID_CONFIG.originXOffset,
    y: screenHeight / 2 + GRID_CONFIG.originYOffset,
  };
}

/**
 * Convert grid coordinates to screen coordinates
 * Uses isometric projection: screenX = (gridX - gridY) * tileWidth/2
 *
 * @param gridX Grid X position (0-5)
 * @param gridY Grid Y position (0-5)
 * @param tileWidth Base tile width in pixels
 * @param tileHeight Base tile height in pixels
 * @returns Screen coordinates relative to container center
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  tileWidth: number,
  tileHeight: number
): ScreenPosition {
  'worklet';
  const screenX = (gridX - gridY) * (tileWidth / 2);
  const screenY = (gridX + gridY) * (tileHeight / 2);

  return { x: screenX, y: screenY };
}

/**
 * Convert screen coordinates to nearest grid position
 * Reverses the isometric projection
 *
 * @param screenX Screen X position relative to container center
 * @param screenY Screen Y position relative to container center
 * @param tileWidth Base tile width in pixels
 * @param tileHeight Base tile height in pixels
 * @returns Nearest grid coordinates (clamped to 0-5)
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  tileWidth: number,
  tileHeight: number
): GridPosition {
  'worklet';
  // Reverse isometric projection
  const gridX = (screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2;
  const gridY = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2;

  // Round to nearest integer and clamp to grid bounds
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, Math.round(gridX))),
    y: Math.max(0, Math.min(GRID_SIZE - 1, Math.round(gridY))),
  };
}

/**
 * Check if a grid position is valid (within bounds)
 */
export function isValidGridPosition(position: GridPosition): boolean {
  return (
    position.x >= 0 &&
    position.x < GRID_SIZE &&
    position.y >= 0 &&
    position.y < GRID_SIZE
  );
}

/**
 * Check if a grid position is occupied by another plant
 */
export function isPositionOccupied(
  position: GridPosition,
  occupiedPositions: Set<string>,
  excludeId?: string
): boolean {
  const key = `${position.x},${position.y}`;

  // If we're checking for the plant being dragged, exclude it from collision
  if (excludeId) {
    return false; // We'd need to check against all other plants except the one being dragged
  }

  return occupiedPositions.has(key);
}

/**
 * Create a position key for map lookups
 */
export function positionKey(position: GridPosition): string {
  'worklet';
  return `${position.x},${position.y}`;
}

/**
 * Clamp zoom value between min and max
 */
export function clampZoom(zoom: number): number {
  'worklet';
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Get tile size from manual configuration
 */
export function calculateTileSize(_screenWidth: number): { width: number; height: number } {
  return {
    width: GRID_CONFIG.tileWidth,
    height: GRID_CONFIG.tileHeight
  };
}
