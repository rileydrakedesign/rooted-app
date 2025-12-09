import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PlantTile, { Plant } from './PlantTile';
import { Colors, Spacing } from '../../constants/theme';

interface IsometricGardenProps {
  plants: Plant[];
  onPlantPress: (plant: Plant) => void;
  onPlantLongPress?: (plant: Plant) => void;
  onEmptyTilePress?: (x: number, y: number) => void;
}

const GRID_SIZE = 6; // 6x6 grid
const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_SIZE = Math.min((SCREEN_WIDTH - Spacing.xLarge * 2) / 4, 90); // Responsive tile size

export default function IsometricGarden({
  plants,
  onPlantPress,
  onPlantLongPress,
  onEmptyTilePress,
}: IsometricGardenProps) {
  // Create a map of occupied positions for quick lookup
  const plantPositionMap = new Map<string, Plant>();
  plants.forEach((plant) => {
    const key = `${plant.position.x},${plant.position.y}`;
    plantPositionMap.set(key, plant);
  });

  // Render garden grid
  // For MVP: Simple grid layout (will be enhanced to isometric later)
  const renderGrid = () => {
    const rows = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      const columns = [];

      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        const plant = plantPositionMap.get(key);

        columns.push(
          <View
            key={`tile-${x}-${y}`}
            style={[styles.gridCell, { width: TILE_SIZE, height: TILE_SIZE }]}
          >
            {plant && (
              <PlantTile
                plant={plant}
                onPress={() => onPlantPress(plant)}
                onLongPress={() => onPlantLongPress?.(plant)}
                size={TILE_SIZE - Spacing.small}
              />
            )}
          </View>
        );
      }

      rows.push(
        <View key={`row-${y}`} style={styles.gridRow}>
          {columns}
        </View>
      );
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      {/* Background greenhouse effect */}
      <View style={styles.greenhouseBackground}>
        {/* Grid overlay */}
        <View style={styles.gridContainer}>
          {renderGrid()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  greenhouseBackground: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
    padding: Spacing.medium,
    // Subtle greenhouse frame effect
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: Colors.warmWood,
  },
  gridContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: Spacing.tiny,
  },
  gridCell: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.tiny,
  },
});
