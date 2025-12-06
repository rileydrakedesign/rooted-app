import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { FriendWithPlant } from '../types/database';

type Props = MainTabScreenProps<'Friends'>;

export default function FriendsScreen({ navigation }: Props) {
  const [friends, setFriends] = useState<FriendWithPlant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          plants (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriends(data as FriendWithPlant[]);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: FriendWithPlant }) => {
    const plant = item.plants?.[0];

    return (
      <TouchableOpacity
        style={styles.friendCard}
        onPress={() => {
          // TODO: Navigate to PlantDetail screen
          console.log('View friend:', item.name);
        }}
      >
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.plantType}>
            {item.plant_type.charAt(0).toUpperCase() + item.plant_type.slice(1)}
          </Text>
          {plant && (
            <Text style={styles.hydration}>
              💧 {Math.round(plant.current_hydration)}%
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A5D3E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // TODO: Navigate to AddFriend screen
            console.log('Add friend');
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>
            Add a friend to start growing your garden
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A5D3E',
  },
  addButton: {
    backgroundColor: '#4A5D3E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5D3E',
    marginBottom: 4,
  },
  plantType: {
    fontSize: 14,
    color: '#6B7C5E',
    marginBottom: 2,
  },
  hydration: {
    fontSize: 14,
    color: '#4A9D8E',
  },
  arrow: {
    fontSize: 20,
    color: '#D4D4C8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5D3E',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7C5E',
    textAlign: 'center',
  },
});
