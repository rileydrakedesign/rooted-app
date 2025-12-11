import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAllPositions, gridToScreen, GRID_CONFIG } from '../../utils/gardenGrid';

/**
 * Debug overlay that shows diamond-shaped boxes at each grid tile
 * Use this to calibrate the grid to match the visual grid in the background image
 */
export default function GridDebugOverlay() {
  const positions = getAllPositions();

  // Diamond size based on tile dimensions
  const diamondSize = GRID_CONFIG.tileWidth * 0.85;
  const diamondHeight = GRID_CONFIG.tileHeight * 1.7;

  return (
    <View style={styles.container} pointerEvents="none">
      {positions.map((pos) => {
        const screen = gridToScreen(pos.x, pos.y);

        // Highlight corners and center for reference
        const isCorner =
          (pos.x === 0 && pos.y === 0) ||
          (pos.x === 9 && pos.y === 0) ||
          (pos.x === 0 && pos.y === 9) ||
          (pos.x === 9 && pos.y === 9);
        const isCenter = pos.x === 4 && pos.y === 4;

        return (
          <View
            key={`${pos.x},${pos.y}`}
            style={[
              styles.diamond,
              {
                left: screen.x - diamondSize / 2,
                top: screen.y - diamondHeight / 2,
                width: diamondSize,
                height: diamondHeight,
                backgroundColor: isCenter
                  ? 'rgba(255, 0, 255, 0.3)' // Magenta for center
                  : isCorner
                  ? 'rgba(255, 0, 0, 0.3)' // Red for corners
                  : 'rgba(0, 255, 0, 0.2)', // Green for regular positions
                borderColor: isCenter
                  ? '#ff00ff'
                  : isCorner
                  ? '#ff0000'
                  : '#00ff00',
              },
            ]}
          >
            <Text style={styles.label}>{`${pos.x},${pos.y}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  diamond: {
    position: 'absolute',
    borderWidth: 2,
    transform: [{ rotate: '45deg' }], // Creates diamond/rhombus shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }], // Un-rotate text so it's readable
  },
});
