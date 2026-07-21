/**
 * Isometric Math Utilities
 *
 * Provides coordinate conversion and depth sorting for isometric tile rendering.
 * Tiles are diamond-shaped with 2:1 ratio (64x32).
 *
 * COORDINATE FRAME CONTRACT
 * =========================
 * grid (i,j,k)  — logical tile coordinates; the single source of truth.
 *                 Plants/entities store ONLY grid coordinates.
 * world         — isometric pixel space produced by gridToScreen(). The camera
 *                 offset is passed as the origin argument, so "world" here is
 *                 the pre-zoom canvas space.
 * canvas        — container-local pixels after the zoom transform:
 *                 canvas = (world − origin) · scale + origin
 *                 where origin = measured container center (NEVER
 *                 Dimensions.get('window') — the canvas sits below the
 *                 TopBar/SafeArea, so the window center is not the view center).
 * window        — gesture absoluteX/absoluteY coordinates:
 *                 canvas = window − containerOffset (measured via measureInWindow).
 */

// Tile dimensions (2:1 diamond ratio for grid spacing)
// Sized to fit 10x10 grid perfectly on screen
// Grid width = 9 * TILE_WIDTH ≈ 360px (fits ~375px phone screen)
export const TILE_WIDTH = 40;
export const TILE_HEIGHT = 20;

// Actual rendered tile image size (maintains 1:1 aspect ratio of source image)
// The tile image is 1024x1024, so we render it as a square
// Scaled proportionally to tile spacing - larger tiles for fewer count
export const TILE_RENDER_SIZE = 60; // Square: 60x60 pixels

// Plant sprite render constants (single source of truth — used by
// DraggablePlant for rendering and by any code aligning sprites to tiles)
export const PLANT_SIZE = 75;
export const PLANT_ANCHOR_OFFSET_X = PLANT_SIZE / 2; // Center horizontally
// The pixel plant assets are tightly cropped (opaque pixels reach the image's
// bottom edge) and taller than wide, so resizeMode="contain" in the square
// container fills the full height: the sprite's visual base = container bottom.
export const PLANT_ANCHOR_OFFSET_Y_IMAGE = PLANT_SIZE;
// Emoji glyphs carry internal padding below the visual base; 0.85 is tuned for them.
export const PLANT_ANCHOR_OFFSET_Y_EMOJI = PLANT_SIZE * 0.85;
// Vertical offset (world px) from the tile's diamond center to where the
// plant's bottom anchor sits. 0 = plant base exactly on the diamond center.
// (Pixel tiles' walkable surface is centered on the tile base point; the old
// -45 value was tuned for the legacy 60px floating-diamond art.)
export const TILE_TOP_OFFSET_Y = 0;

