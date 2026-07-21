/**
 * DraggablePlant Component
 *
 * PRINCIPLE: Separation of concerns
 * - Plant position = Grid coordinates only (i, j, k)
 * - Rendering = Pure worklet (grid → canvas from the shared-value camera),
 *   so plants can never drift from their tiles during pan/zoom
 * - Drag = Track hovered tile on the UI thread; commit grid position on drop
 *
 * The hovered tile is computed in the gesture worklet via the app-wide
 * isoMath.hitTestTile; JS is only involved when the hovered tile CHANGES
 * (validation + DragState for the highlight) and on drop (commit).
 */

import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plant, PLANT_EMOJIS } from './PlantTile';
import {
  worldToCanvas,
  hitTestTile,
  plantAnchorWorld,
  PLANT_SIZE,
  PLANT_ANCHOR_OFFSET_X,
  PLANT_ANCHOR_OFFSET_Y_IMAGE,
  PLANT_ANCHOR_OFFSET_Y_EMOJI,
} from '../../utils/isoMath';
import { useGardenCamera } from '../../contexts/GardenCameraContext';
import { TileCoord } from '../../types/garden';
import { DragState } from './TileMap';
import { exampleMap } from '../../data/exampleMap';
import { WILT_THRESHOLD } from '../../lib/garden';

interface DraggablePlantProps {
  plant: Plant;
  onPositionChange: (plantId: string, newTile: TileCoord) => void;
  onDragStateChange?: (dragState: DragState | null) => void;
  canPlaceAt: (tile: TileCoord, plantId: string) => { ok: boolean; reason?: string };
  onTap?: (plant: Plant) => void;
}

