# DATA-MODEL.md — Supabase Schema & Data Access

> **Source of truth for the schema is `supabase-schema.sql`** (repo root) and the live database.
> `docs/DATABASE_SCHEMA.md` is the long-form column-by-column reference; it predates the Batch-2
> migrations (enum additions, grid range, `handle_new_user`) — trust the SQL over it where they
> disagree. This file is the working summary plus the known drift and defects.

**Project ref:** `ojotriwvmudyoeyihynb` — reachable via the **Supabase MCP server** (`.mcp.json`).

---

## Current state (post Batch 18 — full scope-plan roadmap implemented)

- `src/types/database.ts` is **generated from the live schema** (Supabase MCP
  `generate_typescript_types`, 2026-07-21). Never hand-edit it; regenerate after any migration.
  Use its `Tables<'name'>` helper for row types (see `src/lib/garden.ts`).
- `handle_new_user()` (SECURITY DEFINER, `AFTER INSERT ON auth.users`) now creates the
  `public.users` row on signup; pre-existing auth users were backfilled.
- **Batch 6 (migration `batch6_solid_ground`)**: `log_interaction` reweighted in-person-first
  (manual/"hung out" 50, call 35, text 15) and gained `p_interaction_id` (client UUID) for
  idempotent offline-queue replay; `artifact_templates` got RLS (SELECT for authenticated, no
  writes); `decorative_items` grid CHECKs widened to `<= 9`; `user_garden_overview` dropped.
- **Batch 7 (migration `batch7_streaks`)**: per-plant period streaks, lazily evaluated.
  `plants` gained `streak_window_start/satisfied`, `streak_best`, `streak_broken_at/-count`,
  `prestige_level`. ONE roll-forward function (`roll_plant_streak`) owns the window math,
  shared by `sync_streaks()` (called from `fetchGarden`) and `log_interaction` (satisfies the
  window +1 atomically with hydration). Evolution decoupled: stage advances on lifetime
  interactions (young ≥ 5, mature ≥ 20), never regresses. Pause shifts all streak clocks;
  cadence change never insta-breaks; backdating clamped to 48 h via `p_occurred_at`.
- **Batch 8 (migration `batch8_notification_prefs`)**: `users.notification_prefs jsonb`
  (per-category toggles + digest hour) replaces the cosmetic Settings toggles. Everything is
  **client-scheduled local notifications** (D2 — cancel-all-and-reschedule engine in
  `src/lib/notifications.ts`, driven by GardenContext on every settled state); calendar
  suggestions scan via `src/lib/calendarScan.ts`. `notifications_enabled` /
  `notification_time` are legacy. No server push until linking (Batch 13).
- **Batch 9 (migration `batch9_economy_core`)**: the D1 economy. `ledger_entries` (append-only
  truth, owner-SELECT RLS, deterministic `idempotency_key` UNIQUE) + trigger-maintained
  `users.points_balance`/`gems_balance` caches. `log_interaction` is now **SECURITY DEFINER**
  (explicit `auth.uid()` ownership checks), **returns jsonb** (hydration + streak + mint), and
  mints in-transaction: full mint = base × `streak_multiplier(streak)` once per plant per day
  (`mint:<friend_id>:<date>`), 5-pt trickle after; gem drops — tier-up 3
  (`gem:tierup:<friend>:<streak>`, once ever per tier per friend), prestige 5, first call of
  year 2. `restore_streak(p_friend_id, p_currency)`: one-period window, price 100 ×
  `streak_tier_index(broken)` × 2^(restores in 90 d) or flat 5 gems; re-arms the window
  **unsatisfied**. Client: `src/lib/economy.ts`, TopBar HUD, mint toast + restore card in
  `PlantInfoPanel`. Cash-for-gems: **no** — the ledger reserves a `purchase` source_type only.
