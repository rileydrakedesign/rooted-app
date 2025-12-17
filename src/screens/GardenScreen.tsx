import React, { useState } from 'react';
import { View, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import TopBar from '../components/garden/TopBar';
import TileMap from '../components/garden/TileMap';
import { exampleMap } from '../data/exampleMap';
import { Colors } from '../constants/theme';

type Props = MainTabScreenProps<'Garden'> & {
  onMenuPress?: () => void;
};

export default function GardenScreen({ navigation, onMenuPress }: Props) {
  const [notificationCount] = useState(0);

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

  const handleTileSelected = (i: number, j: number) => {
    console.log(`Tile selected at grid position: (${i}, ${j})`);
    // TODO: Handle tile selection (e.g., plant placement)
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

        {/* New Tile-Based Garden */}
        <TileMap map={exampleMap} onTileSelected={handleTileSelected} />
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
