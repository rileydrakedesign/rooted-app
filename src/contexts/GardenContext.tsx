import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Plant } from '../components/garden/PlantTile';
import { getAllPositions } from '../utils/isoMath';
import { useFriends } from './FriendsContext';

interface GardenContextType {
  plants: Plant[];
  addPlant: (friendName: string, plantType: Plant['plantType'], image: any) => void;
  updatePlantPosition: (plantId: string, newPosition: { x: number; y: number }) => void;
  isPositionOccupied: (position: { x: number; y: number }) => boolean;
  selectedPlant: Plant | null;
  setSelectedPlant: (plant: Plant | null) => void;
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

function GardenProviderInner({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const { addFriend } = useFriends();

  const addPlant = (friendName: string, plantType: Plant['plantType'], image: any) => {
    // Find first available position
    const allPositions = getAllPositions();
    const occupiedPositions = new Set(
      plants.map((p) => `${p.position.x},${p.position.y}`)
    );

    // Filter out front row (y=9 for 10x10 grid) and find first available position
    const availablePosition = allPositions.find(
      (pos) => pos.y < 9 && !occupiedPositions.has(`${pos.x},${pos.y}`)
    );

    if (!availablePosition) {
      // No available positions
      console.warn('No available positions in garden');
      return;
    }

    // Add friend to friends list
    const friend = addFriend(friendName, plantType, image);

    const newPlant: Plant = {
      id: friend.id, // Use friend ID to link them
      friendName,
      plantType,
      stage: 1,
      hydration: 100,
      position: availablePosition,
      image,
    };

    setPlants((prev) => [...prev, newPlant]);
  };

  const updatePlantPosition = (plantId: string, newPosition: { x: number; y: number }) => {
    setPlants((prev) =>
      prev.map((plant) =>
        plant.id === plantId ? { ...plant, position: newPosition } : plant
      )
    );
  };

  const isPositionOccupied = (position: { x: number; y: number }): boolean => {
    return plants.some(
      (plant) => plant.position.x === position.x && plant.position.y === position.y
    );
  };

  return (
    <GardenContext.Provider
      value={{ plants, addPlant, updatePlantPosition, isPositionOccupied, selectedPlant, setSelectedPlant }}
    >
      {children}
    </GardenContext.Provider>
  );
}

// Wrapper that doesn't need useFriends
export function GardenProvider({ children }: { children: ReactNode }) {
  return <GardenProviderInner>{children}</GardenProviderInner>;
}

export function useGarden() {
  const context = useContext(GardenContext);
  if (context === undefined) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
}
