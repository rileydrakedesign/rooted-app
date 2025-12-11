import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAllPositions, gridToScreen } from '../../utils/gardenGrid';

/**
 * Debug overlay that shows circles at each grid position
 * Use this to verify the grid alignment with the background image
 */
export default function GridDebugOverlay() {
  const positions = getAllPositions();

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
        const isCenter = pos.x === 4 && pos.y === 4 || pos.x === 5 && pos.y === 5;

        return (
          <View
            key={`${pos.x},${pos.y}`}
            style={[
              styles.dot,
              {
                left: screen.x - 8,
                top: screen.y - 8,
                backgroundColor: isCenter
                  ? '#ff00ff' // Magenta for center
                  : isCorner
                  ? '#ff0000' // Red for corners
                  : '#00ff00', // Green for regular positions
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
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 18,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
});
