/**
 * WallOverlay — static perimeter wall strip rendered above the plant layer.
 *
 * The front wall must occlude plants standing near the front rows, and since
 * plants are RN views layered above the Skia canvas, the wall lives in the
 * same overlay with a zIndex above every plant. Nothing can ever stand in
 * front of the front wall (there are no tiles beyond the perimeter), so a
 * fixed z-order is always correct — no depth sorting needed.
 *
 * Positioning mirrors DraggablePlant: world = anchor + camera, then the
 * shared zoom transform (worldToCanvas) around the measured container
 * center. transformOrigin 'top left' keeps translate+scale exact.
 */

import React from 'react';
import { Image } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { worldToCanvas } from '../../utils/isoMath';
import { useGardenCamera } from '../../contexts/GardenCameraContext';
import { WallStrip } from '../../data/walls';

// Above all plants (their zIndex tops out around j*10+i ≈ 99) but below a
// plant being actively dragged (zIndex 1000) so the drag ghost stays visible.
const WALL_Z_INDEX = 500;

export default function WallOverlay({ strip }: { strip: WallStrip }) {
  const { cameraX, cameraY, scale, containerFrame } = useGardenCamera();

  const originX = containerFrame.width / 2;
  const originY = containerFrame.height / 2;

  const animatedStyle = useAnimatedStyle(() => {
    const worldX = strip.anchorX + cameraX.value;
    const worldY = strip.anchorY + cameraY.value;
    const canvas = worldToCanvas(worldX, worldY, scale.value, originX, originY);

    return {
      transform: [
        { translateX: canvas.x },
        { translateY: canvas.y },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: strip.width,
          height: strip.height,
          zIndex: WALL_Z_INDEX,
          transformOrigin: 'top left',
        },
        animatedStyle,
      ]}
    >
      <Image
        source={strip.image}
        style={{ width: '100%', height: '100%' }}
        resizeMode="stretch"
      />
    </Animated.View>
  );
}
