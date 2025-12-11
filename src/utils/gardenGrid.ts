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

/**
 * Garden image rendering calculations
 * Source image: 1024x1024px (square)
 * Rendered with resizeMode="contain" in a container of width=SCREEN_WIDTH, height=SCREEN_HEIGHT*0.8
 *
 * Since the image is square and container is wider than tall on most phones,
 * the image scales to fit the screen width.
 */

// Image scaling factor (source 1024px -> screen width)
const IMAGE_SCALE = SCREEN_WIDTH / 1024;

// Actual rendered image dimensions
const RENDERED_WIDTH = SCREEN_WIDTH;
const RENDERED_HEIGHT = SCREEN_WIDTH; // Square image maintains aspect ratio

// Container dimensions (where the image is placed)
const CONTAINER_HEIGHT = SCREEN_HEIGHT * 0.8;

// Vertical offset due to centering within container
const VERTICAL_OFFSET = (CONTAINER_HEIGHT - RENDERED_HEIGHT) / 2;

// Top-left corner of the rendered image on screen
const IMAGE_TOP = VERTICAL_OFFSET;
const IMAGE_LEFT = 0;

// Function to convert source image coordinates to screen coordinates
function imageToScreen(imageX: number, imageY: number): ScreenPosition {
  'worklet';
  return {
    x: IMAGE_LEFT + imageX * IMAGE_SCALE,
    y: IMAGE_TOP + imageY * IMAGE_SCALE,
  };
}

/**
 * Grid intersection coordinates in the SOURCE IMAGE (1024x1024px)
 * Offsets from center point (5,5) which is at image coordinates (512, 512)
 * Scale factor: 1.45x to match actual grid size on background
 */
