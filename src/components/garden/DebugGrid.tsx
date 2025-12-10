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

      // Highlight origin (0,0) in red, corners in blue
      const isOrigin = x === 0 && y === 0;
      const isCorner =
        (x === 0 && y === 0) ||
        (x === GRID_SIZE - 1 && y === 0) ||
        (x === 0 && y === GRID_SIZE - 1) ||
        (x === GRID_SIZE - 1 && y === GRID_SIZE - 1);

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
          <View
            style={[
              styles.diamond,
              {
                backgroundColor: isOrigin
                  ? 'rgba(255, 0, 0, 0.3)'
                  : isCorner
                  ? 'rgba(0, 100, 255, 0.25)'
                  : 'rgba(255, 255, 255, 0.25)',
                borderColor: isOrigin ? '#ff0000' : isCorner ? '#0064ff' : 'rgba(0, 0, 0, 0.4)',
                borderWidth: isOrigin ? 3 : 2,
              },
            ]}
          >
            <Text style={[styles.label, isOrigin && styles.originLabel]}>
              {`${x},${y}`}
            </Text>
          </View>
        </View>
      );
    }
  }

  // Add a center marker at the origin offset
  return (
    <View style={styles.container}>
      {tiles}
      {/* Origin marker */}
      <View
        style={[
          styles.originMarker,
          {
            left: offsetX - 4,
            top: offsetY - 4,
          },
        ]}
      />
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
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: '90%',
    height: '90%',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  originLabel: {
    fontSize: 14,
    color: '#ff0000',
    fontWeight: 'bold',
  },
  originMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
