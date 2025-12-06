import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding3Educational'>;

export default function Onboarding3Educational({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={2} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>DID YOU KNOW?</Text>

        {/* Brain Flower Plant Image */}
        <Image
          source={require('../../../assets/images/plants/flower-plant-brain.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />

        {/* Educational Content */}
        <Text style={styles.message}>
          Deeper connections improve mental health and reduce loneliness.
        </Text>
        <Text style={styles.messageHighlight}>Let's grow together!</Text>
      </View>

      {/* Continue Button */}
      <PixelButton
        title="CONTINUE"
        onPress={() => navigation.navigate('Onboarding4AddFriend')}
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
    color: '#6B4423',
    marginBottom: 40,
  },
  illustrationImage: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  message: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  messageHighlight: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: '#8B4513',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
