import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { gridToScreen, GRID_CONFIG } from '../../utils/gardenGrid';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Grid overlay with lines connecting coordinates
 * Uses View components as lines (no SVG to avoid conflicts)
 */
export default function GridDebugOverlay() {
  const lines: JSX.Element[] = [];

  // Helper function to create a line between two points
  const createLine = (x1: number, y1: number, x2: number, y2: number, key: string, opacity: number = 1) => {
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    return (
      <View
        key={key}
        style={[
          styles.line,
          {
            left: x1,
            top: y1,
            width: length,
            backgroundColor: `rgba(0, 255, 0, ${opacity})`,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  };

  // Draw main grid lines in one direction (rows)
  for (let y = 0; y < GRID_CONFIG.rows; y++) {
    for (let x = 0; x < GRID_CONFIG.cols - 1; x++) {
      const start = gridToScreen(x, y);
      const end = gridToScreen(x + 1, y);

      lines.push(createLine(start.x, start.y, end.x, end.y, `row-${x}-${y}`, 1));

      // Add 3 subdivision lines
      for (let sub = 1; sub <= 3; sub++) {
        const t = sub / 4;
        const subStartX = start.x + (end.x - start.x) * t;
        const subStartY = start.y + (end.y - start.y) * t;
        const subEndX = start.x + (end.x - start.x) * (t + 0.25);
        const subEndY = start.y + (end.y - start.y) * (t + 0.25);

        lines.push(createLine(subStartX, subStartY, subEndX, subEndY, `row-sub-${x}-${y}-${sub}`, 0.3));
      }
    }
  }

  // Draw main grid lines in other direction (columns)
  for (let x = 0; x < GRID_CONFIG.cols; x++) {
    for (let y = 0; y < GRID_CONFIG.rows - 1; y++) {
      const start = gridToScreen(x, y);
      const end = gridToScreen(x, y + 1);

      lines.push(createLine(start.x, start.y, end.x, end.y, `col-${x}-${y}`, 1));

      // Add 3 subdivision lines
      for (let sub = 1; sub <= 3; sub++) {
        const t = sub / 4;
        const subStartX = start.x + (end.x - start.x) * t;
        const subStartY = start.y + (end.y - start.y) * t;
        const subEndX = start.x + (end.x - start.x) * (t + 0.25);
        const subEndY = start.y + (end.y - start.y) * (t + 0.25);

        lines.push(createLine(subStartX, subStartY, subEndX, subEndY, `col-sub-${x}-${y}-${sub}`, 0.3));
      }
    }
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {lines}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    zIndex: 3,
  },
  line: {
    position: 'absolute',
    height: 1.5,
    transformOrigin: '0 0',
  },
});
