import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';
import GridDebugOverlay from './GridDebugOverlay';
import DraggablePlant from './DraggablePlant';
import { Plant, PlantType, GrowthStage } from '../../types/plant';
import { GridPosition } from '../../utils/gardenGrid';

interface IsometricGardenProps {
  showDebugGrid?: boolean; // Toggle debug overlay
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 1.6;

function clampZoom(zoom: number): number {
  'worklet';
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export default function IsometricGarden({
  showDebugGrid = true, // Enable by default for calibration
}: IsometricGardenProps) {
  // Plant state management
  const [plants, setPlants] = useState<Plant[]>([
    // Test plant - can be removed later
    {
      id: 'test-plant-1',
      type: PlantType.TOMATO,
      position: { x: 5, y: 5 }, // Center of grid
      plantedAt: new Date(),
      growthStage: GrowthStage.GROWING,
    },
  ]);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Check if a grid position is occupied by any plant
  const isPositionOccupied = (position: GridPosition, excludePlantId: string): boolean => {
    return plants.some(
      (plant) =>
        plant.id !== excludePlantId &&
        plant.position.x === position.x &&
        plant.position.y === position.y
    );
  };

  // Handle plant position changes
  const handlePlantPositionChange = (plantId: string, newPosition: GridPosition) => {
    setPlants((prevPlants) =>
      prevPlants.map((plant) =>
        plant.id === plantId ? { ...plant, position: newPosition } : plant
      )
    );
  };

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.gardenContainer, animatedStyle]}>
          {/* Background Layer */}
          <Image
            source={require('../../../assets/images/garden/garden.background1.png')}
            style={styles.backgroundImage}
            resizeMode="contain"
          />

          {/* Plants Layer */}
          <View style={styles.plantsLayer}>
            {plants.map((plant) => (
              <DraggablePlant
                key={plant.id}
                plant={plant}
                image={require('../../../assets/images/plants/pixellab-Lush-and-full-potted-plant-wit-1764981154908.png')}
                onPositionChange={handlePlantPositionChange}
                isPositionOccupied={isPositionOccupied}
              />
            ))}
          </View>

          {/* Debug Grid Overlay */}
          {showDebugGrid && <GridDebugOverlay />}

          {/* Foreground Layer */}
          <View style={styles.foregroundImage} pointerEvents="none">
            <Image
              source={require('../../../assets/images/garden/garden-foreground1.png')}
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
  plantsLayer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  foregroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
