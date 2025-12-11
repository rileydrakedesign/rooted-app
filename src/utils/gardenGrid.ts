/**
 * Garden Grid System - Direct Pixel Mapping
 *
 * Maps grid positions directly to pixel coordinates measured from the
 * garden.background1.png image. No isometric math - just exact positions.
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

// Grid dimensions
export const GRID_CONFIG = {
  rows: 10,
  cols: 10,
};

// Garden image positioning on screen
// The garden image is centered horizontally and positioned in upper-middle vertically
const GARDEN_OFFSET_X = SCREEN_WIDTH / 2;
const GARDEN_OFFSET_Y = SCREEN_HEIGHT * 0.42;

/**
 * Direct position mapping for each grid tile center
 * Coordinates are offsets from the garden center point
 *
 * This creates a proper isometric grid matching the background overlay
 * Format: 'x,y': { x: horizontal_offset, y: vertical_offset }
 */
const POSITION_MAP: Record<string, { x: number; y: number }> = {
  // Row 0 (top)
  '0,0': { x: 0, y: -150 },
  '1,0': { x: 29, y: -135 },
  '2,0': { x: 58, y: -120 },
  '3,0': { x: 87, y: -105 },
  '4,0': { x: 116, y: -90 },
  '5,0': { x: 145, y: -75 },
  '6,0': { x: 174, y: -60 },
  '7,0': { x: 203, y: -45 },
  '8,0': { x: 232, y: -30 },
  '9,0': { x: 261, y: -15 },

  // Row 1
  '0,1': { x: -29, y: -135 },
  '1,1': { x: 0, y: -120 },
  '2,1': { x: 29, y: -105 },
  '3,1': { x: 58, y: -90 },
  '4,1': { x: 87, y: -75 },
  '5,1': { x: 116, y: -60 },
  '6,1': { x: 145, y: -45 },
  '7,1': { x: 174, y: -30 },
  '8,1': { x: 203, y: -15 },
  '9,1': { x: 232, y: 0 },

  // Row 2
  '0,2': { x: -58, y: -120 },
  '1,2': { x: -29, y: -105 },
  '2,2': { x: 0, y: -90 },
  '3,2': { x: 29, y: -75 },
  '4,2': { x: 58, y: -60 },
  '5,2': { x: 87, y: -45 },
  '6,2': { x: 116, y: -30 },
  '7,2': { x: 145, y: -15 },
  '8,2': { x: 174, y: 0 },
  '9,2': { x: 203, y: 15 },

  // Row 3
  '0,3': { x: -87, y: -105 },
  '1,3': { x: -58, y: -90 },
  '2,3': { x: -29, y: -75 },
  '3,3': { x: 0, y: -60 },
  '4,3': { x: 29, y: -45 },
  '5,3': { x: 58, y: -30 },
  '6,3': { x: 87, y: -15 },
  '7,3': { x: 116, y: 0 },
  '8,3': { x: 145, y: 15 },
  '9,3': { x: 174, y: 30 },

  // Row 4
  '0,4': { x: -116, y: -90 },
  '1,4': { x: -87, y: -75 },
  '2,4': { x: -58, y: -60 },
  '3,4': { x: -29, y: -45 },
  '4,4': { x: 0, y: -30 },
  '5,4': { x: 29, y: -15 },
  '6,4': { x: 58, y: 0 },
  '7,4': { x: 87, y: 15 },
  '8,4': { x: 116, y: 30 },
  '9,4': { x: 145, y: 45 },

  // Row 5
  '0,5': { x: -145, y: -75 },
  '1,5': { x: -116, y: -60 },
  '2,5': { x: -87, y: -45 },
  '3,5': { x: -58, y: -30 },
  '4,5': { x: -29, y: -15 },
  '5,5': { x: 0, y: 0 },
  '6,5': { x: 29, y: 15 },
  '7,5': { x: 58, y: 30 },
  '8,5': { x: 87, y: 45 },
  '9,5': { x: 116, y: 60 },

  // Row 6
  '0,6': { x: -174, y: -60 },
  '1,6': { x: -145, y: -45 },
  '2,6': { x: -116, y: -30 },
  '3,6': { x: -87, y: -15 },
  '4,6': { x: -58, y: 0 },
  '5,6': { x: -29, y: 15 },
  '6,6': { x: 0, y: 30 },
  '7,6': { x: 29, y: 45 },
  '8,6': { x: 58, y: 60 },
  '9,6': { x: 87, y: 75 },

  // Row 7
  '0,7': { x: -203, y: -45 },
  '1,7': { x: -174, y: -30 },
  '2,7': { x: -145, y: -15 },
  '3,7': { x: -116, y: 0 },
  '4,7': { x: -87, y: 15 },
  '5,7': { x: -58, y: 30 },
  '6,7': { x: -29, y: 45 },
  '7,7': { x: 0, y: 60 },
  '8,7': { x: 29, y: 75 },
  '9,7': { x: 58, y: 90 },

  // Row 8
  '0,8': { x: -232, y: -30 },
  '1,8': { x: -203, y: -15 },
  '2,8': { x: -174, y: 0 },
  '3,8': { x: -145, y: 15 },
  '4,8': { x: -116, y: 30 },
  '5,8': { x: -87, y: 45 },
  '6,8': { x: -58, y: 60 },
  '7,8': { x: -29, y: 75 },
  '8,8': { x: 0, y: 90 },
  '9,8': { x: 29, y: 105 },

  // Row 9 (bottom)
  '0,9': { x: -261, y: -15 },
  '1,9': { x: -232, y: 0 },
  '2,9': { x: -203, y: 15 },
  '3,9': { x: -174, y: 30 },
  '4,9': { x: -145, y: 45 },
  '5,9': { x: -116, y: 60 },
  '6,9': { x: -87, y: 75 },
  '7,9': { x: -58, y: 90 },
  '8,9': { x: -29, y: 105 },
  '9,9': { x: 0, y: 120 },
};

/**
 * Convert grid position to screen coordinates using direct mapping
 */
export function gridToScreen(gridX: number, gridY: number): ScreenPosition {
  'worklet';

  const key = `${gridX},${gridY}`;
  const offset = POSITION_MAP[key] || { x: 0, y: 0 };

  return {
    x: GARDEN_OFFSET_X + offset.x,
    y: GARDEN_OFFSET_Y + offset.y,
  };
}

/**
 * Convert screen coordinates to nearest grid position
 */
export function screenToGrid(screenX: number, screenY: number): GridPosition {
  'worklet';

  // Find closest grid position by distance
  let closestGrid: GridPosition = { x: 0, y: 0 };
  let closestDistance = Infinity;

  for (let y = 0; y < GRID_CONFIG.rows; y++) {
    for (let x = 0; x < GRID_CONFIG.cols; x++) {
      const screen = gridToScreen(x, y);
      const distance = Math.sqrt(
        Math.pow(screenX - screen.x, 2) + Math.pow(screenY - screen.y, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestGrid = { x, y };
      }
    }
  }

  return closestGrid;
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
