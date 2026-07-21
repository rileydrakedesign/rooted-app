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
import { Plant } from '../types/garden';
import { Friend } from '../contexts/FriendsContext';
import { resolvePlantByType } from '../data/plantCatalog';
import { TileCoord } from '../types/garden';
import { Database } from '../types/database';

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
  };
}

function toClientPlant(
  friendRow: FriendRow,
  plantRow: PlantRow,
  pausedAtIso: string | null
): Plant {
  const plantType = friendRow.plant_type as Plant['plantType'];
  return {
    id: friendRow.id, // client invariant: Plant.id === Friend.id
    friendName: friendRow.name,
    plantType,
    stage: STAGE_FROM_EVOLUTION[plantRow.evolution_stage as EvolutionStage] ?? 1,
    hydration: effectiveHydration(plantRow, pausedAtIso),
    position: { i: plantRow.grid_position_x, j: plantRow.grid_position_y, k: 0 },
    image: resolvePlantByType(plantType).image,
  };
}

/**
 * Load the signed-in user's whole garden, including the pause state that
 * governs decay. Flat queries instead of an embedded join so the result
 * shapes stay independent of relationship metadata in the generated types.
 */
export async function fetchGarden(
  userId: string
): Promise<{ friends: Friend[]; plants: Plant[]; isPaused: boolean }> {
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('is_paused, paused_at')
    .eq('id', userId)
    .single();
  if (userError) throw userError;
  const pausedAtIso = userRow.is_paused ? userRow.paused_at : null;

  const { data: friendRows, error: friendsError } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (friendsError) throw friendsError;
  if (!friendRows || friendRows.length === 0) {
    return { friends: [], plants: [], isPaused: userRow.is_paused };
  }

  const { data: plantRows, error: plantsError } = await supabase
    .from('plants')
    .select('*')
    .in('friend_id', friendRows.map((f) => f.id));
  if (plantsError) throw plantsError;

  const plantByFriendId = new Map((plantRows ?? []).map((p) => [p.friend_id, p]));

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
    plants.push(toClientPlant(friendRow, plantRow, pausedAtIso));
  }
  return { friends, plants, isPaused: userRow.is_paused };
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
 * value without a round-trip.
 */
export const HYDRATION_WEIGHTS: Record<InteractionType, number> = {
  call: 40,
  text: 20,
  manual: 30,
};

/**
 * Log contact with a friend — the care loop's only write path. The
 * log_interaction RPC applies the type weighting (call 40 / text 20 /
 * manual 30; p_hydration_amount deliberately omitted), caps at 100,
 * resets the decay clock (last_hydration_update = NOW()), and appends the
 * interactions row. Returns the new hydration, computed optimistically
 * with the identical formula (LEAST(100, current + weight)).
 */
export async function logInteractionRemote(
  userId: string,
  friendId: string,
  type: InteractionType,
  currentHydration: number
): Promise<number> {
  const { error } = await supabase.rpc('log_interaction', {
    p_user_id: userId,
    p_friend_id: friendId,
    p_interaction_type: type,
  });
  if (error) throw error;
  return Math.min(100, Math.round(currentHydration + HYDRATION_WEIGHTS[type]));
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
