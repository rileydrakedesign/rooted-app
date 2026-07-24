/**
 * Local notification engine (Batch 8, decision D2: local-first).
 *
 * Everything is deterministic at schedule time — decay and streak windows
 * are pure functions of the loaded garden — so on every app foreground /
 * log / pause toggle / friend change the engine CANCELS ALL scheduled
 * notifications, recomputes, and reschedules. That structurally satisfies
 * the spec's hard rules: never fire about someone you already contacted
 * (logging reschedules), frequency caps, one morning digest.
 *
 * Copy rule (spec §8): plant-voiced and warm. No guilt, no countdowns, no
 * "bad friend" framing — ever.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Plant } from '../types/garden';
import { Friend } from '../contexts/FriendsContext';
import { WILT_THRESHOLD, windowDeadline } from './garden';
import { supabase } from './supabase';

const MS_PER_DAY = 86_400_000;

/** Cap per-plant alerts so we stay far under iOS's 64-notification limit. */
const MAX_PLANT_ALERTS = 12;

export const NOTIFICATION_CATEGORY_CARE = 'plant-care';

export interface NotificationPrefs {
  digest: boolean;
  digestHour: number; // local hour 0-23
  atRisk: boolean;
  wilt: boolean;
  suggested: boolean;
  birthdays: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  digest: true,
  digestHour: 9,
  atRisk: true,
  wilt: true,
  suggested: true,
  birthdays: true,
};

