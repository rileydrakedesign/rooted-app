/**
 * Garden persistence service — the only place the app talks to the
 * `friends` and `plants` tables. All functions take and return
 * CLIENT-shaped objects (`Friend` from FriendsContext, `Plant` from
 * types/garden); every DB↔client mapping (enums, stages, coordinates,
 * image re-derivation) lives here so the contexts stay dumb.
 *
 * Client/DB key invariant: the client keys both `Friend.id` and `Plant.id`
 * off the DB `friends.id` (plants are 1:1 with friends via UNIQUE
 * friend_id). The separate `plants.id` is never surfaced client-side.
 */

import { supabase } from './supabase';
import { Plant, PlantAttachment } from '../types/garden';
import { Friend } from '../contexts/FriendsContext';
import {
  NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from './notifications';
import { Balances } from './economy';
import { fetchLinks, FriendLink } from './links';
import { resolvePlantByType } from '../data/plantCatalog';
import { TileCoord } from '../types/garden';
import { Database, Json } from '../types/database';

type FriendRow = Database['public']['Tables']['friends']['Row'];
type PlantRow = Database['public']['Tables']['plants']['Row'];

export type ContactFrequency = 'weekly' | 'biweekly' | 'monthly';
type EvolutionStage = 'sprout' | 'young' | 'mature';

/**
 * Hydration at or below this reads as "wilted" (visuals only — death is CUT,
 * a ratified product decision; is_dead/death_timestamp are legacy).
 */
export const WILT_THRESHOLD = 30;

const MS_PER_DAY = 86_400_000;

/**
 * Decay is computed client-side on load: stored hydration minus
 * decay_rate_per_day over the time since last_hydration_update. While the
 * garden is paused, time stops at paused_at (unpausing shifts
 * last_hydration_update forward server-side, so no decay accrues).
 */
function effectiveHydration(row: PlantRow, pausedAtIso: string | null): number {
  const stored = Number(row.current_hydration ?? 100);
  if (!row.last_hydration_update) return Math.round(stored);
  const start = new Date(row.last_hydration_update).getTime();
  const end = pausedAtIso ? new Date(pausedAtIso).getTime() : Date.now();
  const elapsedDays = Math.max(0, (end - start) / MS_PER_DAY);
  const decayed = stored - Number(row.decay_rate_per_day) * elapsedDays;
  return Math.round(Math.min(100, Math.max(0, decayed)));
}

// DB evolution_stage enum ↔ client numeric stage (client stage 4 has no DB
// value yet; loading clamps into 1-3, saving clamps 4 → mature)
const STAGE_FROM_EVOLUTION: Record<EvolutionStage, Plant['stage']> = {
  sprout: 1,
  young: 2,
  mature: 3,
};

/**
 * Onboarding/UI frequency label → contact_frequency enum. The DB has no
 * 'daily'; DAILY maps to the tightest available cadence. Unknown values
 * (e.g. CUSTOM) default to weekly.
 */
export function mapFrequency(raw?: string): ContactFrequency {
  switch ((raw ?? '').toUpperCase().replace(/[^A-Z]/g, '')) {
    case 'BIWEEKLY':
      return 'biweekly';
    case 'MONTHLY':
      return 'monthly';
    case 'DAILY':
    case 'WEEKLY':
    default:
      return 'weekly';
  }
}

// Mirrors the DB's calculate_decay_rate(). The set_plant_decay_rate trigger
// recomputes this on insert; passing it explicitly keeps the NOT NULL column
// satisfied even if the trigger is missing, and satisfies the Insert type.
function decayRateForFrequency(frequency: ContactFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 100 / 7;
    case 'biweekly':
      return 100 / 14;
    case 'monthly':
      return 100 / 30;
  }
}

// contact_frequency enum → display label (PlantInfoPanel, friend cards)
const FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};

// The streak clock: one period per cadence (mirrors DB cadence_period())
const CADENCE_DAYS: Record<ContactFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * Streak tiers (ratified defaults, mirror of DB streak_multiplier()):
 * periods 1–2 ×1.0 · 3–4 ×1.25 · 5–8 ×1.5 · 9–12 ×1.75 · 13+ ×2.0 cap.
 * Tiers count periods regardless of cadence length, so monthly friends tier
 * up at the same period counts as weekly ones. Display-only — the DB is
 * authoritative for every commit.
 */
