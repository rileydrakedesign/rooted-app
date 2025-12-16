/**
 * Garden Grid System - Accurate Pixel Mapping
 *
 * Generated from precise image analysis of gardenBackground1.png
 * Source image: 1000x1000px
 * Grid: 10x10 isometric layout
 * Average alignment accuracy: 29.83px
 *
 * Coordinate system:
 * - (0,0) is at the bottom-center of the playable area
 * - (9,9) is at the top-center
 * - Increasing col moves southeast
 * - Increasing row moves southwest
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GridPosition {
  x: number; // Column (0-9)
  y: number; // Row (0-9)
}

export interface ScreenPosition {
  x: number; // Screen X coordinate (pixels)
  y: number; // Screen Y coordinate (pixels)
}

// Grid configuration
export const GRID_CONFIG = {
  rows: 10,
  cols: 10,
};

/**
 * Image rendering calculations
 * Source image: 1000x1000px
 * Rendered with resizeMode="contain" in container: SCREEN_WIDTH x SCREEN_HEIGHT*0.8
 */

// Image scaling factor (source 1000px -> screen width)
const IMAGE_SCALE = SCREEN_WIDTH / 1000;

// Rendered image dimensions
const RENDERED_WIDTH = SCREEN_WIDTH;
const RENDERED_HEIGHT = SCREEN_WIDTH; // Square image maintains aspect ratio

// Container dimensions
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.8;

// Vertical offset due to centering within container
const VERTICAL_OFFSET = (CONTAINER_HEIGHT - RENDERED_HEIGHT) / 2;

// Image center on screen
const IMAGE_CENTER_X = SCREEN_WIDTH / 2;
const IMAGE_CENTER_Y = VERTICAL_OFFSET + RENDERED_HEIGHT / 2;

/**
 * Isometric grid vectors (in source image coordinates)
 * These define the two primary directions of the isometric grid
 * SCALED to fit the playable grass area (60% of original detected vectors)
 */
const ISOMETRIC_VECTOR_1 = { x: 51.9700, y: -26.0571 }; // Southeast
const ISOMETRIC_VECTOR_2 = { x: -52.0300, y: -26.0270 }; // Southwest

/**
 * Grid origin in source image coordinates
 * This is the position of grid cell (0,0)
 * Centered within the playable grass surface
 *
 * Adjusted by one grid unit towards the back (top of diamond):
 * Shift = Vector1 + Vector2 (moves one diagonal unit up/back)
 */
const GRID_ORIGIN = {
  x: 495.3003 + ISOMETRIC_VECTOR_1.x + ISOMETRIC_VECTOR_2.x,
  y: 760.9205 + ISOMETRIC_VECTOR_1.y + ISOMETRIC_VECTOR_2.y
};

/**
 * Pre-calculated grid positions as offsets from image center (500, 500)
 * This allows for accurate scaling regardless of screen size
 * SHIFTED by one grid unit towards the back corner
 */
