import React, { useState, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList } from '../types/navigation';

import GardenScreen from '../screens/GardenScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import ChoosePlantScreen from '../screens/ChoosePlantScreen';
import SimpleDrawer from '../components/navigation/SimpleDrawer';

const Stack = createNativeStackNavigator<MainTabParamList>();

export default function MainNavigator() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigationRef = useRef<any>(null);

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Garden">
          {(props) => {
            navigationRef.current = props.navigation;
            return (
              <GardenScreen
                {...props}
                onMenuPress={() => setIsDrawerOpen(true)}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="Friends">
          {(props) => {
            navigationRef.current = props.navigation;
            return (
              <FriendsScreen
                {...props}
                onMenuPress={() => setIsDrawerOpen(true)}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="AddFriend" component={AddFriendScreen} />
        <Stack.Screen name="ChoosePlant" component={ChoosePlantScreen} />
      </Stack.Navigator>

      <SimpleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navigation={navigationRef.current}
        state={{ routeNames: ['Garden', 'Friends', 'Settings', 'Help'], index: 0 }}
      />
    </>
  );
}
