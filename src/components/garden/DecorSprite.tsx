/**
 * DecorSprite (Batch 12) — a placed decorative item on the tile grid.
 * Mirrors DraggablePlant's UI-thread positioning contract exactly (grid →
 * world → canvas from the shared-value camera; hitTestTile for drags) so
 * decor and plants can never disagree about tiles.
 *
 * Sprites are art-pending: DECOR_ASSETS entries are null until the user's
 * art pass, so items render as a labeled marker chip that is fully
 * placeable/movable today. Long-press removes.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';
import { Fonts } from '../../constants/fonts';
import {
  worldToCanvas,
  hitTestTile,
  plantAnchorWorld,
  PLANT_SIZE,
  PLANT_ANCHOR_OFFSET_X,
  PLANT_ANCHOR_OFFSET_Y_IMAGE,
} from '../../utils/isoMath';
import { useGardenCamera } from '../../contexts/GardenCameraContext';
import { useGarden } from '../../contexts/GardenContext';
import { TileCoord } from '../../types/garden';
import { DecorItem } from '../../lib/garden';

/**
 * Decor sprite registry — null until the art pass (mockup-to-sprite).
 * Reactive variants (e.g. the bird feeder's birds when the whole garden is
 * healthy) plug in as `reactiveImage`, chosen by aggregate signals only.
 */
export const DECOR_ASSETS: Record<
  string,
  { image: any | null; reactiveImage?: any | null; reactiveWhen?: 'gardenHealthy' }
> = {
  'decor-lantern': { image: null },
  'decor-bench': { image: null },
  'decor-koi-pond': { image: null },
  'decor-bird-feeder': { image: null, reactiveImage: null, reactiveWhen: 'gardenHealthy' },
};

interface DecorSpriteProps {
  item: DecorItem;
  onLongPress?: (item: DecorItem) => void;
}

export default function DecorSprite({ item, onLongPress }: DecorSpriteProps) {
  const { cameraX, cameraY, scale, containerFrame } = useGardenCamera();
  const { activeMap, moveDecor, gardenSignals } = useGarden();
  const mapWidth = activeMap.width;
  const mapHeight = activeMap.height;

  const originX = containerFrame.width / 2;
  const originY = containerFrame.height / 2;
  const offsetX = containerFrame.offsetX;
  const offsetY = containerFrame.offsetY;

  const isDragging = useSharedValue(false);
  const hoveredTile = useSharedValue<TileCoord | null>(null);
  const dragScale = useSharedValue(1);

  const handleDragEnd = (tile: TileCoord | null) => {
    if (tile) moveDecor(item.id, tile);
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) runOnJS(onLongPress)(item);
    });

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      isDragging.value = true;
      dragScale.value = withSpring(1.15);
      const fx = event.absoluteX - offsetX;
      const fy = event.absoluteY - offsetY;
      hoveredTile.value = hitTestTile(
        fx, fy,
        scale.value, originX, originY,
        cameraX.value, cameraY.value,
        mapWidth, mapHeight
      );
    })
    .onUpdate((event) => {
      'worklet';
      const fx = event.absoluteX - offsetX;
      const fy = event.absoluteY - offsetY;
      hoveredTile.value = hitTestTile(
        fx, fy,
        scale.value, originX, originY,
        cameraX.value, cameraY.value,
        mapWidth, mapHeight
      );
    })
    .onEnd(() => {
      'worklet';
      const tile = hoveredTile.value;
      isDragging.value = false;
      hoveredTile.value = null;
      dragScale.value = withSpring(1);
      runOnJS(handleDragEnd)(tile);
    });

  const composedGesture = Gesture.Exclusive(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const ghost = isDragging.value && hoveredTile.value ? hoveredTile.value : null;
    const gridI = ghost ? ghost.i : item.position.i;
    const gridJ = ghost ? ghost.j : item.position.j;

    const anchorWorld = plantAnchorWorld(gridI, gridJ, cameraX.value, cameraY.value);
    const anchorCanvas = worldToCanvas(anchorWorld.x, anchorWorld.y, scale.value, originX, originY);

    return {
      transform: [
        { translateX: anchorCanvas.x - PLANT_ANCHOR_OFFSET_X * scale.value },
        { translateY: anchorCanvas.y - PLANT_ANCHOR_OFFSET_Y_IMAGE * scale.value },
        { scale: scale.value * dragScale.value },
      ],
      zIndex: isDragging.value ? 1000 : item.position.j * 10 + item.position.i,
    };
  });

  const asset = DECOR_ASSETS[item.sku];
  // Reactive decor responds to the whole garden only (spec §3): defaults —
  // avg hydration ≥ 70 and ≥ 50% of windows satisfied.
  const gardenHealthy =
    gardenSignals.avgHydration >= 70 && gardenSignals.windowsSatisfiedPct >= 50;
  const image =
    asset?.reactiveWhen === 'gardenHealthy' && gardenHealthy && asset.reactiveImage
      ? asset.reactiveImage
      : asset?.image ?? null;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {image ? (
          <Image source={image} style={styles.sprite} resizeMode="contain" />
        ) : (
          // Art-pending placeholder marker — placeable now, skinned later.
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText} numberOfLines={1}>
              {item.name.toUpperCase()}
            </Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: PLANT_SIZE,
    height: PLANT_SIZE,
    transformOrigin: 'top left',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: Colors.cream,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: PLANT_SIZE * 0.25,
    maxWidth: PLANT_SIZE,
  },
  placeholderText: {
    fontSize: 8,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
});
