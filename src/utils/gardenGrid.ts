/**
 * Garden Grid System
 * Maps logical grid positions to screen coordinates that align with the
 * visual grid overlay in garden.background1.png
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GridPosition {
  x: number; // Column (0-based)
  y: number; // Row (0-based)
}

export interface ScreenPosition {
  x: number; // Screen X coordinate (pixels)
  y: number; // Screen Y coordinate (pixels)
}

// Grid configuration - adjust these to match the visual grid in the background image
export const GRID_CONFIG = {
  rows: 8,    // Number of rows in the grid
  cols: 8,    // Number of columns in the grid

  // Garden center point on screen (relative to screen dimensions)
  centerX: SCREEN_WIDTH / 2,
  centerY: SCREEN_HEIGHT / 2,

  // Tile dimensions in pixels (for isometric grid)
  // These create the diamond shape: horizontal spacing and vertical spacing
  tileWidth: 50,   // Horizontal distance between tile centers
  tileHeight: 25,  // Vertical distance between tile centers (typically tileWidth / 2)

  // Offset from center to the grid origin (top-left tile at 0,0)
  originOffsetX: 0,
  originOffsetY: -50,
};

/**
 * Convert grid position to screen coordinates
 * Uses standard isometric projection formula
 */
export function gridToScreen(gridX: number, gridY: number): ScreenPosition {
  'worklet';

  // Standard isometric projection:
  // screenX = (gridX - gridY) * tileWidth/2
  // screenY = (gridX + gridY) * tileHeight/2

  const isoX = (gridX - gridY) * (GRID_CONFIG.tileWidth / 2);
  const isoY = (gridX + gridY) * (GRID_CONFIG.tileHeight / 2);

  return {
    x: GRID_CONFIG.centerX + GRID_CONFIG.originOffsetX + isoX,
    y: GRID_CONFIG.centerY + GRID_CONFIG.originOffsetY + isoY,
  };
}

/**
 * Convert screen coordinates to nearest grid position
 */
export function screenToGrid(screenX: number, screenY: number): GridPosition {
  'worklet';

  // Reverse the offset
  const relX = screenX - GRID_CONFIG.centerX - GRID_CONFIG.originOffsetX;
  const relY = screenY - GRID_CONFIG.centerY - GRID_CONFIG.originOffsetY;

  // Reverse isometric projection:
  // gridX = (screenX / (tileWidth/2) + screenY / (tileHeight/2)) / 2
  // gridY = (screenY / (tileHeight/2) - screenX / (tileWidth/2)) / 2

  const gridX = (relX / (GRID_CONFIG.tileWidth / 2) + relY / (GRID_CONFIG.tileHeight / 2)) / 2;
  const gridY = (relY / (GRID_CONFIG.tileHeight / 2) - relX / (GRID_CONFIG.tileWidth / 2)) / 2;

  // Round to nearest grid position and clamp to valid range
  return {
    x: Math.max(0, Math.min(GRID_CONFIG.cols - 1, Math.round(gridX))),
    y: Math.max(0, Math.min(GRID_CONFIG.rows - 1, Math.round(gridY))),
  };
}

/**
 * Check if grid position is valid (within bounds)
 */
export function isValidPosition(pos: GridPosition): boolean {
  return (
    pos.x >= 0 &&
    pos.x < GRID_CONFIG.cols &&
    pos.y >= 0 &&
    pos.y < GRID_CONFIG.rows
  );
}

/**
 * Get all valid grid positions
 */
export function getAllPositions(): GridPosition[] {
  const positions: GridPosition[] = [];
  for (let y = 0; y < GRID_CONFIG.rows; y++) {
    for (let x = 0; x < GRID_CONFIG.cols; x++) {
      positions.push({ x, y });
    }
  }
  return positions;
}

/**
 * Create position key for map lookups
 */
export function positionKey(pos: GridPosition): string {
  'worklet';
  return `${pos.x},${pos.y}`;
}
