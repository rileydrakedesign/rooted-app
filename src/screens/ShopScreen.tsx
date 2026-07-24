/**
 * Shop v1 (Batch 10, spec §3 Self scope) — the first place points go.
 * Catalog is DB-driven (`shop_items`); purchases run through the atomic
 * `purchase_item` RPC. Cosmetics equip from the plant panel's customize
 * sheet, not here.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useGarden } from '../contexts/GardenContext';
import { ScreenHeader, PixelCard, PixelIcon } from '../components';
import { ShopItem } from '../lib/shop';

type Props = MainStackScreenProps<'Shop'>;

const CATEGORY_LABELS: Record<string, string> = {
  pot: 'POTS',
  nameplate: 'NAMEPLATES',
  accessory: 'ACCESSORIES',
  bloom: 'BLOOMS',
  garden_theme: 'GARDEN THEMES',
  decor: 'DECOR',
};

export default function ShopScreen({ navigation }: Props) {
  const {
    shopCatalog,
    ownedSkus,
    balances,
    purchaseItem,
    placeDecor,
    decorItems,
    plants,
  } = useGarden();
  const linkedPlants = plants.filter((p) => p.linkId !== null);
  const [buying, setBuying] = useState<string | null>(null);

  const handlePlaceDecor = async (item: ShopItem) => {
    try {
      const placed = await placeDecor(item.sku, item.display_name);
      Alert.alert(
        placed ? 'Placed' : 'No Room',
        placed
          ? `${item.display_name} is in your garden — drag it wherever feels right.`
          : 'No free tile right now — move something first.'
      );
    } catch (error: any) {
      Alert.alert('Could Not Place', error?.message ?? 'Please try again.');
    }
  };

  const byCategory = useMemo(() => {
    const groups = new Map<string, ShopItem[]>();
    for (const item of shopCatalog) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return groups;
  }, [shopCatalog]);

  const runPurchase = async (
    item: ShopItem,
    scope: 'self' | 'gift' | 'shared',
    linkId?: string
  ) => {
    setBuying(item.sku);
    try {
      await purchaseItem(item.sku, undefined, scope, linkId);
      if (scope === 'gift') {
        Alert.alert('Gifted', 'It just appeared on their side, tagged from you.');
      } else if (scope === 'shared') {
        Alert.alert('Matching Set', 'One half each — it renders the same on both sides.');
      }
    } catch (error: any) {
      Alert.alert('Could Not Buy', error?.message ?? 'Please try again.');
    } finally {
      setBuying(null);
    }
  };

  const handleBuy = (item: ShopItem) => {
    const priceLabel =
      item.price_points != null
        ? `${item.price_points} points`
        : item.price_gems != null
        ? `${item.price_gems} gems`
        : null;
    if (!priceLabel) return;

    // Scope selector (Batch 15): giftable/matching items offer the linked
    // options; buyer always pays full price, both sides receive.
    const giftable = item.scope !== 'self' && linkedPlants.length > 0;
    const firstLink = linkedPlants[0];
    const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'For me', onPress: () => runPurchase(item, 'self') },
    ];
    if (giftable && firstLink?.linkId) {
      buttons.push({
        text: `Gift to ${firstLink.friendName}`,
        onPress: () => runPurchase(item, 'gift', firstLink.linkId ?? undefined),
      });
      if (item.scope === 'shared') {
        buttons.push({
          text: `Matching set with ${firstLink.friendName}`,
          onPress: () => runPurchase(item, 'shared', firstLink.linkId ?? undefined),
        });
      }
    }
    Alert.alert(item.display_name, `${priceLabel}. ${item.description ?? ''}`, buttons);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title="Shop" onBack={() => navigation.goBack()} />
        <View style={styles.balanceRow}>
          <View style={styles.balanceChip}>
            <PixelIcon name="bolt" size={14} color={Colors.streakGold} />
            <Text style={styles.balanceText}>{balances.points} PTS</Text>
          </View>
          <View style={styles.balanceChip}>
            <PixelIcon name="star" size={14} color={Colors.forestGreen} />
            <Text style={styles.balanceText}>{balances.gems} GEMS</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {[...byCategory.entries()].map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionHeader}>
                {CATEGORY_LABELS[category] ?? category.toUpperCase()}
              </Text>
              <PixelCard>
                {items.map((item, index) => {
                  const owned = ownedSkus.includes(item.sku);
                  const purchasable = item.price_points != null || item.price_gems != null;
                  return (
                    <View key={item.sku}>
                      {index > 0 && <View style={styles.rowDivider} />}
                      <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.display_name}</Text>
                          {item.description != null && (
                            <Text style={styles.itemDescription}>{item.description}</Text>
                          )}
                        </View>
                        {owned && item.category === 'decor' ? (
                          <TouchableOpacity
                            style={styles.buyButton}
                            onPress={() => handlePlaceDecor(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.buyText}>
                              {decorItems.some((d) => d.sku === item.sku)
                                ? 'PLACE ANOTHER'
                                : 'PLACE'}
                            </Text>
                          </TouchableOpacity>
                        ) : owned ? (
                          <View style={styles.ownedBadge}>
                            <Text style={styles.ownedText}>
                              {item.category === 'garden_theme' ? 'OWNED · SETTINGS' : 'OWNED'}
                            </Text>
                          </View>
                        ) : purchasable ? (
                          <TouchableOpacity
                            style={styles.buyButton}
                            onPress={() => handleBuy(item)}
                            disabled={buying === item.sku}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.buyText}>
                              {buying === item.sku
                                ? '…'
                                : item.price_points != null
                                ? `${item.price_points} PTS`
                                : `${item.price_gems} GEMS`}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.earnedBadge}>
                            <Text style={styles.earnedText}>EARNED ONLY</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </PixelCard>
            </View>
          ))}
          <Text style={styles.footerNote}>
            Everything here is earned by staying in touch. Equip your cosmetics
            from any plant's panel.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.warmBeige,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: Spacing.small,
    paddingHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
  },
  balanceText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.medium,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.medium + 4,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.small,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium - 4,
    gap: Spacing.small,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  itemDescription: {
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
  buyButton: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingHorizontal: Spacing.medium - 4,
    paddingVertical: Spacing.small,
  },
  buyText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  ownedBadge: {
    backgroundColor: Colors.mintSurface,
    borderRadius: BorderRadius.small,
    borderColor: Colors.pixelBorder,
    borderWidth: 1,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
  },
  ownedText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.forestGreen,
    fontWeight: '700',
  },
  earnedBadge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
  },
  earnedText: {
    fontSize: 11,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
    marginTop: Spacing.small,
    paddingHorizontal: Spacing.large,
  },
});