export const STREAK_TIERS = [
  { fromStreak: 13, multiplier: 2.0 },
  { fromStreak: 9, multiplier: 1.75 },
  { fromStreak: 5, multiplier: 1.5 },
  { fromStreak: 3, multiplier: 1.25 },
  { fromStreak: 0, multiplier: 1.0 },
] as const;

export function multiplierFor(streak: number): number {
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.fromStreak) return tier.multiplier;
  }
  return 1.0;
}

/** Tier index (1-based) and the period count where the next tier starts. */
export function streakTier(streak: number): {
  tierIndex: number;
  multiplier: number;
  nextTierAt: number | null;
} {
  const ascending = [...STREAK_TIERS].reverse(); // fromStreak 0 → 13
  let tierIndex = 1;
  for (let t = 0; t < ascending.length; t++) {
    if (streak >= ascending[t].fromStreak) tierIndex = t + 1;
  }
  const next = ascending[tierIndex]; // undefined at the cap
  return {
    tierIndex,
    multiplier: ascending[tierIndex - 1].multiplier,
    nextTierAt: next ? next.fromStreak : null,
  };
}

/** When the plant's current cadence window closes (streak deadline). */
export function windowDeadline(plant: Plant): Date {
  return new Date(
    new Date(plant.windowStart).getTime() + plant.cadenceDays * MS_PER_DAY
  );
}

/**
 * At-risk = the window is still unsatisfied and less than a quarter of the
 * period (or a day, whichever is larger) remains. Paused gardens are never
 * at risk — the clock is stopped.
 */
export function streakAtRisk(plant: Plant, isPaused: boolean): boolean {
  if (isPaused || plant.windowSatisfied || plant.streak === 0) return false;
  const remainingMs = windowDeadline(plant).getTime() - Date.now();
  const threshold = Math.max(plant.cadenceDays * MS_PER_DAY * 0.25, MS_PER_DAY);
  return remainingMs > 0 && remainingMs <= threshold;
}

/** "8 weeks strong" / "5 months strong" — the streak in the plant's own unit. */
export function streakLabel(plant: Plant): string | null {
  if (plant.streak <= 0) return null;
  const unit =
    plant.cadenceDays === 30 ? 'month' : plant.cadenceDays === 14 ? 'fortnight' : 'week';
  return `${plant.streak} ${unit}${plant.streak === 1 ? '' : 's'} strong`;
}

function toClientFriend(row: FriendRow, hydration: number, lastContactIso?: string): Friend {
  const plantType = row.plant_type as Plant['plantType'];
  return {
    id: row.id,
    friendName: row.name,
    plantType,
    hydration,
    lastContact: lastContactIso
      ? new Date(lastContactIso).toLocaleDateString()
      : 'Just now',
    lastContactAt: lastContactIso,
    contactFrequency:
      FREQUENCY_LABELS[row.contact_frequency as ContactFrequency] ?? 'Weekly',
    image: resolvePlantByType(plantType).image,
    phone: row.phone_number,
    birthday: row.birthday,
    hapticSignature: row.haptic_signature,
  };
}

/** Per-friend signature buzz (Batch 14). */
export async function setFriendHapticSignature(
  friendId: string,
  signature: string
): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .update({ haptic_signature: signature })
    .eq('id', friendId);
  if (error) throw error;
}

