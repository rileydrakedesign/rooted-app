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
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Plant } from '../../types/garden';
import PixelIcon from '../PixelIcon';
import { Colors } from '../../constants/theme';
import {
  worldToCanvas,
  hitTestTile,
  plantAnchorWorld,
  PLANT_SIZE,
  PLANT_ANCHOR_OFFSET_X,
  PLANT_ANCHOR_OFFSET_Y_IMAGE,
} from '../../utils/isoMath';
import { useGardenCamera } from '../../contexts/GardenCameraContext';
import { TileCoord } from '../../types/garden';
import { DragState } from './TileMap';
import { WILT_THRESHOLD } from '../../lib/garden';
import { useGarden } from '../../contexts/GardenContext';
import {
  ATTACHMENT_ASSETS,
  NAMEPLATE_STYLES,
  SKU_ASSET_KEYS,
} from '../../data/attachmentCatalog';
import { Fonts } from '../../constants/fonts';

interface DraggablePlantProps {
  plant: Plant;
  onPositionChange: (plantId: string, newTile: TileCoord) => void;
  onDragStateChange?: (dragState: DragState | null) => void;
  canPlaceAt: (tile: TileCoord, plantId: string) => { ok: boolean; reason?: string };
  onTap?: (plant: Plant) => void;
  /**
   * Birthday celebration (Batch 11). Renders a gold star badge until the
   * party sprites land in the art pass (mockup-to-sprite).
   */
  isBirthday?: boolean;
  /** A nudge just landed on this plant (Batch 14) — plays a brief wiggle;
   *  richer per-type animations come with the art pass. */
  nudgeEffect?: string | null;
}

export default function DraggablePlant({
  plant,
  onPositionChange,
  onDragStateChange,
  canPlaceAt,
  onTap,
  isBirthday,
  nudgeEffect,
}: DraggablePlantProps) {
  const { cameraX, cameraY, scale, containerFrame } = useGardenCamera();
  // Map bounds for the drag hit-test come from the ACTIVE map (Batch 12) —
  // plain numbers so the worklets can capture them.
  const { activeMap } = useGarden();
  const mapWidth = activeMap.width;
  const mapHeight = activeMap.height;

  // Zoom origin = measured container center; offset converts window → canvas
  // coords (see isoMath.ts frame contract)
  const originX = containerFrame.width / 2;
  const originY = containerFrame.height / 2;
  const offsetX = containerFrame.offsetX;
  const offsetY = containerFrame.offsetY;

  const isDragging = useSharedValue(false);
  const hoveredTile = useSharedValue<TileCoord | null>(null);
  const dragScale = useSharedValue(1); // springy "lifted" pop while dragging
  const nudgeWiggle = useSharedValue(0); // degrees; driven by nudgeEffect

  React.useEffect(() => {
    if (!nudgeEffect) return;
    // shimmer = gentle sway; shake/shimmy = livelier; ambient nudges = soft
    const amp = nudgeEffect === 'shake' ? 8 : nudgeEffect === 'shimmy' ? 6 : 3;
    nudgeWiggle.value = withRepeat(
      withSequence(
        withTiming(amp, { duration: 120 }),
        withTiming(-amp, { duration: 120 })
      ),
      8,
      true,
      () => {
        nudgeWiggle.value = withTiming(0, { duration: 150 });
      }
    );
  }, [nudgeEffect, nudgeWiggle]);

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
        mapWidth, mapHeight
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
        mapWidth, mapHeight
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
  // Tightly-cropped sprite assets reach the container bottom (see isoMath.ts)
  const anchorOffsetY = PLANT_ANCHOR_OFFSET_Y_IMAGE;

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
        { rotate: `${nudgeWiggle.value}deg` },
      ],
      zIndex: isDragging.value ? 1000 : baseZIndex,
    };
  });

  // Wilt is visual-only (death is cut): faded sprite + a droplet asking for water
  const isWilted = plant.hydration <= WILT_THRESHOLD;

  // Equipped cosmetics (Batch 10). Sprite attachments composite under/over
  // the plant sprite; a null image (art pending) renders nothing. Nameplates
  // are text plates — they work without art.
  const spriteAttachments = plant.attachments
    .map((a) => ({ ...ATTACHMENT_ASSETS[SKU_ASSET_KEYS[a.sku] ?? ''], sku: a.sku }))
    .filter((a) => a && a.image != null);
  const underLayers = spriteAttachments.filter((a) => a.layer === 'under');
  const overLayers = spriteAttachments.filter((a) => a.layer === 'over');
  const nameplate = plant.attachments
    .map((a) => NAMEPLATE_STYLES[a.sku])
    .find((style) => style != null);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        {underLayers.map((a) => (
          <Image
            key={a.sku}
            source={a.image}
            style={styles.attachmentLayer}
            resizeMode="contain"
          />
        ))}
        <Image
          source={plant.image}
          style={[styles.plantImage, isWilted && styles.wilted]}
          resizeMode="contain"
        />
        {overLayers.map((a) => (
          <Image
            key={a.sku}
            source={a.image}
            style={styles.attachmentLayer}
            resizeMode="contain"
          />
        ))}
        {nameplate && (
          <View style={[styles.nameplate, { backgroundColor: nameplate.background }]}>
            <Text
              style={[styles.nameplateText, { color: nameplate.text }]}
              numberOfLines={1}
            >
              {plant.friendName.toUpperCase()}
            </Text>
          </View>
        )}
        {isWilted && (
          <View style={styles.wiltBadge}>
            <PixelIcon
              name="water"
              size={Math.round(PLANT_SIZE * 0.25)}
              color={Colors.hydrationLow}
            />
          </View>
        )}
        {isBirthday && (
          <View style={styles.birthdayBadge}>
            <PixelIcon
              name="star"
              size={Math.round(PLANT_SIZE * 0.25)}
              color={Colors.streakGold}
            />
          </View>
        )}
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
  wilted: {
    opacity: 0.55,
  },
  wiltBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  attachmentLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  birthdayBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nameplate: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    maxWidth: PLANT_SIZE,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.pixelBorder,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  nameplateText: {
    fontSize: 9,
    fontFamily: Fonts.subtext,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
