import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar } from '../../components';

type Props = AuthStackScreenProps<'Onboarding10Complete'>;

export default function Onboarding10Complete({ navigation }: Props) {
  // In a real implementation, this would navigate to the main app
  // Since we're authenticated, the RootNavigator will automatically switch to MainNavigator

  return (
    <View style={styles.container}>
      {/* Header with progress bar (no back button on final screen) */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <ProgressBar current={6} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Celebration Title (already ALL CAPS) */}
        <Text style={styles.title}>SETUP COMPLETE!</Text>

        {/* Greenhouse Visual */}
        <View style={styles.greenhouseContainer}>
          <Text style={styles.greenhouse}>🏡</Text>
          <Text style={styles.greenhouseText}>Your Garden</Text>
        </View>

        {/* Message */}
        <Text style={styles.message}>
          Your garden is ready!{'\n'}Let's start growing!
        </Text>
      </View>

      {/* Enter Garden Button */}
      <PixelButton
        title="ENTER GARDEN"
        onPress={() => {
          // The app will automatically navigate to Main due to authentication state
          // This is handled by RootNavigator
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes.titleLarge,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 50,
    textAlign: 'center',
  },
  greenhouseContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#DEB887',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  greenhouse: {
    fontSize: 100,
  },
  greenhouseText: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#8B4513',
    fontWeight: 'bold',
    marginTop: 10,
  },
  message: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
  },
});
