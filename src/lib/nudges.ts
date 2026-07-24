/**
 * Nudges & remote plant actions (Batch 14, spec §4) — small ambient signals
 * on a live link. Not a chat: no threads, no read receipts, no pressure to
 * reply. NUDGES MINT NOTHING (§8). Rate cap 3/link/day, RPC-enforced.
 */

import * as Haptics from 'expo-haptics';
import { supabase } from './supabase';
import { Database } from '../types/database';
import { sendPartnerPush } from './links';

export type NudgeRow = Database['public']['Tables']['nudges']['Row'];

export type NudgeType =
  | 'sun' // thinking of you
  | 'rain' // rough week / miss you
  | 'butterfly' // "this reminded me of you" (can carry a note/photo)
  | 'leaf' // "it's been a while, no pressure"
  | 'ladybug' // playful poke
  | 'shimmer' // remote plant actions (message-action tier)
  | 'shake'
  | 'shimmy';

export const NUDGE_LABELS: Record<NudgeType, { label: string; push: string }> = {
  sun: { label: 'Sunlight', push: 'sent your plant some sunlight — thinking of you.' },
  rain: { label: 'Rain', push: 'sent rain — a rough-week hello.' },
  butterfly: { label: 'Butterfly', push: 'sent a butterfly — something reminded them of you.' },
  leaf: { label: 'Falling leaf', push: "sent a falling leaf — it's been a while, no pressure." },
  ladybug: { label: 'Ladybug', push: 'sent a ladybug your way.' },
  shimmer: { label: 'Shimmer', push: 'made your plant shimmer.' },
  shake: { label: 'Shake', push: 'gave your plant a friendly shake.' },
  shimmy: { label: 'Shimmy', push: 'made your plant shimmy.' },
};

export type HapticSignature = 'pulse' | 'double' | 'triple' | 'long';

export const HAPTIC_SIGNATURES: HapticSignature[] = ['pulse', 'double', 'triple', 'long'];

/** Play a friend's signature buzz (foreground only — background haptics
 *  are not deliverable on iOS; degrade gracefully per the plan's risk note). */
export async function playHapticSignature(signature: string): Promise<void> {
  try {
    switch (signature) {
      case 'double':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 180);
        break;
      case 'triple':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
        break;
      case 'long':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {}
}

/** Send a nudge; fires the partner's soft push on success. */
export async function sendNudge(params: {
  linkId: string;
  type: NudgeType;
  note?: string;
  senderName?: string;
}): Promise<void> {
  const { data, error } = await supabase.rpc('send_nudge', {
    p_link_id: params.linkId,
    p_type: params.type,
    p_payload: params.note ? { note: params.note, v: 1 } : { v: 1 },
  });
  if (error) throw error;
  const r = data as { recipient_user_id: string };
  sendPartnerPush(
    r.recipient_user_id,
    'A sign of life in your garden',
    `${params.senderName ?? 'A friend'} ${NUDGE_LABELS[params.type].push}`,
    { url: 'rooted://friends' }
  );
}

/** Unseen nudges addressed to me (sender ≠ me), oldest first. */
export async function fetchUnseenNudges(userId: string): Promise<NudgeRow[]> {
  const { data, error } = await supabase
    .from('nudges')
    .select('*')
    .neq('sender_user_id', userId)
    .is('seen_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function markNudgeSeen(nudgeId: string): Promise<void> {
  await supabase
    .from('nudges')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', nudgeId);
}

/** Live nudge arrivals for my links. Returns an unsubscribe fn. */
export function subscribeToNudges(
  userId: string,
  linkIds: string[],
  onNudge: (nudge: NudgeRow) => void
): () => void {
  if (linkIds.length === 0) return () => {};
  const channel = supabase
    .channel(`nudges-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'nudges' },
      (payload) => {
        const row = payload.new as NudgeRow;
        if (row.sender_user_id !== userId && linkIds.includes(row.link_id)) {
          onNudge(row);
        }
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface SharedWallPhoto {
  id: string;
  ownerUserId: string;
  takenAt: string;
  url: string | null;
  mine: boolean;
}

/** Both sides' shared photos for a link (signed via the shared-wall fn). */
export async function fetchSharedWall(linkId: string): Promise<SharedWallPhoto[]> {
  const { data, error } = await supabase.functions.invoke('shared-wall', {
    body: { link_id: linkId },
  });
  if (error) throw error;
  const photos = (data as { photos: { id: string; owner_user_id: string; taken_at: string; url: string | null; mine: boolean }[] })
    .photos ?? [];
  return photos.map((p) => ({
    id: p.id,
    ownerUserId: p.owner_user_id,
    takenAt: p.taken_at,
    url: p.url,
    mine: p.mine,
  }));
}
