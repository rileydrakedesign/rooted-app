import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { PixelButton, ProgressBar, BackButton, PixelIcon } from '../components';
import { useGarden } from '../contexts/GardenContext';
import { STARTER_PLANTS } from '../data/plantCatalog';

type Props = MainStackScreenProps<'ChoosePlant'>;

/** Step 3 of the main add-friend flow (name → frequency → plant). */
export default function ChoosePlantScreen({ navigation, route }: Props) {
  const { friendName, frequency } = route.params;
  const insets = useSafeAreaInsets();
  const { addPlant } = useGarden();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const currentPlant = STARTER_PLANTS[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : STARTER_PLANTS.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < STARTER_PLANTS.length - 1 ? prev + 1 : 0));
  };

  const handleSelect = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addPlant(friendName, currentPlant.plantType, currentPlant.image, frequency);
      // Back to the tabs (whichever tab launched the flow)
      navigation.popToTop();
    } catch (error: any) {
      Alert.alert('Could Not Add Friend', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.small, paddingBottom: insets.bottom + Spacing.large },
      ]}
    >
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={3} total={3} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>CHOOSE THEIR PLANT!</Text>

        {/* Plant Display with Navigation */}
        <View style={styles.plantContainer}>
          <TouchableOpacity style={styles.arrowButton} onPress={handlePrevious}>
            <PixelIcon name="arrow-left" size={22} color={Colors.warmWood} />
          </TouchableOpacity>

          <View style={styles.plantDisplay}>
            <Image source={currentPlant.image} style={styles.plantImage} resizeMode="contain" />
            <Text style={styles.plantName}>{currentPlant.name}</Text>
          </View>

          <TouchableOpacity style={[styles.arrowButton, styles.arrowFlipped]} onPress={handleNext}>
            <PixelIcon name="arrow-left" size={22} color={Colors.warmWood} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{currentPlant.description}</Text>

        <Text style={styles.counter}>
          {currentIndex + 1} / {STARTER_PLANTS.length}
        </Text>
      </View>

      <PixelButton
        title={saving ? 'Planting...' : 'SELECT PLANT'}
        onPress={handleSelect}
        disabled={saving}
      />
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
    marginBottom: 60,
    textAlign: 'center',
  },
  plantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  arrowButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.tanTrack,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.warmWood,
  },
  arrowFlipped: {
    transform: [{ scaleX: -1 }],
  },
  plantDisplay: {
    width: 200,
    height: 200,
    backgroundColor: Colors.tanTrack,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 3,
    borderColor: Colors.warmWood,
  },
  plantImage: {
    width: 120,
    height: 120,
  },
  plantName: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: Colors.warmWood,
    fontWeight: 'bold',
    marginTop: 10,
  },
  description: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  counter: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