const IMAGE_GRID_POSITIONS: Record<string, { x: number; y: number }> = {
  // Row 0 (top)
  '0,0': { x: 0, y: -217.5 },
  '1,0': { x: 42.05, y: -195.75 },
  '2,0': { x: 84.1, y: -174 },
  '3,0': { x: 126.15, y: -152.25 },
  '4,0': { x: 168.2, y: -130.5 },
  '5,0': { x: 210.25, y: -108.75 },
  '6,0': { x: 252.3, y: -87 },
  '7,0': { x: 294.35, y: -65.25 },
  '8,0': { x: 336.4, y: -43.5 },
  '9,0': { x: 378.45, y: -21.75 },

  // Row 1
  '0,1': { x: -42.05, y: -195.75 },
  '1,1': { x: 0, y: -174 },
  '2,1': { x: 42.05, y: -152.25 },
  '3,1': { x: 84.1, y: -130.5 },
  '4,1': { x: 126.15, y: -108.75 },
  '5,1': { x: 168.2, y: -87 },
  '6,1': { x: 210.25, y: -65.25 },
  '7,1': { x: 252.3, y: -43.5 },
  '8,1': { x: 294.35, y: -21.75 },
  '9,1': { x: 336.4, y: 0 },

  // Row 2
  '0,2': { x: -84.1, y: -174 },
  '1,2': { x: -42.05, y: -152.25 },
  '2,2': { x: 0, y: -130.5 },
  '3,2': { x: 42.05, y: -108.75 },
  '4,2': { x: 84.1, y: -87 },
  '5,2': { x: 126.15, y: -65.25 },
  '6,2': { x: 168.2, y: -43.5 },
  '7,2': { x: 210.25, y: -21.75 },
  '8,2': { x: 252.3, y: 0 },
  '9,2': { x: 294.35, y: 21.75 },

  // Row 3
  '0,3': { x: -126.15, y: -152.25 },
  '1,3': { x: -84.1, y: -130.5 },
  '2,3': { x: -42.05, y: -108.75 },
  '3,3': { x: 0, y: -87 },
  '4,3': { x: 42.05, y: -65.25 },
  '5,3': { x: 84.1, y: -43.5 },
  '6,3': { x: 126.15, y: -21.75 },
  '7,3': { x: 168.2, y: 0 },
  '8,3': { x: 210.25, y: 21.75 },
  '9,3': { x: 252.3, y: 43.5 },

  // Row 4
  '0,4': { x: -168.2, y: -130.5 },
  '1,4': { x: -126.15, y: -108.75 },
  '2,4': { x: -84.1, y: -87 },
  '3,4': { x: -42.05, y: -65.25 },
  '4,4': { x: 0, y: -43.5 },
  '5,4': { x: 42.05, y: -21.75 },
  '6,4': { x: 84.1, y: 0 },
  '7,4': { x: 126.15, y: 21.75 },
  '8,4': { x: 168.2, y: 43.5 },
  '9,4': { x: 210.25, y: 65.25 },

  // Row 5
  '0,5': { x: -210.25, y: -108.75 },
  '1,5': { x: -168.2, y: -87 },
  '2,5': { x: -126.15, y: -65.25 },
  '3,5': { x: -84.1, y: -43.5 },
  '4,5': { x: -42.05, y: -21.75 },
  '5,5': { x: 0, y: 0 },
  '6,5': { x: 42.05, y: 21.75 },
  '7,5': { x: 84.1, y: 43.5 },
  '8,5': { x: 126.15, y: 65.25 },
  '9,5': { x: 168.2, y: 87 },

  // Row 6
  '0,6': { x: -252.3, y: -87 },
  '1,6': { x: -210.25, y: -65.25 },
  '2,6': { x: -168.2, y: -43.5 },
  '3,6': { x: -126.15, y: -21.75 },
  '4,6': { x: -84.1, y: 0 },
  '5,6': { x: -42.05, y: 21.75 },
  '6,6': { x: 0, y: 43.5 },
  '7,6': { x: 42.05, y: 65.25 },
  '8,6': { x: 84.1, y: 87 },
  '9,6': { x: 126.15, y: 108.75 },

  // Row 7
  '0,7': { x: -294.35, y: -65.25 },
  '1,7': { x: -252.3, y: -43.5 },
  '2,7': { x: -210.25, y: -21.75 },
  '3,7': { x: -168.2, y: 0 },
  '4,7': { x: -126.15, y: 21.75 },
  '5,7': { x: -84.1, y: 43.5 },
  '6,7': { x: -42.05, y: 65.25 },
  '7,7': { x: 0, y: 87 },
  '8,7': { x: 42.05, y: 108.75 },
  '9,7': { x: 84.1, y: 130.5 },

  // Row 8
  '0,8': { x: -336.4, y: -43.5 },
  '1,8': { x: -294.35, y: -21.75 },
  '2,8': { x: -252.3, y: 0 },
  '3,8': { x: -210.25, y: 21.75 },
  '4,8': { x: -168.2, y: 43.5 },
  '5,8': { x: -126.15, y: 65.25 },
  '6,8': { x: -84.1, y: 87 },
  '7,8': { x: -42.05, y: 108.75 },
  '8,8': { x: 0, y: 130.5 },
  '9,8': { x: 42.05, y: 152.25 },

  // Row 9 (bottom)
  '0,9': { x: -378.45, y: -21.75 },
  '1,9': { x: -336.4, y: 0 },
  '2,9': { x: -294.35, y: 21.75 },
  '3,9': { x: -252.3, y: 43.5 },
  '4,9': { x: -210.25, y: 65.25 },
  '5,9': { x: -168.2, y: 87 },
  '6,9': { x: -126.15, y: 108.75 },
  '7,9': { x: -84.1, y: 130.5 },
  '8,9': { x: -42.05, y: 152.25 },
  '9,9': { x: 0, y: 174 },
};

/**
 * Convert grid position to screen coordinates using direct mapping
 */
export function gridToScreen(gridX: number, gridY: number): ScreenPosition {
  'worklet';

  const key = `${gridX},${gridY}`;
  const imagePos = IMAGE_GRID_POSITIONS[key];

  if (!imagePos) {
    // Fallback to center if position not found
    return imageToScreen(512, 512);
  }

  // The positions in IMAGE_GRID_POSITIONS are offsets from center (5,5)
  // Center of the garden in the 1024x1024 image
  // Adjusted centerY down by 100px to align with actual grid on background
  const centerX = 512;
  const centerY = 612;

  return imageToScreen(centerX + imagePos.x, centerY + imagePos.y);
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