/** Foreground presentation: banner, no sound spam. */
export function configureNotificationHandling(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Register the care category once at app start: the at-risk/wilt alerts
 * carry "I already did" (logs from the notification, app stays closed) and
 * Call/Text (deep-link into the dialer/messages via the response handler).
 */
export async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_CARE, [
      {
        identifier: 'already-did',
        buttonTitle: 'Already did',
        options: { opensAppToForeground: false },
      },
      { identifier: 'call-now', buttonTitle: 'Call', options: { opensAppToForeground: true } },
      { identifier: 'text-now', buttonTitle: 'Text', options: { opensAppToForeground: true } },
    ]);
  } catch (e) {
    console.warn('[NOTIFY] category registration failed:', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Days until hydration reaches the wilt threshold (Infinity if already wilted-proof). */
function daysUntilWilt(plant: Plant, decayPerDay: number): number {
  if (decayPerDay <= 0) return Infinity;
  return (plant.hydration - WILT_THRESHOLD) / decayPerDay;
}

const DECAY_BY_CADENCE: Record<number, number> = {
  7: 100 / 7,
  14: 100 / 14,
  30: 100 / 30,
};

/** Plant-voiced, warm, zero guilt (§8 gate — every string reviewed). */
function wiltMessage(plant: Plant): string {
  return `${plant.friendName}'s ${plant.plantType} is getting thirsty — a hello would perk it right up.`;
}

function atRiskMessage(plant: Plant): string {
  const unit =
    plant.cadenceDays === 30 ? 'month' : plant.cadenceDays === 14 ? 'fortnight' : 'week';
  return `${plant.friendName}'s ${plant.plantType} is on a ${plant.streak}-${unit} roll — one hello keeps it going.`;
}

function digestMessage(plants: Plant[]): string | null {
  const thirsty = [...plants]
    .filter((p) => p.hydration <= 60)
    .sort((a, b) => a.hydration - b.hydration);
  if (thirsty.length === 0) return null;
  const names = thirsty.slice(0, 3).map((p) => p.friendName);
  if (names.length === 1) return `${names[0]}'s plant misses the sun today.`;
  const last = names.pop();
  return `${names.join(', ')} and ${last} could all use a little sunshine today.`;
}

/**
 * The engine: cancel everything, then reschedule from current state.
 * Paused garden = no plant alerts at all (clocks are stopped); the digest
 * also goes quiet since nothing decays.
 */
export async function rescheduleAllNotifications(
  plants: Plant[],
  friends: Friend[],
  isPaused: boolean,
  prefs: NotificationPrefs,
  userId?: string
): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) return;
    if (plants.length === 0) return;

    const friendById = new Map(friends.map((f) => [f.id, f]));
    const now = Date.now();
    let scheduled = 0;

    if (!isPaused) {
      // Per-plant alerts, soonest-first so the cap keeps the most urgent.
      const candidates: { at: number; plant: Plant; kind: 'atRisk' | 'wilt' }[] = [];
      for (const plant of plants) {
        if (prefs.atRisk && plant.streak > 0 && !plant.windowSatisfied) {
          const deadline = windowDeadline(plant).getTime();
          const threshold = Math.max(plant.cadenceDays * MS_PER_DAY * 0.25, MS_PER_DAY);
          const fireAt = deadline - threshold;
          if (fireAt > now && deadline > now) {
            candidates.push({ at: fireAt, plant, kind: 'atRisk' });
          }
        }
        if (prefs.wilt) {
          const decay = DECAY_BY_CADENCE[plant.cadenceDays] ?? 100 / 7;
          const days = daysUntilWilt(plant, decay);
          if (isFinite(days) && days > 0) {
            candidates.push({ at: now + days * MS_PER_DAY, plant, kind: 'wilt' });
          }
        }
      }
      candidates.sort((a, b) => a.at - b.at);

      for (const c of candidates.slice(0, MAX_PLANT_ALERTS)) {
        const friend = friendById.get(c.plant.id);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: c.kind === 'atRisk' ? 'A streak worth keeping' : 'A little thirsty',
            body: c.kind === 'atRisk' ? atRiskMessage(c.plant) : wiltMessage(c.plant),
            categoryIdentifier: NOTIFICATION_CATEGORY_CARE,
            data: {
              url: `rooted://plant/${c.plant.id}`,
              friendId: c.plant.id,
              phone: friend?.phone ?? null,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(c.at),
          },
        });
        scheduled += 1;
      }
    }

    // Capsule unlocks (Batch 16): one local notification per pending
    // capsule at its unlock_at (lazy unlock still governs the reveal).
    if (userId) {
      try {
        const { data: pending } = await supabase
          .from('capsules')
          .select('id, friend_id, unlock_at')
          .eq('user_id', userId)
          .is('opened_at', null)
          .gt('unlock_at', new Date().toISOString())
          .limit(10);
        for (const capsule of pending ?? []) {
          const friend = friends.find((f) => f.id === capsule.friend_id);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Something surfaced in the garden',
              body: `A time capsule you buried${friend ? ` in ${friend.friendName}'s plant` : ''} is ready to open.`,
              data: { url: `rooted://plant/${capsule.friend_id}` },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(capsule.unlock_at),
            },
          });
          scheduled += 1;
        }
      } catch (e) {
        if (__DEV__) console.log('[NOTIFY] capsule schedule skipped:', e);
      }
    }

    // Birthday celebrations (Batch 11) — up to a year out, one per friend.
    if (prefs.birthdays) {
      for (const friend of friends) {
        if (!friend.birthday) continue;
        const [, mm, dd] = friend.birthday.split('-').map(Number);
        if (!mm || !dd) continue;
        const nowDate = new Date();
        let next = new Date(nowDate.getFullYear(), mm - 1, dd, 9, 30, 0, 0);
        if (next.getTime() <= now) {
          next = new Date(nowDate.getFullYear() + 1, mm - 1, dd, 9, 30, 0, 0);
        }
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'A party in the garden',
            body: `It's ${friend.friendName}'s birthday — their plant is celebrating. A call would make its day.`,
            categoryIdentifier: NOTIFICATION_CATEGORY_CARE,
            data: {
              url: `rooted://plant/${friend.id}`,
              friendId: friend.id,
              phone: friend.phone ?? null,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: next,
          },
        });
        scheduled += 1;
      }
    }

    // One morning digest, computed from the state we know now. Repeats
    // daily; superseded by the next reschedule (every foreground).
    if (prefs.digest && !isPaused) {
      const body = digestMessage(plants);
      if (body) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Your garden this morning',
            body,
            data: { url: 'rooted://friends' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: prefs.digestHour,
            minute: 0,
            repeats: true,
          },
        });
        scheduled += 1;
      }
    }

    if (__DEV__) console.log(`[NOTIFY] rescheduled ${scheduled} notifications`);
  } catch (e) {
    console.warn('[NOTIFY] reschedule failed:', e);
  }
}
