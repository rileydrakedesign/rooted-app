import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding6ChoosePlant'>;

const PLANT_TYPES = [
  {
    name: 'Cactus',
    image: require('../../../assets/images/plants/cactus-plant.png')
  },
  {
    name: 'Sunflower',
    image: require('../../../assets/images/plants/sunflower-plant.png')
  },
  {
    name: 'Monstera',
    image: require('../../../assets/images/plants/monstera-plant.png')
  },
  {
    name: 'Ficus',
    image: require('../../../assets/images/plants/ficus-plant.png')
  },
];

export default function Onboarding6ChoosePlant({ navigation, route }: Props) {
  const { friendName, frequency } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPlant = PLANT_TYPES[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : PLANT_TYPES.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < PLANT_TYPES.length - 1 ? prev + 1 : 0));
  };

  const handleSelect = () => {
    navigation.navigate('Onboarding8Celebration', {
      friendName,
      frequency,
      plantType: currentPlant.name,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={4} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>CHOOSE THEIR PLANT!</Text>

        {/* Plant Display with Navigation */}
        <View style={styles.plantContainer}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handlePrevious}
          >
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>

          <View style={styles.plantDisplay}>
            <Image source={currentPlant.image} style={styles.plantImage} resizeMode="contain" />
            <Text style={styles.plantName}>{currentPlant.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handleNext}
          >
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Plant Counter */}
        <Text style={styles.counter}>
          {currentIndex + 1} / {PLANT_TYPES.length}
        </Text>
      </View>

      {/* Select Button */}
      <PixelButton
        title="SELECT"
        onPress={handleSelect}
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
    backgroundColor: '#DEB887',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  arrowText: {
    fontSize: 24,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  plantDisplay: {
    width: 200,
    height: 200,
    backgroundColor: '#DEB887',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  plantImage: {
    width: 120,
    height: 120,
  },
  plantName: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.subtext,
    color: '#8B4513',
    fontWeight: 'bold',
    marginTop: 10,
  },
  counter: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: '#A0826D',
    textAlign: 'center',
    marginTop: 10,
  },
});