function toClientPlant(
  friendRow: FriendRow,
  plantRow: PlantRow,
  pausedAtIso: string | null,
  attachments: PlantAttachment[] = [],
  link?: { linkId: string; partnerUserId: string }
): Plant {
  const plantType = friendRow.plant_type as Plant['plantType'];
  return {
    dbPlantId: plantRow.id,
    attachments,
    linkId: link?.linkId ?? null,
    partnerUserId: link?.partnerUserId ?? null,
    id: friendRow.id, // client invariant: Plant.id === Friend.id
    friendName: friendRow.name,
    plantType,
    stage: STAGE_FROM_EVOLUTION[plantRow.evolution_stage as EvolutionStage] ?? 1,
    hydration: effectiveHydration(plantRow, pausedAtIso),
    position: { i: plantRow.grid_position_x, j: plantRow.grid_position_y, k: 0 },
    image: resolvePlantByType(plantType).image,
    streak: plantRow.streak_count ?? 0,
    streakBest: plantRow.streak_best ?? 0,
    prestigeLevel: plantRow.prestige_level ?? 0,
    windowStart: plantRow.streak_window_start ?? new Date().toISOString(),
    windowSatisfied: plantRow.streak_window_satisfied ?? false,
    brokenAt: plantRow.streak_broken_at,
    brokenCount: plantRow.streak_broken_count ?? 0,
    cadenceDays: CADENCE_DAYS[friendRow.contact_frequency as ContactFrequency] ?? 7,
  };
}

/**
 * Load the signed-in user's whole garden, including the pause state that
 * governs decay. Flat queries instead of an embedded join so the result
 * shapes stay independent of relationship metadata in the generated types.
 */
export async function fetchGarden(
  userId: string
): Promise<{
  friends: Friend[];
  plants: Plant[];
  isPaused: boolean;
  notificationPrefs: NotificationPrefs;
  balances: Balances;
  isPremium: boolean;
}> {
  // Roll every streak window forward first (commits lapses server-side) so
  // the rows we fetch below are already current. Best-effort: a failed sync
  // must never block the garden from loading.
  const { error: syncError } = await supabase.rpc('sync_streaks');
  if (syncError) console.warn('[GARDEN] sync_streaks failed:', syncError);

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('is_paused, paused_at, notification_prefs, points_balance, gems_balance, is_premium, premium_until')
    .eq('id', userId)
    .single();
  if (userError) throw userError;
  const balances: Balances = {
    points: userRow.points_balance ?? 0,
    gems: userRow.gems_balance ?? 0,
  };
  const isPremium =
    (userRow.is_premium ?? false) &&
    (userRow.premium_until == null || new Date(userRow.premium_until).getTime() > Date.now());
  const pausedAtIso = userRow.is_paused ? userRow.paused_at : null;
  const notificationPrefs: NotificationPrefs = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(userRow.notification_prefs as Partial<NotificationPrefs> | null),
  };

  const { data: friendRows, error: friendsError } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (friendsError) throw friendsError;
  if (!friendRows || friendRows.length === 0) {
    return { friends: [], plants: [], isPaused: userRow.is_paused, notificationPrefs, balances, isPremium };
  }

  const { data: plantRows, error: plantsError } = await supabase
    .from('plants')
    .select('*')
    .in('friend_id', friendRows.map((f) => f.id));
  if (plantsError) throw plantsError;

  const plantByFriendId = new Map((plantRows ?? []).map((p) => [p.friend_id, p]));

  // Active links (Batch 13) — friendId → link info; failures degrade solo.
  let links = new Map<string, FriendLink>();
  try {
    links = await fetchLinks(userId);
  } catch (e) {
    console.warn('[GARDEN] links load failed:', e);
  }

  // Equipped cosmetics (Batch 10) — keyed back to friend ids via plant rows.
  const attachmentsByPlantId = new Map<string, PlantAttachment[]>();
  if (plantRows && plantRows.length > 0) {
    const { data: attachmentRows, error: attachmentsError } = await supabase
      .from('plant_attachments')
      .select('plant_id, slot, sku')
      .in('plant_id', plantRows.map((p) => p.id));
    if (attachmentsError) {
      console.warn('[GARDEN] attachments load failed:', attachmentsError);
    } else {
      for (const row of attachmentRows ?? []) {
        const list = attachmentsByPlantId.get(row.plant_id) ?? [];
        list.push({ slot: row.slot, sku: row.sku });
        attachmentsByPlantId.set(row.plant_id, list);
      }
    }
  }

  const friends: Friend[] = [];
  const plants: Plant[] = [];
  for (const friendRow of friendRows) {
    const plantRow = plantByFriendId.get(friendRow.id);
    // A friends row without a plants row shouldn't exist (1:1), but don't
    // let one bad row take down the whole garden load.
    if (!plantRow) continue;
    friends.push(
      toClientFriend(
        friendRow,
        effectiveHydration(plantRow, pausedAtIso),
        plantRow.last_hydration_update ?? undefined
      )
    );
    plants.push(
      toClientPlant(
        friendRow,
        plantRow,
        pausedAtIso,
        attachmentsByPlantId.get(plantRow.id) ?? [],
        links.get(friendRow.id)
      )
    );
  }
  return { friends, plants, isPaused: userRow.is_paused, notificationPrefs, balances, isPremium };
}

