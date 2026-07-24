/**
 * Garden map registry (Batch 12, decision D4) — the ONLY place a map is
 * resolved from a theme. Nothing outside src/data should import exampleMap
 * directly anymore; consumers take the active map from GardenContext.
 *
 * All themes currently share the cozy-greenhouse geometry (10×10, same
 * beds/paths); themed terrain tiles are a pending art pass (new-terrain-tile
 * / PixelLab — terrain only). Swapping a theme's `map` here re-skins the
 * garden without touching hit-testing or placement, which are parameterized
 * by the active map.
 */

import { exampleMap, MapData } from '../exampleMap';

export type GardenThemeId = 'cozy_greenhouse' | 'moonlight' | 'cosmic' | 'underwater';

export interface GardenMapDef {
  id: GardenThemeId;
  displayName: string;
  map: MapData;
  /** Shop sku that unlocks this theme; null = free default. */
  sku: string | null;
}

export const GARDEN_MAPS: Record<GardenThemeId, GardenMapDef> = {
  cozy_greenhouse: {
    id: 'cozy_greenhouse',
    displayName: 'Cozy Greenhouse',
    map: exampleMap,
    sku: null,
  },
  moonlight: {
    id: 'moonlight',
    displayName: 'Moonlight Garden',
    map: exampleMap, // themed tiles pending art pass
    sku: 'theme-moonlight',
  },
  cosmic: {
    id: 'cosmic',
    displayName: 'Cosmic Garden',
    map: exampleMap, // themed tiles pending art pass
    sku: 'theme-cosmic',
  },
  underwater: {
    id: 'underwater',
    displayName: 'Underwater Garden',
    map: exampleMap, // themed tiles pending art pass
    sku: 'theme-underwater',
  },
};

export function mapForTheme(theme: string | null | undefined): MapData {
  return (GARDEN_MAPS as Record<string, GardenMapDef>)[theme ?? '']?.map ?? exampleMap;
}

export function isGardenTheme(value: string): value is GardenThemeId {
  return value in GARDEN_MAPS;
}
