# CLAUDE.md — Rooted

---

## CRITICAL RULES

- **NEVER assume Expo Go.** This app requires a **custom dev build** (`com.rooted.app`) — Skia and Reanimated v4 need native modules, and `react-native-screens` needs `newArchEnabled: false`. JS-only change → `npx expo start --dev-client`. Native/dep change → `npx expo run:ios`.
- **ALWAYS run `npx tsc --noEmit` before suggesting a commit.** There is **no test suite and no linter** — this is the only automated check. **Baseline is 0 errors** (the old WelcomeScreen/SignUpScreen/AuthNavigator debt was deleted with those dead screens in Batch 6). Never introduce an error.
- **All database work goes through the Supabase MCP server** (project `ojotriwvmudyoeyihynb`). NEVER use `psql` or a direct connection. DDL → `apply_migration`. DML → `execute_sql`. Mirror every schema change into `supabase-schema.sql` **and** `docs/source-of-truth/DATA-MODEL.md`.
- **NEVER hand-edit `src/types/database.ts`.** It is **generated from the live schema** (Supabase MCP `generate_typescript_types`). After any migration, regenerate it; use its `Tables<'name'>` helper for row types. If it and `supabase-schema.sql` disagree, the live DB is the truth — regenerate and re-mirror.
- **NEVER hand-edit garden coordinate math without reading `src/utils/isoMath.ts`'s header contract.** The Skia `<Group>` transform in `TileMap.tsx` and `worldToCanvas()` must stay exact mirrors. They desync **silently** — plants slide off tiles, nothing errors.
- **NEVER use `Dimensions.get('window')` as the zoom origin.** The canvas sits below the TopBar and safe area. The origin is the **measured container center** (`containerFrame`, via `measureInWindow`).
- **NEVER use PixelLab for an asset that has a mockup.** Objects on tiles (plants, decorations) → `mockup-to-sprite` skill (free). Terrain tiles → `new-terrain-tile` skill (PixelLab, because tessellation demands exact 2:1 geometry).
- **NEVER hardcode colors, spacing, radii, or font families.** Import from `src/constants/theme.ts` and `src/constants/fonts.ts`; add the token there if it's missing.
- **NEVER create `-v2`, `-copy`, `-new`, or `-fixed` file variants.** Edit the existing file.
- **NEVER commit secrets.** `.env` is gitignored — keep it that way. App-visible vars must be `EXPO_PUBLIC_`-prefixed.

---

## SELF-HEALING RULES

**IMPORTANT — Documentation Maintenance:**
- When you change code, schema, or assets, you MUST update the affected doc in `docs/source-of-truth/` **before considering the task complete**.
- New table/column/enum → update `DATA-MODEL.md` **and** `supabase-schema.sql`. New screen/context → `ARCHITECTURE.md`. Garden math/render/placement change → `GARDEN.md`. New token/component/asset pipeline change → `DESIGN-SYSTEM.md`.
- When removing or renaming code, update every reference in `docs/source-of-truth/`.
- **NEVER update anything in `docs/archive/`** — those files are deliberately frozen and wrong.

**IMPORTANT — Anti-Pattern Capture:**
- When the user corrects your behavior or flags something as wrong, you MUST add a rule to **Critical Rules** or **Learned Anti-Patterns** below to prevent recurrence.
- Format: `- **NEVER** [specific bad behavior]. Instead, [correct approach].`
- Every correction becomes a permanent rule. This is how the project learns.

---

## Mission

**Rooted** is a relationship-wellness mobile app — "a greenhouse for growing friendships." Each
friend you're staying in touch with is a plant in an isometric pixel-art garden. Contact hydrates
the plant; neglect makes it wilt and eventually die. The garden makes the invisible work of
maintaining friendships legible and tactile.

---

## Current state: the full scope-plan roadmap (Batches 6–18) is implemented

Before building on top of anything, know this:

- **Everything in `docs/scope-plan.md` shipped** (2026-07-22): streaks (window-based, one SQL
  roll-forward `roll_plant_streak`/`roll_link_streak`), local-first notifications + calendar
  suggestions, the D1 economy ledger (idempotency-keyed minting, gem drops, restores), the
  shop (self/gift/shared scopes), the memory layer (journal, photo walls, birthdays), the
  multi-map registry + decor, linking (invites, shared streaks, D5 merge groups, Realtime,
  push via the `send-push` Edge Function), nudges + haptic signatures + shared walls, time
  capsules, Garden Pass entitlements (server-enforced caps + `revenuecat-webhook`), and the
  Almanac/collections/live-ops layer. Batch-by-batch detail: `docs/source-of-truth/DATA-MODEL.md`.