/**
 * Pause/unpause decay for the whole garden. The DB function stamps
 * paused_at (pause) or shifts every plant's last_hydration_update forward
 * by the pause duration (unpause), all scoped to auth.uid() via RLS.
 */
export async function setGardenPausedRemote(paused: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_garden_paused', { p_paused: paused });
  if (error) throw error;
}

export type InteractionType = 'call' | 'text' | 'manual';

/**
 * Mirrors the CASE weighting inside the log_interaction RPC — the RPC is
 * the source of truth; this exists only so the client can show the new
 * value without a round-trip. In-person-first (Batch 6): manual = "hung
 * out" and outranks everything.
 */
export const HYDRATION_WEIGHTS: Record<InteractionType, number> = {
  manual: 50,
  call: 35,
  text: 15,
};

/** What a log did: hydration, streak, and the mint (Batch 9). */
export interface LogResult {
  hydration: number;
  streak: number;
  pointsMinted: number;
  multiplier: number;
  gemsMinted: number;
  fullMint: boolean;
  balances: Balances | null; // null when offline-estimated
  offline: boolean;
  /** Linked-log info (Batch 13). */
  linked: boolean;
  partnerUserId: string | null;
}

/**
 * Log contact with a friend — the care loop's only write path. The
 * log_interaction RPC applies the type weighting (hung out 50 / call 35 /
 * text 15), caps hydration at 100, resets the decay clock, satisfies the
 * streak window, mints points (base × streak multiplier, full once per
 * plant per day, 5-point trickle after) and any gem drops — all in one
 * transaction — and returns the whole result as jsonb.
 *
 * `interactionId` (client-generated UUID) makes the call idempotent — the
 * offline queue replays with the same id and the RPC skips duplicates.
 */
export async function logInteractionRemote(
  userId: string,
  friendId: string,
  type: InteractionType,
  currentHydration: number,
  opts?: { interactionId?: string; note?: string; occurredAt?: string }
): Promise<LogResult> {
  const { data, error } = await supabase.rpc('log_interaction', {
    p_user_id: userId,
    p_friend_id: friendId,
    p_interaction_type: type,
    p_note: opts?.note,
    p_interaction_id: opts?.interactionId,
    p_occurred_at: opts?.occurredAt,
  });
  if (error) throw error;
  const r = data as {
    new_hydration?: number;
    streak?: number;
    points_minted?: number;
    multiplier?: number;
    gems_minted?: number;
    full_mint?: boolean;
    points_balance?: number;
    gems_balance?: number;
    replayed?: boolean;
    linked?: boolean;
    partner_user_id?: string | null;
  };
  return {
    hydration: Math.round(
      r.new_hydration ?? Math.min(100, currentHydration + HYDRATION_WEIGHTS[type])
    ),
    streak: r.streak ?? 0,
    pointsMinted: r.points_minted ?? 0,
    multiplier: r.multiplier ?? 1,
    gemsMinted: r.gems_minted ?? 0,
    fullMint: r.full_mint ?? false,
    balances:
      r.points_balance != null
        ? { points: r.points_balance, gems: r.gems_balance ?? 0 }
        : null,
    offline: false,
    linked: r.linked ?? false,
    partnerUserId: r.partner_user_id ?? null,
  };
}

/**
 * Create a friend + its 1:1 plant. Returns client-shaped objects keyed by
 * the new friends.id. The caller picks `position` (free-tile search stays
 * in GardenContext).
 */
