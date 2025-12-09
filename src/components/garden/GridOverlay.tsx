import React from 'react';
import { View, StyleSheet } from 'react-native';
import { gridToScreen, GridPosition } from '../../utils/isometricCoordinates';

interface GridOverlayProps {
  highlightedTile: GridPosition;
  isValid: boolean;
  tileWidth: number;
  tileHeight: number;
}

export default function GridOverlay({
  highlightedTile,
  isValid,
  tileWidth,
  tileHeight,
}: GridOverlayProps) {
  const position = gridToScreen(
    highlightedTile.x,
    highlightedTile.y,
    tileWidth,
    tileHeight
  );

  // Create isometric diamond shape for tile highlight
  const tileSize = tileWidth * 0.8; // Slightly smaller than actual tile

  return (
    <View
      style={[
        styles.highlight,
        {
          left: position.x,
          top: position.y,
          width: tileSize,
          height: tileSize / 2,
          backgroundColor: isValid
            ? 'rgba(76, 175, 80, 0.4)' // Green with 40% opacity
            : 'rgba(244, 67, 54, 0.4)', // Red with 40% opacity
          borderColor: isValid ? '#4CAF50' : '#F44336',
        },
      ]}
    >
      {/* Inner glow effect */}
      <View
        style={[
          styles.innerGlow,
          {
            borderColor: isValid ? '#4CAF50' : '#F44336',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }], // Creates diamond shape
  },
  innerGlow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 2,
    borderRadius: 6,
    opacity: 0.6,
  },
});
