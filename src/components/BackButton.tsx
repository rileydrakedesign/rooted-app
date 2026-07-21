import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';
import PixelIcon from './PixelIcon';

interface BackButtonProps {
  onPress: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
      <PixelIcon name="arrow-left" size={22} color={Colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.medium,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: Colors.buttonPrimaryLight,
    borderLeftColor: Colors.buttonPrimaryLight,
    borderRightColor: Colors.buttonPrimaryDark,
    borderBottomColor: Colors.buttonPrimaryDark,
    shadowColor: Colors.black,
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
});
