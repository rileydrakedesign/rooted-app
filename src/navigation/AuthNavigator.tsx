import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';

import {
  Onboarding1Welcome,
  Onboarding2ValueProp,
  Onboarding3Educational,
  Onboarding4AddFriend,
  Onboarding5Frequency,
  Onboarding6ChoosePlant,
  Onboarding8Celebration,
  Onboarding9CreateAccount,
  Onboarding10Complete,
} from '../screens/onboarding';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Onboarding1Welcome"
        component={Onboarding1Welcome}
      />
      <Stack.Screen
        name="Onboarding2ValueProp"
        component={Onboarding2ValueProp}
      />
      <Stack.Screen
        name="Onboarding3Educational"
        component={Onboarding3Educational}
      />
      <Stack.Screen
        name="Onboarding4AddFriend"
        component={Onboarding4AddFriend}
      />
      <Stack.Screen
        name="Onboarding5Frequency"
        component={Onboarding5Frequency}
      />
      <Stack.Screen
        name="Onboarding6ChoosePlant"
        component={Onboarding6ChoosePlant}
      />
      <Stack.Screen
        name="Onboarding7PlantBrowse"
        component={Onboarding6ChoosePlant}
      />
      <Stack.Screen
        name="Onboarding8Celebration"
        component={Onboarding8Celebration}
      />
      <Stack.Screen
        name="Onboarding9CreateAccount"
        component={Onboarding9CreateAccount}
      />
      <Stack.Screen
        name="Onboarding10Complete"
        component={Onboarding10Complete}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
}
