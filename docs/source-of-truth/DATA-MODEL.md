# DATA-MODEL.md — Supabase Schema & Data Access

> **Source of truth for the schema is `supabase-schema.sql`** (repo root) and the live database.
> `docs/DATABASE_SCHEMA.md` is the long-form column-by-column reference; it predates the Batch-2
> migrations (enum additions, grid range, `handle_new_user`) — trust the SQL over it where they
> disagree. This file is the working summary plus the known drift and defects.

**Project ref:** `ojotriwvmudyoeyihynb` — reachable via the **Supabase MCP server** (`.mcp.json`).

---

## Current state (post Batch 2 — persistence foundation)

- `src/types/database.ts` is **generated from the live schema** (Supabase MCP
  `generate_typescript_types`, 2026-07-16). Never hand-edit it; regenerate after any migration.
  Use its `Tables<'name'>` helper for row types (see `ProfileScreen`).
- `handle_new_user()` (SECURITY DEFINER, `AFTER INSERT ON auth.users`) now creates the
  `public.users` row on signup; pre-existing auth users were backfilled. `SignUpScreen`'s
  `users` update and `ProfileScreen`'s select now have a row to hit.
- `friends` + `plants` are read/written by the app through **`src/lib/garden.ts`** — the only
  data-access layer for garden state. `FriendsContext`/`GardenContext` load per signed-in user
  and clear on sign-out. Hydration **decays client-side at load** from `last_hydration_update` ×
  `decay_rate_per_day`, frozen while `users.is_paused` (Batch 4); nothing writes decayed values
  back. **Death is CUT (ratified)** — wilt only; `is_dead`/`death_timestamp`/`revive_logs` are
  legacy.
- `interactions` + `log_interaction` are live (Batch 5 watering). `garden_layouts`,
  `decorative_items`, `artifacts`, `revive_logs` are still untouched by the app.

---

## Tables (9)

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Profile extension of `auth.users` | `email`, `display_name`, `phone_number`, `notifications_enabled`, `is_premium`, `total_friends`, `total_interactions`, `is_paused` + `paused_at` (vacation freeze, Batch 4) |
| `friends` | A friend the user tends | `user_id` → users, `name`, `plant_type`, `contact_frequency` |
| `plants` | 1:1 plant representing a friendship | `friend_id` **UNIQUE** → friends, `current_hydration` (0–100), `decay_rate_per_day` (trigger-set), `is_dead`, `evolution_stage`, `streak_count`, `total_xp`, `grid_position_x/y` (0–9) |
| `interactions` | Append-only interaction log | `friend_id`, `user_id`, `interaction_type`, `hydration_restored`, `was_auto_detected` |
| `garden_layouts` | Garden config per user | `user_id`, `room_id`, `theme`, `grid_size` (6–12), `average_hydration` |
| `decorative_items` | Furniture placed in the garden | `user_id`, `garden_layout_id`, `item_id`, `grid_position_x/y` — ⚠️ its grid CHECKs are still `<= 5`; widen like `plants` before persisting decorations |
| `artifacts` | Post-MVP collectibles (user-owned) | `user_id`, `artifact_type`, `artifact_category`, `attached_to_plant_id`, `is_unlocked` |
| `revive_logs` | Free vs premium revive history | `user_id`, `plant_id`, `revive_type` (`free`\|`premium`) |
| `artifact_templates` | Reference table of unlockables (10 seeded rows) | `artifact_type` UNIQUE, `required_streak_days`, `required_avg_hydration` |

All FKs cascade on delete from the owning user, except `artifacts.attached_to_plant_id` (SET NULL).

**Enums:** `plant_type` (cactus, fern, succulent, ivy, sunflower, bonsai, rose, herb, **monstera,
bamboo, ficus** — last three added by migration `add_plant_type_enum_values`), `evolution_stage`
(sprout/young/mature ↔ client stage 1/2/3, mapped in `src/lib/garden.ts`), `contact_frequency`
(weekly/biweekly/monthly — UI labels map via `mapFrequency()`: DAILY→weekly, CUSTOM→weekly),
`interaction_type`, `garden_theme`.

### Client↔DB mapping invariants (all live in `src/lib/garden.ts`)

- Client `Plant.id === Friend.id === friends.id`; the separate `plants.id` is never surfaced.
- `position {i,j,k}` ↔ `grid_position_x/y`; `k` is client-only (always 0 on load).
- `image` is never stored — re-derived from `plant_type` via `resolvePlantByType()`
  (`src/data/plantCatalog.ts`).
- `decay_rate_per_day` is passed by the client (same formula as `calculate_decay_rate`) but the
  BEFORE-INSERT trigger overwrites it — both paths agree by construction.

