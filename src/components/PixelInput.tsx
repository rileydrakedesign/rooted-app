import React from 'react';
import { TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Fonts, FontSizes } from '../constants/fonts';

interface PixelInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export default function PixelInput({ containerStyle, style, ...props }: PixelInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#A0826D"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: FontSizes.inputText,
    fontFamily: Fonts.pixel,
    color: '#6B4423',
    // Pixelated border
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: '#E0E0E0', // Lighter top
    borderLeftColor: '#E0E0E0', // Lighter left
    borderRightColor: '#8B6F47', // Darker right
    borderBottomColor: '#8B6F47', // Darker bottom
    borderRadius: 8, // Rounded pixelated corners
    // Drop shadow (bottom-left)
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
});
