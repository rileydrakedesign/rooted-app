import React from 'react';
import { Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plant } from '../../types/plant';
import { gridToScreen, screenToGrid, GridPosition } from '../../utils/gardenGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SCALE = SCREEN_WIDTH / 1024;
const PLANT_SIZE = 120 * IMAGE_SCALE; // Doubled from 60 to 120
const MAX_SNAP_DISTANCE = 80 * IMAGE_SCALE; // Maximum distance for valid plant placement

interface DraggablePlantProps {
  plant: Plant;
  image: any;
  onPositionChange: (plantId: string, newPosition: GridPosition) => void;
  isPositionOccupied: (position: GridPosition, excludePlantId: string) => boolean;
}

export default function DraggablePlant({
  plant,
  image,
  onPositionChange,
  isPositionOccupied,
}: DraggablePlantProps) {
  const screenPos = gridToScreen(plant.position.x, plant.position.y);

  const translateX = useSharedValue(screenPos.x);
  const translateY = useSharedValue(screenPos.y);
  const isDragging = useSharedValue(false);

  // Handler that runs on JS thread to check collision and snap to position
  const handleDragEnd = (finalX: number, finalY: number) => {
    const gridPos = screenToGrid(finalX, finalY);
    const targetScreenPos = gridToScreen(gridPos.x, gridPos.y);

    // Calculate distance from drop point to nearest grid intersection
    const distance = Math.sqrt(
      Math.pow(finalX - targetScreenPos.x, 2) + Math.pow(finalY - targetScreenPos.y, 2)
    );

    const occupied = isPositionOccupied(gridPos, plant.id);

    // Restrict placement on front row (y=9) - too close to user
    const isFrontRow = gridPos.y >= 9;

    // Only snap if within valid distance, position is not occupied, and not in front row
    if (!occupied && distance <= MAX_SNAP_DISTANCE && !isFrontRow) {
      // Valid position and close enough to grid - snap to grid
      translateX.value = withSpring(targetScreenPos.x);
      translateY.value = withSpring(targetScreenPos.y);
      onPositionChange(plant.id, gridPos);
    } else {
      // Invalid position or too far from grid - snap back to original
      translateX.value = withSpring(screenPos.x);
      translateY.value = withSpring(screenPos.y);
    }

    isDragging.value = false;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = screenPos.x + event.translationX;
      translateY.value = screenPos.y + event.translationY;
    })
    .onEnd((event) => {
      // Calculate final position and handle on JS thread
      const finalX = screenPos.x + event.translationX;
      const finalY = screenPos.y + event.translationY;
      runOnJS(handleDragEnd)(finalX, finalY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - PLANT_SIZE / 2 },
      { translateY: translateY.value - PLANT_SIZE / 2 },
      { scale: withSpring(isDragging.value ? 1.1 : 1) },
    ],
    zIndex: isDragging.value ? 1000 : 1,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        <Image source={image} style={styles.plantImage} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  plantContainer: {
    position: 'absolute',
    width: PLANT_SIZE,
    height: PLANT_SIZE,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
});
