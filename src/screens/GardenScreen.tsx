import React, { useState } from 'react';
import { View, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import TopBar from '../components/garden/TopBar';
import IsometricGarden from '../components/garden/IsometricGarden';
import PlantInfoPanel from '../components/garden/PlantInfoPanel';
import { Plant } from '../components/garden/PlantTile';
import { Colors } from '../constants/theme';

type Props = MainTabScreenProps<'Garden'> & {
  onMenuPress?: () => void;
};

export default function GardenScreen({ navigation, onMenuPress }: Props) {
  // Mock data for demo - will be replaced with actual data from Supabase
  const [plants, setPlants] = useState<Plant[]>([
    {
      id: '1',
      friendName: 'Sarah',
      plantType: 'cactus',
      stage: 2,
      hydration: 75,
      position: { x: 1, y: 1 },
    },
    {
      id: '2',
      friendName: 'Jake',
      plantType: 'sunflower',
      stage: 2,
      hydration: 45,
      position: { x: 3, y: 1 },
    },
    {
      id: '3',
      friendName: 'Alex',
      plantType: 'fern',
      stage: 3,
      hydration: 90,
      position: { x: 2, y: 3 },
    },
  ]);

  const [notificationCount] = useState(2); // Mock notification count
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isPlantInfoVisible, setIsPlantInfoVisible] = useState(false);

  // Handler functions
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      Alert.alert('Menu', 'Drawer will open here');
    }
  };

  const handleAddFriendPress = () => {
    navigation.navigate('AddFriend');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleNotificationPress = () => {
    // TODO: Open notification panel
    Alert.alert('Notifications', `You have ${notificationCount} notifications`);
  };

  const handlePlantPress = (plant: Plant) => {
    setSelectedPlant(plant);
    setIsPlantInfoVisible(true);
  };

  const handlePlantLongPress = (plant: Plant) => {
    // TODO: Enter Edit Mode (drag to rearrange)
    Alert.alert('Edit Mode', `Long press detected on ${plant.friendName}'s plant. Drag to rearrange.`);
  };

  const handleCall = () => {
    Alert.alert('Call', `Calling ${selectedPlant?.friendName}...`);
  };

  const handleText = () => {
    Alert.alert('Text', `Opening messages for ${selectedPlant?.friendName}...`);
  };

  const handleLogInteraction = () => {
    Alert.alert('Log Interaction', 'Log interaction screen coming soon');
  };

  const handleEditFriend = () => {
    Alert.alert('Edit Friend', 'Edit friend screen coming soon');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <TopBar
          gardenName="My Garden"
          notificationCount={notificationCount}
          onMenuPress={handleMenuPress}
          onAddFriendPress={handleAddFriendPress}
          onSettingsPress={handleSettingsPress}
          onNotificationPress={handleNotificationPress}
        />

        {/* Isometric Garden Viewport */}
        <IsometricGarden
          plants={plants}
          onPlantPress={handlePlantPress}
          onPlantLongPress={handlePlantLongPress}
        />

        {/* Plant Info Panel Modal */}
        <PlantInfoPanel
          visible={isPlantInfoVisible}
          plant={selectedPlant}
          onClose={() => setIsPlantInfoVisible(false)}
          onCall={handleCall}
          onText={handleText}
          onLogInteraction={handleLogInteraction}
          onEditFriend={handleEditFriend}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
});
