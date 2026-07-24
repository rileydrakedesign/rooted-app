import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { Fonts, FontSizes } from '../../constants/fonts';
import { Colors } from '../../constants/theme';
import { PixelButton, ProgressBar } from '../../components';
import { useGarden } from '../../contexts/GardenContext';
import { useAuth } from '../../contexts/AuthContext';
import { HYDRATION_WEIGHTS } from '../../lib/garden';
import PixelIcon from '../../components/PixelIcon';

type Props = AuthStackScreenProps<'Onboarding10Complete'>;

/**
 * Final onboarding step: the first care action. The friend seeded during
 * account creation gets watered right here — the user has already done the
 * thing the app is for before they ever see the garden. ENTER GARDEN ends
 * the onboarding hold and lets RootNavigator switch to Main.
 */
export default function Onboarding10Complete({}: Props) {
  const { plants, logInteraction } = useGarden();
  const { setOnboardingActive } = useAuth();
  const [watered, setWatered] = useState(false);
  const [watering, setWatering] = useState(false);

  // The seeded first friend (signup created exactly one).
  const firstPlant = plants[0];

  const bounce = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;

  const handleWater = async () => {
    if (!firstPlant || watering) return;
    setWatering(true);
    try {
      await logInteraction(firstPlant.id, 'manual');
      setWatered(true);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(bounce, { toValue: 1.25, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rewardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(rewardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    } catch (e) {
      console.warn('[ONBOARDING] first watering failed:', e);
    } finally {
      setWatering(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with progress bar (no back button on final screen) */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <ProgressBar current={6} total={6} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {watered ? 'OFF TO A\nGREAT START!' : 'ONE LAST THING'}
        </Text>

        <View style={styles.greenhouseContainer}>
          {firstPlant ? (
            <Animated.Image
              source={firstPlant.image}
              style={[styles.plantSprite, { transform: [{ scale: bounce }] }]}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../../assets/images/Logos/RootedLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <Animated.View style={[styles.rewardBadge, { opacity: rewardOpacity }]}>
            <PixelIcon name="water" size={18} color={Colors.white} />
            <Text style={styles.rewardText}>+{HYDRATION_WEIGHTS.manual}</Text>
          </Animated.View>
          {firstPlant && (
            <Text style={styles.greenhouseText}>{firstPlant.friendName}</Text>
          )}
        </View>

        <Text style={styles.message}>
          {watered
            ? "You've already done the thing this app is for.\nWelcome to your garden!"
            : firstPlant
            ? `Give ${firstPlant.friendName}'s plant its first water — that's what staying in touch feels like here.`
            : "Your garden is ready!\nLet's start growing!"}
        </Text>
      </View>

      {!watered && firstPlant ? (
        <PixelButton
          title={watering ? 'WATERING…' : 'WATER YOUR PLANT'}
          onPress={handleWater}
          disabled={watering}
        />
      ) : (
        <PixelButton
          title="ENTER GARDEN"
          onPress={() => setOnboardingActive(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FontSizes.titleMedium,
    fontFamily: Fonts.heading,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  greenhouseContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    backgroundColor: '#DEB887',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  plantSprite: {
    width: 140,
    height: 140,
  },
  logo: {
    width: 150,
    height: 100,
  },
  rewardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.waterBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.waterBlueDark,
  },
  rewardText: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.heading,
    color: Colors.white,
  },
  greenhouseText: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#8B4513',
    fontWeight: 'bold',
    marginTop: 10,
  },
  message: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: '#6B4423',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
});
