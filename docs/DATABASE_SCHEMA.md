# Rooted - Database Schema Documentation

**Version:** 1.0
**Database:** Supabase (PostgreSQL)
**Last Updated:** December 4, 2025

---

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Enums](#enums)
- [Functions](#functions)
- [Views](#views)
- [Security (RLS)](#security-rls)
- [Common Queries](#common-queries)
- [Data Flow Examples](#data-flow-examples)

---

## Overview

The Rooted database uses PostgreSQL (via Supabase) with a normalized relational structure. Key design principles:

- **Timestamp-based hydration decay** - No cron jobs needed, calculated on-demand
- **Row Level Security (RLS)** - All user data is automatically isolated
- **One-to-one relationships** - Each friend has exactly one plant
- **Automatic triggers** - Decay rates auto-calculate, timestamps auto-update
- **Future-proof schema** - Multi-room support, artifact system ready

---

## Entity Relationship Diagram

```
┌─────────────┐
│ auth.users  │ (Supabase managed)
└──────┬──────┘
       │
       │ 1:1 (extends)
       ▼
┌─────────────────────────────┐
│ users                       │
│ - id (PK, FK → auth.users) │
│ - email                     │
│ - phone_number             │
│ - display_name             │
│ - settings...              │
└──────┬──────────────────────┘
       │
       │ 1:N
       ▼
┌─────────────────────────────┐
│ friends                     │
│ - id (PK)                  │
│ - user_id (FK)             │
│ - name                     │
│ - plant_type               │
│ - contact_frequency        │
└──────┬──────────────────────┘
       │
       │ 1:1
       ▼
┌─────────────────────────────┐
│ plants                      │
│ - id (PK)                  │
│ - friend_id (FK, UNIQUE)   │
│ - current_hydration        │
│ - evolution_stage          │
│ - grid_position_x/y        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ interactions                │
│ - id (PK)                  │
│ - friend_id (FK)           │
│ - user_id (FK)             │
│ - interaction_type         │
│ - hydration_restored       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ garden_layouts              │
│ - id (PK)                  │
│ - user_id (FK)             │
│ - theme                    │
│ - average_hydration        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ decorative_items            │
│ - id (PK)                  │
│ - user_id (FK)             │
│ - item_id                  │
│ - grid_position_x/y        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ artifacts (Post-MVP v1.1)   │
│ - id (PK)                  │
│ - user_id (FK)             │
│ - artifact_type            │
│ - attached_to_plant_id     │
└─────────────────────────────┘

┌─────────────────────────────┐
│ artifact_templates          │
│ - id (PK)                  │
│ - artifact_type (UNIQUE)   │
│ - required_streak_days     │
└─────────────────────────────┘
```

---

## Tables

### `users`

Extends Supabase's `auth.users` with app-specific profile data.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `email` | TEXT | User's email (unique) |
| `phone_number` | TEXT | Optional phone number |
| `display_name` | TEXT | User's display name |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |
| `notifications_enabled` | BOOLEAN | Push notification preference |
| `notification_time` | TIME | Preferred notification time (default: 08:00) |
| `auto_detection_enabled` | BOOLEAN | Enable call/text auto-detection |
| `is_premium` | BOOLEAN | Premium subscription status |
| `premium_expires_at` | TIMESTAMPTZ | Premium expiration date |
| `total_friends` | INTEGER | Cached count of friends |
| `total_interactions` | INTEGER | Cached count of interactions |

**Relationships:**
- 1:N with `friends`
- 1:N with `interactions`
- 1:N with `garden_layouts`
- 1:N with `decorative_items`
- 1:N with `artifacts`

**Indexes:**
- Primary key on `id`
- Unique on `email`

---

### `friends`

Represents friends added to the user's garden.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (FK → users) |
| `name` | TEXT | Friend's name (required) |
| `phone_number` | TEXT | Optional phone number |
| `email` | TEXT | Optional email |
| `plant_type` | plant_type | Plant variety (enum) |
| `contact_frequency` | contact_frequency | How often to contact (enum) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- N:1 with `users` (via `user_id`)
- 1:1 with `plants` (via `id`)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `created_at DESC`

**Constraints:**
- `name` must not be empty

---

### `plants`

Represents the plant state for each friend (one-to-one relationship).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `friend_id` | UUID | Friend reference (FK, UNIQUE) |
| `current_hydration` | NUMERIC(5,2) | Current hydration level (0-100) |
| `last_hydration_update` | TIMESTAMPTZ | Last hydration calculation time |
| `decay_rate_per_day` | NUMERIC(5,2) | Daily decay percentage |
| `is_dead` | BOOLEAN | Plant death status |
| `death_timestamp` | TIMESTAMPTZ | When plant died (if applicable) |
| `evolution_stage` | evolution_stage | Current stage (enum) |
| `streak_count` | INTEGER | Consecutive on-time interactions |
| `total_interactions` | INTEGER | Lifetime interaction count |
| `total_xp` | INTEGER | Total experience points |
| `grid_position_x` | INTEGER | X coordinate (0-5) |
| `grid_position_y` | INTEGER | Y coordinate (0-5) |
| `grid_room_id` | UUID | Room identifier (for multi-room) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- 1:1 with `friends` (via `friend_id`)
- 1:N with `artifacts` (via reverse FK)

**Indexes:**
- Primary key on `id`
- Unique on `friend_id`
- Index on `is_dead`
- Index on `(grid_position_x, grid_position_y)`

**Constraints:**
- `current_hydration` between 0 and 100
- `grid_position_x` between 0 and 5
- `grid_position_y` between 0 and 5
- `streak_count >= 0`

**Triggers:**
- Auto-calculates `decay_rate_per_day` on INSERT
- Auto-updates `updated_at` on UPDATE

---

### `interactions`

Logs all friend interactions (calls, texts, manual logs).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `friend_id` | UUID | Friend reference (FK) |
| `user_id` | UUID | User reference (FK) |
| `interaction_type` | interaction_type | Type of interaction (enum) |
| `hydration_restored` | NUMERIC(5,2) | Hydration amount added |
| `note` | TEXT | Optional user note |
| `was_auto_detected` | BOOLEAN | Auto-detected vs manual |
| `created_at` | TIMESTAMPTZ | Interaction timestamp |

**Relationships:**
- N:1 with `friends` (via `friend_id`)
- N:1 with `users` (via `user_id`)

**Indexes:**
- Primary key on `id`
- Index on `friend_id`
- Index on `user_id`
- Index on `created_at DESC`
- Index on `interaction_type`

**Constraints:**
- `hydration_restored >= 0`

---

### `garden_layouts`

Garden configuration and theme settings.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (FK) |
| `room_id` | UUID | Room identifier |
| `theme` | garden_theme | Visual theme (enum) |
| `grid_size` | INTEGER | Grid dimensions (default: 6) |
| `average_hydration` | NUMERIC(5,2) | Overall garden health |
| `last_health_check` | TIMESTAMPTZ | Last health calculation |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- N:1 with `users` (via `user_id`)
- 1:N with `decorative_items`

**Indexes:**
- Primary key on `id`
- Index on `user_id`

**Constraints:**
- `grid_size` between 6 and 12

---

### `decorative_items`

Furniture and decorations placed in the garden.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (FK) |
| `garden_layout_id` | UUID | Garden reference (FK, nullable) |
| `item_id` | TEXT | Item identifier (e.g., 'wooden-table') |
| `item_name` | TEXT | Display name |
| `grid_position_x` | INTEGER | X coordinate (0-5) |
| `grid_position_y` | INTEGER | Y coordinate (0-5) |
| `is_premium` | BOOLEAN | Premium-only item |
| `unlocked_at` | TIMESTAMPTZ | Unlock timestamp |

**Relationships:**
- N:1 with `users` (via `user_id`)
- N:1 with `garden_layouts` (via `garden_layout_id`)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `garden_layout_id`

**Constraints:**
- `grid_position_x` between 0 and 5
- `grid_position_y` between 0 and 5

---

### `artifacts`

Collectible rewards earned through streaks and garden health (Post-MVP v1.1).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (FK) |
| `artifact_type` | TEXT | Type (e.g., 'butterfly', 'bee') |
| `artifact_category` | TEXT | 'plant_level' or 'garden_level' |
| `attached_to_plant_id` | UUID | Plant reference (nullable) |
| `grid_position_x` | INTEGER | X coordinate (for garden-level) |
| `grid_position_y` | INTEGER | Y coordinate (for garden-level) |
| `required_streak_days` | INTEGER | Streak requirement |
| `required_avg_hydration` | NUMERIC(5,2) | Hydration requirement |
| `is_unlocked` | BOOLEAN | Unlock status |
| `is_active` | BOOLEAN | Visibility toggle |
| `unlocked_at` | TIMESTAMPTZ | Unlock timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Relationships:**
- N:1 with `users` (via `user_id`)
- N:1 with `plants` (via `attached_to_plant_id`, nullable)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `attached_to_plant_id`
- Index on `is_unlocked`

**Constraints:**
- `artifact_category` must be 'plant_level' or 'garden_level'

---

### `artifact_templates`

Master list of available artifacts (seed data, not user-specific).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `artifact_type` | TEXT | Type identifier (unique) |
| `artifact_category` | TEXT | Category |
| `display_name` | TEXT | Display name |
| `description` | TEXT | Description |
| `required_streak_days` | INTEGER | Streak requirement (nullable) |
| `required_avg_hydration` | NUMERIC(5,2) | Hydration requirement (nullable) |
| `is_premium` | BOOLEAN | Premium-only |
| `sort_order` | INTEGER | Display order |

**Relationships:**
- None (reference data)

**Indexes:**
- Primary key on `id`
- Unique on `artifact_type`

**Seed Data:**
- Butterfly (7-day streak)
- Bee (14-day streak)
- Hummingbird (30-day streak)
- Firefly (60-day streak)
- Dragonfly (90-day streak)
- Wind Chime (70% avg hydration for 7 days)
- Bird Feeder (80% avg hydration for 14 days)
- Garden Painting (85% avg hydration for 30 days)
- Friendly Cat (90% avg hydration for 60 days)
- Garden Gnome (95% avg hydration for 90 days)

---

### `revive_logs`

Tracks plant revival history (free vs premium).

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner (FK) |
| `plant_id` | UUID | Plant reference (FK) |
| `revive_type` | TEXT | 'free' or 'premium' |
| `previous_stage` | evolution_stage | Stage before death |
| `previous_streak` | INTEGER | Streak before death |
| `restored_stage` | evolution_stage | Stage after revive |
| `restored_streak` | INTEGER | Streak after revive |
| `created_at` | TIMESTAMPTZ | Revive timestamp |

**Relationships:**
- N:1 with `users` (via `user_id`)
- N:1 with `plants` (via `plant_id`)

**Indexes:**
- Primary key on `id`

**Constraints:**
- `revive_type` must be 'free' or 'premium'

---

## Enums

### `plant_type`

Available plant varieties:
- `cactus` - Desert plant, drought-resistant aesthetic
- `fern` - Tropical lush plant
- `succulent` - Hardy, low-maintenance
- `ivy` - Climbing vine
- `sunflower` - Cheerful, bright
- `bonsai` - Zen miniature tree
- `rose` - Classic flowering bush
- `herb` - Practical herb garden

### `evolution_stage`

Plant growth stages:
- `sprout` - Days 0-7, initial stage
- `young` - Days 8-30, growing stage
- `mature` - Days 31+, fully grown

### `contact_frequency`

How often user contacts friend:
- `weekly` - Every 7 days (14.29% daily decay)
- `biweekly` - Every 14 days (7.14% daily decay)
- `monthly` - Every 30 days (3.33% daily decay)

### `interaction_type`

Types of interactions:
- `call` - Phone call (+40 hydration)
- `text` - Text message (+20 hydration)
- `manual` - Manual log (+30 hydration)

### `garden_theme`

Garden visual themes:
- `cozy_greenhouse` - MVP default
- `moonlight` - Post-MVP
- `cosmic` - Post-MVP
- `underwater` - Post-MVP

---

## Functions

### `calculate_current_hydration(plant_id UUID) → NUMERIC`

Calculates plant's current hydration based on elapsed time since `last_hydration_update`.

**Algorithm:**
```
elapsed_hours = NOW() - last_hydration_update
elapsed_days = elapsed_hours / 24
decay_amount = elapsed_days × decay_rate_per_day
new_hydration = MAX(0, current_hydration - decay_amount)
```

**Usage:**
```sql
-- Get current hydration for a plant
SELECT calculate_current_hydration('plant-uuid-here');
-- Returns: 73.45
```

**When to call:**
- On app open (to display current state)
- Before checking if plant is thirsty
- When rendering garden view

---

### `update_plant_hydration(plant_id UUID) → VOID`

Updates plant's hydration in database and marks as dead if necessary.

**Logic:**
1. Calculates current hydration using `calculate_current_hydration()`
2. Updates `current_hydration` and `last_hydration_update`
3. Marks `is_dead = true` if hydration = 0 for >24 hours
4. Sets `death_timestamp` if newly dead

**Usage:**
```sql
-- Update single plant
SELECT update_plant_hydration('plant-uuid');

-- Update all plants (run on app open)
SELECT update_plant_hydration(id) FROM plants;
```

**When to call:**
- When user opens app (update all plants)
- Before displaying plant details
- Periodically via Edge Function (optional)

---

### `log_interaction(user_id, friend_id, interaction_type, ...) → UUID`

Logs an interaction and automatically restores plant hydration.

**Parameters:**
- `p_user_id` (UUID) - User performing interaction
- `p_friend_id` (UUID) - Friend being contacted
- `p_interaction_type` (interaction_type) - 'call', 'text', or 'manual'
- `p_hydration_amount` (NUMERIC, optional) - Custom hydration amount
- `p_note` (TEXT, optional) - User note
- `p_was_auto_detected` (BOOLEAN, default false) - Auto-detected flag

**Returns:** `interaction_id` (UUID)

**Automatic Actions:**
1. Calculates current hydration
2. Adds hydration (call: +40, text: +20, manual: +30)
3. Caps hydration at 100
4. Increments `total_interactions` and `total_xp`
5. Revives plant if dead
6. Inserts interaction record
7. Updates user's total interaction count

**Usage:**
```sql
-- Log a phone call
SELECT log_interaction(
  'user-uuid',
  'friend-uuid',
  'call'::interaction_type,
  NULL, -- use default +40
  'Called from app',
  true -- auto-detected
);
-- Returns: 'interaction-uuid'

-- Log manual interaction with custom hydration
SELECT log_interaction(
  'user-uuid',
  'friend-uuid',
  'manual'::interaction_type,
  50, -- custom amount
  'Had coffee together',
  false
);
```

---

### `calculate_decay_rate(contact_frequency) → NUMERIC`

Returns daily decay rate for given contact frequency.

**Logic:**
```
weekly: 100 / 7 = 14.29% per day
biweekly: 100 / 14 = 7.14% per day
monthly: 100 / 30 = 3.33% per day
```

**Usage:**
```sql
SELECT calculate_decay_rate('weekly'::contact_frequency);
-- Returns: 14.29
```

**When to call:**
- Automatically called by triggers (no manual use needed)
- When friend's contact frequency changes

---

## Views

### `user_garden_overview`

Aggregated garden statistics per user.

**Columns:**
- `user_id` - User UUID
- `display_name` - User's display name
- `total_friends` - Count of friends
- `alive_plants` - Count of living plants
- `dead_plants` - Count of dead plants
- `avg_hydration` - Average hydration across alive plants
- `total_interactions_count` - Total interaction count

**Usage:**
```sql
-- Get current user's garden overview
SELECT * FROM user_garden_overview
WHERE user_id = auth.uid();
```

---

## Security (RLS)

**All tables have Row Level Security (RLS) enabled.**

### How RLS Works

Supabase automatically filters queries based on the authenticated user (`auth.uid()`).

**Example:**
```sql
-- User A is authenticated (auth.uid() = 'user-a-uuid')

-- This query automatically filters to User A's friends only
SELECT * FROM friends;
-- Returns: Only User A's friends

-- Even if you explicitly try to access User B's data
SELECT * FROM friends WHERE user_id = 'user-b-uuid';
-- Returns: 0 rows (RLS blocks it)
```

### RLS Policies

**Users:**
- Can SELECT own profile
- Can UPDATE own profile

**Friends:**
- Can SELECT/INSERT/UPDATE/DELETE own friends only

**Plants:**
- Can SELECT/INSERT/UPDATE/DELETE plants linked to own friends

**Interactions:**
- Can SELECT own interactions
- Can INSERT own interactions

**Garden Layouts, Decorative Items, Artifacts:**
- Can SELECT/INSERT/UPDATE/DELETE own records only

### Service Role Bypass

The `service_role` key bypasses RLS (use carefully in backend functions only).

---

## Common Queries

### Get All User's Plants with Friend Info

```sql
SELECT
  p.*,
  f.name AS friend_name,
  f.phone_number,
  f.plant_type,
  f.contact_frequency,
  calculate_current_hydration(p.id) AS realtime_hydration
FROM plants p
JOIN friends f ON f.id = p.friend_id
WHERE f.user_id = auth.uid()
ORDER BY p.created_at DESC;
```

### Get Thirsty Plants (Hydration < 60%)

```sql
SELECT
  p.id,
  f.name,
  calculate_current_hydration(p.id) AS current_hydration
FROM plants p
JOIN friends f ON f.id = p.friend_id
WHERE f.user_id = auth.uid()
  AND p.is_dead = false
  AND calculate_current_hydration(p.id) < 60
ORDER BY current_hydration ASC;
```

### Get Recent Interactions

```sql
SELECT
  i.*,
  f.name AS friend_name
FROM interactions i
JOIN friends f ON f.id = i.friend_id
WHERE i.user_id = auth.uid()
ORDER BY i.created_at DESC
LIMIT 20;
```

### Get Unlocked Artifacts

```sql
SELECT
  a.*,
  t.display_name,
  t.description
FROM artifacts a
JOIN artifact_templates t ON t.artifact_type = a.artifact_type
WHERE a.user_id = auth.uid()
  AND a.is_unlocked = true
ORDER BY a.unlocked_at DESC;
```

### Check Which Artifacts User Can Unlock

```sql
-- Plant-level artifacts (based on streaks)
SELECT
  t.*,
  p.streak_count,
  CASE
    WHEN p.streak_count >= t.required_streak_days THEN 'Ready to unlock'
    ELSE 'Need ' || (t.required_streak_days - p.streak_count) || ' more days'
  END AS unlock_status
FROM artifact_templates t
CROSS JOIN plants p
JOIN friends f ON f.id = p.friend_id
WHERE t.artifact_category = 'plant_level'
  AND f.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM artifacts a
    WHERE a.user_id = auth.uid()
      AND a.artifact_type = t.artifact_type
      AND a.attached_to_plant_id = p.id
  );

-- Garden-level artifacts (based on avg hydration)
SELECT
  t.*,
  gl.average_hydration,
  CASE
    WHEN gl.average_hydration >= t.required_avg_hydration THEN 'Ready to unlock'
    ELSE 'Need ' || (t.required_avg_hydration - gl.average_hydration) || '% more hydration'
  END AS unlock_status
FROM artifact_templates t
CROSS JOIN garden_layouts gl
WHERE t.artifact_category = 'garden_level'
  AND gl.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM artifacts a
    WHERE a.user_id = auth.uid()
      AND a.artifact_type = t.artifact_type
  );
```

---

## Data Flow Examples

### Adding a New Friend

```typescript
// 1. Insert friend
const { data: friend, error } = await supabase
  .from('friends')
  .insert({
    name: 'Alice Smith',
    phone_number: '+1234567890',
    plant_type: 'sunflower',
    contact_frequency: 'weekly',
  })
  .select()
  .single();

// 2. Create associated plant
const { data: plant } = await supabase
  .from('plants')
  .insert({
    friend_id: friend.id,
    grid_position_x: 2,
    grid_position_y: 3,
  })
  .select()
  .single();

// Note: decay_rate_per_day is auto-calculated by trigger
```

### Logging an Interaction

```typescript
// Simple: Use the log_interaction function
const { data: interactionId, error } = await supabase.rpc('log_interaction', {
  p_user_id: user.id,
  p_friend_id: friend.id,
  p_interaction_type: 'call',
  p_was_auto_detected: true,
});

// Function automatically:
// - Calculates current hydration
// - Adds +40 hydration (for calls)
// - Updates plant stats
// - Creates interaction record
// - Updates user total interactions
```

### Updating All Plants on App Open

```typescript
// Get all plant IDs
const { data: plants } = await supabase
  .from('plants')
  .select('id');

// Update each plant
for (const plant of plants) {
  await supabase.rpc('update_plant_hydration', {
    p_plant_id: plant.id,
  });
}

// Re-fetch updated data
const { data: updatedPlants } = await supabase
  .from('plants')
  .select(`
    *,
    friends (
      name,
      plant_type,
      contact_frequency
    )
  `);
```

### Checking for Dead Plants

```typescript
const { data: deadPlants } = await supabase
  .from('plants')
  .select(`
    *,
    friends (name)
  `)
  .eq('is_dead', true);

// Prompt user to revive or remove
for (const plant of deadPlants) {
  console.log(`${plant.friends.name}'s plant has died!`);
}
```

---

## Maintenance & Best Practices

### Daily Hydration Updates

**Option 1: Client-side (on app open)**
```typescript
// Call update_plant_hydration for all plants when user opens app
// Already documented above
```

**Option 2: Server-side (Edge Function cron)**
```typescript
// Create Supabase Edge Function
// Schedule to run daily at midnight
// Updates all plants in database
```

### Performance Optimization

**Indexes are already created for:**
- User-based lookups (all tables indexed on `user_id` or FK to user)
- Time-based queries (interactions indexed on `created_at DESC`)
- Spatial queries (plants indexed on grid position)

**Query Optimization Tips:**
- Use `calculate_current_hydration()` only when displaying data (not for batch processing)
- Cache garden overview stats in frontend state
- Use Supabase realtime subscriptions for live updates

### Backup Strategy

Supabase automatically backs up databases daily (Pro plan).

**Manual backups:**
1. Go to Database → Backups in Supabase dashboard
2. Click "Create backup"

---

## Migration History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-04 | Initial schema deployment |

---

## Support & References

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **PRD Location:** `/docs/prd.md`
- **Schema SQL:** `/supabase-schema.sql`
- **Setup Guide:** `/SUPABASE_SETUP.md`

---

**Last Updated:** December 4, 2025
**Maintained By:** Rooted Development Team
