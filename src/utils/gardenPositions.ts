/**
 * Garden Position Mapping System
 *
 * Simple pixel-based positioning for plants on the garden background.
 * Each grid position maps to exact screen coordinates.
 *
 * To calibrate:
 * 1. Enable debug mode to see all available positions
 * 2. Adjust the pixel coordinates below to match your garden background
 * 3. Positions are relative to screen center for responsive layouts
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GridPosition {
  x: number; // Grid column (0-based)
  y: number; // Grid row (0-based)
}

export interface ScreenPosition {
  x: number; // Absolute screen X coordinate
  y: number; // Absolute screen Y coordinate
}

// Grid configuration
export const GRID_SIZE = 4; // 4x4 grid
export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 1.6;

/**
 * Position map - defines where each grid cell appears on screen
 * Coordinates are offsets from screen center
 *
 * Grid layout visualization:
 *    0,0  1,0  2,0  3,0
 *    0,1  1,1  2,1  3,1
 *    0,2  1,2  2,2  3,2
 *    0,3  1,3  2,3  3,3
 */
const POSITION_OFFSETS: Record<string, { x: number; y: number }> = {
  // Row 0 (top row)
  '0,0': { x: -120, y: 80 },
  '1,0': { x: -40, y: 80 },
  '2,0': { x: 40, y: 80 },
  '3,0': { x: 120, y: 80 },

  // Row 1
  '0,1': { x: -120, y: 140 },
  '1,1': { x: -40, y: 140 },
  '2,1': { x: 40, y: 140 },
  '3,1': { x: 120, y: 140 },

  // Row 2
  '0,2': { x: -120, y: 200 },
  '1,2': { x: -40, y: 200 },
  '2,2': { x: 40, y: 200 },
  '3,2': { x: 120, y: 200 },

  // Row 3 (bottom row)
  '0,3': { x: -120, y: 260 },
  '1,3': { x: -40, y: 260 },
  '2,3': { x: 40, y: 260 },
  '3,3': { x: 120, y: 260 },
};

/**
 * Get screen position for a grid coordinate
 */
export function gridToScreen(gridX: number, gridY: number): ScreenPosition {
  'worklet';
  const key = `${gridX},${gridY}`;
  const offset = POSITION_OFFSETS[key] || { x: 0, y: 0 };

  return {
    x: SCREEN_WIDTH / 2 + offset.x,
    y: SCREEN_HEIGHT / 2 + offset.y,
  };
}

/**
 * Find nearest grid position for a screen coordinate
 */
export function screenToGrid(screenX: number, screenY: number): GridPosition {
  'worklet';

  // Convert screen coordinates to offsets from center
  const offsetX = screenX - SCREEN_WIDTH / 2;
  const offsetY = screenY - SCREEN_HEIGHT / 2;

  // Find closest grid position
  let closestGrid: GridPosition = { x: 0, y: 0 };
  let closestDistance = Infinity;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`;
      const pos = POSITION_OFFSETS[key];
      if (!pos) continue;

      const distance = Math.sqrt(
        Math.pow(offsetX - pos.x, 2) + Math.pow(offsetY - pos.y, 2)
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
 * Check if a grid position is valid
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
 * Create a position key for lookups
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
 * Get all valid grid positions
 */
export function getAllGridPositions(): GridPosition[] {
  const positions: GridPosition[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      positions.push({ x, y });
    }
  }
  return positions;
}
