import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

// Deep links (home-screen widget / notifications → app): rooted://plant/<id>,
// rooted://friends, rooted://add-friend
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rooted://'],
  config: {
    screens: {
      Main: {
        screens: {
          Tabs: {
            screens: {
              Garden: 'plant/:openPlantId',
              Friends: 'friends',
            },
          },
          AddFriend: 'add-friend',
          AcceptInvite: 'invite/:code',
        },
      },
    },
  },
};

/**
 * Auth gate. Session state comes from AuthContext (the single auth owner).
 * `onboardingActive` keeps the Auth stack mounted through the post-signup
 * onboarding steps (first watering, completion) — without it, signUp's new
 * session would yank the user straight into the garden mid-flow.
 */
export default function RootNavigator() {
  const { session, initializing, onboardingActive } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A5D3E" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && !onboardingActive ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
});
