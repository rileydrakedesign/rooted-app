import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Plant } from '../../types/garden';
import { Friend } from '../../contexts/FriendsContext';
import {
  InteractionType,
  HYDRATION_WEIGHTS,
  LogResult,
  streakLabel,
  streakTier,
  streakAtRisk,
} from '../../lib/garden';
import { restoreBasePrice, RESTORE_GEM_PRICE } from '../../lib/economy';
import {
  NudgeType,
  NUDGE_LABELS,
  HAPTIC_SIGNATURES,
  sendNudge,
  playHapticSignature,
} from '../../lib/nudges';
import { searchSongs, sendSong, playPreview } from '../../lib/musicBox';
import { setFriendHapticSignature } from '../../lib/garden';
import { useGarden } from '../../contexts/GardenContext';
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
  /** Last log's mint (Batch 9) — shown as the "+35 ×1.5" toast. */
  mintResult?: LogResult | null;
  /** Restore a broken streak (points or gems). */
  onRestoreStreak?: (currency: 'points' | 'gems') => void;
  /** Open this friendship's memory wall (Batch 11). */
  onOpenMemories?: () => void;
  /** Invite this friend to link plants (Batch 13). Hidden when linked. */
  onInvite?: () => void;
}

// The care loop's three log actions, ranked in-person-first (Batch 6);
// weights come from the shared HYDRATION_WEIGHTS so the labels can never
// drift from the RPC
const LOG_ACTIONS: { type: InteractionType; icon: PixelIconName; label: string }[] = [
  { type: 'manual', icon: 'heart', label: 'HUNG OUT' },
  { type: 'call', icon: 'phone', label: 'CALLED' },
  { type: 'text', icon: 'comment', label: 'TEXTED' },
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
  mintResult,
  onRestoreStreak,
  onOpenMemories,
  onInvite,
}: PlantInfoPanelProps) {
  const { gardenPaused, shopCatalog, ownedSkus, equipAttachment, plants, lockedPlantIds } =
    useGarden();
  const [customizing, setCustomizing] = useState(false);
  if (!plant) return null;

  // The prop is a snapshot; attachments must reflect live context state so
  // equip toggles update immediately.
  const liveAttachments =
    plants.find((p) => p.id === plant.id)?.attachments ?? plant.attachments;

  // Owned equipable cosmetics grouped by slot (= category), Batch 10.
  const ownedBySlot = new Map<string, { sku: string; name: string }[]>();
  for (const item of shopCatalog) {
    if (!ownedSkus.includes(item.sku)) continue;
    if (!['pot', 'nameplate', 'accessory', 'bloom'].includes(item.category)) continue;
    const list = ownedBySlot.get(item.category) ?? [];
    list.push({ sku: item.sku, name: item.display_name });
    ownedBySlot.set(item.category, list);
  }

  const handleSendNudge = async (type: NudgeType) => {
    if (!plant.linkId) return;
    try {
      await sendNudge({ linkId: plant.linkId, type, senderName: undefined });
      Alert.alert('Sent', `${NUDGE_LABELS[type].label} is on its way — no reply needed.`);
    } catch (error: any) {
      Alert.alert('Not Sent', error?.message ?? 'Please try again.');
    }
  };

  // Music Box (Batch 18, previews-only v1): search → pick → their plant
  // sways while a 30-second preview plays.
  const handleSendSong = () => {
    if (!plant.linkId) return;
    Alert.prompt?.('Music Box', 'What song is on your mind?', async (query) => {
      if (!query?.trim()) return;
      try {
        const results = await searchSongs(query.trim());
        if (results.length === 0) {
          Alert.alert('No Luck', 'Nothing came back for that — try another search.');
          return;
        }
        Alert.alert(
          'Pick One',
          'A 30-second preview travels with it.',
          [
            { text: 'Cancel', style: 'cancel' },
            ...results.map((song) => ({
              text: `${song.title} — ${song.artist}`,
              onPress: async () => {
                try {
                  playPreview(song.previewUrl);
                  await sendSong({ linkId: plant.linkId as string, song });
                  Alert.alert('Sent', 'Their plant will sway when it lands.');
                } catch (error: any) {
                  Alert.alert('Not Sent', error?.message ?? 'Please try again.');
                }
              },
            })),
          ]
        );
      } catch (error: any) {
        Alert.alert('Search Failed', error?.message ?? 'Please try again.');
      }
    });
  };

  const handleSetHaptic = async (signature: string) => {
    try {
      await setFriendHapticSignature(plant.id, signature);
      playHapticSignature(signature); // preview
    } catch (error: any) {
      Alert.alert('Could Not Save', error?.message ?? 'Please try again.');
    }
  };

  const handleEquipToggle = async (slot: string, sku: string) => {
    const equipped = liveAttachments.some((a) => a.slot === slot && a.sku === sku);
    try {
      await equipAttachment(plant.id, slot, equipped ? null : sku);
    } catch (error: any) {
      Alert.alert('Could Not Update', error?.message ?? 'Please try again.');
    }
  };

  // Restore offer (spec §1): shown while the broken streak is still inside
  // its one-period restore window.
  const restorable =
    plant.brokenAt !== null &&
    plant.brokenCount > 0 &&
    Date.now() <
      new Date(plant.brokenAt).getTime() + plant.cadenceDays * 86_400_000;

  // Days of hydration left before empty at this plant's own cadence decay —
  // a display approximation, not the DB decay math
  const daysUntilWater = Math.max(
    0,
    Math.ceil((plant.hydration / 100) * plant.cadenceDays)
  );

  const tier = streakTier(plant.streak);
  const streakText = streakLabel(plant);
  const atRisk = streakAtRisk(plant, gardenPaused);
  const periodUnit =
    plant.cadenceDays === 30 ? 'month' : plant.cadenceDays === 14 ? 'fortnight' : 'week';

  const stats: { icon: PixelIconName; text: string }[] = [
    ...(friend
      ? [{ icon: 'calendar' as PixelIconName, text: `Last Contact: ${friend.lastContact}` }]
      : []),
    { icon: 'water', text: `Needs Water In: ${daysUntilWater} days` },
    ...(friend
      ? [{ icon: 'phone' as PixelIconName, text: `Contact Frequency: ${friend.contactFrequency}` }]
      : []),
    ...(plant.streak > 0 && tier.nextTierAt !== null
      ? [
          {
            icon: 'star' as PixelIconName,
            text: `Next tier at ${periodUnit} ${tier.nextTierAt}`,
          },
        ]
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
            {streakText && (
              <View style={styles.streakRow}>
                <PixelIcon name="bolt" size={16} color={Colors.streakGold} />
                <Text style={styles.streakText}>{streakText}</Text>
                <Text style={styles.streakMultiplier}>×{tier.multiplier.toFixed(2).replace(/0$/, '')}</Text>
              </View>
            )}
            {plant.prestigeLevel > 0 && (
              <View style={styles.streakRow}>
                <PixelIcon name="star" size={14} color={Colors.streakGold} />
                <Text style={styles.prestigeText}>Prestige {plant.prestigeLevel}</Text>
              </View>
            )}
            {atRisk && (
              <View style={styles.atRiskBadge}>
                <Text style={styles.atRiskText}>STREAK AT RISK</Text>
              </View>
            )}
            {plant.linkId && (
              <View style={styles.linkedBadge}>
                <PixelIcon name="users" size={12} color={Colors.white} />
                <Text style={styles.linkedText}>LINKED — YOU GROW THIS TOGETHER</Text>
              </View>
            )}
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

        {/* Mint toast — what the last log earned ("+35 ×1.5") */}
        {mintResult && mintResult.pointsMinted > 0 && (
          <View style={styles.mintToast}>
            <PixelIcon name="bolt" size={16} color={Colors.streakGold} />
            <Text style={styles.mintToastText}>
              {mintResult.fullMint
                ? `+${mintResult.pointsMinted} points  (×${mintResult.multiplier})`
                : `+${mintResult.pointsMinted} points`}
              {mintResult.gemsMinted > 0 ? `  +${mintResult.gemsMinted} gems` : ''}
              {mintResult.offline ? '  (will sync)' : ''}
            </Text>
          </View>
        )}

        {/* Streak restore offer — the economy's first sink (spec §1) */}
        {restorable && onRestoreStreak && (
          <View style={styles.restoreCard}>
            <Text style={styles.restoreTitle}>
              Bring back the {plant.brokenCount}-period streak?
            </Text>
            <Text style={styles.restoreSubtext}>
              The plant is fine — only the streak lapsed. Restoring re-arms it;
              reaching out is what keeps it.
            </Text>
            <View style={styles.restoreButtons}>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => onRestoreStreak('points')}
                activeOpacity={0.8}
              >
                <Text style={styles.restoreButtonText}>
                  {restoreBasePrice(plant.brokenCount)}+ PTS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => onRestoreStreak('gems')}
                activeOpacity={0.8}
              >
                <Text style={styles.restoreButtonText}>{RESTORE_GEM_PRICE} GEMS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Invite to link (Batch 13) — solo path stays first-class; this is
            an offer, never a demand */}
        {!plant.linkId && onInvite && (
          <TouchableOpacity
            style={styles.memoriesButton}
            onPress={onInvite}
            activeOpacity={0.8}
          >
            <PixelIcon name="users" size={16} color={Colors.textBrown} />
            <Text style={styles.memoriesButtonText}>
              INVITE {plant.friendName.toUpperCase()} TO ROOTED
            </Text>
          </TouchableOpacity>
        )}

        {/* Nudges & plant actions (Batch 14) — linked plants only. Not a
            chat; ambient signals that mint nothing. */}
        {plant.linkId && (
          <View style={styles.nudgeSection}>
            <Text style={styles.nudgeHeader}>SEND A SIGN OF LIFE</Text>
            <View style={styles.nudgeRow}>
              {(['sun', 'rain', 'butterfly', 'leaf', 'ladybug'] as NudgeType[]).map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.nudgeChip}
                    onPress={() => handleSendNudge(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nudgeChipText}>{NUDGE_LABELS[type].label}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <View style={styles.nudgeRow}>
              {(['shimmer', 'shake', 'shimmy'] as NudgeType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.nudgeChip, styles.actionChip]}
                  onPress={() => handleSendNudge(type)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nudgeChipText}>{NUDGE_LABELS[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nudgeChip, styles.actionChip]}
              onPress={handleSendSong}
              activeOpacity={0.8}
            >
              <Text style={styles.nudgeChipText}>SEND A SONG</Text>
            </TouchableOpacity>
            <View style={styles.hapticRow}>
              <Text style={styles.hapticLabel}>THEIR BUZZ:</Text>
              {HAPTIC_SIGNATURES.map((sig) => (
                <TouchableOpacity
                  key={sig}
                  style={[
                    styles.nudgeChip,
                    (friend?.hapticSignature ?? 'pulse') === sig && styles.actionChip,
                  ]}
                  onPress={() => handleSetHaptic(sig)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nudgeChipText}>{sig.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Memory wall entry (Batch 11) — a layer below the hero, never form-first */}
        {onOpenMemories && (
          <TouchableOpacity
            style={styles.memoriesButton}
            onPress={onOpenMemories}
            activeOpacity={0.8}
          >
            <PixelIcon name="camera" size={16} color={Colors.textBrown} />
            <Text style={styles.memoriesButtonText}>MEMORIES & JOURNAL</Text>
            <PixelIcon name="angle-right" size={14} color={Colors.textBrownMuted} />
          </TouchableOpacity>
        )}

        {/* Customize (Batch 10): equip owned cosmetics per slot */}
        {ownedBySlot.size > 0 && (
          <View style={styles.customizeSection}>
            <TouchableOpacity
              style={styles.customizeToggle}
              onPress={() => setCustomizing((c) => !c)}
              activeOpacity={0.8}
            >
              <PixelIcon name="paint-brush" size={16} color={Colors.textBrown} />
              <Text style={styles.customizeToggleText}>
                {customizing ? 'DONE CUSTOMIZING' : 'CUSTOMIZE'}
              </Text>
            </TouchableOpacity>
            {customizing &&
              [...ownedBySlot.entries()].map(([slot, items]) => (
                <View key={slot} style={styles.customizeRow}>
                  <Text style={styles.customizeSlotLabel}>{slot.toUpperCase()}</Text>
                  <View style={styles.customizeChips}>
                    {items.map((item) => {
                      const equipped = liveAttachments.some(
                        (a) => a.slot === slot && a.sku === item.sku
                      );
                      return (
                        <TouchableOpacity
                          key={item.sku}
                          style={[
                            styles.customizeChip,
                            equipped && styles.customizeChipActive,
                          ]}
                          onPress={() => handleEquipToggle(slot, item.sku)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.customizeChipText,
                              equipped && styles.customizeChipTextActive,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Downgrade soft-lock (Batch 17): view-only, never deleted */}
        {lockedPlantIds.includes(plant.id) && (
          <View style={styles.restoreCard}>
            <Text style={styles.restoreTitle}>Resting for now</Text>
            <Text style={styles.restoreSubtext}>
              This plant is safe and keeps everything it has — the free garden
              tends {'\u200b'}12 at a time. Garden Pass wakes it back up.
            </Text>
          </View>
        )}

        {/* Typed log actions — the watering write path */}
        {!lockedPlantIds.includes(plant.id) && (
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
        )}
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  streakText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  streakMultiplier: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  prestigeText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  atRiskBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: Colors.notificationOrange,
    borderRadius: BorderRadius.small,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  atRiskText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  mintToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.small,
    backgroundColor: Colors.mintSurface,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingVertical: Spacing.small,
    marginBottom: Spacing.medium,
  },
  mintToastText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  restoreCard: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    padding: Spacing.medium - 4,
    marginBottom: Spacing.medium,
    gap: 4,
  },
  restoreTitle: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  restoreSubtext: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  restoreButtons: {
    flexDirection: 'row',
    gap: Spacing.small,
    marginTop: Spacing.small,
  },
  restoreButton: {
    flex: 1,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingVertical: Spacing.small,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  nudgeSection: {
    marginBottom: Spacing.medium,
    gap: Spacing.small,
  },
  nudgeHeader: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nudgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.tiny + 2,
  },
  nudgeChip: {
    borderColor: Colors.pixelBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    backgroundColor: Colors.cream,
  },
  actionChip: {
    backgroundColor: Colors.sageGreen,
  },
  nudgeChipText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  hapticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.tiny + 2,
  },
  hapticLabel: {
    fontSize: 10,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
  },
  linkedBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sageGreen,
    borderRadius: BorderRadius.small,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  linkedText: {
    fontSize: 9,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  memoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.small,
    marginBottom: Spacing.medium,
    backgroundColor: Colors.cream,
  },
  memoriesButtonText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  customizeSection: {
    marginBottom: Spacing.medium,
  },
  customizeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.small,
  },
  customizeToggleText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  customizeRow: {
    marginTop: Spacing.small,
  },
  customizeSlotLabel: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  customizeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  customizeChip: {
    borderColor: Colors.pixelBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    backgroundColor: Colors.cream,
  },
  customizeChipActive: {
    backgroundColor: Colors.sageGreen,
  },
  customizeChipText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
  },
  customizeChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
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
