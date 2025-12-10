import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Plant } from './PlantTile';
import DraggablePlant from './DraggablePlant';
import GridOverlay from './GridOverlay';
import PositionDebugGrid from './PositionDebugGrid';
import { Colors } from '../../constants/theme';
import {
  clampZoom,
  GridPosition,
  positionKey,
} from '../../utils/gardenPositions';

interface IsometricGardenProps {
  plants: Plant[];
  onPlantPress: (plant: Plant) => void;
  onPlantLongPress?: (plant: Plant) => void;
  onPlantMove?: (plantId: string, newPosition: GridPosition) => void;
  showDebugGrid?: boolean; // Toggle to show grid overlay for alignment
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IsometricGarden({
  plants,
  onPlantPress,
  onPlantLongPress,
  onPlantMove,
  showDebugGrid = true, // Enable by default for now
}: IsometricGardenProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [highlightedTile, setHighlightedTile] = useState<GridPosition | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);

  // Create occupied positions set for collision detection
  const occupiedPositions = new Set<string>();
  plants.forEach((plant) => {
    if (plant.id !== draggedPlantId) {
      occupiedPositions.add(positionKey(plant.position));
    }
  });

  // Pan gesture handler for scrolling when zoomed
  const panGesture = Gesture.Pan()
    .enabled(true)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      // Reset position if zoomed out
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Save final position when zoomed in
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Pinch gesture handler for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clampZoom(event.scale);
    })
    .onEnd(() => {
      // Smooth spring back if needed
      scale.value = withSpring(clampZoom(scale.value));

      // Reset position when zoomed out to default
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Combine gestures - allow simultaneous pinch and pan
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleDragStart = (plantId: string) => {
    setDraggedPlantId(plantId);
    onPlantLongPress?.(plants.find((p) => p.id === plantId)!);
  };

  const handleDragMove = (position: GridPosition, isValid: boolean) => {
    setHighlightedTile(position);
    setIsValidPlacement(isValid);
  };

  const handleDragEnd = (plantId: string, newPosition: GridPosition, isValid: boolean) => {
    setDraggedPlantId(null);
    setHighlightedTile(null);

    if (isValid && onPlantMove) {
      onPlantMove(plantId, newPosition);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.gardenContainer, animatedStyle]}>
          {/* Background Layer */}
          <Image
            source={require('../../../assets/images/garden/garden-background.png')}
            style={styles.backgroundImage}
            resizeMode="contain"
          />

          {/* Plants Layer */}
          <View style={styles.plantsContainer}>
            {plants.map((plant) => (
              <DraggablePlant
                key={plant.id}
                plant={plant}
                occupiedPositions={occupiedPositions}
                onPress={() => onPlantPress(plant)}
                onDragStart={() => handleDragStart(plant.id)}
                onDragMove={handleDragMove}
                onDragEnd={(newPosition, isValid) => handleDragEnd(plant.id, newPosition, isValid)}
                isDragging={draggedPlantId === plant.id}
              />
            ))}
          </View>

          {/* Debug Grid (for alignment testing) */}
          {showDebugGrid && <PositionDebugGrid />}

          {/* Grid Overlay (visible during drag) */}
          {draggedPlantId && highlightedTile && (
            <GridOverlay
              highlightedTile={highlightedTile}
              isValid={isValidPlacement}
            />
          )}

          {/* Foreground Layer */}
          <View style={styles.foregroundImage} pointerEvents="none">
            <Image
              source={require('../../../assets/images/garden/garden-foreground.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  gardenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  plantsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foregroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
