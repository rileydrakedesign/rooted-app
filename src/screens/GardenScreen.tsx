import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
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
import { exampleMap } from '../data/exampleMap';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { GardenCameraProvider, useGardenCamera } from '../contexts/GardenCameraContext';
import { useGarden } from '../contexts/GardenContext';
import { Plant } from '../components/garden/PlantTile';

type Props = MainTabScreenProps<'Garden'> & {
  onMenuPress?: () => void;
};

function GardenContent({ navigation, onMenuPress }: Props) {
  const [notificationCount] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Get garden state
  const { plants, loading, updatePlantPosition, canPlaceAt } = useGarden();

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

  // Handler functions
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      Alert.alert('Menu', 'Drawer will open here');
    }
  };

  const handleAddFriendPress = () => {
    navigation.navigate('AddFriend');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
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

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <TopBar
            gardenName="My Garden"
            notificationCount={notificationCount}
            onMenuPress={handleMenuPress}
            onAddFriendPress={handleAddFriendPress}
            onSettingsPress={handleSettingsPress}
            onNotificationPress={handleNotificationPress}
            onSharePress={handleSharePress}
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
              map={exampleMap}
              onTileSelected={handleTileSelected}
              dragState={dragState}
            />

            {/* Plant overlay layer */}
            {plants.map((plant) => (
              <DraggablePlant
                key={plant.id}
                plant={plant}
                onPositionChange={updatePlantPosition}
                onDragStateChange={setDragState}
                canPlaceAt={canPlaceAt}
                onTap={handlePlantTap}
              />
            ))}

            {/* Static front wall — above plants, below an actively dragged plant */}
            <WallOverlay strip={FRONT_WALL} />
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
                    Your garden is empty — plant your first friend 🌱
                  </Text>
                  <PixelButton title="ADD A FRIEND" onPress={handleAddFriendPress} />
                </View>
              </View>
            )}
          </ViewShot>

          {/* Plant info panel */}
          <PlantInfoPanel
            plant={selectedPlant}
            visible={selectedPlant !== null}
            onClose={handleClosePanel}
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
});
