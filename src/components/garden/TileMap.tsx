/**
 * TileMap Component
 *
 * Isometric tile grid renderer using Skia Canvas.
 *
 * Camera architecture: tiles render in PURE WORLD coordinates
 * (gridToScreen(i, j, 0, 0)); the camera pan and zoom are applied by a single
 * Skia Group transform driven by the shared values in GardenCameraContext via
 * useDerivedValue. Gestures mutate those shared values directly on the UI
 * thread — there is no React-state camera and no runOnJS camera sync.
 *
 * canvas = ((world + camera) − origin) · scale + origin
 * where origin = measured container center (see isoMath.ts frame contract).
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Image, useImage, Group, Path, Skia, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import {
  gridToScreen,
  hitTestTile,
  tileDrawRect,
  TILE_WIDTH,
  TILE_HEIGHT,
} from '../../utils/isoMath';
import { MapData, getTileAt, TILE_IMAGES } from '../../data/exampleMap';
import { BACK_WALL } from '../../data/walls';
import { useGardenCamera } from '../../contexts/GardenCameraContext';
import { TileCoord } from '../../types/garden';
import { logCoords } from '../../utils/debugLog';

/**
 * Drag state for entity placement
 */
export interface DragState {
  entityId: string;           // Entity being dragged
  startTile: TileCoord;       // Original tile position
  currentScreen: { x: number; y: number }; // Current finger position
  hoveredTile?: TileCoord;    // Tile currently under finger
  valid: boolean;             // Is current placement valid?
}

interface TileMapProps {
  map: MapData;
  onTileSelected?: (i: number, j: number) => void;
  dragState?: DragState | null;  // External drag state for highlighting
}

// Zoom constraints
const MIN_ZOOM = 1.0; // Default zoom - cannot zoom out past this
const MAX_ZOOM = 2.5; // Maximum zoom in

/**
 * Calculate pan bounds based on current zoom level
 * Returns { min, max } camera X positions to keep grid edges on screen
 * @param viewCenterX - Horizontal center of the garden container (zoom origin X)
 */
function calculatePanBounds(
  mapWidth: number,
  mapHeight: number,
  currentScale: number,
  viewCenterX: number
): { min: number; max: number } {
  'worklet';

  // For 10x10 grid, the isometric diamond's corners are:
  // Left corner (0, 9): x offset = (0-9) * TILE_WIDTH/2 = -180
  // Right corner (9, 0): x offset = (9-0) * TILE_WIDTH/2 = +180
  const leftCornerOffset = (0 - (mapHeight - 1)) * (TILE_WIDTH / 2);  // -180
  const rightCornerOffset = ((mapWidth - 1) - 0) * (TILE_WIDTH / 2);  // +180

  // Account for tile render size (tiles extend beyond center point)
  const tileHalfWidth = TILE_WIDTH / 2;

  // Calculate the actual leftmost and rightmost pixels of the grid
  const gridLeftEdge = leftCornerOffset - tileHalfWidth;
  const gridRightEdge = rightCornerOffset + tileHalfWidth;

  // When scaled, these edges move further from center
  const scaledLeftEdge = gridLeftEdge * currentScale;
  const scaledRightEdge = gridRightEdge * currentScale;

  // Default centered camera position
  const centerX = viewCenterX;

  // Calculate min/max camera X to keep edges on screen
  const minCameraX = centerX - scaledRightEdge;
  const maxCameraX = centerX - scaledLeftEdge;

  return { min: minCameraX, max: maxCameraX };
}

