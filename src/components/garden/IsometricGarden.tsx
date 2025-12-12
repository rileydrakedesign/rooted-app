import React from 'react';
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
import PlantInfoPanel from './PlantInfoPanel';
import { GridPosition } from '../../utils/gardenGrid';
import { useGarden } from '../../contexts/GardenContext';
import { Plant } from '../garden/PlantTile';

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
  showDebugGrid = false, // Disabled by default
}: IsometricGardenProps) {
  // Get plants and functions from context
  const { plants, updatePlantPosition, selectedPlant, setSelectedPlant } = useGarden();

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Check if a grid position is occupied by any plant (excluding the one being moved)
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
    updatePlantPosition(plantId, newPosition);
  };

  // Handle plant tap to show friend info
  const handlePlantTap = (plant: Plant) => {
    setSelectedPlant(plant);
  };

  // Handle closing plant info panel
  const handleClosePanel = () => {
    setSelectedPlant(null);
  };

  // Placeholder handlers for panel actions
  const handleCall = () => {
    console.log('Call:', selectedPlant?.friendName);
    setSelectedPlant(null);
  };

  const handleText = () => {
    console.log('Text:', selectedPlant?.friendName);
    setSelectedPlant(null);
  };

  const handleLogInteraction = () => {
    console.log('Log interaction:', selectedPlant?.friendName);
    setSelectedPlant(null);
  };

  const handleEditFriend = () => {
    console.log('Edit friend:', selectedPlant?.friendName);
    setSelectedPlant(null);
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
                onPositionChange={handlePlantPositionChange}
                isPositionOccupied={isPositionOccupied}
                onTap={handlePlantTap}
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

      {/* Plant Info Panel */}
      <PlantInfoPanel
        visible={selectedPlant !== null}
        plant={selectedPlant}
        onClose={handleClosePanel}
        onCall={handleCall}
        onText={handleText}
        onLogInteraction={handleLogInteraction}
        onEditFriend={handleEditFriend}
      />
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
    zIndex: 1,
  },
  plantsLayer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    zIndex: 2,
  },
  foregroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    zIndex: 4,
  },
});
