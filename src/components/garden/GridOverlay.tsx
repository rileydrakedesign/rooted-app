import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { gridToScreen, GridPosition, getGridOrigin } from '../../utils/isometricCoordinates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const origin = getGridOrigin(SCREEN_WIDTH, SCREEN_HEIGHT);
  const gridPos = gridToScreen(
    highlightedTile.x,
    highlightedTile.y,
    tileWidth,
    tileHeight
  );

  // Absolute screen position
  const position = {
    x: origin.x + gridPos.x,
    y: origin.y + gridPos.y,
  };

  // Create isometric diamond shape for tile highlight
  const tileSize = tileWidth * 0.8; // Slightly smaller than actual tile
  const diamondHeight = tileHeight * 0.8;

  return (
    <View
      style={[
        styles.highlight,
        {
          left: position.x - tileSize / 2, // Center the diamond on the position
          top: position.y - diamondHeight / 2,
          width: tileSize,
          height: diamondHeight,
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
