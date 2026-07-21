# ARCHITECTURE.md — App Shell, Navigation & State

> **Source of truth** for how the app boots, routes, and holds state.
> Subsystem detail lives in [`GARDEN.md`](GARDEN.md), [`DATA-MODEL.md`](DATA-MODEL.md),
> [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).

---

## Boot sequence

```
index.ts                       registerRootComponent, enableScreens(), imports gesture-handler FIRST
└── App.tsx                    loads 3 Google Fonts, holds splash until ready
    └── SafeAreaProvider
        └── FriendsProvider    friends[]  (in-memory)
            └── GardenProvider plants[], occupancy  (in-memory)
                └── RootNavigator
```

`import 'react-native-gesture-handler'` must stay the **first** import in `index.ts`.

Fonts are loaded in `App.tsx` via `expo-font` and referenced through `src/constants/fonts.ts`.
A font-load failure is caught and the app continues with system fonts.

---

## Navigation

`RootNavigator` subscribes to Supabase auth and switches stacks on session presence.

| Stack | Condition | Screens |
|---|---|---|
| **AuthNavigator** | no session | `Onboarding1Welcome` → `2ValueProp` → `3Educational` → `4AddFriend` → `5Frequency` → `6ChoosePlant` → (`7PlantBrowse`, aliased to the same component) → `8Celebration` → `9CreateAccount` → `10Complete`, plus `Login` |
| **MainNavigator** | session | `Garden` (home), `Friends`, `Settings`, `Help`, `AddFriend`, `ChoosePlant` |

Both are **native stacks** with `headerShown: false`.

Param lists live in `src/types/navigation.ts`. The onboarding stack threads
`friendName` → `frequency` → `plantType` forward through route params. On successful sign-up,
`Onboarding9CreateAccount` seeds the first friend via the async `useGarden().addPlant`
(resolving the plant name through `src/data/plantCatalog.ts`), which persists `friends` +
`plants` rows — but **only if `signUp` returned a session** (email confirmation disabled);
otherwise the seed is skipped with a console warning. `GardenProvider` wraps `RootNavigator`,
so the same context instance survives the Auth→Main swap.

**Drawer:** `MainNavigator` is a stack, not a drawer navigator. `SimpleDrawer` is a custom overlay
rendered as a sibling of the stack, driven by `isDrawerOpen` state and a `navigationRef` captured
from whichever screen rendered last. `MainTabParamList` is named "Tab" for historical reasons — it
is neither a tab nor a drawer navigator.

---

## State

There is no Redux/Zustand/Query layer. State is React context plus local component state.

| Context | Owns | Persisted? |
|---|---|---|
| `FriendsContext` | `friends[]`, `setAllFriends`, `appendFriend`, `updateFriendHydration`, `getFriendById` | ✅ populated from the DB by `GardenContext`'s load; ids are DB `friends.id` |
| `GardenContext` | `plants[]`, `loading`, async `addPlant`, `updatePlantPosition`, `canPlaceAt`, derived `occupancy`, `gardenPaused` + async `setGardenPaused` | ✅ loads via `fetchGarden(userId)` on sign-in, clears on sign-out; `addPlant` awaits the insert; position updates persist in the background (optimistic locally); pause persists via the `set_garden_paused` RPC |
| `GardenCameraContext` | `cameraX`, `cameraY`, `scale` (Reanimated SharedValues), `containerFrame` | n/a — mounted per-screen inside `GardenScreen`, so the camera resets on remount |

`GardenContext` owns the auth awareness (`getSession()` + `onAuthStateChange`, deferred with
`setTimeout` because supabase-js holds a lock during the callback; a user-id ref suppresses
reloads on `TOKEN_REFRESHED`) and pushes loaded friends into `FriendsContext`. All DB access goes
through [`src/lib/garden.ts`](../../src/lib/garden.ts). Hydration is persisted but static — no
decay loop exists yet. See [`DATA-MODEL.md`](DATA-MODEL.md).

Known duplication to clean up rather than extend:
- `GardenContext.selectedPlant` is dead — `GardenScreen` keeps its own local `selectedPlant`.
- There is no shared `useAuth` hook; screens each call `supabase.auth.getUser()`.

---

## Repo layout

```
index.ts                     entry — gesture-handler import, enableScreens
App.tsx                      fonts, splash, providers
src/
  navigation/                RootNavigator (auth gate), AuthNavigator, MainNavigator
  screens/                   Garden, Friends, AddFriend, ChoosePlant, Settings, Help, Profile,
    onboarding/              Login, SignUp, Welcome  ·  10-step onboarding flow
  components/
    garden/                  TileMap (Skia), DraggablePlant, PlantInfoPanel, TopBar
    navigation/              SimpleDrawer, CustomDrawerContent
    *.tsx                    PixelButton, PixelInput, ProgressBar, BackButton
  contexts/                  FriendsContext, GardenContext, GardenCameraContext
  utils/                     isoMath, occupancy, placementRules, debugLog
  types/                     garden, database, navigation
  constants/                 theme (Colors, Spacing), fonts
  data/                      exampleMap (map + TILE_IMAGES registry), plantCatalog (STARTER_PLANTS), walls
  lib/supabase.ts            typed Supabase client
assets/images/
  plants/pixel/              plant sprites (PNG, static require)
  garden/tiles/              isometric terrain tiles
scripts/                     pixelize.py, seamless_tile.py, mockup_tile.py, scene_preview.py
supabase-schema.sql          canonical DDL
docs/source-of-truth/        these docs
docs/archive/                superseded working notes — do not trust
.claude/skills/              mockup-to-sprite, new-terrain-tile
```

---

## Build & run

Custom **dev build only — Expo Go will not work** (Skia + Reanimated v4 need native modules, and
`react-native-screens` requires `newArchEnabled: false`, which Expo Go cannot honor).

| Command | Use |
|---|---|
| `npx expo run:ios` | Full native build + launch (10–15 min first time; needed after native/dep changes) |
| `npx expo start --dev-client` | Metro only — the normal loop for JS-only changes |
| `npx expo start --dev-client --clear` | Reset Metro cache |
| `npx tsc --noEmit` | Typecheck. **Baseline: 6 pre-existing errors** in `WelcomeScreen` (2), `SignUpScreen` (2), `AuthNavigator` (1), `FriendsContext` (1). |

Bundle id: `com.rooted.app`. There is **no test suite and no lint config** — `npx tsc --noEmit` is
the only automated check.

Env (`.env`, gitignored — must be `EXPO_PUBLIC_`-prefixed to reach the app):

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```
