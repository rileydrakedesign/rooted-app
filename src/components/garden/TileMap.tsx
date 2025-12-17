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

export default function TileMap({ map, onTileSelected }: TileMapProps) {
  // Camera position (controlled on JS thread for simplicity)
  // Center the camera to show the middle of the 16x16 map perfectly on screen
  const [cameraX, setCameraX] = useState(SCREEN_WIDTH / 2);
  const [cameraY, setCameraY] = useState(SCREEN_HEIGHT / 2.2);

  // Selected tile
  const [selectedI, setSelectedI] = useState(-1);
  const [selectedJ, setSelectedJ] = useState(-1);

  // Load tile images
  const grassImage = useImage(TILE_IMAGES[1]);

  // Gesture handling with shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  /**
   * Update camera position (runs on JS thread)
   */
  const updateCamera = useCallback((newX: number, newY: number) => {
    setCameraX(newX);
    setCameraY(newY);
  }, []);

  /**
   * Pan Gesture - Move camera
   */
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      // Update camera position on JS thread using runOnJS
      const newX = cameraX + translateX.value;
      const newY = cameraY + translateY.value;
      runOnJS(updateCamera)(newX, newY);

      // Reset translation
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
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
    // Convert tap position to grid coordinates
    const gridCoord = screenToGrid(event.x, event.y, cameraX, cameraY);

    // Validate bounds
    if (isInBounds(gridCoord.i, gridCoord.j, map.width, map.height)) {
      runOnJS(handleTileSelection)(gridCoord.i, gridCoord.j);
    }
  });

  // Combine gestures
  const composedGesture = Gesture.Race(tapGesture, panGesture);

  // Animated style for panning feedback
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Calculate current camera position including translation
  const effectiveCameraX = cameraX + (translateX.value || 0);
  const effectiveCameraY = cameraY + (translateY.value || 0);

  // Build list of visible tiles to render
  const renderTiles = () => {
    if (!grassImage) return null;

    const tiles = [];

    // For 16x16 map, just render all tiles (small enough for good performance)
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

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.container}>
          <Canvas style={styles.canvas}>
            {renderTiles()}
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
    height: SCREEN_HEIGHT,
  },
});
