# Database Quick Reference - Rooted

**Quick lookup for common database operations.**

For full documentation, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## Core Functions Cheat Sheet

### Update Plant Hydration

```sql
-- Update single plant
SELECT update_plant_hydration('plant-uuid');

-- Update all user's plants (call on app open)
SELECT update_plant_hydration(id) FROM plants
WHERE friend_id IN (SELECT id FROM friends WHERE user_id = auth.uid());
```

### Log Interaction

```sql
-- Auto-detect phone call (+40 hydration)
SELECT log_interaction(
  'user-uuid'::UUID,
  'friend-uuid'::UUID,
  'call'::interaction_type
);

-- Manual text (+20 hydration)
SELECT log_interaction(
  'user-uuid'::UUID,
  'friend-uuid'::UUID,
  'text'::interaction_type,
  NULL,
  'Texted about weekend plans',
  false
);
```

### Check Current Hydration

```sql
SELECT calculate_current_hydration('plant-uuid');
-- Returns: 73.45
```

---

## TypeScript/React Native Examples

### Initialize Supabase

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

### Add Friend + Plant

```typescript
// 1. Add friend
const { data: friend } = await supabase
  .from('friends')
  .insert({
    name: 'Alice',
    plant_type: 'sunflower',
    contact_frequency: 'weekly',
  })
  .select()
  .single();

// 2. Add plant
const { data: plant } = await supabase
  .from('plants')
  .insert({
    friend_id: friend.id,
    grid_position_x: 2,
    grid_position_y: 3,
  })
  .select()
  .single();
```

### Get All Plants

```typescript
const { data: plants } = await supabase
  .from('plants')
  .select(`
    *,
    friends (
      id,
      name,
      phone_number,
      plant_type,
      contact_frequency
    )
  `)
  .order('created_at', { ascending: false });

// Calculate realtime hydration for each plant
const plantsWithHydration = await Promise.all(
  plants.map(async (plant) => {
    const { data: hydration } = await supabase.rpc(
      'calculate_current_hydration',
      { p_plant_id: plant.id }
    );
    return { ...plant, current_hydration: hydration };
  })
);
```

### Log Interaction (Call/Text)

```typescript
const { data: interactionId } = await supabase.rpc('log_interaction', {
  p_user_id: user.id,
  p_friend_id: friend.id,
  p_interaction_type: 'call',
  p_was_auto_detected: true,
});

// Automatically adds +40 hydration, updates stats, creates log
```

### Get Thirsty Plants

```typescript
// First update all plants
const { data: allPlants } = await supabase
  .from('plants')
  .select('id')
  .eq('is_dead', false);

for (const plant of allPlants) {
  await supabase.rpc('update_plant_hydration', {
    p_plant_id: plant.id,
  });
}

// Then get thirsty ones
const { data: thirstyPlants } = await supabase
  .from('plants')
  .select(`
    *,
    friends (name, plant_type)
  `)
  .eq('is_dead', false)
  .lt('current_hydration', 60)
  .order('current_hydration', { ascending: true });
```

### Get Recent Interactions

```typescript
const { data: interactions } = await supabase
  .from('interactions')
  .select(`
    *,
    friends (name, plant_type)
  `)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Update Friend's Contact Frequency

```typescript
// This automatically updates plant's decay_rate_per_day via trigger
const { data } = await supabase
  .from('friends')
  .update({ contact_frequency: 'biweekly' })
  .eq('id', friendId);
```

### Check Dead Plants

```typescript
const { data: deadPlants } = await supabase
  .from('plants')
  .select(`
    *,
    friends (name)
  `)
  .eq('is_dead', true);

// Returns plants that need revival or removal
```

### Revive Plant (Free)

```typescript
// Manual revive logic (resets to sprout, clears streak)
const { data } = await supabase
  .from('plants')
  .update({
    is_dead: false,
    death_timestamp: null,
    current_hydration: 100,
    last_hydration_update: new Date().toISOString(),
    evolution_stage: 'sprout',
    streak_count: 0,
  })
  .eq('id', plantId);

// Log revive
await supabase.from('revive_logs').insert({
  user_id: user.id,
  plant_id: plantId,
  revive_type: 'free',
  previous_stage: 'mature',
  previous_streak: 30,
  restored_stage: 'sprout',
  restored_streak: 0,
});
```

### Revive Plant (Premium)

```typescript
// Premium revive (restores previous stage + streak)
const { data: plant } = await supabase
  .from('plants')
  .select('evolution_stage, streak_count')
  .eq('id', plantId)
  .single();

await supabase
  .from('plants')
  .update({
    is_dead: false,
    death_timestamp: null,
    current_hydration: 100,
    last_hydration_update: new Date().toISOString(),
    // Keep current evolution_stage and streak_count
  })
  .eq('id', plantId);