export default function DraggablePlant({
  plant,
  onPositionChange,
  onDragStateChange,
  canPlaceAt,
  onTap,
}: DraggablePlantProps) {
  const { cameraX, cameraY, scale, containerFrame } = useGardenCamera();

  // Zoom origin = measured container center; offset converts window → canvas
  // coords (see isoMath.ts frame contract)
  const originX = containerFrame.width / 2;
  const originY = containerFrame.height / 2;
  const offsetX = containerFrame.offsetX;
  const offsetY = containerFrame.offsetY;

  const isDragging = useSharedValue(false);
  const hoveredTile = useSharedValue<TileCoord | null>(null);
  const dragScale = useSharedValue(1); // springy "lifted" pop while dragging

  /**
   * Report drag state to parent (JS thread — runs validation for the highlight)
   */
  const reportDragState = (tile: TileCoord | null, fingerX: number, fingerY: number) => {
    if (!onDragStateChange) return;

    const startTile: TileCoord = plant.position;

    if (!tile) {
      // Finger is outside the map — no hover highlight; dropping here snaps back
      onDragStateChange({
        entityId: plant.id,
        startTile,
        currentScreen: { x: fingerX, y: fingerY },
        hoveredTile: undefined,
        valid: false,
      });
      return;
    }

    const validation = canPlaceAt(tile, plant.id);
    onDragStateChange({
      entityId: plant.id,
      startTile,
      currentScreen: { x: fingerX, y: fingerY },
      hoveredTile: tile,
      valid: validation.ok,
    });
  };

  /**
   * Handle drag end (JS thread) — final validation and grid-position commit.
   * No visual work here: the animated style falls back to plant.position the
   * moment isDragging is false, and moves to the new tile when state commits.
   */
  const handleDragEnd = (tile: TileCoord | null) => {
    if (onDragStateChange) {
      onDragStateChange(null);
    }

    if (tile) {
      const validation = canPlaceAt(tile, plant.id);
      if (validation.ok) {
        onPositionChange(plant.id, tile);
      }
    }
  };

  /**
   * Tap gesture
   */
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        runOnJS(onTap)(plant);
      }
    });

  /**
   * Pan gesture — hovered tile computed on the UI thread; JS notified only
   * when the hovered tile changes.
   */
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      isDragging.value = true;
      dragScale.value = withSpring(1.15);

      // absoluteX/Y are window coords; subtract the container offset to get
      // container-local canvas coords (event.x/y would be plant-local!)
      const fx = event.absoluteX - offsetX;
      const fy = event.absoluteY - offsetY;
      const tile = hitTestTile(
        fx, fy,
        scale.value, originX, originY,
        cameraX.value, cameraY.value,
        exampleMap.width, exampleMap.height
      );
      hoveredTile.value = tile;
      runOnJS(reportDragState)(tile, fx, fy);
    })
    .onUpdate((event) => {
      'worklet';
      const fx = event.absoluteX - offsetX;
      const fy = event.absoluteY - offsetY;
      const tile = hitTestTile(
        fx, fy,
        scale.value, originX, originY,
        cameraX.value, cameraY.value,
        exampleMap.width, exampleMap.height
      );

      const prev = hoveredTile.value;
      const changed = tile
        ? (!prev || prev.i !== tile.i || prev.j !== tile.j)
        : prev !== null;

      if (changed) {
        hoveredTile.value = tile;
        runOnJS(reportDragState)(tile, fx, fy);
      }
    })
    .onEnd(() => {
      'worklet';
      const tile = hoveredTile.value;
      isDragging.value = false;
      hoveredTile.value = null;
      dragScale.value = withSpring(1);
      runOnJS(handleDragEnd)(tile);
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  /**
   * Position + scale computed ENTIRELY on the UI thread from the grid
   * position and the shared-value camera. While dragging, the plant ghost
   * snaps to the hovered tile's center (per plant-drag.md).
   */
  // Where the sprite's visual base sits inside the 75px container differs by
  // render type: tightly-cropped image assets reach the container bottom,
  // emoji glyphs have internal padding (see isoMath.ts)
  const anchorOffsetY = plant.image ? PLANT_ANCHOR_OFFSET_Y_IMAGE : PLANT_ANCHOR_OFFSET_Y_EMOJI;

  const animatedStyle = useAnimatedStyle(() => {
    const ghost = isDragging.value && hoveredTile.value ? hoveredTile.value : null;
    const gridI = ghost ? ghost.i : plant.position.i;
    const gridJ = ghost ? ghost.j : plant.position.j;

    const anchorWorld = plantAnchorWorld(gridI, gridJ, cameraX.value, cameraY.value);
    const anchorCanvas = worldToCanvas(anchorWorld.x, anchorWorld.y, scale.value, originX, originY);

    const baseZIndex = (plant.position.j * 10) + plant.position.i;

    return {
      transform: [
        { translateX: anchorCanvas.x - PLANT_ANCHOR_OFFSET_X * scale.value },
        { translateY: anchorCanvas.y - anchorOffsetY * scale.value },
        { scale: scale.value * dragScale.value },
      ],
      zIndex: isDragging.value ? 1000 : baseZIndex,
    };
  });

  // Wilt is visual-only (death is cut): faded sprite + a droplet asking for water
  const isWilted = plant.hydration <= WILT_THRESHOLD;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        {plant.image ? (
          <Image
            source={plant.image}
            style={[styles.plantImage, isWilted && styles.wilted]}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.plantEmoji, isWilted && styles.wilted]}>
            {PLANT_EMOJIS[plant.plantType]}
          </Text>
        )}
        {isWilted && <Text style={styles.wiltBadge}>💧</Text>}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  plantContainer: {
    position: 'absolute',
    width: PLANT_SIZE,
    height: PLANT_SIZE,
    // The animated translate assumes top-left scaling (anchorCanvas −
    // offset·scale). RN's default center origin adds (size/2)·(1−scale)
    // drift — plants slid off their tiles when zoomed.
    transformOrigin: 'top left',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantEmoji: {
    fontSize: PLANT_SIZE * 0.8,
    textAlign: 'center',
  },
  wilted: {
    opacity: 0.55,
  },
  wiltBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: PLANT_SIZE * 0.25,
  },
});
