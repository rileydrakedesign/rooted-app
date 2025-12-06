import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Fonts, FontSizes } from '../constants/fonts';

interface PixelButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PixelButton({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: PixelButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // Pixelated border effect using multiple borders
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    // Rounded pixelated corners
    borderRadius: 10,
    // Drop shadow effect (bottom-left for pixel art style)
    shadowColor: '#000',
    shadowOffset: {
      width: -3,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 0, // No blur for pixel effect
    elevation: 8, // Android shadow
  },
  primaryButton: {
    backgroundColor: '#B8916B', // Tan/brown from mockup
    borderTopColor: '#D4A574', // Lighter edge (top highlight)
    borderLeftColor: '#D4A574', // Lighter edge (left highlight)
    borderRightColor: '#8B6F47', // Darker edge (right shadow)
    borderBottomColor: '#8B6F47', // Darker edge (bottom shadow)
  },
  secondaryButton: {
    backgroundColor: '#D4A574', // Lighter tan
    borderTopColor: '#E8C9A0', // Lighter edge
    borderLeftColor: '#E8C9A0', // Lighter edge
    borderRightColor: '#B8916B', // Darker edge
    borderBottomColor: '#B8916B', // Darker edge
  },
  disabledButton: {
    backgroundColor: '#A0826D',
    opacity: 0.5,
    borderTopColor: '#C0A080',
    borderLeftColor: '#C0A080',
    borderRightColor: '#705030',
    borderBottomColor: '#705030',
  },
  buttonText: {
    fontSize: FontSizes.buttonMedium,
    fontFamily: Fonts.pixel,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  primaryText: {
    color: '#FFF',
  },
  secondaryText: {
    color: '#6B4423',
  },
  disabledText: {
    color: '#999',
  },
});