export interface GridCoord {
  i: number; // Column
  j: number; // Row
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
 * Zoom transform: world (pre-zoom canvas space) → canvas (container-local px).
 * Must stay the exact inverse of canvasToWorld and match the Skia Group transform.
 */
export function worldToCanvas(
  worldX: number,
  worldY: number,
  scale: number,
  originX: number,
  originY: number
): ScreenCoord {
  'worklet';

  return {
    x: (worldX - originX) * scale + originX,
    y: (worldY - originY) * scale + originY,
  };
}

/**
 * Inverse zoom transform: canvas (container-local px) → world (pre-zoom canvas space).
 */
export function canvasToWorld(
  canvasX: number,
  canvasY: number,
  scale: number,
  originX: number,
  originY: number
): ScreenCoord {
  'worklet';

  return {
    x: (canvasX - originX) / scale + originX,
    y: (canvasY - originY) / scale + originY,
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
 * Diamond hit-test for accurate tile selection
 *
 * The basic screenToGrid uses simple rounding which can be inaccurate at tile edges.
 * This function tests candidates to find which tile diamond actually contains the point.
 *
 * Algorithm:
 * 1. Use screenToGrid to get an approximate tile
 * 2. Test this tile and its 4 neighbors (up, down, left, right)
 * 3. For each candidate, check if the point is inside its diamond shape
 * 4. Return the tile that contains the point, or the closest one
 *
 * @param x - Screen X coordinate
 * @param y - Screen Y coordinate
 * @param originX - Camera/viewport X offset
 * @param originY - Camera/viewport Y offset
 * @returns Grid coordinates (accurate to tile diamond shape)
 */
export function screenToGridDiamond(
  x: number,
  y: number,
  originX: number = 0,
  originY: number = 0
): GridCoord {
  'worklet';

  // Get approximate tile using standard method
  const approx = screenToGrid(x, y, originX, originY);

  // Test candidates: center tile and its 4 neighbors
  const candidates = [
    { i: approx.i, j: approx.j },       // Center
    { i: approx.i - 1, j: approx.j },   // Left
    { i: approx.i + 1, j: approx.j },   // Right
    { i: approx.i, j: approx.j - 1 },   // Up
    { i: approx.i, j: approx.j + 1 },   // Down
  ];

  let bestCandidate = candidates[0];
  let minDistance = Number.POSITIVE_INFINITY;

  // Find the candidate whose center is closest to the point
  // This works because isometric diamonds are convex shapes
  for (const candidate of candidates) {
    const tileCenter = gridToScreen(candidate.i, candidate.j, originX, originY);

    // Calculate distance from point to tile center
    const dx = x - tileCenter.x;
    const dy = y - tileCenter.y;
    const distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance

    if (distance < minDistance) {
      minDistance = distance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * THE single screen→tile hit-test for the whole app.
 *
 * Converts a container-local canvas point to the grid tile under it, or null
 * if the point is outside the map. Both the plant drag and the tile tap MUST
 * use this function so a given pixel always maps to the same tile.
 *
 * @param canvasX/canvasY - Container-local coordinates (gesture absoluteX/Y
 *                          minus container offset, or tap event.x/y on the
 *                          container's GestureDetector)
 * @param scale - Current zoom scale
 * @param originX/originY - Zoom origin (measured container center)
 * @param cameraX/cameraY - Camera offset (world position of tile 0,0)
 * @param mapWidth/mapHeight - Map bounds in tiles
 */
export function hitTestTile(
  canvasX: number,
  canvasY: number,
  scale: number,
  originX: number,
  originY: number,
  cameraX: number,
  cameraY: number,
  mapWidth: number,
  mapHeight: number
): { i: number; j: number; k: number } | null {
  'worklet';

  const world = canvasToWorld(canvasX, canvasY, scale, originX, originY);
  const gridCoord = screenToGridDiamond(world.x, world.y, cameraX, cameraY);

  if (!isInBounds(gridCoord.i, gridCoord.j, mapWidth, mapHeight)) {
    return null;
  }

  return { i: gridCoord.i, j: gridCoord.j, k: 0 };
}

/**
 * World position of a plant's bottom anchor when standing on tile (i, j).
 */
export function plantAnchorWorld(
  i: number,
  j: number,
  cameraX: number = 0,
  cameraY: number = 0
): ScreenCoord {
  'worklet';

  const tileBase = gridToScreen(i, j, cameraX, cameraY);
  return { x: tileBase.x, y: tileBase.y + TILE_TOP_OFFSET_Y };
}

/**
 * Draw rectangle (top-left + size) for a tile image, given the tile's world
 * base point (its diamond center from gridToScreen).
 *
 * Tile 1 (legacy art): diamond floats inside an oversized square canvas, so it
 *   renders at TILE_RENDER_SIZE bottom-center anchored.
 * Tile 2+ (PixelLab blocks): diamond top spans the full canvas width, so it
 *   renders at TILE_WIDTH with the image top at worldY - TILE_HEIGHT/2; the
 *   dirt block extends below and is covered by tiles in front.
 */
export function tileDrawRect(
  tileId: number,
  worldX: number,
  worldY: number
): { x: number; y: number; size: number; isPixelTile: boolean } {
  'worklet';

  const isPixelTile = tileId !== 1;
  const size = isPixelTile ? TILE_WIDTH : TILE_RENDER_SIZE;
  return {
    x: worldX - size / 2,
    y: isPixelTile ? worldY - TILE_HEIGHT / 2 : worldY - TILE_RENDER_SIZE + TILE_HEIGHT / 2,
    size,
    isPixelTile,
  };
}

/**
 * Check if a screen point is inside a tile's diamond shape
 *
 * Isometric tile diamonds have 4 edges. This function checks if a point
 * is on the correct side of all 4 edges.
 *
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param i - Tile column
 * @param j - Tile row
 * @param originX - Camera/viewport X offset
 * @param originY - Camera/viewport Y offset
 * @returns True if point is inside tile diamond
 */
export function isPointInTileDiamond(
  screenX: number,
  screenY: number,
  i: number,
  j: number,
  originX: number = 0,
  originY: number = 0
): boolean {
  'worklet';

  // Get tile center in screen coordinates
  const tileCenter = gridToScreen(i, j, originX, originY);

  // Calculate relative position from tile center
  const dx = screenX - tileCenter.x;
  const dy = screenY - tileCenter.y;

  // Diamond bounds (half widths and heights)
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  // Check if point is inside the diamond using diamond inequality:
  // |dx/halfWidth| + |dy/halfHeight| <= 1
  const normalized = Math.abs(dx / halfWidth) + Math.abs(dy / halfHeight);
  return normalized <= 1;
}
