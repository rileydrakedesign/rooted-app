import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import BackButton from './BackButton';

interface ScreenHeaderProps {
  title: string;
  /** When set, shows a BackButton on the left. */
  onBack?: () => void;
  /** Optional right-side action (icon button etc.); a spacer keeps the title centered. */
  rightAction?: React.ReactNode;
}

/**
 * Shared screen header: centered title, optional back button, optional right
 * action, bottom divider. Replaces per-screen hand-rolled headers.
 */
export default function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.side}>{onBack && <BackButton onPress={onBack} />}</View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>{rightAction}</View>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium + Spacing.tiny,
    paddingVertical: Spacing.medium,
  },
  side: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
    textAlign: 'center',
  },
  divider: {
    height: 3,
    backgroundColor: Colors.pixelBorder,
  },
});