export default function TileMap({ map, onTileSelected, dragState }: TileMapProps) {
  // Shared-value camera (single source of truth, UI thread)
  const { cameraX, cameraY, scale, containerFrame } = useGardenCamera();

  // Zoom origin = center of the measured garden container (see isoMath.ts contract)
  const originX = containerFrame.width / 2;
  const originY = containerFrame.height / 2;

  // Home camera position: centers the MAP in the container. Camera is the
  // world position of tile (0,0); the grid spans (width-1 + height-1) *
  // TILE_HEIGHT/2 vertically, so shift up by half that span. Horizontally
  // tile (0,0) is already the grid's center column (i - j = 0).
  const mapVerticalSpan = ((map.width - 1) + (map.height - 1)) * (TILE_HEIGHT / 2);
  const homeCameraX = originX;
  const homeCameraY = originY - mapVerticalSpan / 2;

  // Initialize camera position once the container is measured
  useEffect(() => {
    if (containerFrame.width === 0 || containerFrame.height === 0) return;

    logCoords('TILEMAP CAMERA INIT', {
      container: containerFrame,
      target: { x: homeCameraX, y: homeCameraY },
    });

    cameraX.value = homeCameraX;
    cameraY.value = homeCameraY;
  }, [containerFrame.width, containerFrame.height, homeCameraX, homeCameraY, cameraX, cameraY]);

  // Load tile images (hooks must be called unconditionally, one per tile ID)
  const legacyGrassImage = useImage(TILE_IMAGES[1]);
  const grassImage = useImage(TILE_IMAGES[2]);
  const soilImage = useImage(TILE_IMAGES[3]);
  const pathImage = useImage(TILE_IMAGES[4]);
  const waterImage = useImage(TILE_IMAGES[5]);
  const flowerGrassImage = useImage(TILE_IMAGES[6]);
  const tileImages: Record<number, ReturnType<typeof useImage>> = {
    1: legacyGrassImage,
    2: grassImage,
    3: soilImage,
    4: pathImage,
    5: waterImage,
    6: flowerGrassImage,
  };
  const backWallImage = useImage(BACK_WALL.image);

  /**
   * Pan Gesture - Move camera horizontally (only when zoomed in).
   * Mutates cameraX directly on the UI thread with bounds clamping.
   */
  const panStartCameraX = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      panStartCameraX.value = cameraX.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (scale.value > MIN_ZOOM) {
        const bounds = calculatePanBounds(map.width, map.height, scale.value, originX);
        const proposed = panStartCameraX.value + event.translationX;
        cameraX.value = Math.max(bounds.min, Math.min(bounds.max, proposed));
      }
    });

  /**
   * Pinch Gesture - Zoom in/out. Mutates scale directly on the UI thread.
   */
  const pinchStartScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      pinchStartScale.value = scale.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartScale.value * event.scale));
      scale.value = newScale;

      // Keep the camera within pan bounds for the new zoom level
      const bounds = calculatePanBounds(map.width, map.height, newScale, originX);
      cameraX.value = Math.max(bounds.min, Math.min(bounds.max, cameraX.value));
    })
    .onEnd(() => {
      'worklet';
      // Snap camera back to home when fully zoomed out
      if (scale.value <= MIN_ZOOM) {
        cameraX.value = homeCameraX;
        cameraY.value = homeCameraY;
      }
    });

  /**
   * Handle tile selection (runs on JS thread)
   */
  const handleTileSelection = useCallback((i: number, j: number) => {
    if (onTileSelected) {
      onTileSelected(i, j);
    }
  }, [onTileSelected]);

  /**
   * Tap Gesture - Select tile
   * Tap event.x/y are container-local (the GestureDetector wraps the
   * container view), so they feed hitTestTile directly.
   */
  const tapGesture = Gesture.Tap().onEnd((event) => {
    'worklet';

    const tile = hitTestTile(
      event.x,
      event.y,
      scale.value,
      originX,
      originY,
      cameraX.value,
      cameraY.value,
      map.width,
      map.height
    );

    if (tile) {
      runOnJS(handleTileSelection)(tile.i, tile.j);
    }
  });

  // Combine gestures - allow simultaneous pinch and pan, but tap is exclusive
  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  // The single camera transform, computed on the UI thread:
  // canvas = ((world + camera) − origin) · scale + origin
  const groupTransform = useDerivedValue(() => [
    { translateX: originX },
    { translateY: originY },
    { scale: scale.value },
    { translateX: -originX },
    { translateY: -originY },
    { translateX: cameraX.value },
    { translateY: cameraY.value },
  ]);

  // Build list of tiles to render (pure world coordinates — the camera lives
  // in the Group transform, so tiles never re-render on camera moves)
  const renderTiles = () => {
    const tiles = [];

    // Render tiles back-to-front
    for (let j = 0; j <= map.height - 1; j++) {
      for (let i = 0; i <= map.width - 1; i++) {
        const tileId = getTileAt(map, i, j);
        if (tileId === 0) continue;

        // World position of the tile's diamond center
        const worldPos = gridToScreen(i, j, 0, 0);

        // Tile image anchoring is centralized in isoMath.tileDrawRect so the
        // tile art, highlight diamond, and plant anchors share one convention.
        const tileImage = tileImages[tileId];
        if (!tileImage) continue; // image still loading
        const rect = tileDrawRect(tileId, worldPos.x, worldPos.y);

        tiles.push(
          <Image
            key={`${i},${j}`}
            image={tileImage}
            x={rect.x}
            y={rect.y}
            width={rect.size}
            height={rect.size}
            fit="contain"
            sampling={
              rect.isPixelTile
                ? { filter: FilterMode.Nearest, mipmap: MipmapMode.None }
                : undefined
            }
          />
        );
      }
    }

    return tiles;
  };

  /**
   * Create a diamond outline path for tile highlighting (world coordinates)
   */
  const createDiamondPath = (worldPos: { x: number; y: number }): any => {
    const path = Skia.Path.Make();
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;

    // Diamond corners (top, right, bottom, left)
    path.moveTo(worldPos.x, worldPos.y - halfHeight);           // Top
    path.lineTo(worldPos.x + halfWidth, worldPos.y);            // Right
    path.lineTo(worldPos.x, worldPos.y + halfHeight);           // Bottom
    path.lineTo(worldPos.x - halfWidth, worldPos.y);            // Left
    path.close();

    return path;
  };

  /**
   * Render tile highlight for dragged entity (world coordinates, inside the
   * same camera-transformed Group as the tiles)
   */
  const renderTileHighlight = () => {
    if (!dragState || !dragState.hoveredTile) return null;

    const { hoveredTile, valid } = dragState;
    const worldPos = gridToScreen(hoveredTile.i, hoveredTile.j, 0, 0);

    const diamondPath = createDiamondPath(worldPos);

    // Green for valid placement, red for invalid
    const color = valid ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    const strokeColor = valid ? 'rgba(0, 200, 0, 1)' : 'rgba(200, 0, 0, 1)';

    return (
      <Group key="drag-highlight">
        {/* Fill */}
        <Path path={diamondPath} color={color} />
        {/* Outline */}
        <Path
          path={diamondPath}
          color={strokeColor}
          style="stroke"
          strokeWidth={2}
        />
      </Group>
    );
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          <Group transform={groupTransform}>
            {renderTiles()}
            {/* Static back wall: world coords, after tiles (its grass foot
                overlaps the back tile rims), behind all RN-layer plants */}
            {backWallImage && (
              <Image
                image={backWallImage}
                x={BACK_WALL.anchorX}
                y={BACK_WALL.anchorY}
                width={BACK_WALL.width}
                height={BACK_WALL.height}
                fit="contain"
                sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
              />
            )}
            {renderTileHighlight()}
          </Group>
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});