- **Friends + plants persist per user**; writes go through **`src/lib/garden.ts`** plus the
  per-domain services (`economy.ts`, `shop.ts`, `memories.ts`, `links.ts`, `nudges.ts`,
  `capsules.ts`, `almanac.ts`, `musicBox.ts`, `purchases.ts`). Client invariant:
  `Plant.id === Friend.id`; `Plant.dbPlantId` exists only for attachment writes.
- **`log_interaction` is the care loop's single write RPC** (SECURITY DEFINER, jsonb result):
  hydration + streak satisfy + evolution + minting in one transaction; linked plants water
  BOTH sides and share one streak on `garden_links`. Weights: hung out 50 / called 35 /
  texted 15. Idempotent on `p_interaction_id` (offline queue `src/lib/logQueue.ts`).
- **DEATH IS CUT — ratified.** `hydration <= 30` renders wilted; only streaks can lapse (and
  can be restored for one period). `is_dead`/`death_timestamp`/`revive_logs`/
  `update_plant_hydration` are legacy — never build on them.
- **Art is design-pending by intent** (the user designs sprites): `attachmentCatalog.ts`,
  `DecorSprite.DECOR_ASSETS`, themed tile maps, party/graft/capsule celebration sprites are
  null/placeholder until assets land — mechanics all work today. Never generate this art
  unprompted.
- **Still needs user setup:** RevenueCat (app/products, `EXPO_PUBLIC_REVENUECAT_IOS_KEY`,
  `REVENUECAT_WEBHOOK_SECRET` function secret) — the paywall degrades gracefully; the CallKit
  auto-watering spike needs a physical device (manual-first shipped).
- The onboarding first-friend seed + first watering require `signUp` to return a session —
  i.e. **email confirmation disabled** in the Supabase project.

## Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Expo (custom dev build, **not Expo Go**) | Expo 54, RN 0.81.5, React 19.1 |
| **Language** | TypeScript (`strict: true`) | TS 5.9 |
| **Navigation** | React Navigation (native stack) | v7 |
| **Garden rendering** | React Native Skia | v2.4 |
| **Gestures / animation** | react-native-gesture-handler + Reanimated | GH 2.28, Reanimated 4.1 |
| **Backend** | Supabase (Postgres + Auth), `@supabase/supabase-js` | v2.86 |
| **Session storage** | AsyncStorage + expo-secure-store | |
| **Fonts** | Rubik, Nunito, VT323 (`@expo-google-fonts`) | |
| **Art pipeline** | Python (Pillow) + PixelLab MCP + Aseprite | |

---

## Architecture

| Domain | Entry point | Reference doc |
|---|---|---|
| App shell / boot | [`App.tsx`](App.tsx), [`index.ts`](index.ts) | [`ARCHITECTURE.md`](docs/source-of-truth/ARCHITECTURE.md) |
| Navigation & auth gate | [`src/navigation/RootNavigator.tsx`](src/navigation/RootNavigator.tsx) | [`ARCHITECTURE.md`](docs/source-of-truth/ARCHITECTURE.md) |
| Isometric garden | [`src/screens/GardenScreen.tsx`](src/screens/GardenScreen.tsx), [`src/utils/isoMath.ts`](src/utils/isoMath.ts) | [`GARDEN.md`](docs/source-of-truth/GARDEN.md) |
| Data layer | [`src/lib/garden.ts`](src/lib/garden.ts), [`src/lib/supabase.ts`](src/lib/supabase.ts), [`supabase-schema.sql`](supabase-schema.sql) | [`DATA-MODEL.md`](docs/source-of-truth/DATA-MODEL.md) |
| Visual language & art | [`src/constants/theme.ts`](src/constants/theme.ts) | [`DESIGN-SYSTEM.md`](docs/source-of-truth/DESIGN-SYSTEM.md) |

**Context Claude cannot infer from the code:**
- **Two render layers.** Tiles are drawn in **Skia**; plants are **RN views absolutely positioned
  on top of the canvas**. They stay aligned only because both apply the same camera transform.
  A tile can therefore *never* occlude a plant.
