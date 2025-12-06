import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack - Onboarding Flow
export type AuthStackParamList = {
  Onboarding1Welcome: undefined;
  Onboarding2ValueProp: undefined;
  Onboarding3Educational: undefined;
  Onboarding4AddFriend: undefined;
  Onboarding5Frequency: { friendName: string };
  Onboarding6ChoosePlant: { friendName: string; frequency: string };
  Onboarding7PlantBrowse: { friendName: string; frequency: string };
  Onboarding8Celebration: { friendName: string; frequency: string; plantType: string };
  Onboarding9CreateAccount: { friendName: string; frequency: string; plantType: string };
  Onboarding10Complete: undefined;
  Login: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// Main Tab Navigator
export type MainTabParamList = {
  Garden: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AddFriend: undefined;
  EditFriend: { friendId: string };
  PlantDetail: { plantId: string };
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
