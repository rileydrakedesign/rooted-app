/**
 * Time capsules (Batch 16, spec §6) — bury a note, photo, or voice memo in
 * a plant; it unlocks on the chosen date. Unlock is LAZY (checked at read
 * time) plus a scheduled local notification via the Batch 8 engine.
 * Slots: 1 per plant free, 5 with Pass — enforced by the bury_capsule RPC,
 * never client-only.
 */

import { supabase } from './supabase';
import { Database } from '../types/database';
import { generateUUID } from './logQueue';

export type CapsuleRow = Database['public']['Tables']['capsules']['Row'];
export type CapsuleKind = 'note' | 'photo' | 'voice';

export interface Capsule {
  row: CapsuleRow;
  /** Unlock date has passed (openable). */
  unlocked: boolean;
  /** Signed URL for photo/voice payloads, present once unlocked+opened. */
  mediaUrl: string | null;
}

export async function fetchCapsules(friendId: string): Promise<Capsule[]> {
  const { data, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('friend_id', friendId)
    .order('unlock_at', { ascending: true });
  if (error) throw error;
  const now = Date.now();
  return (data ?? []).map((row) => ({
    row,
    unlocked: new Date(row.unlock_at).getTime() <= now,
    mediaUrl: null,
  }));
}

export async function buryCapsule(params: {
  friendId: string;
  kind: CapsuleKind;
  unlockAt: string; // ISO
  body?: string;
  storagePath?: string;
  shared?: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('bury_capsule', {
    p_friend_id: params.friendId,
    p_kind: params.kind,
    p_unlock_at: params.unlockAt,
    p_body: params.body,
    p_storage_path: params.storagePath,
    p_shared: params.shared ?? false,
  });
  if (error) throw error;
}

/**
 * Open an unlocked capsule: stamps opened_at and signs its media (if any).
 * Opening is one-way — the celebration happens once.
 */
export async function openCapsule(capsule: CapsuleRow): Promise<{ mediaUrl: string | null }> {
  if (new Date(capsule.unlock_at).getTime() > Date.now()) {
    throw new Error('Still buried — it opens ' + new Date(capsule.unlock_at).toLocaleDateString());
  }
  if (!capsule.opened_at) {
    await supabase
      .from('capsules')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', capsule.id);
  }
  if (!capsule.storage_path) return { mediaUrl: null };
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(capsule.storage_path, 3600);
  if (error) return { mediaUrl: null };
  return { mediaUrl: data.signedUrl };
}

/** Upload a recorded voice memo into the memories bucket; returns the path. */
export async function uploadVoiceMemo(
  userId: string,
  friendId: string,
  localUri: string
): Promise<string> {
  const path = `${userId}/${friendId}/voice-${generateUUID()}.m4a`;
  const response = await fetch(localUri);
  const body = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from('memories')
    .upload(path, body, { contentType: 'audio/m4a' });
  if (error) throw error;
  return path;
}
