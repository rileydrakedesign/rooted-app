/**
 * Almanac (Batch 18, spec §7) — the year in your garden: connection totals,
 * best streaks, the collection, and a shareable recap card (same ViewShot
 * pipeline as the garden share). History depth is Pass-gated: free sees
 * the current year; the Pass unlocks every year you've been here.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { useGarden } from '../contexts/GardenContext';
import { ScreenHeader, PixelCard, PixelIcon } from '../components';
import {
  AlmanacSummary,
  ArtifactRow,
  ArtifactTemplateRow,
  computeAlmanac,
  syncAndFetchCollection,
} from '../lib/almanac';

type Props = MainStackScreenProps<'Almanac'>;

export default function AlmanacScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { isPremium } = useGarden();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<AlmanacSummary | null>(null);
  const [unlocked, setUnlocked] = useState<ArtifactRow[]>([]);
  const [templates, setTemplates] = useState<ArtifactTemplateRow[]>([]);
  const cardRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (!user) return;
    computeAlmanac(user.id, year, friends).then(setSummary).catch(() => {});
  }, [user, year, friends]);

  useEffect(() => {
    syncAndFetchCollection()
      .then(({ unlocked, templates }) => {
        setUnlocked(unlocked);
        setTemplates(templates);
      })
      .catch(() => {});
  }, []);

  const handleYearBack = () => {
    // History depth is the Pass's Almanac benefit (server data allows it;
    // this gate is presentation-level by design — the data is the user's).
    if (!isPremium) {
      Alert.alert(
        'The Deep Almanac',
        'Past years live in the Garden Pass. This year is always free.'
      );
      return;
    }
    setYear((y) => y - 1);
  };

  const handleShareRecap = async () => {
    try {
      const capture = cardRef.current?.capture;
      if (!capture) throw new Error('Recap not ready');
      const uri = await capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } catch (error: any) {
      Alert.alert('Could Not Share', error?.message ?? 'Please try again.');
    }
  };

  const unlockedTypes = new Set(unlocked.map((a) => a.artifact_type));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title="Almanac"
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity onPress={handleShareRecap} activeOpacity={0.7}>
              <PixelIcon name="camera" size={20} color={Colors.textBrown} />
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.yearRow}>
            <TouchableOpacity onPress={handleYearBack} activeOpacity={0.7}>
              <PixelIcon name="arrow-left" size={18} color={Colors.textBrown} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity
              onPress={() => setYear((y) => Math.min(currentYear, y + 1))}
              activeOpacity={0.7}
              style={styles.yearForward}
            >
              <PixelIcon name="angle-right" size={18} color={Colors.textBrown} />
            </TouchableOpacity>
          </View>

          {/* The shareable recap card */}
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.recapCard}>
              <Text style={styles.recapTitle}>ROOTED · {year}</Text>
              <Text style={styles.recapBig}>{summary?.totalConnections ?? 0}</Text>
              <Text style={styles.recapCaption}>real connections</Text>
              <View style={styles.recapStats}>
                <Text style={styles.recapStat}>
                  {summary?.byType.manual ?? 0} hangouts · {summary?.byType.call ?? 0} calls ·{' '}
                  {summary?.byType.text ?? 0} texts
                </Text>
                {summary?.mostTendedFriend && (
                  <Text style={styles.recapStat}>
                    Most tended: {summary.mostTendedFriend.name} (
                    {summary.mostTendedFriend.count})
                  </Text>
                )}
                <Text style={styles.recapStat}>
                  Best streak: {summary?.bestStreak ?? 0} periods · {summary?.photosAdded ?? 0}{' '}
                  memories kept
                </Text>
                <Text style={styles.recapStat}>
                  {summary?.pointsEarned ?? 0} points · {summary?.gemsEarned ?? 0} gems — all
                  earned
                </Text>
              </View>
              <Text style={styles.recapFooter}>a garden grown by showing up</Text>
            </View>
          </ViewShot>

          {/* Collection */}
          <Text style={styles.sectionHeader}>COLLECTION</Text>
          <PixelCard>
            {templates.map((template, index) => {
              const has = unlockedTypes.has(template.artifact_type);
              return (
                <View key={template.artifact_type}>
                  {index > 0 && <View style={styles.rowDivider} />}
                  <View style={styles.collectionRow}>
                    <PixelIcon
                      name={has ? 'check-circle' : 'lock'}
                      size={18}
                      color={has ? Colors.success : Colors.textBrownMuted}
                    />
                    <View style={styles.collectionInfo}>
                      <Text style={[styles.collectionName, !has && styles.collectionLocked]}>
                        {template.display_name}
                      </Text>
                      <Text style={styles.collectionHint}>
                        {has
                          ? template.description ?? ''
                          : template.required_streak_days != null
                          ? `Keep a streak alive ${template.required_streak_days} days`
                          : `Keep the whole garden above ${Math.round(Number(template.required_avg_hydration ?? 0))}%`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </PixelCard>
          <Text style={styles.footnote}>
            Seasonal flora joins the collection during live events — they only
            exist because you both showed up.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.warmBeige },
  container: { flex: 1, backgroundColor: Colors.warmBeige },
  content: { padding: Spacing.medium, paddingBottom: 40, gap: Spacing.medium },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.large,
  },
  yearText: {
    fontSize: FontSizes.titleSmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  yearForward: {},
  recapCard: {
    backgroundColor: Colors.forestGreen,
    borderRadius: BorderRadius.large,
    borderColor: Colors.pixelBorder,
    borderWidth: 3,
    padding: Spacing.large,
    alignItems: 'center',
    gap: 4,
  },
  recapTitle: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.pixel,
    color: Colors.wheat,
    letterSpacing: 2,
  },
  recapBig: {
    fontSize: 56,
    fontFamily: Fonts.heading,
    color: Colors.white,
  },
  recapCaption: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.wheat,
  },
  recapStats: { marginTop: Spacing.medium, gap: 4, alignItems: 'center' },
  recapStat: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    textAlign: 'center',
  },
  recapFooter: {
    marginTop: Spacing.medium,
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.wheat,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small + 2,
    padding: Spacing.medium - 4,
  },
  collectionInfo: { flex: 1 },
  collectionName: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  collectionLocked: { color: Colors.textBrownMuted },
  collectionHint: {
    fontSize: 12,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.dividerTan,
    marginHorizontal: Spacing.medium - 4,
  },
  footnote: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.medium,
  },
});
