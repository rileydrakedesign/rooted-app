import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';
import { Fonts } from '../constants/fonts';

/** Single source for the hydration → status color ramp. */
export function getHydrationColor(hydration: number): string {
  if (hydration >= 60) return Colors.hydrationHigh;
  if (hydration >= 20) return Colors.hydrationMedium;
  return Colors.hydrationLow;
}

interface HydrationBarProps {
  /** 0–100 */
  hydration: number;
  /** Bar height in pt; the compact list variant is 12, the panel variant 48. */
  height?: number;
  /** Show the percentage label inside the fill (panel variant). */
  showLabel?: boolean;
}

export default function HydrationBar({
  hydration,
  height = 12,
  showLabel = false,
}: HydrationBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(hydration)));
  return (
    <View style={[styles.track, { height }, showLabel && styles.trackChunky]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: getHydrationColor(clamped),
          },
          showLabel && styles.fillLabeled,
        ]}
      >
        {showLabel && <Text style={styles.label}>{clamped}%</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.tanTrack,
    borderRadius: BorderRadius.small - 3,
    borderWidth: 1,
    borderColor: Colors.pixelBorder,
    overflow: 'hidden',
  },
  trackChunky: {
    borderRadius: BorderRadius.medium,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  fill: {
    height: '100%',
  },
  fillLabeled: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  label: {
    fontSize: 18,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
});
