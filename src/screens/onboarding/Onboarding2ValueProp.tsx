import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { PixelButton, ProgressBar, BackButton } from '../../components';

type Props = AuthStackScreenProps<'Onboarding2ValueProp'>;

export default function Onboarding2ValueProp({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const options = [
    'Mental health & wellness',
    'Build better friendships',
    'Reduce social anxiety',
    'Track interactions',
    'Stay connected',
    'Remember important dates',
  ];

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      setSelected(selected.filter(o => o !== option));
    } else {
      setSelected([...selected, option]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and progress bar */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.progressContainer}>
          <ProgressBar current={1} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>WHY ARE YOU CHOOSING{'\n'}ROOTED?</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selected.includes(option) && styles.optionButtonSelected,
              ]}
              onPress={() => toggleOption(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected.includes(option) && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <PixelButton
        title="CONTINUE"
        onPress={() => navigation.navigate('Onboarding3Educational')}
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
    color: '#6B4423',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 38,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: '#E8C9A0',
    borderLeftColor: '#E8C9A0',
    borderRightColor: '#B8916B',
    borderBottomColor: '#B8916B',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#B8916B',
    borderTopColor: '#D4A574',
    borderLeftColor: '#D4A574',
    borderRightColor: '#8B6F47',
    borderBottomColor: '#8B6F47',
  },
  optionText: {
    fontSize: FontSizes.buttonMedium,
    fontFamily: Fonts.pixel,
    color: '#6B4423',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  optionTextSelected: {
    color: '#FFF',
  },
});