- **Grid `(i, j, k)` is the only source of truth for position.** Entities store grid coords, never
  pixels. Frames: `grid → world → canvas → window`. `hitTestTile()` is *the* screen→tile function —
  drag and tap must both use it so a pixel always maps to the same tile.
- **The camera lives on the UI thread only** (Reanimated SharedValues, no React mirror — by design).
  Mirroring it back with `runOnJS` reintroduces a mid-gesture drift race.
- `MainNavigator` is a **native stack whose first screen is a bottom-tab navigator**
  (Garden · Friends · Settings); flow screens (`AddFriend` → `SetFrequency` → `ChoosePlant`,
  `Help`) push above the tabs. The old drawer (`SimpleDrawer`/`CustomDrawerContent`) is deleted —
  never re-add a hamburger menu. Types: `MainTabsParamList` nested in `MainStackParamList`.
- **Emoji are banned as UI.** Every icon renders through `src/components/PixelIcon.tsx`
  (vendored HackerNoon Pixel Icon Library, CC BY 4.0 — attribution in HelpScreen/README stays).
  Add icons via `scripts/gen-pixel-icons.js`, never inline emoji or one-off SVGs.

---

## Data Model

> **Full schema:** [`DATA-MODEL.md`](docs/source-of-truth/DATA-MODEL.md) · canonical DDL in
> [`supabase-schema.sql`](supabase-schema.sql) · long-form reference in [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)

**9 tables**, RLS owner-scoped via `auth.uid()`:

- `users` — profile extension of `auth.users`; populated by the `handle_new_user` trigger on signup (no INSERT policy — deliberate, the trigger is SECURITY DEFINER)
- `friends` — a friend you tend: `plant_type`, `contact_frequency`
- `plants` — **1:1 with `friends`** (UNIQUE `friend_id`): hydration 0–100, decay rate, evolution stage, streak, grid position (0–9)
- `interactions` — append-only log; `log_interaction()` RPC is the intended write path (call 40 / text 20 / manual 30 hydration) — **unused by the app so far**
- `garden_layouts`, `decorative_items`, `artifacts`, `revive_logs`, `artifact_templates`

App access goes through **`src/lib/garden.ts`** only (`fetchGarden`, `createFriendWithPlant`, `persistPlantPosition`) — don't scatter `supabase.from('friends'|'plants')` elsewhere.

**Known defects — do not mistake these for your own bugs:**
- `update_plant_hydration()` has a broken 24h death check — moot now that death is cut, but don't call it expecting sane behavior.
- `artifact_templates` has **no RLS** — anon can read *and write* it.
- `decorative_items` grid CHECKs are still `<= 5` (plants was widened to `<= 9`; widen decorations the same way before persisting them).

---

## Repo Layout

```
index.ts                    entry — gesture-handler import MUST be first
App.tsx                     fonts, splash, FriendsProvider → GardenProvider
src/
  navigation/               RootNavigator (auth gate) → Auth | Main
  screens/                  Garden, Friends, ChoosePlant, Settings, …
    onboarding/             10-step flow; params thread friendName → frequency → plantType
  components/garden/        TileMap (Skia), DraggablePlant (RN), PlantInfoPanel, TopBar
  components/               PixelButton, PixelInput, ProgressBar, BackButton
  contexts/                 FriendsContext, GardenContext, GardenCameraContext
  utils/                    isoMath ⭐, occupancy, placementRules, debugLog
  constants/                theme.ts (Colors/Spacing/…), fonts.ts
  data/                     exampleMap (map + TILE_IMAGES registry), plantCatalog (STARTER_PLANTS), walls
  lib/supabase.ts           typed client; THROWS at import if env vars missing
  lib/garden.ts             garden persistence service — sole reader/writer of friends+plants
assets/images/plants/pixel/ plant sprites (static require only)
assets/images/garden/tiles/ isometric terrain
scripts/                    pixelize.py, seamless_tile.py, mockup_tile.py, scene_preview.py
targets/widget/             WidgetKit home-screen widget (SwiftUI, NOT RN) — native change,
                            edit → prebuild --clean + expo run:ios
docs/source-of-truth/       ⭐ canonical docs — read before editing, update after
docs/archive/               superseded notes — DO NOT TRUST, DO NOT UPDATE
.claude/skills/             mockup-to-sprite, new-terrain-tile
```

