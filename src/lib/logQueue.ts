/**
 * Offline log queue — interactions that failed to reach the log_interaction
 * RPC (bad connectivity, transient Supabase errors) are persisted here and
 * replayed on app launch/foreground.
 *
 * Each queued entry carries a client-generated interaction UUID; the RPC is
 * idempotent on that id, so a replay that already landed (response dropped
 * mid-flight) is a no-op server-side and can never double-water a plant.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { InteractionType } from './garden';

const QUEUE_KEY = '@rooted/log_queue_v1';

export interface QueuedLog {
  interactionId: string; // client-generated UUID, idempotency key
  userId: string;
  friendId: string;
  type: InteractionType;
  note?: string;
  occurredAt?: string; // ISO — preserves backdating through a replay
  queuedAt: string; // ISO
}

/** RFC4122 v4, crypto-free (Math.random is fine for idempotency ids). */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function readQueue(): Promise<QueuedLog[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedLog[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[LOG QUEUE] persist failed:', e);
  }
}

export async function enqueueLog(entry: QueuedLog): Promise<void> {
  const queue = await readQueue();
  if (queue.some((q) => q.interactionId === entry.interactionId)) return;
  queue.push(entry);
  await writeQueue(queue);
}

export async function pendingCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Replay every queued log against the RPC. Successes (and idempotent
 * already-landed replays) leave the queue; failures stay for next time.
 * Returns the number of logs that flushed — callers refresh the garden
 * when > 0 so hydration reflects the replayed care.
 */
export async function flushLogQueue(): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedLog[] = [];
  let flushed = 0;
  for (const entry of queue) {
    const { error } = await supabase.rpc('log_interaction', {
      p_user_id: entry.userId,
      p_friend_id: entry.friendId,
      p_interaction_type: entry.type,
      p_note: entry.note,
      p_interaction_id: entry.interactionId,
      // A replay hours later still credits the moment it happened (the
      // RPC clamps to the 48 h backdating window).
      p_occurred_at: entry.occurredAt ?? entry.queuedAt,
    });
    if (error) {
      remaining.push(entry);
    } else {
      flushed += 1;
    }
  }
  await writeQueue(remaining);
  return flushed;
}
