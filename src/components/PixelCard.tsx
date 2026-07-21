import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface PixelCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When set, the card renders as a touchable. */
  onPress?: () => void;
}

/**
 * The chunky pixel-bordered card used for list rows, settings groups, and
 * panel surfaces — the single home of the 2/2/4/4 border treatment.
 */
export default function PixelCard({ children, style, onPress }: PixelCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    overflow: 'hidden',
  },
});
