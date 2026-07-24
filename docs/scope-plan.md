# Rooted — Scope Plan: from today's app to the full spec

*The build sequence for everything in [`app-spec.md`](app-spec.md). This doc answers "in what
order, with what schema, and what's blocking." Feature status and ratified decisions live in
[`feature-set.md`](feature-set.md); current behavior lives in `docs/source-of-truth/`. Batches
1–5 (shipped) are recorded there — this plan continues the numbering at Batch 6.*

*Every number the spec leaves open appears here as a **proposed default** — tunable, veto-able,
collected in §6. Phases are buildable as written.*

---

## 1. Gap analysis — spec section → current status

| app-spec section | Status today |
|---|---|
| §1 Hydration, cadence, wilt, pause | ✅ Shipped — client-side lazy decay (`effectiveHydration`), wilt ≤ 30, `set_garden_paused` RPC |
| §1 Streaks, multipliers, restores | ❌ Absent — `plants.streak_count` exists but is never written |
| §2 Points & gems | ❌ Absent — no columns, no code |
| §3 Upgrades (plant / garden / decor / helpers) | ❌ Absent — `decorative_items` unused, map hardcoded (`exampleMap`) |
| §4 Linked plants, nudges, message actions | ❌ Absent — no cross-user concept anywhere |
| §5 Logging connections | 🔨 Partial — manual Called/Texted/Hung-out only; no suggested, auto, or reminder-driven logs |
| §6 Journal, memory wall, time capsules | ❌ Absent — `interactions.note` never passed; no photo storage |
| §7 Notifications, widget, share, Almanac, Garden Pass | 🔨 Partial — widget + basic share shipped; notifications are cosmetic toggles; no Almanac, no IAP |
| §8 Anti-features | ✅ Honored — death already cut (ratified); nothing violates §8 today |

Known DB debts inherited by this plan: `artifact_templates` has no RLS (anon read+write);
`decorative_items` grid CHECKs still `<= 5`; `user_garden_overview` inflates interaction counts;
`log_interaction` never touches streak/evolution; two competing signup paths and no shared
AuthContext. All are assigned to a batch in §8.

---

## 2. Architecture decisions (made once, used everywhere)

**D1 — Economy ledger: append-only truth, cached balances.**
One `ledger_entries` row per mint/spend: `(id, user_id, currency 'points'|'gems', amount int
signed, reason, source_type, source_id, idempotency_key text UNIQUE, metadata jsonb,
created_at)`. RLS: owner SELECT only; all writes via SECURITY DEFINER RPCs. Idempotency keys are
deterministic (`mint:interaction:<interaction_id>`, `restore:<friend_id>:<broken_at>`), so
offline-queue replays and linked duplicate-log merges can never double-mint — the INSERT
conflicts and is skipped. Balance columns `users.points_balance` / `users.gems_balance`
maintained by an AFTER INSERT trigger; `SUM(amount)` reconciliation always available.
*Rejected: balance columns alone — no audit trail, no idempotency, no restore-escalation history.*

**D2 — Notifications: local-first, push only when linking demands it.**
Everything solo is client-scheduled local notifications. Decay and streak windows are
deterministic, so every plant's wilt time and window deadline is computable at schedule time. On
every app foreground / log / pause toggle: cancel all scheduled notifications, recompute,
reschedule. This natively satisfies the spec's hard rules — "never fire about someone you
already contacted" (logging happens in-app, which reschedules), frequency caps, and the morning
digest. Server push (Supabase Edge Function → Expo Push) arrives in Batch 13, where reacting to
*the other user* makes it genuinely unavoidable. *Rejected: server cron from day one — the app's
whole architecture is lazy client evaluation; a scheduler adds ops surface for zero solo benefit.*

**D3 — IAP via RevenueCat** (`react-native-purchases`), not raw StoreKit 2. Receipt validation,
subscription lifecycle webhooks, sandbox tooling, à-la-carte products in one SDK; Android later
for free.

**D4 — Multi-map refactor lands in Batch 12**, immediately before the first feature that needs
it (garden themes/decor). Not earlier — it's pure infrastructure until then.

**D5 — Linked-log merge semantics.** A linked log creates a `link_events` row; a second log of
the same type by the partner within the merge window (same calendar day) joins the existing
`merge_group_id` instead of creating one. Hydration/streak effects apply **once per merge group
per plant**; minting applies **once per user per merge group** — both sides earn, so co-op
out-earns solo (spec §4).

