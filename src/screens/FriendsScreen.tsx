import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { Colors } from '../constants/theme';
import { useFriends, Friend } from '../contexts/FriendsContext';

type Props = MainTabScreenProps<'Friends'> & {
  onMenuPress?: () => void;
};

export default function FriendsScreen({ navigation, onMenuPress }: Props) {
  const { friends } = useFriends();

  // Separate friends into categories based on hydration
  const needsAttention = friends.filter((friend) => friend.hydration < 60);
  const healthyFriends = friends.filter((friend) => friend.hydration >= 60);

  const totalFriends = friends.length;
  const maxFriends = 20;

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    }
  };

  const handleAddFriend = () => {
    navigation.navigate('AddFriend');
  };

  const handleFriendPress = (friend: Friend) => {
    // TODO: Open Plant Info Panel
    console.log('View friend:', friend.friendName);
  };

  const handleCall = (friend: Friend) => {
    console.log('Call:', friend.friendName);
  };

  const handleText = (friend: Friend) => {
    console.log('Text:', friend.friendName);
  };

  const getHydrationColor = (hydration: number) => {
    if (hydration >= 60) return '#4CAF50'; // Green
    if (hydration >= 20) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const renderFriendCard = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={styles.friendCard}
      onPress={() => handleFriendPress(friend)}
      activeOpacity={0.8}
    >
      {/* Plant Emoji */}
      <Text style={styles.plantEmoji}>{friend.plantEmoji}</Text>

      {/* Friend Info */}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.friendName}</Text>

        {/* Hydration Bar */}
        <View style={styles.hydrationBarBg}>
          <View
            style={[
              styles.hydrationBarFill,
              {
                width: `${friend.hydration}%`,
                backgroundColor: getHydrationColor(friend.hydration),
              },
            ]}
          />
        </View>

        {/* Hydration Stats */}
        <Text style={styles.stats}>
          {friend.hydration}% • {friend.lastContact}
        </Text>
      </View>

      {/* Action Icons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleCall(friend);
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleText(friend);
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>💬</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Friends ({totalFriends}/{maxFriends})
          </Text>

          <TouchableOpacity onPress={handleAddFriend} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Needs Attention Section */}
          {needsAttention.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.sectionHeaderText}>
                  NEEDS ATTENTION ({needsAttention.length})
                </Text>
              </View>

              {needsAttention.map(renderFriendCard)}
            </View>
          )}

          {/* Healthy Section */}
          {healthyFriends.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.healthyIcon}>✅</Text>
                <Text style={styles.sectionHeaderTextGreen}>
                  HEALTHY ({healthyFriends.length})
                </Text>
              </View>

              {/* Collapsed view showing first 2 names + count */}
              <View style={styles.healthyCard}>
                {healthyFriends.length === 1 ? (
                  <Text style={styles.healthyList}>
                    {healthyFriends[0].plantEmoji} {healthyFriends[0].friendName}
                  </Text>
                ) : healthyFriends.length === 2 ? (
                  <Text style={styles.healthyList}>
                    {healthyFriends[0].plantEmoji} {healthyFriends[0].friendName} • {' '}
                    {healthyFriends[1].plantEmoji} {healthyFriends[1].friendName}
                  </Text>
                ) : (
                  <Text style={styles.healthyList}>
                    {healthyFriends[0].plantEmoji} {healthyFriends[0].friendName} • {' '}
                    {healthyFriends[1].plantEmoji} {healthyFriends[1].friendName} • ... ({healthyFriends.length - 2} more)
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Empty state */}
          {friends.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No friends yet!</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button above to add your first friend
              </Text>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#6B4423',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#6B4423',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 32,
    color: '#6B4423',
    fontWeight: '300',
  },
  divider: {
    height: 3,
    backgroundColor: '#8B6F47',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  warningIcon: {
    fontSize: 20,
  },
  healthyIcon: {
    fontSize: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#D32F2F',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHeaderTextGreen: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#4CAF50',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
    marginBottom: 10,
    gap: 6,
  },
  plantEmoji: {
    fontSize: 19,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    color: '#6B4423',
  },
  hydrationBarBg: {
    height: 12,
    backgroundColor: '#DEB887',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8B6F47',
    overflow: 'hidden',
  },
  hydrationBarFill: {
    height: '100%',
  },
  stats: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
  },
  actions: {
    flexDirection: 'column',
    gap: 4,
  },
  actionButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 12,
  },
  healthyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8B6F47',
  },
  healthyList: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: '#8B6F47',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#A0826D',
    textAlign: 'center',
  },
});
