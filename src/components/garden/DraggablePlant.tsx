import React, { useEffect } from 'react';
import { Image, StyleSheet, Dimensions, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Plant, PLANT_EMOJIS } from './PlantTile';
import { GridPosition, isValidPosition } from '../../utils/isoMath';

// TODO: Integrate with new tile-based grid system
// These functions need to be reimplemented for the new tile renderer
const gridCellToScreen = (gridX: number, gridY: number) => ({ x: 0, y: 0 }); // Placeholder
const screenToCellCenter = (screenX: number, screenY: number) => ({ x: 0, y: 0 }); // Placeholder

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Plant Visual Constants
 * TODO: Update to work with new tile-based grid system
 */
const IMAGE_SCALE = SCREEN_WIDTH / 1000; // Match source image dimensions

// Plant sprite dimensions (base size in source image pixels)
const PLANT_BASE_SIZE = 200; // Base size for plant sprite (80 * 2.5)
const PLANT_SIZE = PLANT_BASE_SIZE * IMAGE_SCALE;

// Anchor point configuration
// Plants anchor at bottom-center to appear sitting on the ground
const PLANT_ANCHOR_OFFSET_X = PLANT_SIZE / 2; // Center horizontally
const PLANT_ANCHOR_OFFSET_Y = PLANT_SIZE * 0.75; // Anchor at 75% down (bottom)

// Visual center offset (for placement calculations)
// This is where users perceive the plant to be during drag
const VISUAL_CENTER_OFFSET_X = PLANT_SIZE / 2; // Middle of sprite
const VISUAL_CENTER_OFFSET_Y = PLANT_SIZE / 2; // Middle of sprite

interface DraggablePlantProps {
  plant: Plant;
  onPositionChange: (plantId: string, newPosition: GridPosition) => void;
  isPositionOccupied: (position: GridPosition, excludePlantId: string) => boolean;
  onTap?: (plant: Plant) => void;
}

export default function DraggablePlant({
  plant,
  onPositionChange,
  isPositionOccupied,
  onTap,
}: DraggablePlantProps) {
  // Shared values for animation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Store starting position for drag calculations
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  // Sync visual position with grid position whenever plant.position changes
  useEffect(() => {
    const cellCenter = gridCellToScreen(plant.position.x, plant.position.y);
    translateX.value = cellCenter.x - PLANT_ANCHOR_OFFSET_X;
    translateY.value = cellCenter.y - PLANT_ANCHOR_OFFSET_Y;
  }, [plant.position.x, plant.position.y]);

  /**
   * Handle drag end - snap to nearest valid cell center
   *
   * First Principles Approach:
   * 1. Calculate where user sees the plant (visual center)
   * 2. Find nearest cell center to that visual position
   * 3. Validate the target position (not occupied, not front row)
   * 4. Snap plant's anchor point to target cell center (or back to original)
   */
  const handleDragEnd = (draggedTranslateX: number, draggedTranslateY: number) => {
    // Calculate visual center position (where user perceives the plant to be)
    const visualCenterX = draggedTranslateX + VISUAL_CENTER_OFFSET_X;
    const visualCenterY = draggedTranslateY + VISUAL_CENTER_OFFSET_Y;

    console.log('🔍 Drag End Debug:', {
      plantId: plant.id,
      draggedTranslate: { x: draggedTranslateX, y: draggedTranslateY },
      visualCenter: { x: visualCenterX, y: visualCenterY },
      PLANT_SIZE,
      VISUAL_CENTER_OFFSET_X,
      VISUAL_CENTER_OFFSET_Y,
    });

    // Find nearest cell center to the visual position
    const targetGridPos = screenToCellCenter(visualCenterX, visualCenterY);

    console.log('🎯 Target Grid:', targetGridPos);

    // Get the target cell center coordinates
    const targetCellCenter = gridCellToScreen(targetGridPos.x, targetGridPos.y);

    console.log('📍 Target Cell Center:', targetCellCenter);

    // Validate placement
    const withinBounds = isValidPosition(targetGridPos); // Check grid boundaries (0-15 for x and y)
    const occupied = isPositionOccupied(targetGridPos, plant.id);
    const isFrontRow = targetGridPos.y >= 15; // Restrict front row placement

    console.log('✅ Validation:', { withinBounds, occupied, isFrontRow });

    if (withinBounds && !occupied && !isFrontRow) {
      // Valid position - snap anchor point to target cell center
      translateX.value = withSpring(targetCellCenter.x - PLANT_ANCHOR_OFFSET_X);
      translateY.value = withSpring(targetCellCenter.y - PLANT_ANCHOR_OFFSET_Y);
      onPositionChange(plant.id, targetGridPos);
    } else {
      // Invalid position - snap back to current grid position
      const currentCellCenter = gridCellToScreen(plant.position.x, plant.position.y);
      translateX.value = withSpring(currentCellCenter.x - PLANT_ANCHOR_OFFSET_X);
      translateY.value = withSpring(currentCellCenter.y - PLANT_ANCHOR_OFFSET_Y);
    }

    isDragging.value = false;
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
      // Store starting position in shared values
      dragStartX.value = translateX.value;
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Update position relative to starting position
      translateX.value = dragStartX.value + event.translationX;
      translateY.value = dragStartY.value + event.translationY;
    })
    .onEnd((event) => {
      // Calculate final translateX/translateY values (top-left corner of plant sprite)
      const finalTranslateX = dragStartX.value + event.translationX;
      const finalTranslateY = dragStartY.value + event.translationY;
      runOnJS(handleDragEnd)(finalTranslateX, finalTranslateY);
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
