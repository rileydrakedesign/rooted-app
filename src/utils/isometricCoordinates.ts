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

export const GRID_SIZE = 6; // 6x6 grid
export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 2.0;

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
  return `${position.x},${position.y}`;
}

/**
 * Clamp zoom value between min and max
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Calculate optimal tile size based on screen width
 */
export function calculateTileSize(screenWidth: number): { width: number; height: number } {
  // Leave margins on sides, divide remaining space by grid size
  const margin = 40;
  const availableWidth = screenWidth - margin * 2;

  // Isometric tiles are 2:1 ratio (width:height)
  const tileWidth = availableWidth / (GRID_SIZE + 2); // +2 for visual spacing
  const tileHeight = tileWidth / 2;

  return { width: tileWidth, height: tileHeight };
}
