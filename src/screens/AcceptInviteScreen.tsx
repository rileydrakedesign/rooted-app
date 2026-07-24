/**
 * AcceptInviteScreen (Batch 13, spec §4) — redeem a link invite. Reached by
 * the rooted://invite/<code> deep link or by typing a code (the
 * not-yet-installed fallback path — no deferred-deep-link SDK). Picks the
 * plant + cadence for the reciprocal side, then the RPC grafts the pair.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MainStackScreenProps } from '../types/navigation';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useGarden } from '../contexts/GardenContext';
import { ScreenHeader, PixelButton, PixelInput } from '../components';
import { STARTER_PLANTS } from '../data/plantCatalog';
import { ContactFrequency } from '../lib/garden';
import { Plant } from '../types/garden';

type Props = MainStackScreenProps<'AcceptInvite'>;

const FREQUENCIES: { value: ContactFrequency; label: string }[] = [
  { value: 'weekly', label: 'WEEKLY' },
  { value: 'biweekly', label: 'BI-WEEKLY' },
  { value: 'monthly', label: 'MONTHLY' },
];

export default function AcceptInviteScreen({ navigation, route }: Props) {
  const { acceptInvite } = useGarden();
  const [code, setCode] = useState(route.params?.code ?? '');
  const [plantType, setPlantType] = useState<Plant['plantType']>(
    (STARTER_PLANTS[0]?.plantType as Plant['plantType']) ?? 'fern'
  );
  const [frequency, setFrequency] = useState<ContactFrequency>('weekly');
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (!code.trim()) return;
    setAccepting(true);
    try {
      const result = await acceptInvite(code.trim(), plantType, frequency);
      Alert.alert(
        'Grafted!',
        result.inheritedStreak > 0
          ? `Your plants are linked — and the ${result.inheritedStreak}-period streak carries over. You both keep it alive now.`
          : 'Your plants are linked. Either of you can water it — you grow it together now.',
        [{ text: 'See the garden', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Could Not Link', error?.message ?? 'Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title="Join a Garden" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lead}>
            Someone planted you in their garden. Link up, and their plant of you
            becomes something you tend together.
          </Text>

          <Text style={styles.label}>INVITE CODE</Text>
          <PixelInput
            placeholder="e.g. 7F2K9B01"
            value={code}
            onChangeText={(v: string) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Text style={styles.label}>THEIR PLANT IN YOUR GARDEN</Text>
          <View style={styles.chips}>
            {STARTER_PLANTS.map((starter) => (
              <TouchableOpacity
                key={starter.plantType}
                style={[
                  styles.chip,
                  plantType === starter.plantType && styles.chipActive,
                ]}
                onPress={() => setPlantType(starter.plantType as Plant['plantType'])}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    plantType === starter.plantType && styles.chipTextActive,
                  ]}
                >
                  {starter.plantType.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>HOW OFTEN DO YOU TWO TALK?</Text>
          <View style={styles.chips}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, frequency === f.value && styles.chipActive]}
                onPress={() => setFrequency(f.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    frequency === f.value && styles.chipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonWrap}>
            <PixelButton
              title={accepting ? 'GRAFTING…' : 'LINK PLANTS'}
              onPress={handleAccept}
              disabled={accepting || !code.trim()}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.warmBeige },
  container: { flex: 1, backgroundColor: Colors.warmBeige },
  content: { padding: Spacing.medium, paddingBottom: 40, gap: Spacing.small },
  lead: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    lineHeight: 22,
    marginBottom: Spacing.medium,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.medium,
    marginBottom: Spacing.tiny,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.small,
  },
  chip: {
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.small + 2,
    paddingVertical: Spacing.tiny + 2,
    backgroundColor: Colors.cream,
  },
  chipActive: { backgroundColor: Colors.sageGreen },
  chipText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  chipTextActive: { color: Colors.white },
  buttonWrap: { marginTop: Spacing.large },
});
