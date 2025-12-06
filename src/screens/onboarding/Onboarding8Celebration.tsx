import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding8Celebration'>;

export default function Onboarding8Celebration({ navigation, route }: Props) {
  const { friendName, frequency, plantType } = route.params;

  const handleContinue = () => {
    navigation.navigate('Onboarding9CreateAccount', {
      friendName,
      frequency,
      plantType,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={5} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Celebration Title (already ALL CAPS) */}
        <Text style={styles.title}>FIRST FRIEND{'\n'}CREATED!</Text>

        {/* Greenhouse Visual with Plant */}
        <View style={styles.greenhouseContainer}>
          <Text style={styles.greenhouse}>🏡</Text>
          <View style={styles.plantBadge}>
            <Text style={styles.plantEmoji}>🌱</Text>
          </View>
        </View>

        {/* Message */}
        <Text style={styles.message}>
          You've planted your first seed! Remember to call or text to keep it healthy!
        </Text>
      </View>

      {/* Continue Button */}
      <PixelButton
        title="CONTINUE"
        onPress={handleContinue}
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
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes.titleMedium,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  greenhouseContainer: {
    position: 'relative',
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
  plantBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#F5E6D3',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  plantEmoji: {
    fontSize: 30,
  },
  message: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
});
