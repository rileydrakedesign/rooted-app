/**
 * Economy service (Batch 9, decision D1) — the client face of the
 * append-only `ledger_entries` truth. Balances are read from the
 * trigger-maintained cache columns on `users`; every write goes through a
 * SECURITY DEFINER RPC with a deterministic idempotency key, so nothing
 * here can double-mint or double-spend.
 */

import { supabase } from './supabase';
import { Database } from '../types/database';

export type LedgerRow = Database['public']['Tables']['ledger_entries']['Row'];

export interface Balances {
  points: number;
  gems: number;
}

export type RestoreCurrency = 'points' | 'gems';

/** Client mirror of the DB restore price base (100 × broken tier index). */
export function restoreBasePrice(brokenStreak: number): number {
  const tier =
    brokenStreak >= 13 ? 5 : brokenStreak >= 9 ? 4 : brokenStreak >= 5 ? 3 : brokenStreak >= 3 ? 2 : 1;
  return 100 * tier;
}

export const RESTORE_GEM_PRICE = 5;

export interface RestoreResult {
  restoredStreak: number;
  price: number;
  currency: RestoreCurrency;
  balances: Balances;
}

/**
 * Buy back a broken streak. The RPC validates the one-period restore
 * window, prices from the broken tier (×2 per repeat within 90 days),
 * spends, restores the count, and re-arms the window WITHOUT satisfying it
 * — the restore only counts if you follow through.
 */
export async function restoreStreakRemote(
  friendId: string,
  currency: RestoreCurrency
): Promise<RestoreResult> {
  const { data, error } = await supabase.rpc('restore_streak', {
    p_friend_id: friendId,
    p_currency: currency,
  });
  if (error) throw error;
  const result = data as {
    restored_streak: number;
    price: number;
    currency: RestoreCurrency;
    points_balance: number;
    gems_balance: number;
  };
  return {
    restoredStreak: result.restored_streak,
    price: result.price,
    currency: result.currency,
    balances: { points: result.points_balance, gems: result.gems_balance },
  };
}

/** Recent ledger activity, newest first (mint toasts, future Almanac). */
export async function fetchRecentLedger(
  userId: string,
  limit = 50
): Promise<LedgerRow[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