### RLS

Enabled on all 8 core tables, owner-scoped via `auth.uid()`. Notes:

- **`artifact_templates` has no RLS and no policy** (it is created after the RLS block), so the
  anon/authenticated roles can read *and write* it. Still open.
- `users` has SELECT + UPDATE policies and **no INSERT policy — deliberate**: inserts happen only
  via the SECURITY DEFINER `handle_new_user()` trigger, which bypasses RLS.

---

## Functions & triggers

| Name | Notes |
|---|---|
| `calculate_current_hydration(plant_id)` | Pure read; time-decay math, floors at 0 |
| `update_plant_hydration(plant_id)` | Persists decay, flips `is_dead`. **Defective** — the 24h death check reads the *old* `last_hydration_update` while the same UPDATE sets it to `NOW()`, so calling this on every app open means `is_dead` can effectively never become true. |
| `log_interaction(...)` | The care loop's write RPC — called by `logInteractionRemote` (`src/lib/garden.ts`) from the plant panel (Batch 5). Decays first (`calculate_current_hydration`), then restores: call 40 / text 20 / manual 30 (client passes no `p_hydration_amount` — the CASE is the source of truth), caps at 100, resets `last_hydration_update`, +10 XP, clears `is_dead` (legacy), inserts `interactions`, bumps `users.total_interactions`. Does **not** update `streak_count`, `evolution_stage`, or `users.total_friends`. |
| `calculate_decay_rate(p_frequency)` | 100/7, 100/14, 100/30. Arg name drift with the old hand-written types is resolved — generated `database.ts` declares `p_frequency` correctly. |
| `handle_new_user()` | SECURITY DEFINER; inserts `public.users (id, email, phone_number, display_name)` from `NEW` + `raw_user_meta_data` (`full_name`, `phone_number`), `ON CONFLICT DO NOTHING`. |
| `set_garden_paused(p_paused)` | SECURITY INVOKER (RLS-scoped to `auth.uid()`). Pause: stamps `users.paused_at`. Unpause: shifts every plant's `last_hydration_update` forward by the pause duration, then clears the flag. Called from the Settings toggle via `setGardenPausedRemote`. |

**Triggers:** `updated_at` maintenance on 5 tables; `set_plant_decay_rate_on_insert` (BEFORE INSERT
on plants, derives decay from the friend's frequency — verified live); `update_plant_decay_rate`
(AFTER UPDATE on friends, propagates frequency changes); `on_auth_user_created` (AFTER INSERT on
`auth.users` → `handle_new_user()`).

**View:** `user_garden_overview` — ⚠️ its LEFT JOIN to `interactions` cross-multiplies with
friends/plants and `COUNT(i.id)` is not DISTINCT, so `total_interactions_count` is inflated.

---

## Auth flow

- Client: `src/lib/supabase.ts` — `createClient<Database>` with `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, AsyncStorage persistence, `autoRefreshToken: true`,
  `detectSessionInUrl: false`. **Throws at import time if the env vars are missing.**
- Session gate: `RootNavigator` calls `getSession()` on mount and subscribes to `onAuthStateChange`,
  then renders `MainNavigator` (session) or `AuthNavigator` (no session).
- Garden load: `GardenContext` runs the same `getSession()` + `onAuthStateChange` pattern
  (deferred with `setTimeout` — supabase-js holds a lock during the callback) and calls
  `fetchGarden(userId)` on sign-in / clears both contexts on sign-out. A user-id ref suppresses
  redundant reloads on `TOKEN_REFRESHED`.
- Sign in: `LoginScreen` → `signInWithPassword`.
- Sign up: **two competing paths** — `SignUpScreen` (`signUp` then `users` update) and
  `Onboarding9CreateAccount` (`signUp` with `options.data` raw metadata, then seeds the first
  friend via `addPlant` **iff `signUp` returned a session** — i.e. email confirmation is disabled
  in the project; otherwise the seed is skipped with a console warning). These should be reconciled.
- User id: each screen re-fetches via `supabase.auth.getUser()`. **There is no shared
  `AuthContext` / `useAuth` hook** — worth adding.

---

## Database access rules

- Use the **Supabase MCP server** for all schema inspection and DDL/DML. Do not shell out to `psql`.
- DDL (new table, column, enum value, trigger, policy) → `apply_migration`. DML → `execute_sql`.
- Any schema change must be reflected in **`supabase-schema.sql`** and in this file.
- Regenerate `src/types/database.ts` from the live schema rather than hand-editing it.
- App-side reads/writes of garden state go through `src/lib/garden.ts` — don't scatter
  `supabase.from('friends'|'plants')` calls elsewhere.
