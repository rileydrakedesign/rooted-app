import React from 'react';
import { Image, StyleSheet, Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plant, PLANT_EMOJIS } from './PlantTile';
import { gridCellToScreen, screenToGrid, GridPosition } from '../../utils/gardenGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Plant Visual Constants
 * Using correct IMAGE_SCALE to match gardenGrid.ts
 */
const IMAGE_SCALE = SCREEN_WIDTH / 1000; // Match source image dimensions

// Plant sprite dimensions (base size in source image pixels)
const PLANT_BASE_SIZE = 200; // Base size for plant sprite (80 * 2.5)
const PLANT_SIZE = PLANT_BASE_SIZE * IMAGE_SCALE;

// Anchor point configuration
// Plants anchor at bottom-center to appear sitting on the ground
const PLANT_ANCHOR_OFFSET_X = PLANT_SIZE / 2; // Center horizontally
const PLANT_ANCHOR_OFFSET_Y = PLANT_SIZE * 0.75; // Anchor at 75% down (bottom)

// Snap distance threshold (in screen pixels)
const MAX_SNAP_DISTANCE = 60 * IMAGE_SCALE;

interface DraggablePlantProps {
  plant: Plant;
  onPositionChange: (plantId: string, newPosition: GridPosition) => void;
  isPositionOccupied: (position: GridPosition, excludePlantId: string) => boolean;
  onTap?: (plant: Plant) => void;
  onHoverUpdate?: (gridX: number, gridY: number, isValid: boolean, visible: boolean) => void;
}

export default function DraggablePlant({
  plant,
  onPositionChange,
  isPositionOccupied,
  onTap,
  onHoverUpdate,
}: DraggablePlantProps) {
  // Get the cell center position for this plant's grid coordinates
  const cellCenter = gridCellToScreen(plant.position.x, plant.position.y);

  // Initialize position at cell center with anchor offset
  const translateX = useSharedValue(cellCenter.x - PLANT_ANCHOR_OFFSET_X);
  const translateY = useSharedValue(cellCenter.y - PLANT_ANCHOR_OFFSET_Y);
  const isDragging = useSharedValue(false);

  /**
   * Handle drag end - snap to nearest valid cell center
   */
  const handleDragEnd = (finalX: number, finalY: number) => {
    // Convert drag position to grid coordinates (finds nearest grid intersection)
    const gridPos = screenToGrid(finalX, finalY);

    // Get the target cell center
    const targetCellCenter = gridCellToScreen(gridPos.x, gridPos.y);

    // Calculate distance from drop point to target cell center
    const distance = Math.sqrt(
      Math.pow(finalX - targetCellCenter.x, 2) +
      Math.pow(finalY - targetCellCenter.y, 2)
    );

    // Check if position is occupied
    const occupied = isPositionOccupied(gridPos, plant.id);

    // Restrict placement on front row (y=9) - too close to viewer
    const isFrontRow = gridPos.y >= 9;

    // Validate placement: within snap distance, not occupied, not front row
    if (!occupied && distance <= MAX_SNAP_DISTANCE && !isFrontRow) {
      // Valid position - snap to target cell center
      translateX.value = withSpring(targetCellCenter.x - PLANT_ANCHOR_OFFSET_X);
      translateY.value = withSpring(targetCellCenter.y - PLANT_ANCHOR_OFFSET_Y);
      onPositionChange(plant.id, gridPos);
    } else {
      // Invalid position - snap back to original cell center
      translateX.value = withSpring(cellCenter.x - PLANT_ANCHOR_OFFSET_X);
      translateY.value = withSpring(cellCenter.y - PLANT_ANCHOR_OFFSET_Y);
    }

    // Hide highlight when drag ends
    onHoverUpdate?.(0, 0, false, false);

    isDragging.value = false;
  };

  /**
   * Update hover highlight during drag
   */
  const handleDragUpdate = (currentX: number, currentY: number) => {
    if (!onHoverUpdate) return;

    const gridPos = screenToGrid(currentX, currentY);
    const targetCellCenter = gridCellToScreen(gridPos.x, gridPos.y);

    const distance = Math.sqrt(
      Math.pow(currentX - targetCellCenter.x, 2) +
      Math.pow(currentY - targetCellCenter.y, 2)
    );

    const occupied = isPositionOccupied(gridPos, plant.id);
    const isFrontRow = gridPos.y >= 9;
    const isValid = !occupied && distance <= MAX_SNAP_DISTANCE && !isFrontRow;

    onHoverUpdate(gridPos.x, gridPos.y, isValid, true);
  };

  /**
   * Tap gesture - show plant info
   */
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        runOnJS(onTap)(plant);
      }
    });

  /**
   * Pan gesture - drag plant
   */
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      // Update position relative to original cell center
      translateX.value = (cellCenter.x - PLANT_ANCHOR_OFFSET_X) + event.translationX;
      translateY.value = (cellCenter.y - PLANT_ANCHOR_OFFSET_Y) + event.translationY;

      // Update hover highlight (current drag position)
      const currentX = cellCenter.x + event.translationX;
      const currentY = cellCenter.y + event.translationY;
      runOnJS(handleDragUpdate)(currentX, currentY);
    })
    .onEnd((event) => {
      // Calculate final position (add anchor offset back to get actual drag point)
      const finalX = cellCenter.x + event.translationX;
      const finalY = cellCenter.y + event.translationY;
      runOnJS(handleDragEnd)(finalX, finalY);
    });

  // Exclusive gesture: tap or pan, not both
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  /**
   * Animated style with:
   * - Position based on cell center
   * - Isometric layering (Z-index based on grid row)
   * - Scale feedback during drag
   */
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate Z-index for isometric layering
    // Back rows (low Y) render behind front rows (high Y)
    const baseZIndex = (plant.position.y * 10) + plant.position.x;
    const zIndex = isDragging.value ? 1000 : baseZIndex;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isDragging.value ? 1.15 : 1) },
      ],
      zIndex,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.plantContainer, animatedStyle]}>
        {plant.image ? (
          <Image source={plant.image} style={styles.plantImage} resizeMode="contain" />
        ) : (
          <Text style={styles.plantEmoji}>{PLANT_EMOJIS[plant.plantType]}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  plantContainer: {
    position: 'absolute',
    width: PLANT_SIZE,
    height: PLANT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // Isometric shadow (bottom-right direction)
    shadowColor: '#000',
    shadowOffset: {
      width: 3 * IMAGE_SCALE,
      height: 2 * IMAGE_SCALE,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4 * IMAGE_SCALE,
    elevation: 5,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantEmoji: {
    fontSize: PLANT_SIZE * 0.8,
    textAlign: 'center',
  },
});