- **Batch 10 (migration `batch10_shop_v1`)**: `shop_items` (12 seeded SKUs; read-only RLS;
  both prices NULL = milestone-only, e.g. the prestige `pot-golden-ring`), `user_items`
  inventory (UNIQUE user+sku), `plant_attachments` (UNIQUE plant+slot, slot = category;
  owner-scoped RLS via plants→friends). Atomic `purchase_item(p_sku, p_currency)` RPC
  (SECURITY DEFINER, key `purchase:<user>:<sku>`). Client: `src/lib/shop.ts`, ShopScreen
  (TopBar entry), customize section in `PlantInfoPanel`, sprite compositing in
  `DraggablePlant` via `src/data/attachmentCatalog.ts` — **all sprite assets are null until
  the user designs them** (nameplates render as text plates and work today). Client `Plant`
  carries `dbPlantId` (plants.id) solely for attachment writes.
- **Batch 11 (migration `batch11_memory_layer`)**: `friends.birthday date`; `journal_entries`
  (kind note|date|gift_idea|milestone, owner RLS); `photos` (storage_path, `is_shared` flag
  pre-designed for Batch 14); private Storage bucket **`memories`** with path-prefix RLS
  (`<user_id>/<friend_id>/<uuid>.jpg`). Client: `src/lib/memories.ts` (picker → resize 1600px
  → upload → row; signed-URL reads; soft 20-photo cap until Batch 17), `MemoryWallScreen`
  (photos + journal + birthday), hangout-log photo prompt, birthday reminders in the Batch 8
  scheduler, birthday badge in-garden (placeholder until party sprites land).
- **Batch 12 (migration `batch12_garden_scope_catalog`)**: `garden_layouts` finally wired
  (get-or-create on load; `theme` = equipped garden theme) and `decorative_items` persistence
  live (item_id = shop sku; drag-to-move, long-press to store). Shop catalog gained
  `garden_theme` + `decor` SKUs — `purchase_item` unchanged. Client: map registry
  `src/data/maps/` (D4) replaces every direct `exampleMap` import; validation/hit-testing
  parameterized by the active map; reactive decor driven by aggregate `gardenSignals` only.
- **Batch 13 (migrations `batch13_linking_core` + `batch13_linked_log_interaction`)**:
  cross-user plants. `link_invites` (single-use 8-char codes, 14-day expiry, silent
  asymmetry), `garden_links` (**the shared streak lives here**; per-plant fields become
  display mirrors; period = the longer cadence; freezes if either member pauses),
  `link_events` (D5 merge groups; in the Realtime publication), `push_tokens` + the first
  Edge Function **`send-push`** (dumb Expo sender). `log_interaction` v4: linked logs water
  BOTH plants and satisfy the shared streak once per merge group; a partner's same-type
  same-day log joins the group but still mints (both sides earn — co-op out-earns solo).
  `restore_streak` v2 is link-aware. Client: `src/lib/links.ts`, invite share sheet from
  `PlantInfoPanel`, `AcceptInviteScreen` (deep link `rooted://invite/<code>` + typeable code
  fallback), Realtime subscription + partner push after linked logs, push-token registration
  on sign-in. **Live-tested end-to-end** (invite → accept → both-sides log → merge verified).
