/**
 * Memory layer service (Batch 11, spec §6) — journal entries, the photo
 * wall, and birthdays. Photos upload to the private `memories` bucket at
 * <user_id>/<friend_id>/<uuid>.jpg (path-prefix RLS); reads go through
 * short-lived signed URLs.
 *
 * Photo cap (ratified default #10): 20 per plant free — SOFT-enforced here
 * (counted + warned) until Batch 17 makes it a server entitlement.
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Database } from '../types/database';
import { generateUUID } from './logQueue';

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type PhotoRow = Database['public']['Tables']['photos']['Row'];
export type JournalKind = 'note' | 'date' | 'gift_idea' | 'milestone';

export const FREE_PHOTO_CAP = 20;

// ── Journal ────────────────────────────────────────────────────────────────

export async function fetchJournal(friendId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('friend_id', friendId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addJournalEntry(params: {
  userId: string;
  friendId: string;
  kind: JournalKind;
  body: string;
  eventDate?: string; // ISO date
}): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: params.userId,
      friend_id: params.friendId,
      kind: params.kind,
      body: params.body,
      event_date: params.eventDate,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
  if (error) throw error;
}

// ── Birthdays ──────────────────────────────────────────────────────────────

export async function setFriendBirthday(
  friendId: string,
  birthday: string | null // 'YYYY-MM-DD'
): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .update({ birthday })
    .eq('id', friendId);
  if (error) throw error;
}

// ── Photos ─────────────────────────────────────────────────────────────────

export interface WallPhoto {
  row: PhotoRow;
  /** Short-lived signed URL for display. */
  url: string | null;
}

export async function fetchPhotoWall(friendId: string): Promise<WallPhoto[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('friend_id', friendId)
    .order('taken_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: signed, error: signError } = await supabase.storage
    .from('memories')
    .createSignedUrls(rows.map((r) => r.storage_path), 3600);
  if (signError) {
    console.warn('[MEMORIES] signing failed:', signError);
    return rows.map((row) => ({ row, url: null }));
  }
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((row) => ({ row, url: urlByPath.get(row.storage_path) ?? null }));
}

export async function photoCount(friendId: string): Promise<number> {
  const { count, error } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('friend_id', friendId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Pick a photo, resize client-side (long edge 1600, jpeg 0.8), upload,
 * insert the photos row. Returns null if the user cancels the picker.
 */
export async function pickAndUploadPhoto(params: {
  userId: string;
  friendId: string;
  interactionId?: string;
}): Promise<PhotoRow | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access is needed to add memories.');

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });
  if (picked.canceled || picked.assets.length === 0) return null;

  const asset = picked.assets[0];
  const resized = await ImageManipulator.manipulateAsync(
    asset.uri,
    asset.width > 1600 ? [{ resize: { width: 1600 } }] : [],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  const path = `${params.userId}/${params.friendId}/${generateUUID()}.jpg`;
  const response = await fetch(resized.uri);
  const body = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('memories')
    .upload(path, body, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('photos')
    .insert({
      user_id: params.userId,
      friend_id: params.friendId,
      interaction_id: params.interactionId,
      storage_path: path,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePhoto(photo: PhotoRow): Promise<void> {
  await supabase.storage.from('memories').remove([photo.storage_path]);
  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
}

/** Flip a photo's shared flag (feeds the Batch 14 shared wall). */
export async function setPhotoShared(photoId: string, shared: boolean): Promise<void> {
  const { error } = await supabase
    .from('photos')
    .update({ is_shared: shared })
    .eq('id', photoId);
  if (error) throw error;
}
