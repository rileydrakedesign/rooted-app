# Supabase Setup Guide for Rooted

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `rooted-app`
4. Database Password: (save this securely)
5. Region: Choose closest to your users
6. Click "Create new project"

### 2. Run the Schema

Once your project is created:

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the editor
5. Click **Run** (bottom right)

**Expected result:** "Success. No rows returned" (this is correct!)

### 3. Verify Setup

Check that tables were created:

1. Go to **Table Editor** in sidebar
2. You should see these tables:
   - `users`
   - `friends`
   - `plants`
   - `interactions`
   - `garden_layouts`
   - `decorative_items`
   - `artifacts`
   - `revive_logs`
   - `artifact_templates`

### 4. Get Your API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them for your React Native app):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Schema Overview

### Core Tables

**users** (extends Supabase auth.users)
- User profile, settings, premium status
- Auto-created when user signs up

**friends**
- Friend records (name, contact info)
- Links to plants (one-to-one)

**plants**
- Plant state (hydration, evolution, position)
- Auto-calculates decay based on timestamp

**interactions**
- Log of all calls/texts with friends
- Tracks auto-detected vs manual

**garden_layouts**
- Garden theme and configuration
- Multi-room support (future)

**decorative_items**
- Furniture and decorations placed in garden

**artifacts** (Post-MVP v1.1)
- Collectible butterflies, bees, wind chimes, etc.
- Unlocked by streaks and garden health

**artifact_templates**
- Master list of available artifacts to unlock

### Key Functions

#### `calculate_current_hydration(plant_id)`
Calculates plant's current hydration based on elapsed time since last update.

**Usage:**
```sql
SELECT calculate_current_hydration('plant-uuid-here');
-- Returns: 73.45 (current hydration percentage)
```

#### `update_plant_hydration(plant_id)`
Updates plant's hydration and marks as dead if necessary.

**Usage:**
```sql
SELECT update_plant_hydration('plant-uuid-here');
```

Call this:
- When user opens the app (update all plants)
- Periodically via Edge Function (optional)

#### `log_interaction(user_id, friend_id, interaction_type, ...)`
Logs an interaction and restores plant hydration automatically.

**Usage:**
```sql
SELECT log_interaction(
  'user-uuid',
  'friend-uuid',
  'call'::interaction_type,
  NULL, -- use default hydration amount (40 for calls)
  'Called from app', -- optional note
  true -- was auto-detected
);
-- Returns: interaction_id (UUID)
```

**Default hydration amounts:**
- Call: +40
- Text: +20
- Manual: +30

#### `calculate_decay_rate(contact_frequency)`
Returns daily decay rate for given frequency.

**Usage:**
```sql
SELECT calculate_decay_rate('weekly'::contact_frequency);
-- Returns: 14.29 (decays 14.29% per day)
```

## Row Level Security (RLS)

✅ **All tables have RLS enabled** - users can only access their own data.

**What this means:**
- Users can only see their own friends, plants, interactions
- No user can access another user's data
- Supabase automatically enforces this based on `auth.uid()`

**Example:**
```sql
-- This query automatically filters to current user's friends
SELECT * FROM friends;

-- Even if you try to access another user's data, RLS blocks it
SELECT * FROM friends WHERE user_id = 'someone-elses-uuid';
-- Returns: 0 rows (RLS filters it out)
```

## Authentication Setup

### Enable Email + Phone Authentication

1. Go to **Authentication** → **Providers**
2. Enable:
   - ✅ **Email** (enabled by default)
   - ✅ **Phone** (SMS-based login)
   - ✅ **Apple** (Sign in with Apple for iOS)

3. For Phone auth:
   - Click **Phone**
   - Choose SMS provider (Twilio recommended)
   - Add API credentials

4. For Apple auth:
   - Click **Apple**
   - Add your Apple Developer Team ID
   - Add Service ID, Key ID, and Private Key

### Email Templates (Optional Customization)

Go to **Authentication** → **Email Templates** to customize:
- Confirmation email
- Magic link email
- Password reset email

