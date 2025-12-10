import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gridToScreen, getAllGridPositions } from '../../utils/gardenPositions';

/**
 * Debug component that shows all available plant positions
 * Renders circles at each valid grid position for calibration
 */
export default function PositionDebugGrid() {
  const positions = getAllGridPositions();

  return (
    <View style={styles.container}>
      {positions.map((pos) => {
        const screenPos = gridToScreen(pos.x, pos.y);
        const isOrigin = pos.x === 0 && pos.y === 0;
        const isCorner =
          (pos.x === 0 && pos.y === 0) ||
          (pos.x === 3 && pos.y === 0) ||
          (pos.x === 0 && pos.y === 3) ||
          (pos.x === 3 && pos.y === 3);

        return (
          <View
            key={`${pos.x},${pos.y}`}
            style={[
              styles.marker,
              {
                left: screenPos.x - 20,
                top: screenPos.y - 20,
                backgroundColor: isOrigin
                  ? 'rgba(255, 0, 0, 0.5)'
                  : isCorner
                  ? 'rgba(0, 100, 255, 0.4)'
                  : 'rgba(255, 255, 255, 0.3)',
                borderColor: isOrigin ? '#ff0000' : isCorner ? '#0064ff' : 'rgba(0, 0, 0, 0.5)',
                borderWidth: isOrigin ? 3 : 2,
              },
            ]}
          >
            <Text style={[styles.label, isOrigin && styles.originLabel]}>
              {pos.x},{pos.y}
            </Text>
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
    pointerEvents: 'none',
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  originLabel: {
    color: '#ff0000',
    fontSize: 12,
  },
});
