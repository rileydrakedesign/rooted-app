import React from 'react';
import { View, StyleSheet } from 'react-native';
import { gridToScreen, GridPosition } from '../../utils/gardenPositions';

interface GridOverlayProps {
  highlightedTile: GridPosition;
  isValid: boolean;
}

export default function GridOverlay({
  highlightedTile,
  isValid,
}: GridOverlayProps) {
  // Get screen position for the highlighted tile
  const position = gridToScreen(highlightedTile.x, highlightedTile.y);

  // Circle highlight size
  const size = 50;

  return (
    <View
      style={[
        styles.highlight,
        {
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          backgroundColor: isValid
            ? 'rgba(76, 175, 80, 0.4)' // Green with 40% opacity
            : 'rgba(244, 67, 54, 0.4)', // Red with 40% opacity
          borderColor: isValid ? '#4CAF50' : '#F44336',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 25, // Circular highlight
  },
});
