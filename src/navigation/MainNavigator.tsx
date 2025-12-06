import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';

import GardenScreen from '../screens/GardenScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Garden"
        component={GardenScreen}
        options={{
          tabBarIcon: ({ color }) => <GardenIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color }) => <FriendsIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple text-based icons (will be replaced with actual pixel art icons later)
function GardenIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 24, color }}>🌱</Text>;
}

function FriendsIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 24, color }}>👥</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 24, color }}>👤</Text>;
}
