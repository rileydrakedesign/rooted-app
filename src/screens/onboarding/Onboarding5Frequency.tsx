import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar, BackButton, FrequencyPicker } from '../../components';

type Props = AuthStackScreenProps<'Onboarding5Frequency'>;

export default function Onboarding5Frequency({ navigation, route }: Props) {
  const { friendName } = route.params;
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedFrequency) return;
    navigation.navigate('Onboarding6ChoosePlant', {
      friendName,
      frequency: selectedFrequency,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={3} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>HOW OFTEN DO YOU TALK?</Text>

        {/* Friend Name Display */}
        <Text style={styles.friendName}>Friend Name:</Text>
        <Text style={styles.friendNameValue}>{friendName}</Text>

        {/* Frequency Options */}
        <FrequencyPicker selected={selectedFrequency} onSelect={setSelectedFrequency} />
      </View>

      {/* Next Button */}
      <PixelButton
        title="NEXT"
        onPress={handleNext}
        disabled={!selectedFrequency}
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes.titleMedium,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 30,
    textAlign: 'center',
  },
  friendName: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    marginBottom: 5,
  },
  friendNameValue: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: '#8B4513',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
});