---

## 3. Phased roadmap — Batches 6–18

Native deps marked **[REBUILD]** force `npx expo run:ios`. All schema work via the Supabase MCP
server, mirrored to `supabase-schema.sql` + `DATA-MODEL.md`, with `src/types/database.ts`
regenerated after every migration.

### Batch 6 — Solid Ground *(debts + the weighting decision)*

**Goal:** pay down every debt later batches would inherit, and land the interaction-weight
rework that the entire economy multiplies through.
**User-visible:** re-ranked log actions (in-person on top), a first watering *inside*
onboarding, logs that survive bad connectivity.

- **Schema:** rework `log_interaction` CASE weights to in-person-first — *default: Hung out 50 /
  Called 35 / Texted 15* (RPC stays the source of truth; `HYDRATION_WEIGHTS` in
  `src/lib/garden.ts` mirrors for display). Enable RLS on `artifact_templates` (SELECT for
  authenticated, no writes). Widen `decorative_items` grid CHECKs to `<= 9`. Fix
  `user_garden_overview` DISTINCT counts (or drop the view — nothing reads it). `is_dead` /
  `revive_logs` machinery stays untouched legacy forever.
- **Client:** new `src/contexts/AuthContext.tsx` (`useAuth()`); consumers stop re-fetching
  `supabase.auth.getUser()` per screen. Single signup path — `Onboarding9CreateAccount` wins
  (it carries the first-friend seed); `SignUpScreen` folds into it. First care action in
  onboarding: the Celebration step triggers `logInteractionRemote` on the seeded friend with the
  reward animation. Offline log queue (`src/lib/logQueue.ts`, AsyncStorage-backed): enqueue on
  failure, replay on foreground/launch; client-generated interaction UUIDs prevent double-insert
  until D1's idempotency lands.
- **Deps/order:** none — first because weights gate Batch 9's mint table and
  AuthContext/offline-queue are load-bearing for everything after.
- **Risks:** low. `interaction_type` enum changes are append-only in Postgres; renames need a
  mapping migration.

### Batch 7 — Streaks *(spec §1: the second clock)*

**Goal:** the ratified per-plant period streak, lazily evaluated — `streak_count` finally gets
its job.
**User-visible:** "8 weeks strong" on the plant panel and widget, tier badges, at-risk state,
prestige marks past the cap.

- **Schema:** `plants` gains `streak_window_start timestamptz`, `streak_window_satisfied bool`,
  `streak_best int`, `streak_broken_at timestamptz NULL` (arms the Batch 9 restore window),
  `prestige_level int`. **One SQL roll-forward function** implements the window math, shared by:
  a new `sync_streaks()` RPC (rolls all the caller's plants forward, commits lapses — called on
  garden load and before widget sync; no cron) and `log_interaction` (roll forward, then if the
  window is unsatisfied: satisfy + `streak_count += 1` + bump best/prestige, atomic with the
  hydration write). `set_garden_paused` unpause shifts `streak_window_start` exactly as it
  shifts `last_hydration_update`. Cadence-change trigger recomputes the window at the *later* of
  old/new deadlines — never insta-breaks.
- **Client:** `Plant` gains streak fields; display-only helpers `streakTier()`,
  `multiplierFor()`, `windowDeadline()` in `src/lib/garden.ts` (DB commits are authoritative).
  `PlantInfoPanel` shows streak + tier + "next tier at week N" + at-risk badge. Widget snapshot
  (`widgetSync.ts` + Swift) gains streak and recomputes at-risk with the same formula.
- **Evolution decoupled** (permanent, never resets — spec §1 "growth is never lost"): stage
  advances on lifetime interaction count inside `log_interaction` — *defaults: young at 5,
  mature at 20*.
- **Defaults:** tiers = periods 1–2 ×1.0 · 3–4 ×1.25 · 5–8 ×1.5 · 9–12 ×1.75 · 13+ ×2.0 cap
  (ratified placeholders); backdating a log allowed up to 48 h; tiers count *periods* regardless
  of cadence length, so monthly friends tier up at the same period counts as weekly ones.
- **Deps/order:** after 6 (weights settled). Everything downstream — points, restores,
  notification copy, shared streaks — consumes streak state.
- **Risks:** window math across pause + cadence change + backdating is the subtlest logic in the
  app; the single shared SQL function is the mitigation (exactly one implementation).