---

## Environment Variables

`.env` at repo root (gitignored). Must be `EXPO_PUBLIC_`-prefixed to be readable in the app.

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Optional — Garden Pass storefront (Batch 17). Absent = paywall degrades
# gracefully ("purchases not available in this build").
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
```

---

## Commands

| Command | Use |
|---|---|
| `npx expo start --dev-client` | Metro only — the normal loop for JS changes |
| `npx expo run:ios` | Full native build (10–15 min first time; after native/dep changes) |
| `npx expo start --dev-client --clear` | Reset Metro cache |
| `npx tsc --noEmit` | Typecheck — the **only** automated check (baseline: 0 errors) |

Metro runs on **http://localhost:8081**. Target: iOS Simulator, bundle id `com.rooted.app`.

---

## Source of Truth Documentation

Read the relevant doc **before** modifying a subsystem; update it **after**.

| Document | Covers |
|---|---|
| [`ARCHITECTURE.md`](docs/source-of-truth/ARCHITECTURE.md) | Boot, navigation, contexts, state ownership, repo layout, build commands |
| [`GARDEN.md`](docs/source-of-truth/GARDEN.md) | Coordinate frames, Skia/RN split, camera, drag & placement, render constants, dead code |
| [`DATA-MODEL.md`](docs/source-of-truth/DATA-MODEL.md) | All 9 tables, RLS, functions/triggers, auth flow, type drift, schema defects |
| [`DESIGN-SYSTEM.md`](docs/source-of-truth/DESIGN-SYSTEM.md) | Color/spacing/type tokens, shared pixel components, the two art pipelines |

Supporting (not canonical): [`docs/prd.md`](docs/prd.md) (product requirements),
[`docs/BACKLOG.md`](docs/BACKLOG.md) (ideas + planned work — add to it, don't create new notes files),
[`DEVELOPMENT.md`](DEVELOPMENT.md) (dev build setup), [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

---

## Agent Instructions

- **Search before create** — grep for an existing implementation before adding a file.
- **Update, never duplicate** — edit in place; no `-v2`/`-copy` variants.
- **Read before modify** — read the subsystem's source-of-truth doc first.
- **Update after modify** — update that doc before calling the task done.
- **Stage by name** — never `git add -A` or `git add .`.
- **Verify in the simulator** — the garden is visual and gesture-driven. A typecheck pass is not
  evidence that a drag, zoom, or placement change works. Drive it.
- **Prefer deleting dead code to extending it** — see the dead-code list in `GARDEN.md`
  (`depthKey`, `getVisibleTileBounds`, the duplicate `MapData`, …). `PlantTile` and the
  emoji render path are already gone.

### Learned Anti-Patterns

- **NEVER** use `event.x/y` in a plant drag worklet. Instead, use `event.absoluteX/absoluteY` minus
  `containerFrame.offset` — `event.x/y` is plant-local and silently wrong.
- **NEVER** mutate the `OccupancyMap` from a state updater. Instead, derive it from `plants` with
  `buildOccupancy()` in a `useMemo`.
- **NEVER** add a tile id to `TILE_IMAGES` without also adding its `useImage` hook in `TileMap.tsx`.
  A missing image makes the tile silently vanish (`if (!tileImage) continue`).
- **NEVER** treat the front-row placement block (`j >= map.height - 1`) or `MIN_ZOOM = 1.0` as bugs.
  Both are deliberate.
- **NEVER** log design iterations or completed edits to `docs/BACKLOG.md` unprompted. Instead,
  add backlog entries only when the user asks to record something; the backlog is theirs to curate.
- **NEVER** assume `npx expo run:ios` applies a newly added config plugin — `ios/` is
  prebuild-generated and stays stale until `npx expo prebuild -p ios` (or a manual
  `ios/Rooted/Info.plist` patch). Missing usage-description keys crash at **boot**, not at
  first use: expo-calendar needs BOTH the Calendar and Reminders strings
  (`NSCalendars*`, `NSReminders*`); image-picker needs `NSPhotoLibraryUsageDescription`;
  audio recording needs `NSMicrophoneUsageDescription`. All are declared in `app.json`
  plugins now — keep them when regenerating.
