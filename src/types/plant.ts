/**
 * Plant types and interfaces for the garden system
 */

import { GridPosition } from '../utils/gardenGrid';

export interface Plant {
  id: string;
  type: PlantType;
  position: GridPosition;
  plantedAt: Date;
  growthStage: GrowthStage;
  friendName?: string; // Name of the friend associated with this plant
  image: any; // Image source for the plant
}

export enum PlantType {
  TOMATO = 'tomato',
  CARROT = 'carrot',
  LETTUCE = 'lettuce',
  // Add more plant types as needed
}

export enum GrowthStage {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROWING = 'growing',
  MATURE = 'mature',
  HARVESTABLE = 'harvestable',
}

export interface PlantData {
  type: PlantType;
  name: string;
  growthTime: number; // in seconds
  image: any; // require() image source
}