Make them match Rooted's pixel art aesthetic!

## React Native Integration

### Install Supabase Client

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### Initialize Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Example Usage

#### Sign Up User
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});
```

#### Sign In User
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});
```

#### Add a Friend
```typescript
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

// Then create the associated plant
const { data: plant, error: plantError } = await supabase
  .from('plants')
  .insert({
    friend_id: friend.id,
    grid_position_x: 2,
    grid_position_y: 3,
  })
  .select()
  .single();
```

#### Log an Interaction
```typescript
const { data, error } = await supabase.rpc('log_interaction', {
  p_user_id: user.id,
  p_friend_id: friend.id,
  p_interaction_type: 'call',
  p_was_auto_detected: true,
});
```

#### Get All User's Plants
```typescript
const { data: plants, error } = await supabase
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
```

#### Update Plant Hydration on App Open
```typescript
// Get all plant IDs
const { data: plants } = await supabase
  .from('plants')
  .select('id');

// Update each plant's hydration
for (const plant of plants) {
  await supabase.rpc('update_plant_hydration', {
    p_plant_id: plant.id,
  });
}

// Re-fetch updated plants
const { data: updatedPlants } = await supabase
  .from('plants')
  .select('*');
```

## Realtime Subscriptions (Optional)

Enable realtime updates when data changes:

```typescript
// Listen for plant hydration changes
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
      // Update your React state here
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

## Database Maintenance

### Periodic Hydration Update (Edge Function)

Create a Supabase Edge Function to update all plants daily:

```typescript
// supabase/functions/update-all-plants/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get all plants
  const { data: plants } = await supabase
    .from('plants')
    .select('id');

  // Update each plant
  for (const plant of plants || []) {
    await supabase.rpc('update_plant_hydration', {
      p_plant_id: plant.id,
    });
  }

  return new Response(JSON.stringify({ updated: plants?.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Schedule this to run daily via cron (Supabase Edge Functions support cron).

## Backup & Migrations

### Database Backups

Supabase automatically backs up your database daily (Pro plan).

**Manual backup:**
1. Go to **Database** → **Backups**
2. Click **Create backup**

### Schema Migrations

When you make schema changes:

1. Create a new migration file
2. Go to **SQL Editor**
3. Run your migration SQL
4. Save to version control

**Example migration (add new column):**
```sql
-- Migration: Add plant_nickname column
ALTER TABLE public.plants
ADD COLUMN plant_nickname TEXT;

COMMENT ON COLUMN public.plants.plant_nickname IS 'User-defined nickname for plant';
```

## Troubleshooting

### "No rows returned" when querying

**Cause:** Row Level Security is blocking your query.

**Fix:** Make sure you're authenticated:
```typescript
const { data: session } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
```

### Plants not decaying

**Cause:** `update_plant_hydration()` not being called.

**Fix:** Call this function when user opens app or via Edge Function cron.

### Foreign key constraint errors

**Cause:** Trying to insert plant without valid friend_id.

**Fix:** Always create friend first, then plant:
```typescript
// 1. Create friend
const { data: friend } = await supabase
  .from('friends')
  .insert({ name: 'Bob' })
  .select()
  .single();

// 2. Create plant (references friend.id)
const { data: plant } = await supabase
  .from('plants')
  .insert({ friend_id: friend.id, ... })
  .select()
  .single();
```

## Next Steps

1. ✅ Run `supabase-schema.sql` in SQL Editor
2. ✅ Configure authentication providers
3. ✅ Get API credentials
4. ✅ Install `@supabase/supabase-js` in your React Native app
5. ✅ Initialize Supabase client
6. 🚀 Start building!

## Resources

### Rooted Documentation

- **[Database Schema Documentation](./docs/DATABASE_SCHEMA.md)** - Complete schema reference, ERD, tables, functions, queries
- **[Database Quick Reference](./docs/DATABASE_QUICK_REFERENCE.md)** - Cheat sheet for common operations
- **[Product Requirements Document](./docs/prd.md)** - Full PRD with technical specs

### Supabase Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactnative)
