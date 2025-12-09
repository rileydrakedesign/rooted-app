import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
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
} from '../../utils/isometricCoordinates';

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

  // Calculate base position from grid coordinates
  const basePosition = gridToScreen(
    plant.position.x,
    plant.position.y,
    tileWidth,
    tileHeight
  );

  const longPressHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      // Lift the plant
      scale.value = withSpring(1.15);
      runOnJS(onDragStart)();
      ctx.startX = 0;
      ctx.startY = 0;
    },
    onActive: (event, ctx: any) => {
      // Update translation
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Calculate which grid position we're over
      const screenX = basePosition.x + event.translationX;
      const screenY = basePosition.y + event.translationY;
      const targetGrid = screenToGrid(screenX, screenY, tileWidth, tileHeight);

      // Check if valid placement
      const isValid = !occupiedPositions.has(positionKey(targetGrid));

      // Notify parent of drag movement
      runOnJS(onDragMove)(targetGrid, isValid);
    },
    onEnd: (event) => {
      // Calculate final grid position
      const screenX = basePosition.x + event.translationX;
      const screenY = basePosition.y + event.translationY;
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
    },
    onFail: () => {
      // Short tap - treat as press
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      runOnJS(onPress)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: basePosition.x + translateX.value },
      { translateY: basePosition.y + translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging ? 1000 : plant.position.y, // Z-sorting by Y position
    opacity: isDragging ? 0.8 : 1,
  }));

  return (
    <LongPressGestureHandler
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.BEGAN) {
          longPressHandler.onStart?.(event.nativeEvent, {});
        }
      }}
      onGestureEvent={longPressHandler}
      minDurationMs={300}
    >
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        {/* Plant sprite - using emoji for now */}
        <Text style={styles.plantEmoji}>
          {plant.plantType === 'cactus' && '🌵'}
          {plant.plantType === 'sunflower' && '🌻'}
          {plant.plantType === 'fern' && '🌿'}
          {plant.plantType === 'rose' && '🌹'}
          {plant.plantType === 'tulip' && '🌷'}
          {plant.plantType === 'daisy' && '🌼'}
          {plant.plantType === 'orchid' && '🌸'}
          {plant.plantType === 'lavender' && '🪻'}
        </Text>

        {/* Friend name label */}
        <Text style={styles.friendName}>{plant.friendName}</Text>
      </Animated.View>
    </LongPressGestureHandler>
  );
}

const styles = StyleSheet.create({
  plantContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantEmoji: {
    fontSize: 48,
    textAlign: 'center',
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
