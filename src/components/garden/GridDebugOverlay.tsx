import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAllPositions, gridToScreen } from '../../utils/gardenGrid';

/**
 * Debug overlay that shows dots at each grid intersection
 * Use this to calibrate the grid to match the visual grid in the background image
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
          (pos.x === 7 && pos.y === 0) ||
          (pos.x === 0 && pos.y === 7) ||
          (pos.x === 7 && pos.y === 7);
        const isCenter = pos.x === 3 && pos.y === 3;

        return (
          <View
            key={`${pos.x},${pos.y}`}
            style={[
              styles.dot,
              {
                left: screen.x - 6,
                top: screen.y - 6,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 14,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
});
