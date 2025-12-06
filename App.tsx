import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { Rubik_700Bold } from '@expo-google-fonts/rubik';
import { Nunito_700Bold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';

// Keep the splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load Google Fonts
        await Font.loadAsync({
          VT323_400Regular,    // Pixel font for buttons and inputs
          Rubik_700Bold,       // Heading font (free alternative to Realtime Rounded)
          Nunito_700Bold,      // Subtext font (free alternative to Corporative Sans)
        });
      } catch (e) {
        console.warn('Font loading error:', e);
        // Continue anyway with system fonts
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5E6D3',
  },
});
