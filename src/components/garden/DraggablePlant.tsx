import React from 'react';
import { StyleSheet, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plant } from './PlantTile';
import {
  gridToScreen,
  screenToGrid,
  GridPosition,
  positionKey,
  getGridOrigin,
} from '../../utils/isometricCoordinates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggablePlantProps {
  plant: Plant;
  tileWidth: number;
  tileHeight: number;
  occupiedPositions: Set<string>;
  onPress: () => void;
  onDragStart: () => void;
  onDragMove: (position: GridPosition, isValid: boolean) => void;
  onDragEnd: (newPosition: GridPosition, isValid: boolean) => void;
  isDragging: boolean;
}

export default function DraggablePlant({
  plant,
  tileWidth,
  tileHeight,
  occupiedPositions,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
}: DraggablePlantProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Get grid origin
  const origin = getGridOrigin(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Calculate base position from grid coordinates
  const gridPos = gridToScreen(
    plant.position.x,
    plant.position.y,
    tileWidth,
    tileHeight
  );

  // Absolute screen position
  const basePosition = {
    x: origin.x + gridPos.x,
    y: origin.y + gridPos.y,
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Lift the plant
      scale.value = withSpring(1.15);
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      // Update translation
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Calculate which grid position we're over (subtract origin offset)
      const screenX = basePosition.x + event.translationX - origin.x;
      const screenY = basePosition.y + event.translationY - origin.y;
      const targetGrid = screenToGrid(screenX, screenY, tileWidth, tileHeight);

      // Check if valid placement
      const isValid = !occupiedPositions.has(positionKey(targetGrid));

      // Notify parent of drag movement
      runOnJS(onDragMove)(targetGrid, isValid);
    })
    .onEnd((event) => {
      // Calculate final grid position (subtract origin offset)
      const screenX = basePosition.x + event.translationX - origin.x;
      const screenY = basePosition.y + event.translationY - origin.y;
      const targetGrid = screenToGrid(screenX, screenY, tileWidth, tileHeight);
      const isValid = !occupiedPositions.has(positionKey(targetGrid));

      if (isValid) {
        // Valid placement - snap to new position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        runOnJS(onDragEnd)(targetGrid, true);
      } else {
        // Invalid placement - bounce back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        runOnJS(onDragEnd)(plant.position, false);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    left: basePosition.x + translateX.value,
    top: basePosition.y + translateY.value,
    transform: [{ scale: scale.value }],
    zIndex: isDragging ? 1000 : plant.position.y, // Z-sorting by Y position
    opacity: isDragging ? 0.8 : 1,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        {/* Plant sprite */}
        <Image
          source={require('../../../assets/images/plants/pixellab-Lush-and-full-potted-plant-wit-1764981154908.png')}
          style={styles.plantImage}
          resizeMode="contain"
        />

        {/* Friend name label */}
        <Text style={styles.friendName}>{plant.friendName}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  plantContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantImage: {
    width: 80,
    height: 80,
  },
  friendName: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: '#6B4423',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