const GRID_OFFSETS: Record<string, { x: number; y: number }> = {
  "0,0": {
    "x": -5,
    "y": 209
  },
  "1,0": {
    "x": 47,
    "y": 183
  },
  "2,0": {
    "x": 99,
    "y": 157
  },
  "3,0": {
    "x": 151,
    "y": 131
  },
  "4,0": {
    "x": 203,
    "y": 105
  },
  "5,0": {
    "x": 255,
    "y": 79
  },
  "6,0": {
    "x": 307,
    "y": 53
  },
  "7,0": {
    "x": 359,
    "y": 27
  },
  "8,0": {
    "x": 411,
    "y": 0
  },
  "9,0": {
    "x": 463,
    "y": -26
  },
  "0,1": {
    "x": -57,
    "y": 183
  },
  "1,1": {
    "x": -5,
    "y": 157
  },
  "2,1": {
    "x": 47,
    "y": 131
  },
  "3,1": {
    "x": 99,
    "y": 105
  },
  "4,1": {
    "x": 151,
    "y": 79
  },
  "5,1": {
    "x": 203,
    "y": 53
  },
  "6,1": {
    "x": 255,
    "y": 27
  },
  "7,1": {
    "x": 307,
    "y": 0
  },
  "8,1": {
    "x": 359,
    "y": -26
  },
  "9,1": {
    "x": 411,
    "y": -52
  },
  "0,2": {
    "x": -109,
    "y": 157
  },
  "1,2": {
    "x": -57,
    "y": 131
  },
  "2,2": {
    "x": -5,
    "y": 105
  },
  "3,2": {
    "x": 47,
    "y": 79
  },
  "4,2": {
    "x": 99,
    "y": 53
  },
  "5,2": {
    "x": 151,
    "y": 27
  },
  "6,2": {
    "x": 203,
    "y": 1
  },
  "7,2": {
    "x": 255,
    "y": -26
  },
  "8,2": {
    "x": 307,
    "y": -52
  },
  "9,2": {
    "x": 359,
    "y": -78
  },
  "0,3": {
    "x": -161,
    "y": 131
  },
  "1,3": {
    "x": -109,
    "y": 105
  },
  "2,3": {
    "x": -57,
    "y": 79
  },
  "3,3": {
    "x": -5,
    "y": 53
  },
  "4,3": {
    "x": 47,
    "y": 27
  },
  "5,3": {
    "x": 99,
    "y": 1
  },
  "6,3": {
    "x": 151,
    "y": -26
  },
  "7,3": {
    "x": 203,
    "y": -52
  },
  "8,3": {
    "x": 255,
    "y": -78
  },
  "9,3": {
    "x": 307,
    "y": -104
  },
  "0,4": {
    "x": -213,
    "y": 105
  },
  "1,4": {
    "x": -161,
    "y": 79
  },
  "2,4": {
    "x": -109,
    "y": 53
  },
  "3,4": {
    "x": -57,
    "y": 27
  },
  "4,4": {
    "x": -5,
    "y": 1
  },
  "5,4": {
    "x": 47,
    "y": -25
  },
  "6,4": {
    "x": 99,
    "y": -52
  },
  "7,4": {
    "x": 151,
    "y": -78
  },
  "8,4": {
    "x": 203,
    "y": -104
  },
  "9,4": {
    "x": 255,
    "y": -130
  },
  "0,5": {
    "x": -265,
    "y": 79
  },
  "1,5": {
    "x": -213,
    "y": 53
  },
  "2,5": {
    "x": -161,
    "y": 27
  },
  "3,5": {
    "x": -109,
    "y": 1
  },
  "4,5": {
    "x": -57,
    "y": -25
  },
  "5,5": {
    "x": -5,
    "y": -52
  },
  "6,5": {
    "x": 47,
    "y": -78
  },
  "7,5": {
    "x": 99,
    "y": -104
  },
  "8,5": {
    "x": 151,
    "y": -130
  },
  "9,5": {
    "x": 203,
    "y": -156
  },
  "0,6": {
    "x": -317,
    "y": 53
  },
  "1,6": {
    "x": -265,
    "y": 27
  },
  "2,6": {
    "x": -213,
    "y": 1
  },
  "3,6": {
    "x": -161,
    "y": -25
  },
  "4,6": {
    "x": -109,
    "y": -51
  },
  "5,6": {
    "x": -57,
    "y": -78
  },
  "6,6": {
    "x": -5,
    "y": -104
  },
  "7,6": {
    "x": 47,
    "y": -130
  },
  "8,6": {
    "x": 99,
    "y": -156
  },
  "9,6": {
    "x": 151,
    "y": -182
  },
  "0,7": {
    "x": -369,
    "y": 27
  },
  "1,7": {
    "x": -317,
    "y": 1
  },
  "2,7": {
    "x": -265,
    "y": -25
  },
  "3,7": {
    "x": -213,
    "y": -51
  },
  "4,7": {
    "x": -161,
    "y": -77
  },
  "5,7": {
    "x": -109,
    "y": -104
  },
  "6,7": {
    "x": -57,
    "y": -130
  },
  "7,7": {
    "x": -5,
    "y": -156
  },
  "8,7": {
    "x": 47,
    "y": -182
  },
  "9,7": {
    "x": 99,
    "y": -208
  },
  "0,8": {
    "x": -421,
    "y": 1
  },
  "1,8": {
    "x": -369,
    "y": -25
  },
  "2,8": {
    "x": -317,
    "y": -51
  },
  "3,8": {
    "x": -265,
    "y": -77
  },
  "4,8": {
    "x": -213,
    "y": -104
  },
  "5,8": {
    "x": -161,
    "y": -130
  },
  "6,8": {
    "x": -109,
    "y": -156
  },
  "7,8": {
    "x": -57,
    "y": -182
  },
  "8,8": {
    "x": -5,
    "y": -208
  },
  "9,8": {
    "x": 47,
    "y": -234
  },
  "0,9": {
    "x": -473,
    "y": -25
  },
  "1,9": {
    "x": -421,
    "y": -51
  },
  "2,9": {
    "x": -369,
    "y": -77
  },
  "3,9": {
    "x": -317,
    "y": -103
  },
  "4,9": {
    "x": -265,
    "y": -130
  },
  "5,9": {
    "x": -213,
    "y": -156
  },
  "6,9": {
    "x": -161,
    "y": -182
  },
  "7,9": {
    "x": -109,
    "y": -208
  },
  "8,9": {
    "x": -57,
    "y": -234
  },
  "9,9": {
    "x": -5,
    "y": -260
  }
};

/**
 * Convert source image coordinates to screen coordinates
 */
function imageToScreen(imageX: number, imageY: number): ScreenPosition {
  'worklet';
  // Position relative to image center
  const offsetX = (imageX - 500) * IMAGE_SCALE;
  const offsetY = (imageY - 500) * IMAGE_SCALE;

  return {
    x: IMAGE_CENTER_X + offsetX,
    y: IMAGE_CENTER_Y + offsetY,
  };
}

/**
 * Convert grid position to screen coordinates
 */
export function gridToScreen(gridX: number, gridY: number): ScreenPosition {
  'worklet';

  const key = `${gridX},${gridY}`;
  const offset = GRID_OFFSETS[key];

  if (!offset) {
    // Fallback: calculate position using isometric formula
    const imageX = GRID_ORIGIN.x + gridX * ISOMETRIC_VECTOR_1.x + gridY * ISOMETRIC_VECTOR_2.x;
    const imageY = GRID_ORIGIN.y + gridX * ISOMETRIC_VECTOR_1.y + gridY * ISOMETRIC_VECTOR_2.y;
    return imageToScreen(imageX, imageY);
  }

  // Use pre-calculated offset
  return {
    x: IMAGE_CENTER_X + offset.x * IMAGE_SCALE,
    y: IMAGE_CENTER_Y + offset.y * IMAGE_SCALE,
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