- **Batch 14 (migration `batch14_communication_layer`)**: `nudges` (5 ambient types + 3 remote
  plant actions; payload jsonb; Realtime; `send_nudge` RPC — membership + 3/link/day cap;
  **mints nothing**, §8), `friends.haptic_signature` (per-friend buzz). Gift restores work by
  construction (shared streak — either member's restore saves both). Edge Function
  **`shared-wall`** signs both sides' `is_shared` photos after a membership check. Client:
  `src/lib/nudges.ts`, nudge picker + haptic editor in `PlantInfoPanel`, receive-side wiggle
  animation in `DraggablePlant` + signature haptics, shared-wall section + tap-to-share in
  `MemoryWallScreen`, linked hangout photos default to the shared wall (dual-photo moment).
- **Batch 15 (migration `batch15_social_economy`)**: `shop_items.scope` = capability tier
  (self/gift/shared); `purchase_item` v2 takes `p_scope` + `p_link_id` — gift writes the
  partner's inventory (giver in metadata), shared writes both from ONE spend (buyer pays
  full, both receive — default #14). Scope selector in ShopScreen; gifted-item push ping.
- **Batch 16 (migration `batch16_time_capsules`)**: `capsules` (note/photo/voice; `link_id`
  = buried together; owner RLS + link-member SELECT). `bury_capsule` RPC enforces slots
  server-side (1/plant free, 5 with Pass). Lazy unlock + local notification at `unlock_at`.
  Client: `src/lib/capsules.ts` + `CapsuleSection` on the memory wall (records voice via
  expo-audio; photo capsules ride the photo-upload path).
- **Batch 17 (migration `batch17_garden_pass_entitlements`)**: `users.premium_until` +
  `user_is_premium()`; server-enforced caps — `friends_plant_cap` (12 free) and `photos_cap`
  (20/plant free) triggers, capsule slots in `bury_capsule`. Edge Function
  **`revenuecat-webhook`** (fail-closed secret) flips the flag from RevenueCat lifecycle
  events. Client: `src/lib/purchases.ts` (config-gated on `EXPO_PUBLIC_REVENUECAT_IOS_KEY`,
  graceful no-op without it), `GardenPassScreen` paywall (Settings entry), downgrade
  soft-lock (`lockedPlantIds` — view-only, never deleted). **User setup still required**:
  RevenueCat app/products + env key + webhook secret.
- **Batch 18 (migrations `batch18_almanac_liveops_longtail` + `batch18_seasonal_gems`)**:
  Almanac (`src/lib/almanac.ts` + `AlmanacScreen` — recap card, collection, Pass-gated
  history); collections activate via `sync_artifacts()`; live-ops — pg_cron +
  `seasonal_events` + `shop_items.event_window` (hourly `shop-event-windows` job) +
  `award_seasonal_gems` trigger (both-showed-up gem drop); Music Box previews-only v1
  (nudge type `song`, iTunes previews, expo-audio); helper SKUs. CallKit auto-watering NOT
  built (device spike required); in-app "Call now" assist ships instead.
- `revive_logs`, `is_dead`, `update_plant_hydration` remain untouched legacy — forever.
- `friends` + `plants` are read/written by the app through **`src/lib/garden.ts`** — the only
  data-access layer for garden state. `FriendsContext`/`GardenContext` load per signed-in user
  and clear on sign-out. Hydration **decays client-side at load** from `last_hydration_update` ×
  `decay_rate_per_day`, frozen while `users.is_paused` (Batch 4); nothing writes decayed values
  back. **Death is CUT (ratified)** — wilt only; `is_dead`/`death_timestamp`/`revive_logs` are
  legacy.
- `interactions` + `log_interaction` are live. `garden_layouts` + `decorative_items` are wired
  (Batch 12). Still untouched by the app: `artifacts`, `revive_logs` (legacy).

---

## Tables (22)

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Profile extension of `auth.users` | `email`, `display_name`, `phone_number`, `notifications_enabled`, `is_premium`, `total_friends`, `total_interactions`, `is_paused` + `paused_at` (vacation freeze, Batch 4) |
| `friends` | A friend the user tends | `user_id` → users, `name`, `plant_type`, `contact_frequency` |
| `plants` | 1:1 plant representing a friendship | `friend_id` **UNIQUE** → friends, `current_hydration` (0–100), `decay_rate_per_day` (trigger-set), `is_dead` (legacy), `evolution_stage` (lifetime-interaction driven), `streak_count` + `streak_window_start/satisfied` + `streak_best` + `streak_broken_at/-count` + `prestige_level` (Batch 7), `total_xp`, `grid_position_x/y` (0–9) |
| `interactions` | Append-only interaction log | `friend_id`, `user_id`, `interaction_type`, `hydration_restored`, `was_auto_detected` |
| `garden_layouts` | Garden config per user | `user_id`, `room_id`, `theme`, `grid_size` (6–12), `average_hydration` |
| `decorative_items` | Furniture placed in the garden | `user_id`, `garden_layout_id`, `item_id`, `grid_position_x/y` (0–9, widened Batch 6) |
| `artifacts` | Post-MVP collectibles (user-owned) | `user_id`, `artifact_type`, `artifact_category`, `attached_to_plant_id`, `is_unlocked` |
| `revive_logs` | Free vs premium revive history | `user_id`, `plant_id`, `revive_type` (`free`\|`premium`) |
| `artifact_templates` | Reference table of unlockables (10 seeded rows) | `artifact_type` UNIQUE, `required_streak_days`, `required_avg_hydration` |
| `ledger_entries` | Append-only economy truth (Batch 9) | `currency` (`points`\|`gems`), signed `amount`, `reason`, `source_type`, `idempotency_key` UNIQUE, `metadata` — owner SELECT only; writes via SECURITY DEFINER RPCs |
| `shop_items` | Cosmetics catalog (Batch 10) | `sku` PK, `category`, `scope` (`self` now; `gift`/`shared` in Batch 15), `price_points`/`price_gems` (both NULL = earned-only), `asset_key`, `is_active` |
| `user_items` | Cosmetics inventory (Batch 10) | UNIQUE (`user_id`,`sku`), `acquired_via`, `ledger_entry_id` |
| `plant_attachments` | Equipped cosmetics per plant slot (Batch 10) | UNIQUE (`plant_id`,`slot`); owner RLS via plants→friends |
| `journal_entries` | Per-friend journal (Batch 11) | `kind` (`note`\|`date`\|`gift_idea`\|`milestone`), `body`, `event_date` |
| `photos` | Memory-wall photos (Batch 11) | `storage_path` → `memories` bucket, `interaction_id`, `is_shared` (Batch 14 flag) |
| `link_invites` | Link invite codes (Batch 13) | `code` UNIQUE, `status`, `expires_at`; inviter-only SELECT |
| `garden_links` | Linked pairs + THE shared streak (Batch 13) | `user_a/b`, `friend_a/b_id`, shared window/streak fields; member SELECT |
| `link_events` | Linked logs + D5 merge groups (Batch 13) | `merge_group_id`, `interaction_type`, `occurred_at`; Realtime-enabled |
| `push_tokens` | Expo push tokens (Batch 13) | PK (`user_id`,`token`); owner ALL |
| `nudges` | Ambient signals + plant actions (Batch 14) | `type`, `payload`, `seen_at`; member SELECT, receiver UPDATE; Realtime; 3/day cap in `send_nudge` |
| `capsules` | Time capsules (Batch 16) | `kind` (`note`\|`photo`\|`voice`), `unlock_at`, `opened_at`, `link_id` (co-op); slots RPC-enforced |
| `seasonal_events` | Live-ops event windows (Batch 18) | `starts_at`/`ends_at`; read-only to clients; drives shop `event_window` + seasonal gems |

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

Enabled on all 9 tables, owner-scoped via `auth.uid()`. Notes:

- `artifact_templates` (fixed Batch 6): RLS enabled, **SELECT for authenticated only** — it is
  read-only reference data; writes happen via migrations.
- `users` has SELECT + UPDATE policies and **no INSERT policy — deliberate**: inserts happen only
  via the SECURITY DEFINER `handle_new_user()` trigger, which bypasses RLS.

---

## Functions & triggers

| Name | Notes |
|---|---|
| `calculate_current_hydration(plant_id)` | Pure read; time-decay math, floors at 0 |
| `update_plant_hydration(plant_id)` | Persists decay, flips `is_dead`. **Defective** — the 24h death check reads the *old* `last_hydration_update` while the same UPDATE sets it to `NOW()`, so calling this on every app open means `is_dead` can effectively never become true. |
| `log_interaction(...)` | The care loop's write RPC — called by `logInteractionRemote` (`src/lib/garden.ts`) from the plant panel. Decays first (`calculate_current_hydration`), then restores: **manual ("hung out") 50 / call 35 / text 15** (Batch 6 in-person-first rework; client passes no `p_hydration_amount` — the CASE is the source of truth), caps at 100, resets `last_hydration_update`, +10 XP, inserts `interactions`, bumps `users.total_interactions`. `p_interaction_id` (client-generated UUID) makes it **idempotent** (offline queue, `src/lib/logQueue.ts`). `p_occurred_at` backdates up to 48 h (streak credit + `interactions.created_at`; hydration still treats it as now). Streak: rolls to the occurrence, satisfies the window (+1 streak, best, prestige at 13/17/21…), rolls to now. Evolution: young ≥ 5, mature ≥ 20 lifetime interactions. No longer touches `is_dead` (legacy). |
| `cadence_period(p_frequency)` | The streak clock: 7/14/30 days per period (IMMUTABLE) |
| `streak_multiplier(p_streak)` | Tier multiplier: 1–2 ×1.0 · 3–4 ×1.25 · 5–8 ×1.5 · 9–12 ×1.75 · 13+ ×2.0 (IMMUTABLE; Batch 9 mint consumes it) |
| `roll_plant_streak(plant_id, to)` | **The only window-math implementation.** Advances the streak window to `to`, committing lapses (`streak_broken_at/-count` arm the restore; only the streak resets). Clock freezes at `paused_at` while paused. `FOR UPDATE` row lock. |
| `sync_streaks()` | Rolls all the caller's plants forward to now — called from `fetchGarden` before every load/refresh. No cron anywhere. |
| `calculate_decay_rate(p_frequency)` | 100/7, 100/14, 100/30. Arg name drift with the old hand-written types is resolved — generated `database.ts` declares `p_frequency` correctly. |
| `handle_new_user()` | SECURITY DEFINER; inserts `public.users (id, email, phone_number, display_name)` from `NEW` + `raw_user_meta_data` (`full_name`, `phone_number`), `ON CONFLICT DO NOTHING`. |
| `set_garden_paused(p_paused)` | SECURITY INVOKER (RLS-scoped to `auth.uid()`). Pause: stamps `users.paused_at`. Unpause: shifts every plant's `last_hydration_update`, `streak_window_start`, **and** `streak_broken_at` forward by the pause duration (Batch 7 — every clock freezes), then clears the flag. Called from the Settings toggle via `setGardenPausedRemote`. |

**Triggers:** `updated_at` maintenance on 5 tables; `set_plant_decay_rate_on_insert` (BEFORE INSERT
on plants, derives decay from the friend's frequency — verified live); `update_plant_decay_rate`
(AFTER UPDATE on friends, propagates frequency changes **and** recomputes the streak window at
the later of old/new deadlines so a cadence change never insta-breaks — Batch 7);
`on_auth_user_created` (AFTER INSERT on `auth.users` → `handle_new_user()`).

**Views:** none — `user_garden_overview` was dropped in Batch 6 (inflated cross-join counts,
no readers).

---

## Auth flow

- Client: `src/lib/supabase.ts` — `createClient<Database>` with `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, AsyncStorage persistence, `autoRefreshToken: true`,
  `detectSessionInUrl: false`. **Throws at import time if the env vars are missing.**
- Session owner: **`src/contexts/AuthContext.tsx`** (Batch 6) — the single
  `getSession()`/`onAuthStateChange` subscription (deferred with `setTimeout` — supabase-js
  holds a lock during the callback). Everything reads `useAuth()`; no screen calls
  `supabase.auth.getUser()` anymore.
- Session gate: `RootNavigator` reads `useAuth()` and renders `MainNavigator` (session) or
  `AuthNavigator` (no session). `onboardingActive` (set by the signup flow) holds the Auth
  stack mounted through the post-signup steps (first watering, completion).
- Garden load: `GardenContext` reacts to `useAuth().user?.id` — `fetchGarden(userId)` on
  sign-in, clears both contexts on sign-out. Before each load/foreground refresh it replays the
  offline log queue (`flushLogQueue`).
- Sign in: `LoginScreen` → `signInWithPassword`.
- Sign up: **one path** — `Onboarding9CreateAccount` (`signUp` with `options.data` raw metadata,
  then seeds the first friend via `addPlant` **iff `signUp` returned a session** — i.e. email
  confirmation is disabled in the project; otherwise the seed is skipped with a console
  warning). The old `SignUpScreen`/`WelcomeScreen` were deleted in Batch 6. The first care
  action (watering the seeded friend) happens on `Onboarding10Complete`.

---

## Database access rules

- Use the **Supabase MCP server** for all schema inspection and DDL/DML. Do not shell out to `psql`.
- DDL (new table, column, enum value, trigger, policy) → `apply_migration`. DML → `execute_sql`.
- Any schema change must be reflected in **`supabase-schema.sql`** and in this file.
- Regenerate `src/types/database.ts` from the live schema rather than hand-editing it.
- App-side reads/writes of garden state go through `src/lib/garden.ts` — don't scatter
  `supabase.from('friends'|'plants')` calls elsewhere.
