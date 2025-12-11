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
    const occupied = isPositionOccupied(gridPos, plant.id);

    if (!occupied) {
      // Valid position - snap to grid
      const newScreenPos = gridToScreen(gridPos.x, gridPos.y);
      translateX.value = withSpring(newScreenPos.x);
      translateY.value = withSpring(newScreenPos.y);
      onPositionChange(plant.id, gridPos);
    } else {
      // Invalid position - snap back to original
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
