/**
 * Home-screen widget sync — writes a garden snapshot into the App Group
 * (group.com.rooted.app) and reloads the WidgetKit timelines. The widget
 * (targets/widget/index.swift) decays hydration forward from `syncedAt`
 * with the same formula as effectiveHydration in garden.ts.
 *
 * iOS-only; harmless no-op elsewhere or when the native module is absent
 * (e.g. a dev build that predates the widget target).
 */

import { Platform } from 'react-native';
import { Plant } from '../types/garden';
import { Friend } from '../contexts/FriendsContext';

const APP_GROUP = 'group.com.rooted.app';

// Mirrors the DB's calculate_decay_rate() / decayRateForFrequency in garden.ts,
// keyed by the client display label.
const DECAY_BY_FREQUENCY: Record<string, number> = {
  Weekly: 100 / 7,
  'Bi-weekly': 100 / 14,
  Monthly: 100 / 30,
};

export function syncWidgetSnapshot(
  plants: Plant[],
  friends: Friend[],
  isPaused: boolean
): void {
  if (Platform.OS !== 'ios') return;
  try {
    // Lazy require: the module throws where the native side isn't built yet.
    const { ExtensionStorage } = require('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
    const friendById = new Map(friends.map((f) => [f.id, f]));

    storage.set(
      'garden',
      plants.map((plant) => {
        const friend = friendById.get(plant.id);
        return {
          id: plant.id,
          name: plant.friendName,
          plantType: plant.plantType,
          hydration: plant.hydration,
          decayRatePerDay:
            DECAY_BY_FREQUENCY[friend?.contactFrequency ?? 'Weekly'] ?? 100 / 7,
          lastContactAt: friend?.lastContactAt ?? '',
          frequency: friend?.contactFrequency ?? 'Weekly',
        };
      })
    );
    storage.set('syncedAt', new Date().toISOString());
    storage.set('isPaused', isPaused ? 1 : 0);
    ExtensionStorage.reloadWidget();
  } catch (e) {
    // Native module unavailable (old build / Expo Go) — skip, but say so in
    // dev: a silent skip here once masked a missing-pod build issue.
    if (__DEV__) console.warn('[WIDGET] snapshot sync skipped:', e);
  }
}
