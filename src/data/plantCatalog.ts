/**
 * Plant catalog — single source of truth for the starter plants.
 *
 * Used by both plant pickers (ChoosePlantScreen and Onboarding6ChoosePlant)
 * and by the onboarding seed in Onboarding9CreateAccount, so name, type
 * union, and asset can never drift between flows.
 *
 * Static require() only — the Metro asset pipeline cannot resolve dynamic
 * paths (same constraint as TILE_IMAGES in exampleMap.ts).
 */

import { Plant } from '../components/garden/PlantTile';

export interface StarterPlant {
  name: string;
  plantType: Plant['plantType'];
  image: any;
  description: string;
}

export const STARTER_PLANTS: StarterPlant[] = [
  {
    name: 'Cactus',
    plantType: 'cactus',
    image: require('../../assets/images/plants/pixel/cactus-128.png'),
    description: 'Desert • Low Maintenance',
  },
  {
    name: 'Sunflower',
    plantType: 'sunflower',
    image: require('../../assets/images/plants/pixel/sunflower-128.png'),
    description: 'Sunny • Cheerful',
  },
  {
    name: 'Monstera',
    plantType: 'monstera',
    image: require('../../assets/images/plants/pixel/monstera-128.png'),
    description: 'Tropical • Lush',
  },
  {
    name: 'Ficus',
    plantType: 'ficus',
    image: require('../../assets/images/plants/pixel/ficus-128.png'),
    description: 'Classic • Elegant',
  },
];

/**
 * Look up a starter plant by display name (case-insensitive).
 * Falls back to the cactus entry for unknown names.
 */
export function resolvePlantByName(name: string): StarterPlant {
  return (
    STARTER_PLANTS.find((p) => p.name.toLowerCase() === name.toLowerCase()) ??
    STARTER_PLANTS[0]
  );
}

/**
 * Look up a starter plant by its `plantType` union value. Used to re-derive
 * the image asset for rows loaded from the DB (the DB stores no image).
 * Falls back to the cactus entry for types with no sprite yet.
 */
export function resolvePlantByType(plantType: Plant['plantType']): StarterPlant {
  return STARTER_PLANTS.find((p) => p.plantType === plantType) ?? STARTER_PLANTS[0];
}