export async function createFriendWithPlant(params: {
  userId: string;
  name: string;
  plantType: Plant['plantType'];
  contactFrequency: ContactFrequency;
  position: TileCoord;
}): Promise<{ friend: Friend; plant: Plant }> {
  const { data: friendRow, error: friendError } = await supabase
    .from('friends')
    .insert({
      user_id: params.userId,
      name: params.name,
      plant_type: params.plantType as FriendRow['plant_type'],
      contact_frequency: params.contactFrequency,
    })
    .select()
    .single();
  if (friendError) throw friendError;

  const { data: plantRow, error: plantError } = await supabase
    .from('plants')
    .insert({
      friend_id: friendRow.id,
      decay_rate_per_day: decayRateForFrequency(params.contactFrequency),
      grid_position_x: params.position.i,
      grid_position_y: params.position.j,
    })
    .select()
    .single();
  if (plantError) {
    // Don't strand a plantless friend — the 1:1 invariant is what load
    // relies on. Best-effort rollback, then surface the original failure.
    await supabase.from('friends').delete().eq('id', friendRow.id);
    throw plantError;
  }

  return {
    friend: toClientFriend(friendRow, Number(plantRow.current_hydration ?? 100)),
    plant: toClientPlant(friendRow, plantRow, null),
  };
}

// ── Garden layout & decor (Batch 12) ───────────────────────────────────────

export interface DecorItem {
  id: string;
  sku: string; // decorative_items.item_id
  name: string;
  position: TileCoord;
}

/** The user's garden theme; creates the layout row on first read. */
export async function fetchGardenLayout(userId: string): Promise<{ theme: string }> {
  const { data, error } = await supabase
    .from('garden_layouts')
    .select('id, theme')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return { theme: data.theme ?? 'cozy_greenhouse' };

  const { error: insertError } = await supabase
    .from('garden_layouts')
    .insert({ user_id: userId });
  if (insertError && insertError.code !== '23505') throw insertError;
  return { theme: 'cozy_greenhouse' };
}

export async function persistGardenTheme(userId: string, theme: string): Promise<void> {
  const { error } = await supabase
    .from('garden_layouts')
    .update({ theme: theme as Database['public']['Enums']['garden_theme'] })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchDecor(userId: string): Promise<DecorItem[]> {
  const { data, error } = await supabase
    .from('decorative_items')
    .select('id, item_id, item_name, grid_position_x, grid_position_y')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    sku: row.item_id,
    name: row.item_name,
    position: { i: row.grid_position_x, j: row.grid_position_y, k: 0 },
  }));
}

export async function placeDecorRemote(params: {
  userId: string;
  sku: string;
  name: string;
  position: TileCoord;
}): Promise<DecorItem> {
  const { data, error } = await supabase
    .from('decorative_items')
    .insert({
      user_id: params.userId,
      item_id: params.sku,
      item_name: params.name,
      grid_position_x: params.position.i,
      grid_position_y: params.position.j,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    sku: data.item_id,
    name: data.item_name,
    position: { i: data.grid_position_x, j: data.grid_position_y, k: 0 },
  };
}

export async function persistDecorPosition(id: string, tile: TileCoord): Promise<void> {
  const { error } = await supabase
    .from('decorative_items')
    .update({ grid_position_x: tile.i, grid_position_y: tile.j })
    .eq('id', id);
  if (error) throw error;
}

export async function removeDecorRemote(id: string): Promise<void> {
  const { error } = await supabase.from('decorative_items').delete().eq('id', id);
  if (error) throw error;
}

/** Persist the user's notification preferences (Batch 8). */
export async function persistNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ notification_prefs: prefs as unknown as Json })
    .eq('id', userId);
  if (error) throw error;
}

/** Persist a plant's grid tile. `friendId` is the client Plant.id. */
export async function persistPlantPosition(
  friendId: string,
  tile: TileCoord
): Promise<void> {
  const { error } = await supabase
    .from('plants')
    .update({ grid_position_x: tile.i, grid_position_y: tile.j })
    .eq('friend_id', friendId);
  if (error) throw error;
}
