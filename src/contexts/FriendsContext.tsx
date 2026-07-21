import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Plant, PLANT_EMOJIS } from '../components/garden/PlantTile';

export interface Friend {
  id: string;
  friendName: string;
  plantType: Plant['plantType'];
  plantEmoji: string;
  hydration: number;
  lastContact: string;
  image?: any; // Plant image asset
}

interface FriendsContextType {
  friends: Friend[];
  /** Replace the whole list — used by the auth-scoped garden load/clear. */
  setAllFriends: (friends: Friend[]) => void;
  /** Append one friend already persisted to the DB (client-shaped). */
  appendFriend: (friend: Friend) => void;
  updateFriendHydration: (friendId: string, hydration: number) => void;
  getFriendById: (friendId: string) => Friend | undefined;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const setAllFriends = useCallback((next: Friend[]) => {
    setFriends(next);
  }, []);

  const appendFriend = useCallback((friend: Friend) => {
    setFriends((prev) => [...prev.filter((f) => f.id !== friend.id), friend]);
  }, []);

  const updateFriendHydration = useCallback((friendId: string, hydration: number) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, hydration } : friend
      )
    );
  }, []);

  const getFriendById = useCallback(
    (friendId: string): Friend | undefined =>
      friends.find((friend) => friend.id === friendId),
    [friends]
  );

  return (
    <FriendsContext.Provider
      value={{ friends, setAllFriends, appendFriend, updateFriendHydration, getFriendById }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
