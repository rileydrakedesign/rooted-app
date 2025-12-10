import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gridToScreen, GRID_SIZE } from '../../utils/isometricCoordinates';

interface DebugGridProps {
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Debug component that renders a visible grid overlay
 * Shows all tiles in the isometric grid for alignment testing
 */
export default function DebugGrid({
  tileWidth,
  tileHeight,
  offsetX,
  offsetY,
}: DebugGridProps) {
  const tiles = [];

  // Render all grid positions
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const screenPos = gridToScreen(x, y, tileWidth, tileHeight);
      const absolutePos = {
        x: offsetX + screenPos.x,
        y: offsetY + screenPos.y,
      };

      tiles.push(
        <View
          key={`${x},${y}`}
          style={[
            styles.tile,
            {
              left: absolutePos.x - tileWidth / 2,
              top: absolutePos.y - tileHeight / 2,
              width: tileWidth,
              height: tileHeight,
            },
          ]}
        >
          <View style={styles.diamond}>
            <Text style={styles.label}>{`${x},${y}`}</Text>
          </View>
        </View>
      );
    }
  }

  return <View style={styles.container}>{tiles}</View>;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: '80%',
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
});
