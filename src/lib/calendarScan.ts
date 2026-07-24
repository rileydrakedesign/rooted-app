/**
 * Calendar-suggested logs (Batch 8, spec §5): on foreground, scan recent
 * calendar events for friend-name matches and offer a one-tap "did you see
 * Maya?" confirm card. Read-only; never writes to the calendar. No proof is
 * ever demanded — a suggestion is just a shortcut to the same manual log.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Friend } from '../contexts/FriendsContext';

const HANDLED_KEY = '@rooted/handled_calendar_suggestions_v1';
const LOOKBACK_MS = 36 * 3_600_000; // yesterday + today

export interface HangoutSuggestion {
  /** Stable id (event + friend) for dismiss/dedupe bookkeeping. */
  id: string;
  friendId: string;
  friendName: string;
  eventTitle: string;
  /** ISO start — passed to the log as the backdated occurrence time. */
  startsAt: string;
}

export async function calendarPermissionGranted(): Promise<boolean> {
  const { granted } = await Calendar.getCalendarPermissionsAsync();
  return granted;
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { granted } = await Calendar.requestCalendarPermissionsAsync();
  return granted;
}

async function readHandled(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(HANDLED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Remember a suggestion as logged/dismissed so it never re-surfaces. */
export async function markSuggestionHandled(id: string): Promise<void> {
  const handled = await readHandled();
  handled.add(id);
  // Keep the set bounded — old event ids can never come back anyway.
  const trimmed = [...handled].slice(-200);
  try {
    await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Events from the last ~36 h whose title contains a friend's name
 * (word-boundary, case-insensitive). Only fires with permission already
 * granted — requesting lives in Settings, not here.
 */
export async function scanCalendarForFriends(
  friends: Friend[]
): Promise<HangoutSuggestion[]> {
  try {
    if (friends.length === 0 || !(await calendarPermissionGranted())) return [];

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (calendars.length === 0) return [];

    const now = new Date();
    const events = await Calendar.getEventsAsync(
      calendars.map((c) => c.id),
      new Date(now.getTime() - LOOKBACK_MS),
      now
    );

    const handled = await readHandled();
    const suggestions: HangoutSuggestion[] = [];
    for (const event of events) {
      const title = event.title ?? '';
      for (const friend of friends) {
        const name = friend.friendName.trim();
        if (!name) continue;
        const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (!re.test(title)) continue;
        const id = `${event.id}:${friend.id}`;
        if (handled.has(id)) continue;
        suggestions.push({
          id,
          friendId: friend.id,
          friendName: friend.friendName,
          eventTitle: title,
          startsAt: new Date(event.startDate).toISOString(),
        });
      }
    }
    return suggestions;
  } catch (e) {
    console.warn('[CALENDAR] scan failed:', e);
    return [];
  }
}
