import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Plant } from './PlantTile';
import DraggablePlant from './DraggablePlant';
import GridOverlay from './GridOverlay';
import { Colors } from '../../constants/theme';
import {
  calculateTileSize,
  clampZoom,
  GridPosition,
  positionKey,
} from '../../utils/isometricCoordinates';

interface IsometricGardenProps {
  plants: Plant[];
  onPlantPress: (plant: Plant) => void;
  onPlantLongPress?: (plant: Plant) => void;
  onPlantMove?: (plantId: string, newPosition: GridPosition) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IsometricGarden({
  plants,
  onPlantPress,
  onPlantLongPress,
  onPlantMove,
}: IsometricGardenProps) {
  const scale = useSharedValue(1);
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [highlightedTile, setHighlightedTile] = useState<GridPosition | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);

  // Calculate tile dimensions
  const { width: tileWidth, height: tileHeight } = calculateTileSize(SCREEN_WIDTH);

  // Create occupied positions set for collision detection
  const occupiedPositions = new Set<string>();
  plants.forEach((plant) => {
    if (plant.id !== draggedPlantId) {
      occupiedPositions.add(positionKey(plant.position));
    }
  });

  // Pinch gesture handler for zoom
  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = clampZoom(event.scale);
    },
    onEnd: () => {
      // Smooth spring back if needed
      scale.value = withSpring(clampZoom(scale.value));
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
      <PinchGestureHandler onGestureEvent={pinchHandler}>
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
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                occupiedPositions={occupiedPositions}
                onPress={() => onPlantPress(plant)}
                onDragStart={() => handleDragStart(plant.id)}
                onDragMove={handleDragMove}
                onDragEnd={(newPosition, isValid) => handleDragEnd(plant.id, newPosition, isValid)}
                isDragging={draggedPlantId === plant.id}
              />
            ))}
          </View>

          {/* Grid Overlay (visible during drag) */}
          {draggedPlantId && highlightedTile && (
            <GridOverlay
              highlightedTile={highlightedTile}
              isValid={isValidPlacement}
              tileWidth={tileWidth}
              tileHeight={tileHeight}
            />
          )}

          {/* Foreground Layer */}
          <Image
            source={require('../../../assets/images/garden/garden-foreground.png')}
            style={styles.foregroundImage}
            resizeMode="contain"
            pointerEvents="none"
          />
        </Animated.View>
      </PinchGestureHandler>
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
  },
  foregroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
