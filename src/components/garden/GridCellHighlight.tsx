import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { gridCellToScreen } from '../../utils/gardenGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SCALE = SCREEN_WIDTH / 1000;

// Highlight dimensions (diamond shape that fits in grid cell)
const CELL_SIZE = 52 * IMAGE_SCALE; // Half of grid vector length
const HIGHLIGHT_SIZE = CELL_SIZE * 2; // Diamond width/height

interface GridCellHighlightProps {
  gridX: number;
  gridY: number;
  isValid: boolean;
  visible: boolean;
}

export default function GridCellHighlight({
  gridX,
  gridY,
  isValid,
  visible,
}: GridCellHighlightProps) {
  const cellCenter = gridCellToScreen(gridX, gridY);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(visible ? 0.4 : 0, { damping: 15 }),
      transform: [
        { translateX: cellCenter.x - HIGHLIGHT_SIZE / 2 },
        { translateY: cellCenter.y - HIGHLIGHT_SIZE / 2 },
        { scale: withSpring(visible ? 1 : 0.8, { damping: 15 }) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.highlight,
        {
          width: HIGHLIGHT_SIZE,
          height: HIGHLIGHT_SIZE,
          backgroundColor: isValid ? '#4ade80' : '#f87171', // Green or red
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    // Diamond shape using rotation
    transform: [{ rotate: '45deg' }],
    borderRadius: 8 * IMAGE_SCALE,
    borderWidth: 3 * IMAGE_SCALE,
    borderColor: '#fff',
    zIndex: 2, // Above grid, below plants
  },
});
