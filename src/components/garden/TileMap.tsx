/**
 * TileMap Component
 *
 * Isometric tile grid renderer using Skia Canvas.
 * Features:
 * - Efficient tile culling (only renders visible tiles)
 * - Pan gesture for camera movement
 * - Tap handling for tile selection
 * - Crisp pixel art rendering
 *
 * Note: This uses a simpler immediate-mode rendering approach
 * that's compatible with Skia's drawing model.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Canvas, Image, useImage, Rect, Group } from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  gridToScreen,
  screenToGrid,
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_RENDER_SIZE,
  isInBounds,
} from '../../utils/isoMath';
import { MapData, getTileAt, TILE_IMAGES } from '../../data/exampleMap';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TileMapProps {
  map: MapData;
  onTileSelected?: (i: number, j: number) => void;
}

// Zoom constraints
const MIN_ZOOM = 1.0; // Default zoom - cannot zoom out past this
const MAX_ZOOM = 2.5; // Maximum zoom in

export default function TileMap({ map, onTileSelected }: TileMapProps) {
  // Camera position (controlled on JS thread for simplicity)
  // Center the camera to show the middle of the 10x10 map perfectly on screen
  // Shift UP to account for TopBar at top
  const [cameraX, setCameraX] = useState(SCREEN_WIDTH / 2);
  const [cameraY, setCameraY] = useState(SCREEN_HEIGHT / 2 - 80); // Shifted UP to center in available space

  // Selected tile
  const [selectedI, setSelectedI] = useState(-1);
  const [selectedJ, setSelectedJ] = useState(-1);

  // Zoom state (React state for re-rendering)
  const [scale, setScale] = useState(1);

  // Load tile images
  const grassImage = useImage(TILE_IMAGES[1]);

  // Gesture handling with shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Saved scale for pinch gesture (shared value for UI thread)
  const savedScale = useSharedValue(1);
  const currentScale = useSharedValue(1); // Track current scale on UI thread

  /**
   * Update camera position (runs on JS thread)
   */
  const updateCamera = useCallback((newX: number, newY: number) => {
    setCameraX(newX);
    setCameraY(newY);
  }, []);

  /**
   * Update scale (runs on JS thread)
   */
  const updateScale = useCallback((newScale: number) => {
    setScale(newScale);
  }, []);

  /**
   * Pan Gesture - Move camera (only when zoomed in, horizontal only)
   */
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      // Don't save translateY - we're blocking vertical movement
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow horizontal panning when zoomed in (scale > 1)
      if (currentScale.value > MIN_ZOOM) {
        // Only update X translation - Y stays at 0 (no vertical panning)
        translateX.value = savedTranslateX.value + event.translationX;
      }
    })
    .onEnd(() => {
      'worklet';
      // Update camera position on JS thread using runOnJS
      if (currentScale.value > MIN_ZOOM) {
        const newX = cameraX + translateX.value;
        // Keep Y centered - don't update it
        runOnJS(updateCamera)(newX, cameraY);
      }

      // Reset translation
      translateX.value = 0;
      savedTranslateX.value = 0;
      // translateY stays at 0 always
    });

  /**
   * Pinch Gesture - Zoom in/out
   */
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = currentScale.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Calculate new scale with constraints
      const newScale = savedScale.value * event.scale;
      currentScale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

      // Update React state for re-render
      runOnJS(updateScale)(currentScale.value);
    })
    .onEnd(() => {
      'worklet';
      // Ensure scale stays within bounds
      currentScale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentScale.value));
      savedScale.value = currentScale.value;

      // Final update to React state
      runOnJS(updateScale)(currentScale.value);

      // Reset camera position when zooming back to default
      if (currentScale.value <= MIN_ZOOM) {
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateCamera)(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 80); // Centered in available space
      }
    });

  /**
   * Handle tile selection (runs on JS thread)
   */
  const handleTileSelection = useCallback((i: number, j: number) => {
    setSelectedI(i);
    setSelectedJ(j);
    console.log(`Selected tile: (${i}, ${j})`);
    if (onTileSelected) {
      onTileSelected(i, j);
    }
  }, [onTileSelected]);

  /**
   * Tap Gesture - Select tile
   */
  const tapGesture = Gesture.Tap().onEnd((event) => {
    'worklet';

    // Transform tap position from screen space to world space
    // Inverse of the zoom transform applied to the canvas
    const zoomOriginX = SCREEN_WIDTH / 2;
    const zoomOriginY = SCREEN_HEIGHT / 2;

    // Apply inverse transform: move to origin, inverse scale, move back
    const worldX = (event.x - zoomOriginX) / currentScale.value + zoomOriginX;
    const worldY = (event.y - zoomOriginY) / currentScale.value + zoomOriginY;

    // Convert world position to grid coordinates
    const effectiveCamX = cameraX + translateX.value;
    const effectiveCamY = cameraY + translateY.value;
    const gridCoord = screenToGrid(worldX, worldY, effectiveCamX, effectiveCamY);

    // Validate bounds
    if (isInBounds(gridCoord.i, gridCoord.j, map.width, map.height)) {
      runOnJS(handleTileSelection)(gridCoord.i, gridCoord.j);
    }
  });

  // Combine gestures - allow simultaneous pinch and pan, but tap is exclusive
  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );


  // Calculate current camera position including translation (NO zoom multiplication)
  const effectiveCameraX = cameraX + (translateX.value || 0);
  const effectiveCameraY = cameraY + (translateY.value || 0);
  const effectiveScale = scale; // Use React state, not shared value

  // Build list of visible tiles to render
  const renderTiles = () => {
    if (!grassImage) return null;

    const tiles = [];

    // For 10x10 map, render all tiles (optimized for performance - only 100 tiles)
    const minI = 0;
    const maxI = map.width - 1;
    const minJ = 0;
    const maxJ = map.height - 1;

    // Render tiles back-to-front
    for (let j = minJ; j <= maxJ; j++) {
      for (let i = minI; i <= maxI; i++) {
        const tileId = getTileAt(map, i, j);
        if (tileId === 0) continue;

        // Calculate screen position (this is the base/center of the tile's diamond footprint)
        const screenPos = gridToScreen(i, j, effectiveCameraX, effectiveCameraY);

        // Anchor the tile image at its bottom-center
        // Since the image is square (1:1 ratio), we center it horizontally
        // and align its bottom with the tile position
        const drawX = screenPos.x - TILE_RENDER_SIZE / 2;
        const drawY = screenPos.y - TILE_RENDER_SIZE + TILE_HEIGHT / 2;

        const isSelected = i === selectedI && j === selectedJ;

        tiles.push(
          <Group key={`${i},${j}`}>
            <Image
              image={grassImage}
              x={drawX}
              y={drawY}
              width={TILE_RENDER_SIZE}
              height={TILE_RENDER_SIZE}
              fit="contain"
            />
            {isSelected && (
              <Rect
                x={drawX}
                y={drawY}
                width={TILE_RENDER_SIZE}
                height={TILE_RENDER_SIZE}
                color="rgba(100, 255, 100, 0.4)"
              />
            )}
          </Group>
        );
      }
    }

    return tiles;
  };

  // Calculate zoom transform around screen center
  const zoomOriginX = SCREEN_WIDTH / 2;
  const zoomOriginY = SCREEN_HEIGHT / 2;

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.container}>
          <Canvas style={styles.canvas}>
            <Group
              transform={[
                { translateX: zoomOriginX },
                { translateY: zoomOriginY },
                { scale: effectiveScale },
                { translateX: -zoomOriginX },
                { translateY: -zoomOriginY },
              ]}
            >
              {renderTiles()}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    width: SCREEN_WIDTH,
    // Remove fixed height - let it fill the available space
  },
});
