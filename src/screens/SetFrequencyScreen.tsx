import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { PixelButton, ProgressBar, BackButton, FrequencyPicker } from '../components';

type Props = MainStackScreenProps<'SetFrequency'>;

/**
 * Step 2 of the main add-friend flow (name → frequency → plant). Mirrors
 * onboarding step 5 via the shared FrequencyPicker.
 */
export default function SetFrequencyScreen({ navigation, route }: Props) {
  const { friendName } = route.params;
  const insets = useSafeAreaInsets();
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedFrequency) return;
    navigation.navigate('ChoosePlant', { friendName, frequency: selectedFrequency });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.small, paddingBottom: insets.bottom + Spacing.large },
      ]}
    >
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={2} total={3} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>HOW OFTEN DO YOU TALK?</Text>

        <Text style={styles.friendLabel}>Friend Name:</Text>
        <Text style={styles.friendName}>{friendName}</Text>

        <FrequencyPicker selected={selectedFrequency} onSelect={setSelectedFrequency} />
      </View>

      <PixelButton title="NEXT" onPress={handleNext} disabled={!selectedFrequency} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
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
    color: Colors.warmWood,
    marginBottom: 30,
    textAlign: 'center',
  },
  friendLabel: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    textAlign: 'center',
    marginBottom: 5,
  },
  friendName: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: Colors.warmWood,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
});
