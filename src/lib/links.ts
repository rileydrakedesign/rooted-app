/**
 * Linking service (Batch 13, spec §4) — invites, links, push plumbing.
 * Cross-user writes go only through SECURITY DEFINER RPCs; this module is
 * the client face. The `send-push` Edge Function is a dumb Expo sender —
 * every decision about WHEN to push stays here or in RPCs.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { ContactFrequency } from './garden';
import { Database } from '../types/database';

export type GardenLinkRow = Database['public']['Tables']['garden_links']['Row'];

export interface FriendLink {
  linkId: string;
  partnerUserId: string;
}

/** friendId → link info for every active link the user is part of. */
export async function fetchLinks(userId: string): Promise<Map<string, FriendLink>> {
  const { data, error } = await supabase
    .from('garden_links')
    .select('*')
    .eq('status', 'active')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  if (error) throw error;
  const map = new Map<string, FriendLink>();
  for (const row of data ?? []) {
    const mine = row.user_a === userId;
    map.set(mine ? row.friend_a_id : row.friend_b_id, {
      linkId: row.id,
      partnerUserId: mine ? row.user_b : row.user_a,
    });
  }
  return map;
}

/** "You're a monstera in my garden" — a single-use, expiring invite code. */
export async function createLinkInvite(friendId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_link_invite', {
    p_friend_id: friendId,
  });
  if (error) throw error;
  return (data as { code: string }).code;
}

export interface AcceptResult {
  linkId: string;
  myFriendId: string;
  inheritedStreak: number;
}

export async function acceptLinkInvite(params: {
  code: string;
  plantType: string;
  frequency: ContactFrequency;
  gridX: number;
  gridY: number;
  existingFriendId?: string;
}): Promise<AcceptResult> {
  const { data, error } = await supabase.rpc('accept_link_invite', {
    p_code: params.code,
    p_plant_type: params.plantType as Database['public']['Enums']['plant_type'],
    p_frequency: params.frequency,
    p_grid_x: params.gridX,
    p_grid_y: params.gridY,
    p_existing_friend_id: params.existingFriendId,
  });
  if (error) throw error;
  const r = data as { link_id: string; my_friend_id: string; inherited_streak: number };
  return { linkId: r.link_id, myFriendId: r.my_friend_id, inheritedStreak: r.inherited_streak };
}

/**
 * Register this device's Expo push token. Quietly no-ops where a token
 * can't be issued (simulator, missing EAS project id, denied permission).
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (!token) return;
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    );
  } catch (e) {
    if (__DEV__) console.log('[PUSH] token registration skipped:', e);
  }
}

/** Fire-and-forget push to the link partner via the send-push function. */
export function sendPartnerPush(
  partnerUserId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): void {
  supabase.functions
    .invoke('send-push', {
      body: { to_user_id: partnerUserId, title, body, data },
    })
    .catch((e) => {
      if (__DEV__) console.log('[PUSH] send skipped:', e);
    });
}

/**
 * Subscribe to the partner side of the user's links: an INSERT by the
 * partner is a live watering moment. Returns an unsubscribe fn.
 */
export function subscribeToLinkEvents(
  userId: string,
  linkIds: string[],
  onPartnerEvent: (linkId: string) => void
): () => void {
  if (linkIds.length === 0) return () => {};
  const channel = supabase
    .channel(`link-events-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'link_events' },
      (payload) => {
        const row = payload.new as { link_id: string; logger_user_id: string };
        if (row.logger_user_id !== userId && linkIds.includes(row.link_id)) {
          onPartnerEvent(row.link_id);
        }
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
