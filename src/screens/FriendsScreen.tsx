import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';
import { Fonts, FontSizes } from '../constants/fonts';
import { useFriends, Friend } from '../contexts/FriendsContext';
import { useGarden } from '../contexts/GardenContext';
import { InteractionType } from '../lib/garden';
import {
  ScreenHeader,
  PixelCard,
  HydrationBar,
  PixelIcon,
  PlantInfoPanel,
} from '../components';

type Props = MainTabScreenProps<'Friends'>;

const MAX_FRIENDS = 20;

export default function FriendsScreen({ navigation }: Props) {
  const { friends, getFriendById } = useFriends();
  const { plants, logInteraction } = useGarden();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Derive the panel's data from live context state so hydration updates
  // (from logging) reflect immediately (Plant.id === Friend.id)
  const selectedPlant = selectedFriendId
    ? plants.find((p) => p.id === selectedFriendId) ?? null
    : null;
  const selectedFriend = selectedFriendId ? getFriendById(selectedFriendId) : null;

  const needsAttention = friends.filter((friend) => friend.hydration < 60);
  const healthyFriends = friends.filter((friend) => friend.hydration >= 60);

  const handleAddFriend = () => {
    navigation.navigate('AddFriend');
  };

  const handleLog = async (friendId: string, type: InteractionType) => {
    try {
      await logInteraction(friendId, type);
    } catch (error: any) {
      Alert.alert('Could Not Log', error?.message ?? 'Please try again.');
    }
  };

  const renderFriendCard = (friend: Friend) => (
    <PixelCard
      key={friend.id}
      style={styles.friendCard}
      onPress={() => setSelectedFriendId(friend.id)}
    >
      <View style={styles.friendCardInner}>
        <Image source={friend.image} style={styles.plantSprite} resizeMode="contain" />

        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.friendName}</Text>
          <HydrationBar hydration={friend.hydration} />
          <Text style={styles.stats}>
            {friend.hydration}% • {friend.lastContact}
          </Text>
        </View>

        {/* Quick log actions — same write path as the plant panel */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleLog(friend.id, 'call')}
            style={styles.actionButton}
          >
            <PixelIcon name="phone" size={18} color={Colors.textBrown} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleLog(friend.id, 'text')}
            style={styles.actionButton}
          >
            <PixelIcon name="comment" size={18} color={Colors.textBrown} />
          </TouchableOpacity>
        </View>
      </View>
    </PixelCard>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title={`Friends (${friends.length}/${MAX_FRIENDS})`}
          rightAction={
            <TouchableOpacity onPress={handleAddFriend} style={styles.addButton}>
              <PixelIcon name="plus" size={22} color={Colors.textBrown} />
            </TouchableOpacity>
          }
        />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {needsAttention.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <PixelIcon name="warning" size={18} color={Colors.danger} />
                <Text style={[styles.sectionHeaderText, { color: Colors.danger }]}>
                  NEEDS ATTENTION ({needsAttention.length})
                </Text>
              </View>
              {needsAttention.map(renderFriendCard)}
            </View>
          )}

          {healthyFriends.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <PixelIcon name="check-circle" size={18} color={Colors.success} />
                <Text style={[styles.sectionHeaderText, { color: Colors.success }]}>
                  HEALTHY ({healthyFriends.length})
                </Text>
              </View>
              {healthyFriends.map(renderFriendCard)}
            </View>
          )}

          {friends.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No friends yet!</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button above to add your first friend
              </Text>
            </View>
          )}
        </ScrollView>

        <PlantInfoPanel
          plant={selectedPlant}
          friend={selectedFriend}
          visible={selectedPlant !== null}
          onClose={() => setSelectedFriendId(null)}
          onLogInteraction={(type) => selectedFriendId && handleLog(selectedFriendId, type)}
        />
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
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.medium,
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium - 4,
    gap: Spacing.small,
  },
  sectionHeaderText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.subtext,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  friendCard: {
    marginBottom: Spacing.medium - 6,
  },
  friendCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.small,
    gap: Spacing.small,
  },
  plantSprite: {
    width: 36,
    height: 36,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontSize: 17,
    fontFamily: Fonts.heading,
    color: Colors.textBrown,
  },
  stats: {
    fontSize: 13,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: FontSizes.bodyLarge,
    fontFamily: Fonts.heading,
    color: Colors.pixelBorder,
    marginBottom: Spacing.small,
  },
  emptyStateSubtext: {
    fontSize: FontSizes.caption,
    fontFamily: Fonts.subtext,
    color: Colors.textBrownMuted,
    textAlign: 'center',
  },
});
