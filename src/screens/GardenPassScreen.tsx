/**
 * Garden Pass paywall (Batch 17, spec §7 — the only real money).
 * Soft walls, warm copy, zero guilt (§8). Cash never touches care,
 * currency, or recovery: the Pass sells capacity and keepsakes only.
 * Config-gated on the RevenueCat key — without it this screen still
 * renders (benefits + "not available yet") so nothing dead-ends.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useGarden } from '../contexts/GardenContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenHeader, PixelCard, PixelIcon, PixelIconName } from '../components';
import {
  PASS_PRICES,
  PassOffering,
  fetchPassOffering,
  purchasePassPackage,
  restorePassPurchases,
  passAvailable,
} from '../lib/purchases';

type Props = MainStackScreenProps<'GardenPass'>;

const BENEFITS: { icon: PixelIconName; title: string; body: string }[] = [
  { icon: 'seedlings', title: 'A bigger garden', body: 'Unlimited plants (12 on the free plan — never fewer).' },
  { icon: 'camera', title: 'Every photo, kept', body: 'Unlimited memory-wall photos per plant.' },
  { icon: 'clock', title: 'More capsules', body: 'Five buried time capsules per plant instead of one.' },
  { icon: 'star', title: 'Rare species', body: 'Pass-only plant varieties as they arrive.' },
  { icon: 'calendar', title: 'Deep Almanac', body: 'Your full history in the yearly Almanac.' },
];

export default function GardenPassScreen({ navigation }: Props) {
  const { isPremium } = useGarden();
  const { user } = useAuth();
  const [offering, setOffering] = useState<PassOffering | null>(null);
  const [working, setWorking] = useState(false);
  const available = passAvailable();

  useEffect(() => {
    if (available) fetchPassOffering().then(setOffering);
  }, [available]);

  const handleBuy = async (pkg: unknown | null, label: string) => {
    if (!pkg) {
      Alert.alert('Almost Ready', 'The Garden Pass storefront is not configured yet.');
      return;
    }
    setWorking(true);
    try {
      const bought = await purchasePassPackage(pkg);
      if (bought) {
        Alert.alert('Welcome In', 'The garden just got bigger. It may take a moment to reflect.');
      }
    } catch (error: any) {
      Alert.alert('Purchase Problem', error?.message ?? `Could not start the ${label} purchase.`);
    } finally {
      setWorking(false);
    }
  };

  const handleRestore = async () => {
    setWorking(true);
    try {
      const restored = await restorePassPurchases();
      Alert.alert(
        restored ? 'Restored' : 'Nothing To Restore',
        restored
          ? 'Your Pass is back. It may take a moment to reflect.'
          : 'No previous Garden Pass purchase was found for this account.'
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title="Garden Pass" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lead}>
            {isPremium
              ? 'You have the Pass — thank you for helping the garden grow.'
              : 'Everything that matters is free forever. The Pass just makes the garden roomier.'}
          </Text>

          <PixelCard>
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.title}>
                {index > 0 && <View style={styles.rowDivider} />}
                <View style={styles.benefitRow}>
                  <PixelIcon name={benefit.icon} size={20} color={Colors.forestGreen} />
                  <View style={styles.benefitInfo}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitBody}>{benefit.body}</Text>
                  </View>
                </View>
              </View>
            ))}
          </PixelCard>

          {!isPremium && (
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => handleBuy(offering?.monthlyPackage ?? null, 'monthly')}
                disabled={working}
                activeOpacity={0.8}
              >
                <Text style={styles.buyText}>MONTHLY · {PASS_PRICES.monthly}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buyButton, styles.yearlyButton]}
                onPress={() => handleBuy(offering?.yearlyPackage ?? null, 'yearly')}
                disabled={working}
                activeOpacity={0.8}
              >
                <Text style={styles.buyText}>YEARLY · {PASS_PRICES.yearly}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestore} disabled={working} activeOpacity={0.7}>
                <Text style={styles.restoreText}>Restore purchases</Text>
              </TouchableOpacity>
              {!available && (
                <Text style={styles.unavailableText}>
                  Purchases aren't available in this build yet.
                </Text>
              )}
            </View>
          )}

          <Text style={styles.guardrail}>
            The Pass never touches care: no paid streaks, no paid points or
            gems, nothing to recover with money. If your garden is rich, it's
            because your friendships are.
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
  lead: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    lineHeight: 22,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.small + 2,
    padding: Spacing.medium - 4,
  },
  benefitInfo: { flex: 1 },
  benefitTitle: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  benefitBody: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.dividerTan,
    marginHorizontal: Spacing.medium - 4,
  },
  buttons: { gap: Spacing.small, alignItems: 'stretch' },
  buyButton: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    paddingVertical: Spacing.medium - 4,
    alignItems: 'center',
  },
  yearlyButton: { backgroundColor: Colors.sageGreen },
  buyText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restoreText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: Spacing.small,
  },
  unavailableText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
  },
  guardrail: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.medium,
  },
});
