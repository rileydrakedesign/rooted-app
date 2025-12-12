import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

export interface Plant {
  id: string;
  friendName: string;
  plantType: 'cactus' | 'sunflower' | 'fern' | 'rose' | 'succulent' | 'ivy' | 'monstera' | 'bamboo';
  stage: 1 | 2 | 3 | 4; // Growth stages
  hydration: number; // 0-100
  position: {
    x: number; // 0-5 (grid coordinate)
    y: number; // 0-5 (grid coordinate)
  };
  image?: any; // Optional image asset
}

interface PlantTileProps {
  plant: Plant;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
}

// Plant emoji mapping by type
export const PLANT_EMOJIS: Record<Plant['plantType'], string> = {
  cactus: '🌵',
  sunflower: '🌻',
  fern: '🌿',
  rose: '🌹',
  succulent: '🪴',
  ivy: '🍃',
  monstera: '🌱',
  bamboo: '🎋',
};

export default function PlantTile({
  plant,
  onPress,
  onLongPress,
  size = 80,
}: PlantTileProps) {
  // Get hydration status color
  const getHydrationColor = () => {
    if (plant.hydration >= 60) return Colors.hydrationHigh;
    if (plant.hydration >= 20) return Colors.hydrationMedium;
    return Colors.hydrationLow;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor: getHydrationColor(),
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Plant Sprite (using emoji for MVP) */}
      <Text style={[styles.plantEmoji, { fontSize: size * 0.5 }]}>
        {PLANT_EMOJIS[plant.plantType]}
      </Text>

      {/* Hydration indicator (small dot) */}
      <View
        style={[
          styles.hydrationDot,
          { backgroundColor: getHydrationColor() },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.sageGreen,
    borderRadius: BorderRadius.medium,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    // Pixel art shadow
    shadowColor: Colors.black,
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  plantEmoji: {
    textAlign: 'center',
  },
  hydrationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.white,
  },
});
