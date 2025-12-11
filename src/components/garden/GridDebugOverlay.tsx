import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gridToScreen } from '../../utils/gardenGrid';

/**
 * Simple debug overlay - shows just 5 reference points
 * Once these align correctly, we can add the full grid
 */
export default function GridDebugOverlay() {
  // Test with just 5 key positions first
  const testPositions = [
    { x: 0, y: 0, label: '0,0 (top-left)', color: '#ff0000' },
    { x: 9, y: 0, label: '9,0 (top-right)', color: '#ff0000' },
    { x: 5, y: 5, label: '5,5 (center)', color: '#ff00ff' },
    { x: 0, y: 9, label: '0,9 (bottom-left)', color: '#ff0000' },
    { x: 9, y: 9, label: '9,9 (bottom-right)', color: '#ff0000' },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {testPositions.map((pos) => {
        const screen = gridToScreen(pos.x, pos.y);

        return (
          <View
            key={`${pos.x},${pos.y}`}
            style={[
              styles.dot,
              {
                left: screen.x - 6,
                top: screen.y - 6,
                backgroundColor: pos.color,
              },
            ]}
          >
            <Text style={styles.label}>{pos.label}</Text>
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
  },
  label: {
    position: 'absolute',
    top: 15,
    left: -20,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 60,
  },
});
