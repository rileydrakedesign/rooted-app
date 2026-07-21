import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Plant } from '../../types/garden';
import { Friend } from '../../contexts/FriendsContext';
import { InteractionType, HYDRATION_WEIGHTS } from '../../lib/garden';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { Fonts, FontSizes } from '../../constants/fonts';
import BottomSheet from '../BottomSheet';
import HydrationBar from '../HydrationBar';
import PixelIcon, { PixelIconName } from '../PixelIcon';

interface PlantInfoPanelProps {
  visible: boolean;
  plant: Plant | null;
  /** Matching friend record (Friend.id === Plant.id) for contact details. */
  friend?: Friend | null;
  onClose: () => void;
  onLogInteraction?: (type: InteractionType) => void;
}

// The care loop's three log actions; weights come from the shared
// HYDRATION_WEIGHTS so the labels can never drift from the RPC
const LOG_ACTIONS: { type: InteractionType; icon: PixelIconName; label: string }[] = [
  { type: 'call', icon: 'phone', label: 'CALLED' },
  { type: 'text', icon: 'comment', label: 'TEXTED' },
  { type: 'manual', icon: 'heart', label: 'HUNG OUT' },
];

/**
 * The single friend-care surface: opened by tapping a plant in the garden or
 * a friend in the list — both paths land here and log through the same RPC.
 */
export default function PlantInfoPanel({
  visible,
  plant,
  friend,
  onClose,
  onLogInteraction,
}: PlantInfoPanelProps) {
  if (!plant) return null;

  // Days of hydration left before empty at weekly-cadence decay — a display
  // approximation, not the DB decay math
  const daysUntilWater = Math.max(0, Math.ceil((plant.hydration / 100) * 7));

  const stats: { icon: PixelIconName; text: string }[] = [
    ...(friend
      ? [{ icon: 'calendar' as PixelIconName, text: `Last Contact: ${friend.lastContact}` }]
      : []),
    { icon: 'water', text: `Needs Water In: ${daysUntilWater} days` },
    ...(friend
      ? [{ icon: 'phone' as PixelIconName, text: `Contact Frequency: ${friend.contactFrequency}` }]
      : []),
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.spriteContainer}>
            <Image source={plant.image} style={styles.sprite} resizeMode="contain" />
          </View>

          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{plant.friendName.toUpperCase()}</Text>
            <Text style={styles.plantDetails}>
              {plant.plantType.charAt(0).toUpperCase() + plant.plantType.slice(1)} • Stage {plant.stage}
            </Text>
          </View>
        </View>

        {/* Hydration Bar */}
        <View style={styles.hydrationContainer}>
          <HydrationBar hydration={plant.hydration} height={48} showLabel />
        </View>

        {/* Info Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.text} style={styles.statRow}>
              <PixelIcon name={stat.icon} size={20} color={Colors.textBrown} />
              <Text style={styles.statText}>{stat.text}</Text>
            </View>
          ))}
        </View>

        {/* Typed log actions — the watering write path */}
        <View style={styles.buttonRow}>
          {LOG_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.type}
              style={styles.logButton}
              onPress={() => onLogInteraction?.(action.type)}
              activeOpacity={0.8}
            >
              <PixelIcon name={action.icon} size={20} color={Colors.white} />
              <Text style={styles.logButtonText}>{action.label}</Text>
              <Text style={styles.logButtonHint}>+{HYDRATION_WEIGHTS[action.type]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.large,
    gap: Spacing.medium,
  },
  spriteContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.mintSurface,
    borderRadius: BorderRadius.large,
    borderColor: Colors.pixelBorder,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 88,
    height: 88,
  },
  friendInfo: {
    flex: 1,
    paddingTop: Spacing.small,
  },
  friendName: {
    fontSize: 24,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  plantDetails: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  hydrationContainer: {
    marginBottom: Spacing.large,
  },
  statsContainer: {
    marginBottom: Spacing.large,
    gap: Spacing.medium - 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium - 4,
  },
  statText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.medium - 4,
  },
  logButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: Spacing.medium - 4,
    paddingHorizontal: Spacing.tiny,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    gap: 2,
  },
  logButtonText: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  logButtonHint: {
    fontSize: 12,
    fontFamily: Fonts.subtext,
    color: Colors.cream,
  },
});
