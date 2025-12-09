import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList } from '../types/navigation';

import GardenScreen from '../screens/GardenScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import SimpleDrawer from '../components/navigation/SimpleDrawer';

const Stack = createNativeStackNavigator<MainTabParamList>();

export default function MainNavigator() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Garden');

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Garden">
          {(props) => (
            <GardenScreen
              {...props}
              onMenuPress={() => setIsDrawerOpen(true)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Settings" component={ProfileScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
      </Stack.Navigator>

      <SimpleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navigation={{
          navigate: (screen: string) => {
            setCurrentRoute(screen);
            setIsDrawerOpen(false);
          },
        }}
        state={{ routeNames: ['Garden', 'Friends', 'Settings', 'Help'], index: 0 }}
      />
    </>
  );
}
