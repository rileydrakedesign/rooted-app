import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';

export const CONTACT_FREQUENCIES = ['DAILY', 'WEEKLY', 'BI-WEEKLY', 'CUSTOM'] as const;

interface FrequencyPickerProps {
  selected: string | null;
  onSelect: (frequency: string) => void;
}

/**
 * Contact-frequency option list shared by onboarding step 5 and the main
 * add-friend flow — the two paths must present identical choices.
 */
export default function FrequencyPicker({ selected, onSelect }: FrequencyPickerProps) {
  return (
    <View style={styles.container}>
      {CONTACT_FREQUENCIES.map((freq) => {
        const isSelected = selected === freq;
        return (
          <TouchableOpacity
            key={freq}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(freq)}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {freq}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
  option: {
    backgroundColor: Colors.tanTrack,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.medium,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: Colors.wheat,
    borderLeftColor: Colors.wheat,
    borderRightColor: Colors.saddleBrown,
    borderBottomColor: Colors.saddleBrown,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
  optionSelected: {
    backgroundColor: Colors.buttonPrimary,
    borderTopColor: Colors.buttonPrimaryLight,
    borderLeftColor: Colors.buttonPrimaryLight,
    borderRightColor: Colors.buttonPrimaryDark,
    borderBottomColor: Colors.buttonPrimaryDark,
  },
  optionText: {
    fontSize: FontSizes.buttonMedium,
    fontFamily: Fonts.pixel,
    color: Colors.textBrown,
    fontWeight: '600',
    letterSpacing: 1,
  },
  optionTextSelected: {
    color: Colors.white,
  },
});
