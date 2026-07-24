import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  AppState,
  Share,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MainTabScreenProps } from '../types/navigation';
import TopBar from '../components/garden/TopBar';
import TileMap, { DragState } from '../components/garden/TileMap';
import DraggablePlant from '../components/garden/DraggablePlant';
import WallOverlay from '../components/garden/WallOverlay';
import { FRONT_WALL } from '../data/walls';
import PlantInfoPanel from '../components/garden/PlantInfoPanel';
import { PixelButton } from '../components';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { GardenCameraProvider, useGardenCamera } from '../contexts/GardenCameraContext';
import { useGarden } from '../contexts/GardenContext';
import { useFriends } from '../contexts/FriendsContext';
import { InteractionType, LogResult } from '../lib/garden';
import { Plant } from '../types/garden';
import {
  HangoutSuggestion,
  scanCalendarForFriends,
  markSuggestionHandled,
} from '../lib/calendarScan';
import { pickAndUploadPhoto, setPhotoShared } from '../lib/memories';
import { useAuth } from '../contexts/AuthContext';
import PixelIcon from '../components/PixelIcon';
import DecorSprite from '../components/garden/DecorSprite';

type Props = MainTabScreenProps<'Garden'>;

function GardenContent({ navigation, route }: Props) {
  const [notificationCount] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Get garden state
  const {
    plants,
    loading,
    updatePlantPosition,
    canPlaceAt,
    logInteraction,
    gardenPaused,
    notificationPrefs,
    balances,
    restoreStreak,
    activeMap,
    decorItems,
    removeDecor,
    createInvite,
    nudgeEffects,
  } = useGarden();
  const { friends, getFriendById } = useFriends();
  const { user } = useAuth();

  // Calendar-suggested logs (Batch 8): scan on mount + foreground when the
  // pref is on; surface one confirm card at a time.
  const [suggestions, setSuggestions] = useState<HangoutSuggestion[]>([]);
  useEffect(() => {
    if (!notificationPrefs.suggested || friends.length === 0) return;
    let cancelled = false;
    const scan = () =>
      scanCalendarForFriends(friends).then((found) => {
        if (!cancelled) setSuggestions(found);
      });
    scan();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') scan();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [notificationPrefs.suggested, friends]);

  const activeSuggestion = suggestions[0] ?? null;

  const resolveSuggestion = async (suggestion: HangoutSuggestion, log: boolean) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    await markSuggestionHandled(suggestion.id);
    if (log) {
      try {
        await logInteraction(
          suggestion.friendId,
          'manual',
          suggestion.eventTitle,
          suggestion.startsAt
        );
      } catch (error: any) {
        Alert.alert('Could Not Log', error?.message ?? 'Please try again.');
      }
    }
  };

  // Measure the garden container so gesture (window) coords and the zoom
  // origin can be expressed in container-local space (see isoMath.ts contract)
  const { setContainerFrame } = useGardenCamera();
  const gardenContainerRef = useRef<View>(null);
  // ViewShot wrapper ref — its capture() resolves its own native tag, which
  // works under Paper (captureRef(ref) throws "No view found with reactTag"
  // with newArchEnabled: false)
  const viewShotRef = useRef<ViewShot>(null);

  const handleGardenLayout = useCallback(() => {
    gardenContainerRef.current?.measureInWindow((x, y, width, height) => {
      setContainerFrame({ offsetX: x, offsetY: y, width, height });
    });
  }, [setContainerFrame]);

  // Widget deep link (rooted://plant/<id>): open that plant's panel once the
  // garden has loaded, then clear the param so back/reopen behaves normally.
  const openPlantId = route.params?.openPlantId;
  React.useEffect(() => {
    if (!openPlantId || loading) return;
    const plant = plants.find((p) => p.id === openPlantId);
    if (plant) setSelectedPlant(plant);
    navigation.setParams({ openPlantId: undefined });
  }, [openPlantId, loading, plants, navigation]);

  const handleAddFriendPress = () => {
    navigation.navigate('AddFriend');
  };

  // A native view snapshot of the container composites BOTH render layers —
  // Skia tiles and the RN plant overlay. (A Skia makeImageSnapshot would
  // capture the ground and none of the plants.)
  const handleSharePress = async () => {
    try {
      const capture = viewShotRef.current?.capture;
      if (!capture) throw new Error('Garden view not ready');
      const uri = await capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (error: any) {
      Alert.alert('Could Not Share', error?.message ?? 'Please try again.');
    }
  };

  const handleNotificationPress = () => {
    // TODO: Open notification panel
    Alert.alert('Notifications', `You have ${notificationCount} notifications`);
  };

  const handleTileSelected = (i: number, j: number) => {
    console.log(`Tile selected at grid position: (${i}, ${j})`);
    // TODO: Handle tile selection (e.g., plant placement)
  };

  const handlePlantTap = (plant: Plant) => {
    setSelectedPlant(plant);
  };

  const handleClosePanel = () => {
    setSelectedPlant(null);
  };

  const [lastMint, setLastMint] = useState<LogResult | null>(null);

  const handleLogInteraction = async (type: InteractionType) => {
    if (!selectedPlant) return;
    const friendId = selectedPlant.id;
    const friendName = selectedPlant.friendName;
    // L2 call assist (Batch 18, trust ladder): tapping CALLED with a phone
    // number on file offers to dial first. Auto-watering via CXCallObserver
    // stays gated behind the CallKit device spike — manual-first ships.
    if (type === 'call') {
      const phone = getFriendById(friendId)?.phone;
      if (phone) {
        const dial = await new Promise<boolean>((resolve) =>
          Alert.alert(`Call ${friendName}?`, 'Log it either way.', [
            { text: 'Just log it', onPress: () => resolve(false) },
            {
              text: 'Call now',
              onPress: () => {
                Linking.openURL(`tel:${phone}`).catch(() => {});
                resolve(false);
              },
            },
          ])
        );
        void dial;
      }
    }
    try {
      const result = await logInteraction(friendId, type);
      setLastMint(result);
      // Hangout logs come with an optional photo prompt (spec §5) that
      // feeds the plant's memory wall. Optional, never demanded.
      if (type === 'manual' && user) {
        const linked = result.linked;
        Alert.alert(
          'Save the Moment?',
          linked
            ? `Add a photo from your time with ${friendName}? If you both add one, they meet on your shared wall.`
            : `Add a photo from your time with ${friendName} to the memory wall?`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Add photo',
              onPress: () => {
                pickAndUploadPhoto({ userId: user.id, friendId })
                  .then((row) => {
                    // Dual-photo moment (spec §4): linked hangout photos go
                    // to the shared wall by default.
                    if (row && linked) setPhotoShared(row.id, true).catch(() => {});
                  })
                  .catch((e: any) =>
                    Alert.alert('Could Not Upload', e?.message ?? 'Please try again.')
                  );
              },
            },
          ]
        );
      }
      // selectedPlant is a snapshot, not a live reference into plants —
      // refresh it or the panel's hydration/streak won't move
      setSelectedPlant((prev) =>
        prev
          ? {
              ...prev,
              hydration: result.hydration,
              windowSatisfied: true,
              streak: Math.max(prev.streak, result.streak),
            }
          : prev
      );
    } catch (error: any) {
      Alert.alert('Could Not Log', error?.message ?? 'Please try again.');
    }
  };

  // Invite a friend to link plants (Batch 13): share sheet with the deep
  // link plus a typeable code fallback for the not-yet-installed path.
  const handleInvite = async () => {
    if (!selectedPlant) return;
    try {
      const code = await createInvite(selectedPlant.id);
      await Share.share({
        message:
          `You're a ${selectedPlant.plantType} in my garden. Join me on Rooted ` +
          `and we'll grow it together: rooted://invite/${code}  (invite code: ${code})`,
      });
    } catch (error: any) {
      Alert.alert('Could Not Invite', error?.message ?? 'Please try again.');
    }
  };

  // Restore a broken streak from the plant panel (Batch 9's first sink).
  // Ends in a reconnection prompt — the restore only counts if you follow
  // through (spec §1).
  const handleRestoreStreak = async (currency: 'points' | 'gems') => {
    if (!selectedPlant) return;
    const name = selectedPlant.friendName;
    try {
      const result = await restoreStreak(selectedPlant.id, currency);
      setSelectedPlant((prev) =>
        prev
          ? {
              ...prev,
              streak: result.restoredStreak,
              windowSatisfied: false,
              brokenAt: null,
              brokenCount: 0,
            }
          : prev
      );
      Alert.alert(
        'Streak Saved',
        `${name}'s ${result.restoredStreak}-period streak is back — reach out this period to keep it going.`
      );
    } catch (error: any) {
      Alert.alert('Could Not Restore', error?.message ?? 'Please try again.');
    }
  };

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <TopBar
            gardenName="My Garden"
            notificationCount={notificationCount}
            onAddFriendPress={handleAddFriendPress}
            onNotificationPress={handleNotificationPress}
            onSharePress={handleSharePress}
            balances={balances}
            onShopPress={() => navigation.navigate('Shop')}
          />

          {/* Garden with tile map and plant overlay. ViewShot wraps the
              container so the share capture composites BOTH render layers
              (Skia tiles + RN plants); the inner View keeps the measured
              ref the camera math depends on. */}
          <ViewShot
            ref={viewShotRef}
            style={styles.captureLayer}
            options={{ format: 'png', quality: 1 }}
          >
          <View
            style={styles.gardenContainer}
            ref={gardenContainerRef}
            onLayout={handleGardenLayout}
          >
            <TileMap
              map={activeMap}
              onTileSelected={handleTileSelected}
              dragState={dragState}
            />

            {/* Plant overlay layer */}
            {plants.map((plant) => {
              const birthday = getFriendById(plant.id)?.birthday;
              const today = new Date();
              const isBirthday = birthday
                ? Number(birthday.slice(5, 7)) === today.getMonth() + 1 &&
                  Number(birthday.slice(8, 10)) === today.getDate()
                : false;
              return (
                <DraggablePlant
                  key={plant.id}
                  plant={plant}
                  onPositionChange={updatePlantPosition}
                  onDragStateChange={setDragState}
                  canPlaceAt={canPlaceAt}
                  onTap={handlePlantTap}
                  isBirthday={isBirthday}
                  nudgeEffect={nudgeEffects[plant.id] ?? null}
                />
              );
            })}

            {/* Placed decor (Batch 12) — drag to move, long-press to store */}
            {decorItems.map((item) => (
              <DecorSprite
                key={item.id}
                item={item}
                onLongPress={(decor) =>
                  Alert.alert(decor.name, 'Put this back in storage?', [
                    { text: 'Keep it here', style: 'cancel' },
                    { text: 'Store it', onPress: () => removeDecor(decor.id) },
                  ])
                }
              />
            ))}

            {/* Static front wall — above plants, below an actively dragged plant */}
            <WallOverlay strip={FRONT_WALL} />

            {/* Pause visibility (Batch 8): the frozen garden says so here,
                not just in Settings */}
            {gardenPaused && (
              <View style={styles.pausedBanner} pointerEvents="none">
                <PixelIcon name="sun" size={16} color={Colors.textBrown} />
                <Text style={styles.pausedText}>
                  Garden paused — everything is frozen until you're back
                </Text>
              </View>
            )}

            {/* Calendar-suggested log confirm card (spec §5) */}
            {activeSuggestion && (
              <View style={styles.suggestionCard}>
                <Text style={styles.suggestionTitle}>
                  Did you see {activeSuggestion.friendName}?
                </Text>
                <Text style={styles.suggestionSubtext} numberOfLines={1}>
                  {activeSuggestion.eventTitle}
                </Text>
                <View style={styles.suggestionButtons}>
                  <TouchableOpacity
                    style={styles.suggestionConfirm}
                    onPress={() => resolveSuggestion(activeSuggestion, true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestionConfirmText}>WE HUNG OUT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionDismiss}
                    onPress={() => resolveSuggestion(activeSuggestion, false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestionDismissText}>NOT THIS TIME</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

            {/* Spinner while the persisted garden loads — keeps the
                empty-state prompt from flashing before data arrives */}
            {loading && (
              <View style={styles.emptyState} pointerEvents="none">
                <ActivityIndicator size="large" color={Colors.warmWood} />
              </View>
            )}

            {/* Empty-state prompt over the ground tiles, shown only once the
                load settles with zero plants */}
            {!loading && plants.length === 0 && (
              <View style={styles.emptyState} pointerEvents="box-none">
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateText}>
                    Your garden is empty — plant your first friend
                  </Text>
                  <PixelButton title="ADD A FRIEND" onPress={handleAddFriendPress} />
                </View>
              </View>
            )}
          </ViewShot>

          {/* Plant info panel */}
          <PlantInfoPanel
            plant={selectedPlant}
            friend={selectedPlant ? getFriendById(selectedPlant.id) : null}
            visible={selectedPlant !== null}
            onClose={() => {
              setLastMint(null);
              handleClosePanel();
            }}
            onLogInteraction={handleLogInteraction}
            mintResult={lastMint}
            onRestoreStreak={handleRestoreStreak}
            onInvite={handleInvite}
            onOpenMemories={() => {
              if (!selectedPlant) return;
              const friendId = selectedPlant.id;
              setLastMint(null);
              setSelectedPlant(null);
              navigation.navigate('MemoryWall', { friendId });
            }}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function GardenScreen(props: Props) {
  return (
    <GardenCameraProvider>
      <GardenContent {...props} />
    </GardenCameraProvider>
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
  gardenContainer: {
    flex: 1,
    position: 'relative', // Allow absolute positioning of plant overlays
  },
  captureLayer: {
    flex: 1,
    // Fills the shared PNG's background — without it the capture is
    // transparent outside the map (reads as black in most viewers)
    backgroundColor: Colors.warmBeige,
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
    // Above WallOverlay (500) and the dragged-plant ceiling (1000) — with no
    // plants there is nothing this prompt should ever sit under.
    zIndex: 1500,
  },
  emptyStateCard: {
    alignItems: 'center',
    backgroundColor: Colors.warmBeige,
    borderRadius: BorderRadius.large,
    borderWidth: 3,
    borderColor: Colors.buttonPrimaryDark,
    padding: Spacing.large,
    gap: Spacing.medium,
  },
  emptyStateText: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.subtext,
    color: Colors.warmWood,
    textAlign: 'center',
  },
  pausedBanner: {
    position: 'absolute',
    top: Spacing.small,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
    backgroundColor: Colors.cream,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium - 4,
    paddingVertical: Spacing.small,
    zIndex: 1200,
  },
  pausedText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
  suggestionCard: {
    position: 'absolute',
    top: Spacing.small,
    left: Spacing.medium,
    right: Spacing.medium,
    backgroundColor: Colors.cream,
    borderColor: Colors.pixelBorder,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    gap: 4,
    zIndex: 1300,
  },
  suggestionTitle: {
    fontSize: FontSizes.bodyMedium,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  suggestionSubtext: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  suggestionButtons: {
    flexDirection: 'row',
    gap: Spacing.small,
    marginTop: Spacing.small,
  },
  suggestionConfirm: {
    flex: 1,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingVertical: Spacing.small + 2,
    alignItems: 'center',
  },
  suggestionConfirmText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.white,
    fontWeight: '700',
  },
  suggestionDismiss: {
    flex: 1,
    backgroundColor: Colors.transparent,
    borderRadius: BorderRadius.medium,
    borderColor: Colors.pixelBorder,
    borderWidth: 2,
    paddingVertical: Spacing.small + 2,
    alignItems: 'center',
  },
  suggestionDismissText: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrown,
    fontWeight: '700',
  },
});
