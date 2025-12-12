import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Plant } from '../components/garden/PlantTile';

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
  addFriend: (name: string, plantType: Plant['plantType'], image: any) => Friend;
  updateFriendHydration: (friendId: string, hydration: number) => void;
  getFriendById: (friendId: string) => Friend | undefined;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Emoji mapping for plant types
const PLANT_EMOJIS: Record<Plant['plantType'], string> = {
  cactus: '🌵',
  sunflower: '🌻',
  fern: '🌿',
  rose: '🌹',
  succulent: '🪴',
  ivy: '🍃',
  monstera: '🌱',
  bamboo: '🎋',
};

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const addFriend = (name: string, plantType: Plant['plantType'], image: any): Friend => {
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      friendName: name,
      plantType,
      plantEmoji: PLANT_EMOJIS[plantType],
      hydration: 100,
      lastContact: 'Just now',
      image,
    };

    setFriends((prev) => [...prev, newFriend]);
    return newFriend;
  };

  const updateFriendHydration = (friendId: string, hydration: number) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, hydration } : friend
      )
    );
  };

  const getFriendById = (friendId: string): Friend | undefined => {
    return friends.find((friend) => friend.id === friendId);
  };

  return (
    <FriendsContext.Provider
      value={{ friends, addFriend, updateFriendHydration, getFriendById }}
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
