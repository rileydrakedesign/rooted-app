/**
 * Almanac (Batch 18, spec §7) — the year-scale layer, computed entirely
 * from existing tables (interactions, ledger_entries, photos, plants) with
 * NO new write paths. History depth is Pass-gated by the caller (free =
 * current year).
 */

import { supabase } from './supabase';
import { Database } from '../types/database';
import { Friend } from '../contexts/FriendsContext';

export type ArtifactRow = Database['public']['Tables']['artifacts']['Row'];
export type ArtifactTemplateRow = Database['public']['Tables']['artifact_templates']['Row'];

export interface AlmanacSummary {
  year: number;
  totalConnections: number;
  byType: { manual: number; call: number; text: number };
  pointsEarned: number;
  gemsEarned: number;
  photosAdded: number;
  mostTendedFriend: { name: string; count: number } | null;
  bestStreak: number;
}

export async function computeAlmanac(
  userId: string,
  year: number,
  friends: Friend[]
): Promise<AlmanacSummary> {
  const from = new Date(Date.UTC(year, 0, 1)).toISOString();
  const to = new Date(Date.UTC(year + 1, 0, 1)).toISOString();

  const [interactions, ledger, photos, plants] = await Promise.all([
    supabase
      .from('interactions')
      .select('interaction_type, friend_id')
      .eq('user_id', userId)
      .gte('created_at', from)
      .lt('created_at', to),
    supabase
      .from('ledger_entries')
      .select('currency, amount')
      .eq('user_id', userId)
      .gt('amount', 0)
      .gte('created_at', from)
      .lt('created_at', to),
    supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', from)
      .lt('created_at', to),
    supabase.from('plants').select('streak_best'),
  ]);

  const rows = interactions.data ?? [];
  const byType = { manual: 0, call: 0, text: 0 };
  const byFriend = new Map<string, number>();
  for (const row of rows) {
    byType[row.interaction_type as keyof typeof byType] += 1;
    byFriend.set(row.friend_id, (byFriend.get(row.friend_id) ?? 0) + 1);
  }

  let mostTended: { name: string; count: number } | null = null;
  for (const [friendId, count] of byFriend) {
    if (!mostTended || count > mostTended.count) {
      const friend = friends.find((f) => f.id === friendId);
      mostTended = { name: friend?.friendName ?? 'A friend', count };
    }
  }

  let points = 0;
  let gems = 0;
  for (const entry of ledger.data ?? []) {
    if (entry.currency === 'points') points += entry.amount;
    else gems += entry.amount;
  }

  return {
    year,
    totalConnections: rows.length,
    byType,
    pointsEarned: points,
    gemsEarned: gems,
    photosAdded: photos.count ?? 0,
    mostTendedFriend: mostTended,
    bestStreak: Math.max(0, ...(plants.data ?? []).map((p) => p.streak_best ?? 0)),
  };
}

/** Lazy collection award + fetch (Batch 18 — artifacts finally activate). */
export async function syncAndFetchCollection(): Promise<{
  unlocked: ArtifactRow[];
  templates: ArtifactTemplateRow[];
}> {
  await supabase.rpc('sync_artifacts').then(({ error }) => {
    if (error) console.warn('[ALMANAC] sync_artifacts failed:', error);
  });
  const [artifacts, templates] = await Promise.all([
    supabase.from('artifacts').select('*').order('unlocked_at', { ascending: false }),
    supabase.from('artifact_templates').select('*').order('sort_order', { ascending: true }),
  ]);
  return {
    unlocked: artifacts.data ?? [],
    templates: templates.data ?? [],
  };
}
