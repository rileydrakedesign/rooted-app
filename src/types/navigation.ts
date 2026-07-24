import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
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
  Onboarding8Celebration: { friendName: string; frequency: string; plantType: string };
  Onboarding9CreateAccount: { friendName: string; frequency: string; plantType: string };
  Onboarding10Complete: undefined;
  Login: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// Main area: a bottom-tab navigator (top-level destinations) nested in a
// native stack (flow screens pushed above the tabs).
export type MainTabsParamList = {
  Garden: { openPlantId?: string } | undefined; // openPlantId: rooted://plant/<id> deep link
  Friends: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabsParamList>;
  AddFriend: undefined;
  SetFrequency: { friendName: string };
  ChoosePlant: { friendName: string; frequency: string };
  Help: undefined;
  Shop: undefined;
  MemoryWall: { friendId: string };
  AcceptInvite: { code?: string } | undefined;
  GardenPass: undefined;
  Almanac: undefined;
};

// Tab screens can navigate to both tab siblings and parent-stack flow screens.
export type MainTabScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  NativeStackScreenProps<MainStackParamList>
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
