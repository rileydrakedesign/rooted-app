import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList, MainTabsParamList } from '../types/navigation';
import { Colors } from '../constants/theme';
import { Fonts } from '../constants/fonts';
import PixelIcon, { PixelIconName } from '../components/PixelIcon';

import GardenScreen from '../screens/GardenScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import SetFrequencyScreen from '../screens/SetFrequencyScreen';
import ChoosePlantScreen from '../screens/ChoosePlantScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const TAB_ICONS: Record<keyof MainTabsParamList, PixelIconName> = {
  Garden: 'seedlings',
  Friends: 'users',
  Settings: 'cog',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <PixelIcon name={TAB_ICONS[route.name]} size={24} color={color} />
        ),
        tabBarActiveTintColor: Colors.forestGreen,
        tabBarInactiveTintColor: Colors.textBrownMuted,
        tabBarStyle: {
          backgroundColor: Colors.warmBeige,
          borderTopWidth: 2,
          borderTopColor: Colors.pixelBorder,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.pixel,
          fontSize: 14,
        },
      })}
    >
      <Tab.Screen name="Garden" component={GardenScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} />
      <Stack.Screen name="SetFrequency" component={SetFrequencyScreen} />
      <Stack.Screen name="ChoosePlant" component={ChoosePlantScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
