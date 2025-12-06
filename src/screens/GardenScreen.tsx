import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';

type Props = MainTabScreenProps<'Garden'>;

export default function GardenScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Garden</Text>
      <Text style={styles.subtitle}>
        Your plants will appear here once you add friends
      </Text>

      {/* TODO: Implement isometric garden grid with Phaser or react-native-svg */}
      <View style={styles.gardenPlaceholder}>
        <Text style={styles.placeholderText}>
          🌱 Garden Grid Coming Soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A5D3E',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C5E',
    marginBottom: 20,
  },
  gardenPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8DC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4D4C8',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7C5E',
  },
});