### Batch 8 — Reminders That Help You Act *(spec §5 suggested logs + §7 notifications)*

**Goal:** plant-voiced local notifications and calendar-suggested logs, per D2.
**User-visible:** morning digest ("Maya's fern misses the sun"), streak-at-risk alerts with
*Call now / Text / already did* buttons, "did you see Maya?" confirm cards, Settings toggles
that finally work.

- **Native:** `expo-notifications` + `expo-calendar` **[REBUILD #1]**.
- **Schema:** `users.notification_prefs jsonb` (per-category toggles + digest hour) replaces the
  cosmetic Settings `useState` toggles. No server components.
- **Client:** `src/lib/notifications.ts` — the cancel-all-and-reschedule engine. Inputs: plants,
  streak windows, pause state, prefs. Outputs: one daily digest + capped per-plant at-risk/wilt
  alerts, all deep-linked (`rooted://plant/<id>`), with iOS notification-category actions —
  *already did* fires `logInteractionRemote` from the response handler; *Call/Text* open
  `tel:`/`sms:`. Reschedule hooks: foreground, after log, after pause toggle, after add/edit
  friend. Calendar scan on foreground → friend-name matches → one-tap confirm card. Every string
  passes the §8 no-guilt gate. The owed pause-visibility refinement (paused state visible in the
  garden, not just Settings) rides along.
- **Spike (parallel, timeboxed):** CallKit `CXCallObserver` — app-initiated `tel:` call,
  observe connect/disconnect while backgrounded on the dev build. Result gates Batch 18's
  auto-watering only; manual-first ships regardless.
- **Deps/order:** after 7 (at-risk alerts are the highest-value notification). Before the
  economy — retention infra should exist before an economy is tuned on top of it, and this batch
  is independent of points entirely.
- **Risks:** iOS 64-scheduled-notification limit (fine at digest + a handful); category
  registration at app start; calendar-permission UX.

### Batch 9 — Economy Core *(spec §2 + §1 restores)*

**Goal:** the D1 ledger, points minted on every log, gem milestone drops, and streak restores as
the first sink.
**User-visible:** points/gems HUD in the TopBar, mint animation on log ("+35 × 1.5"), gem drops
on tier-ups, "Restore streak?" on lapsed plants.

- **Schema:** `ledger_entries` + balance trigger + `users.points_balance`/`gems_balance` per D1.
  `log_interaction` extended in the same transaction: mint `base_points(type) ×
  multiplier(streak_tier)` with a once-per-plant-per-day full-mint check (race-safe via the
  idempotency key `mint:<friend_id>:<date>` pattern); extra same-day logs mint a *5-point
  trickle*. Gem drops detected in the same call, idempotency-keyed — *defaults: tier-up 3,
  prestige milestone 5, first-call-of-year 2 (`gem:first-call:<friend_id>:<year>`), seasonal
  event 5*. New `restore_streak(p_friend_id, p_currency)` RPC: validates
  `streak_broken_at + one cadence period > now()`, prices from the broken tier × repeat
  escalation (counted from prior `restore:` ledger rows), spends, restores `streak_count`, and
  **re-arms the window without satisfying it** — the restore only counts if you follow through
  (spec §1). *Default price: 100 points × tier index (1–5), ×2 per repeat restore on the same
  plant within 90 days; or flat 5 gems.*
- **Client:** new `src/lib/economy.ts` beside `garden.ts` (balances, ledger fetch, restore
  call); economy state folded into `GardenContext`. TopBar HUD; mint toast in `PlantInfoPanel`;
  restore sheet ending in a reconnection prompt ("Streak saved — call Maya this week?").
- **Pre-build:** a scratchpad TypeScript sim (not committed) runs 90 days of weekly/biweekly/
  monthly friends across tiers to sanity-check mint values and restore prices before the
  migration hard-codes them.
- **Cash-for-gems: no at launch.** The ledger's `reason`/`source_type` reserves a `purchase`
  source so the door isn't welded shut, but §2's "no buying currency" holds.
- **Deps/order:** after 7 (multiplier = tier) and 6 (base points = reworked weights). Restores
  ship *here*, not with the shop, so the economy launches with a sink.
- **Risks:** wrong mint values are expensive to walk back (deflating later is fine; confiscating
  isn't) — the sim is the mitigation.

### Batch 10 — Shop v1 *(spec §3: plant upgrades, Self scope)*

**Goal:** the first spend catalog — pots, nameplates, leaf/bloom variants, accessories on your
own plants.
**User-visible:** a Shop surface, a plant customization sheet, cosmetics rendering in the garden
and widget.

- **Schema:** `shop_items` (sku PK, category `pot|nameplate|accessory|bloom`, scope `self` for
  now, `price_points`, `price_gems`, `asset_key`, `is_active`, `sort`; read-only RLS).
  `user_items` inventory (user_id, sku, acquired_via `purchase|gift|milestone`,
  ledger_entry_id). `plant_attachments` (plant_id, sku, slot, position jsonb). Atomic
  `purchase_item(p_sku)` RPC: ledger spend + inventory grant, idempotency-keyed. (Deliberately
  **not** reusing `artifact_templates` — that stays reserved for Batch 18 collections.)
- **Client:** Shop screen (entry from the Garden TopBar); customization sheet from
  `PlantInfoPanel`; attachment compositing over plant sprites in `DraggablePlant` at all three
  evolution stages; widget sprites gain attachments or degrade gracefully.
- **Art:** launch catalog ~10–15 SKUs via **mockup-to-sprite** (free). Batch 7's prestige
  cosmetics (golden pot ring) become the first unpurchasable rendered attachments.
- **Deps/order:** immediately after 9 so points have somewhere to go within one release cycle.
- **Risks:** sprite compositing on the two-layer render (Skia tiles / RN plants) is the real
  work; art volume is the schedule risk — launch small.

### Batch 11 — The Memory Layer, solo half *(spec §6: journal + photo wall)*

**Goal:** each plant becomes the archive of that friendship.
**User-visible:** journal on the plant panel, post-log "anything to remember?" prompt, birthday
celebrations in the garden, photo prompt on hangout logs, per-plant chronological memory wall.

- **Schema:** `friends.birthday date NULL` (year optional by convention). `journal_entries`
  (id, user_id, friend_id, kind `note|date|gift_idea|milestone`, body, event_date NULL; owner
  RLS). Wire `interactions.note` at last (optional param through `logInteractionRemote` →
  `log_interaction`). **Supabase Storage:** private `memories` bucket, path
  `<user_id>/<friend_id>/<uuid>.jpg`, storage RLS scoped to the `auth.uid()` path prefix.
  `photos` table (id, user_id, friend_id, interaction_id NULL, storage_path, taken_at,
  `is_shared bool DEFAULT false`) — the `is_shared` flag is designed *now* so Batch 14's shared
  wall needs no photo migration.
- **Native:** `expo-image-picker` + `expo-image-manipulator` (client-side resize before upload)
  **[REBUILD #2]**.
- **Client:** journal UI inside `PlantInfoPanel` (a layer below the hero, never form-first);
  hangout-log photo prompt; MemoryWall screen; birthday party sprites in-garden
  (mockup-to-sprite); birthday reminders ride the Batch 8 scheduler. Photo uploads reuse the
  offline-queue pattern.
- **Defaults:** photo cap 20/plant free, unlimited with Pass — *soft-enforced* (counted, warned)
  until Batch 17 makes it an entitlement.
- **Deps/order:** technically only needs Batch 6 — **position-flexible**; can swap ahead of 9–10
  if economy tuning stalls. Placed here so v1 closes on the emotional layer.
- **Risks:** storage cost model (drives the Pass boundary); upload reliability.

---

### ✂️ v1 cut-line

**Batches 6–11 are the shippable solo v1**: honest weights, streaks with tiers and restores,
warm notifications, an earned economy with its first catalog, and the memory layer. After the
line: **v1.5 = linking (12–16)**, **v2 = monetization + live-ops (17–18)**. If a pre-launch trim
is needed, the Shop (10) can slip to v1.1 — streaks + restores stand alone. **Never ship streaks
without notifications** — at-risk alerts are what make period streaks humane.

---

### Batch 12 — Your Garden, Your Way *(spec §3: garden upgrades + static assets)*

**Goal:** the D4 multi-map refactor plus the garden-scope economy: themes, decor, reactive
assets.
**User-visible:** buyable garden themes (mossy grove, desert bloom…), placeable decor (lanterns,
benches, koi pond), first reactive pieces (bird feeder responds to whole-garden health).

- **Client refactor first:** map registry in `src/data/maps/` replaces every direct `exampleMap`
  import (`GardenContext`, `DraggablePlant`); validation/hit-testing parameterized by the active
  map. `garden_layouts` finally wired (active theme, grid size) through `garden.ts`.
- **Schema:** `garden_layouts` live; `decorative_items` persistence (CHECKs already widened in
  Batch 6); `shop_items` gains `garden_theme` and `decor` categories — `purchase_item`
  unchanged.
- **Reactive assets:** driven by aggregate signals only — *defaults: average hydration and
  %-of-windows-satisfied* — never any single relationship (spec §3).
- **Helpers** (gopher/hedgehog) deferred to Batch 18 — they're content, not architecture.
- **Art:** terrain via **new-terrain-tile** (PixelLab — terrain only); decor via
  mockup-to-sprite.
- **Deps/order:** after 10 (shop plumbing). Post-v1 because it's the largest pure-client
  refactor and blocks nothing before it.
- **Risks:** touches the garden's hottest paths (camera, hit-testing, drag) with no test suite —
  budget simulator QA; PixelLab tessellation iteration.

### Batch 13 — Linking Core *(spec §4 foundation)*

**Goal:** the biggest architectural lift — cross-user plants. Invite → accept → graft; one
shared streak; either side logs; duplicates merge; server push arrives.
**User-visible:** "you're a monstera in my garden" invite, graft animation, linked plants both
people water, first cross-user push ("Sam watered your plant").

- **Schema** (cross-user access *only* via SECURITY DEFINER RPCs with explicit membership
  checks; base-table RLS stays owner-scoped):
  - `link_invites` (code UNIQUE, inviter_user_id, inviter_friend_id, status, expires_at —
    single-use, expiring).
  - `garden_links` (user_a/b, friend_a_id/b_id, status, linked_at) — **shared streak state
    lives here** (`window_start`, `window_satisfied`, `streak_count`, `broken_at`);
    per-plant streak fields stay authoritative for solo plants only. `sync_streaks` and
    `log_interaction` branch on link existence. On link, the pair inherits the *longer* current
    streak.
  - `link_events` (link_id, logger_user_id, interaction_id, merge_group_id, occurred_at)
    implementing D5.
  - RPCs: `create_link_invite`, `accept_link_invite` (creates the reciprocal friend/plant if
    needed, marries streaks), `get_link_state`.
  - `push_tokens` table + the project's **first Edge Function** `send-push` (dumb Expo Push
    sender; all decisions stay in RPCs).
- **Client:** invite share sheet — `rooted://invite/<code>` plus a **code-entry fallback** for
  the not-yet-installed path (no deferred-deep-link SDK); accept flow post-signup; graft
  animation; linked badge; Supabase **Realtime** subscription on the pair's `link_events` for
  live watering moments; push-token registration (expo-notifications already installed in 8 —
  this is why notifications preceded linking).
- **Defaults:** invite asymmetry is *silent* — the inviter sees an "invited" state until
  acceptance; declines and expiry never surface as rejection (§8: no guilt).
- **Deps/order:** needs 7 (streak model), 9 (merge idempotency rides the ledger), 8 (push
  permission + notification plumbing). Post-v1 by design: the solo product must stand alone —
  the spec never forces invites.
- **Risks:** highest of the roadmap — SECURITY DEFINER escape hatches, merge races (mitigated by
  D5 keys), streak-marriage edge cases, invite abuse. **Spikes:** Realtime behavior under RN
  backgrounding; cold-start invite redemption through the App Store.

### Batch 14 — The Communication Layer *(spec §4: nudges, message actions, dual photos, gift restores)*

**Goal:** everything expressive that rides on a live link.
**User-visible:** the five nudges (☀️🌧🦋🍂🐞) landing as plant animations + soft pushes, photo
sends, remote plant actions with per-friend haptic signatures, side-by-side dual photo cards,
the shared memory wall, gift streak restores.

- **Schema:** `nudges` (link_id, sender_user_id, type enum, payload jsonb — note/photo path,
  seen_at; RPC-mediated writes; Realtime + push on insert). *Rate cap: 3 per link per day,
  RPC-enforced.* **Nudges mint nothing** — a ping is never worth a conversation (§8). Dual-photo
  prompt when both sides log one merge group → composite card rendered client-side (reuse the
  `captureRef` share pipeline), saved to both walls. `photos.is_shared` flips per photo → shared
  wall. `restore_streak` extended for cross-link gifting ("I've been the absent one").
- **Client:** nudge picker on the linked plant panel; receive-side animations on the Skia/RN
  plant layer; shared wall view; per-friend haptic signature editor.
- **Native:** `expo-haptics` + `expo-audio` (pulled forward from Batch 16 to share the rebuild)
  **[REBUILD #3]**.
- **Deps/order:** 13 (links, push, Realtime) + 11 (photos). Split from 13 deliberately — linking
  core is risky enough alone.
- **Risks:** background haptic delivery — spike; likely tap-triggered only, degrade gracefully.
  Animation payload versioning across app versions.

### Batch 15 — Social Economy *(spec §3: Gift & Shared scopes)*

**Goal:** the economy points outward.
**User-visible:** "Gift to Sam" in the shop, "from Sam" planter tags, friendship-bracelet
matching sets rendering identically on both sides.

- **Schema:** `shop_items.scope` gains `gift|shared`; `purchase_item(p_sku, p_scope, p_link_id)`
  — gift writes the partner's `user_items` (giver in metadata) behind a link-membership check;
  shared writes both inventories atomically from one spend. *Default cost model: buyer pays full
  price, both sides receive* — simplest, no debt mechanics. Gifted-item ping rides the nudge
  channel.
- **Client:** scope selector in the shop; gifted-item reveal moment; shared-set render parity.
- **Deps/order:** 13 + 10.

### Batch 16 — Time Capsules *(spec §6)*

**Goal:** bury a note, photo, or voice memo; it unlocks on the chosen date; linked pairs bury
together.
**User-visible:** burial flow, buried marker in the garden, unlock celebration, co-op capsules.

- **Schema:** `capsules` (id, user_id, friend_id, link_id NULL, kind `note|photo|voice`, body,
  storage_path NULL, unlock_at, opened_at NULL; owner RLS + link-RPC path for shared). Unlock is
  lazy (checked on load) + a scheduled local notification at `unlock_at` via the Batch 8 engine.
  *Default slots: 1 per plant free, 5 with Pass* — RPC-enforced.
- **Client:** burial flow, locked/unlocked garden states, voice record/playback (expo-audio,
  already installed); voice files use the `memories` bucket pattern.
- **Deps/order:** solo capsules need only 11; shared capsules need 13. Can ship solo-first.

### Batch 17 — Garden Pass *(spec §7: the only real money)*

**Goal:** subscription + à-la-carte cosmetics per D3, with the money/earned wall intact.
**User-visible:** paywall (plant capacity, rare species, full photo storage, extra capsule
slots, Almanac history), restore purchases, premium state everywhere it matters.

- **Native:** `react-native-purchases` (RevenueCat) **[REBUILD #4]**.
- **Server:** RevenueCat webhook → Edge Function → `users.is_premium` + new
  `users.premium_until timestamptz`. Entitlement checks live **in RPCs, server-enforced** —
  plant-add cap, photo cap, capsule slots, Almanac depth — never client-only.
- **Defaults:** 12 plants free, unlimited with Pass; **$4.99/mo or $29.99/yr**; à-la-carte
  cosmetics as separate SKUs. Downgrade soft-locks excess plants (view-only, never deleted).
- **Guardrails:** soft walls, warm copy, zero guilt; cash never touches care, currency, or
  recovery (§8). Gems stay earned-only unless that decision is explicitly reopened.
- **Deps/order:** everything the Pass gates must exist (11, 16, core plant cap). Late
  deliberately — price with real usage data from beta.
- **Risks:** App Store subscription review; entitlement races on downgrade.

### Batch 18 — Almanac, Live-ops & the Long Tail *(spec §7)*

**Goal:** the year-scale layer.
**User-visible:** yearly Almanac with shareable recap cards; seasonal event flora and
collections; helpers; song sends via the Music Box; (conditional) calls that water the plant
themselves.

- **Almanac:** computed entirely from existing `interactions` + `ledger_entries` + `photos` — no
  new write paths; recap cards via the `captureRef` pipeline; history depth Pass-gated.
- **Collections:** the dormant `artifacts`/`artifact_templates` tables finally activate (RLS
  fixed back in Batch 6); seasonal drops keyed to real interactions during event windows;
  content via mockup-to-sprite. **Helpers** (deferred from 12) land here as collection-adjacent
  content — they flag care ("who needs you today", "you wrote this about Sam in March"), never
  do it.
- **Live-ops:** the first *scheduled* server logic — pg_cron or a scheduled Edge Function
  toggling `shop_items.is_active`/event windows. Acceptable now; the app has had Edge Functions
  since 13.
- **Music Box:** MusicKit **spike first** — no maintained Expo wrapper, so a custom Swift module
  + config plugin **[REBUILD]**; Apple Music subscriber playback, 30 s previews for everyone
  else. *Default scope: previews-only v1.* Spotify fast-follow.
- **L1 auto-watering:** only if the Batch 8 CallKit spike passed — in-app Call button →
  `CXCallObserver` → auto-log with `was_auto_detected = true` (column exists), minting identical
  to manual (trust-ladder parity).

---

## 4. Rebuild schedule

Four planned rebuilds of the custom dev build (`com.rooted.app`), each bundling its batch's
native deps:

| Rebuild | Batch | Deps |
|---|---|---|
| #1 | 8 | `expo-notifications`, `expo-calendar` |
| #2 | 11 | `expo-image-picker`, `expo-image-manipulator` |
| #3 | 14 | `expo-haptics`, `expo-audio` (pulled forward from 16) |
| #4 | 17 | `react-native-purchases` (+ MusicKit Swift module in 18 if pursued) |

## 5. Debt ledger

| Debt | Resolved in |
|---|---|
| `artifact_templates` no RLS | Batch 6 |
| `decorative_items` CHECKs `<= 5` | Batch 6 |
| `user_garden_overview` inflated counts | Batch 6 |
| Two signup paths, no AuthContext | Batch 6 |
| Cosmetic Settings notification toggles | Batch 8 |
| `log_interaction` ignores streak/evolution | Batch 7 (that *is* the feature) |
| Pause invisible in the garden | Batch 8 |
| Hardcoded `exampleMap` | Batch 12 (D4) |
| `interactions.note` unused | Batch 11 |
| `is_dead` / `death_timestamp` / `revive_logs` / `update_plant_hydration` | Never touched — documented legacy |

## 6. Proposed defaults (all tunable — veto here, not mid-batch)

| # | Decision | Proposed default | Used in |
|---|---|---|---|
| 1 | Interaction weights (hydration = base points) | Hung out 50 / Called 35 / Texted 15 | B6, B9 |
| 2 | Streak tiers | 1–2 ×1.0 · 3–4 ×1.25 · 5–8 ×1.5 · 9–12 ×1.75 · 13+ ×2.0 | B7 |
| 3 | Backdating window | 48 h | B7 |
| 4 | Long-cadence fairness | tiers count periods, not days | B7 |
| 5 | Evolution driver | lifetime interactions: young at 5, mature at 20 | B7 |
| 6 | Same-day extra-log trickle | 5 points | B9 |
| 7 | Gem drops | tier-up 3 · prestige 5 · first-call-of-year 2 · seasonal 5 | B9 |
| 8 | Restore price | 100 pts × tier index, ×2 per repeat (90 d), or 5 gems | B9 |
| 9 | Cash-for-gems | No at launch; ledger reserves a `purchase` source | B9/B17 |
| 10 | Photo cap | 20/plant free, unlimited with Pass | B11, B17 |
| 11 | Reactive-asset signals | avg hydration + % windows satisfied | B12 |
| 12 | Invite asymmetry | silent — no visible decline/expiry | B13 |
| 13 | Nudge rate cap | 3 per link per day; nudges mint nothing | B14 |
| 14 | Shared-set cost | buyer pays full, both receive | B15 |
| 15 | Capsule slots | 1/plant free, 5 with Pass | B16, B17 |
| 16 | Free plant cap / Pass price | 12 plants · $4.99/mo · $29.99/yr | B17 |
| 17 | Music Box scope | previews-only v1 | B18 |

## 7. Anti-feature guardrails (spec §8, restated as review gates)

Checked on every batch before it merges:

- No plant ever dies; no cash ever recovers anything.
- No purchasable points or gems (see default #9); no ads; no data sale.
- No guilt copy — every notification and empty-state string reviewed against "plant-voiced and
  warm."
- No proof demanded for a log; no forced invites (solo path stays first-class forever).
- No hollow ping worth a conversation — nudges and message actions mint nothing.