// Log premium revive
await supabase.from('revive_logs').insert({
  user_id: user.id,
  plant_id: plantId,
  revive_type: 'premium',
  previous_stage: plant.evolution_stage,
  previous_streak: plant.streak_count,
  restored_stage: plant.evolution_stage,
  restored_streak: plant.streak_count,
});
```

### Get Garden Overview Stats

```typescript
const { data: stats } = await supabase
  .from('user_garden_overview')
  .select('*')
  .single();

// Returns: {
//   user_id: 'uuid',
//   display_name: 'Riley',
//   total_friends: 12,
//   alive_plants: 10,
//   dead_plants: 2,
//   avg_hydration: 75.3,
//   total_interactions_count: 45
// }
```

---

## Hydration & Decay Logic

### Decay Rates

| Frequency | Decay Rate | Days to 0% |
|-----------|------------|------------|
| Weekly | 14.29%/day | 7 days |
| Bi-weekly | 7.14%/day | 14 days |
| Monthly | 3.33%/day | 30 days |

### Hydration Restoration

| Interaction | Hydration Added |
|-------------|-----------------|
| Call | +40 |
| Text | +20 |
| Manual Log | +30 |

### Death Logic

- Plant reaches 0% hydration → Enters 24-hour grace period
- After 24 hours at 0% → Marked as dead
- Dead plants remain in garden until revived or removed

---

## Common Patterns

### On App Open (Update All Plants)

```typescript
async function updateAllPlants() {
  const { data: plants } = await supabase
    .from('plants')
    .select('id');

  for (const plant of plants) {
    await supabase.rpc('update_plant_hydration', {
      p_plant_id: plant.id,
    });
  }
}
```

### Check if Plant Needs Watering

```typescript
async function isPlantThirsty(plantId: string): Promise<boolean> {
  const { data: hydration } = await supabase.rpc(
    'calculate_current_hydration',
    { p_plant_id: plantId }
  );

  return hydration < 60; // Thirsty threshold
}
```

### Get Plants Needing Attention Today

```typescript
async function getPlantsNeedingAttention() {
  // Update all plants first
  await updateAllPlants();

  // Get plants below 60% hydration
  const { data } = await supabase
    .from('plants')
    .select(`
      *,
      friends (name, contact_frequency)
    `)
    .eq('is_dead', false)
    .lt('current_hydration', 60)
    .order('current_hydration', { ascending: true });

  return data;
}
```

---

## Realtime Subscriptions

### Listen for Plant Changes

```typescript
const subscription = supabase
  .channel('plants_changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'plants',
    },
    (payload) => {
      console.log('Plant updated:', payload.new);
      // Update UI with new plant data
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Listen for New Interactions

```typescript
const subscription = supabase
  .channel('interaction_logs')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'interactions',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      console.log('New interaction:', payload.new);
      // Show notification or update UI
    }
  )
  .subscribe();
```

---

## Troubleshooting

### "No rows returned" when querying

**Cause:** Row Level Security is filtering your data.

**Fix:** Ensure you're authenticated:
```typescript
const { data: session } = await supabase.auth.getSession();
if (!session) {
  // User not logged in
}
```

### Plants not decaying

**Cause:** `update_plant_hydration()` not called.

**Fix:** Call it on app open or via Edge Function.

### Hydration stuck at same value

**Cause:** `last_hydration_update` not being updated.

**Fix:** Use `update_plant_hydration()` instead of manual UPDATE.

---

## Quick SQL Snippets

### Delete All Test Data

```sql
-- ⚠️ DANGER: Deletes all data for current user
DELETE FROM interactions WHERE user_id = auth.uid();
DELETE FROM plants WHERE friend_id IN (SELECT id FROM friends WHERE user_id = auth.uid());
DELETE FROM friends WHERE user_id = auth.uid();
DELETE FROM decorative_items WHERE user_id = auth.uid();
DELETE FROM artifacts WHERE user_id = auth.uid();
```

### Reset Plant Hydration to 100%

```sql
UPDATE plants
SET
  current_hydration = 100,
  last_hydration_update = NOW(),
  is_dead = false,
  death_timestamp = NULL
WHERE id = 'plant-uuid';
```

### Manually Trigger Plant Evolution

```sql
UPDATE plants
SET
  evolution_stage = 'mature',
  total_xp = 500
WHERE id = 'plant-uuid';
```

---

## Resources

- **Full Schema Docs:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Setup Guide:** [../SUPABASE_SETUP.md](../SUPABASE_SETUP.md)
- **PRD:** [prd.md](./prd.md)
- **Supabase Dashboard:** Your project dashboard
- **SQL Editor:** Run custom queries

---

**Last Updated:** December 4, 2025
