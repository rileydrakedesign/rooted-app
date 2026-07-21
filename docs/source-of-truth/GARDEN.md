# GARDEN.md — Isometric Garden Subsystem

> **Source of truth** for the tile-based garden. Derived from the code as of commit `b7223b9`.
> Supersedes the archived notes in `docs/archive/` (`NEW_ARCHITECTURE.md`, `TILE_SYSTEM_SUMMARY.md`,
> `grid-prep.md`, `plant-drag.md`) — those describe earlier versions and are wrong in places.

---

## Overview

The garden is a 2:1 isometric diamond grid. Ground tiles are drawn with **Skia**; plants are
**React Native views** absolutely positioned on top of the Skia canvas. The two layers are kept in
sync by applying the *same* camera transform on both sides.

```
GardenScreen (owns dragState, selectedPlant, containerFrame measurement)
├── GardenCameraProvider          cameraX / cameraY / scale (Reanimated SharedValues)
├── <TopBar />
├── gardenContainer               ← measured via measureInWindow; its center is the zoom origin
│   ├── <TileMap />               Skia <Canvas> → one <Group transform> → tile <Image>s + highlight <Path>
│   └── <DraggablePlant /> × N    RN Animated.Views, siblings of the Canvas (NOT inside Skia)
└── <PlantInfoPanel />
```

**Consequence of the two-layer split:** plants are always painted above *all* tiles. A tile can
never occlude a plant. If you need true interleaving, plants must move into the Skia canvas.

---

## Files

| File | Role |
|---|---|
| `src/utils/isoMath.ts` | Coordinate frames, projection, hit-testing, render constants. **Read the header comment first.** |
| `src/utils/occupancy.ts` | `OccupancyMap` + `buildOccupancy()` — which tile holds which entity |
| `src/utils/placementRules.ts` | `canPlaceEntity()` — the placement validation rules |
| `src/types/garden.ts` | `TileCoord`, `TileMeta`, `MapData`, `Entity` |
| `src/data/exampleMap.ts` | The hardcoded map + `TILE_IMAGES` id→asset registry |
| `src/contexts/GardenContext.tsx` | `plants[]` state, `addPlant`, `updatePlantPosition`, derived `occupancy` |
| `src/contexts/GardenCameraContext.tsx` | Camera shared values + `containerFrame` |
| `src/components/garden/TileMap.tsx` | Skia tile rendering, pan/pinch gestures, drop highlight |
| `src/components/garden/DraggablePlant.tsx` | Plant sprite + drag gesture |
| `src/screens/GardenScreen.tsx` | Composition, container measurement, drag state relay |

---

## Coordinate frames

Four frames, in order. `isoMath.ts` documents the contract in its header — keep them in sync.

| Frame | Meaning |
|---|---|
| **grid** `(i, j, k)` | Logical tile coords. **The single source of truth** — entities store only this. |
| **world** | Isometric pixel space from `gridToScreen(i, j, originX, originY)`. Pre-zoom canvas space. |
| **canvas** | Container-local pixels after zoom: `canvas = (world − origin) · scale + origin` |
| **window** | Gesture `absoluteX/absoluteY`. Convert with `canvas = window − containerFrame.offset` |

**The zoom origin is the measured container center — never `Dimensions.get('window')`.** The canvas
sits below the TopBar and safe area, so the window center is not the view center. `containerFrame`
is set from `measureInWindow` in `GardenScreen.tsx`; `width === 0` means "not yet measured".

### The mirror invariant

The Skia `<Group>` transform in `TileMap.tsx` and `worldToCanvas()` in `isoMath.ts` express the
*same* transform:

```
canvas = ((world + camera) − origin) · scale + origin
```

`TileMap` applies it declaratively to the Group; `DraggablePlant` applies it manually via
`worldToCanvas`. **If you change one, change the other.** They drift silently — plants slide off
their tiles under zoom or pan, and nothing errors.

### Hit-testing

`hitTestTile(canvasX, canvasY, scale, originX, originY, cameraX, cameraY, mapW, mapH)` in
`isoMath.ts` is **the** screen→tile function. Both the drag and any tile tap must use it, so a
given pixel always resolves to the same tile. It runs `canvasToWorld` then `screenToGridDiamond`
(nearest of 5 candidate diamond centers), then bounds-checks. Returns `TileCoord | null`.

---

## Render constants (`isoMath.ts`)

| Constant | Value | Notes |
|---|---|---|
| `TILE_WIDTH` / `TILE_HEIGHT` | 40 / 20 | Grid spacing, 2:1 diamond |
| `TILE_RENDER_SIZE` | 60 | Legacy tile id 1 only |
| `PLANT_SIZE` | 75 | Plant sprite box |
| `PLANT_ANCHOR_OFFSET_Y_IMAGE` | `PLANT_SIZE` | PNG sprites are tightly cropped → visual base = box bottom |
| `PLANT_ANCHOR_OFFSET_Y_EMOJI` | `PLANT_SIZE * 0.85` | Emoji glyphs carry internal bottom padding |
| `TILE_TOP_OFFSET_Y` | 0 | Plant base sits on the diamond center. Was `-45` for the retired floating-diamond art. |
| `MIN_ZOOM` | 1.0 | You cannot zoom out past the home framing |

Anchor offsets are multiplied by `scale` inside the same transform list that also contains
`{ scale }`. Reordering that transform list breaks alignment.

---

## State ownership

**`GardenContext`** — `plants[]` is the single source of truth (React state). `occupancy` is
**derived**, never mutated:

```ts
const occupancy = useMemo(
  () => buildOccupancy(plants.map(p => ({ id: p.id, tile: p.position }))),
  [plants]
);
```

Rebuild it from `plants`; do not call the `OccupancyMap` mutators (`occupy`/`clear`/`clearEntity`)
from state updaters.

**`GardenCameraContext`** — `cameraX`, `cameraY`, `scale` are Reanimated `SharedValue`s and live
**on the UI thread only, with no React mirror by design**. Mirroring them back with `runOnJS`
reintroduces a mid-gesture drift race. `containerFrame` is ordinary React state (measurement only).

Note: `GardenProvider` is mounted at app root, but `GardenCameraProvider` is mounted inside
`GardenScreen` — so the camera resets whenever the screen remounts.

---

## Drag & placement flow

1. `Gesture.Pan` on the plant's `Animated.View`. The worklet converts `event.absoluteX/absoluteY`
   (window) to container-local by subtracting `containerFrame.offsetX/offsetY`.
   **Use `absoluteX/absoluteY`, never `event.x/y`** — the latter is plant-local and will be wrong.
2. `hitTestTile(...)` → hovered `TileCoord | null`.
3. On *tile change only*, `runOnJS` reports drag state up; `GardenScreen` validates with
   `canPlaceAt` and passes a `DragState` to `TileMap`, which draws a green (valid) or red (invalid)
   diamond `Path` in world coords inside the camera Group.
4. While dragging, the plant ghost **snaps to the hovered tile center**, not to the finger.
5. `onEnd` re-validates and calls `updatePlantPosition`, which validates a third time and does a
   pure `setPlants` map. An invalid or off-map drop changes nothing, and the animated style snaps
   the sprite back to `plant.position` automatically.

### Placement rules (`placementRules.ts`)

In order: in bounds → tile `meta.placeable` (**only tile id 3, tilled soil**) → not occupied
(ignoring the entity being moved) → **not on the front row** (`j >= map.height - 1`, a deliberate
visual-clarity rule that is easy to mistake for a bug).

---

## Assets

- **Plant sprites:** `assets/images/plants/pixel/*.png` (`cactus-128`, `sunflower-128`,
  `monstera-128`, `ficus-128`). Referenced by static `require()` only — there is no atlas. The
  starter plant catalog lives in `src/data/plantCatalog.ts` (`STARTER_PLANTS` +
  `resolvePlantByName`), the single source of truth consumed by both picker screens
  (`ChoosePlantScreen`, `Onboarding6ChoosePlant`) and the onboarding seed
  (`Onboarding9CreateAccount`). Adding a plant means editing only the catalog.
- **Tiles:** `assets/images/garden/tiles/*.png`, mapped by id in `TILE_IMAGES` (`exampleMap.ts`).
  `TileMap` calls one `useImage` hook per tile id, unconditionally. **Adding a tile id requires
  adding both the `TILE_IMAGES` entry and the hook** — a missing image makes the tile silently
  vanish (`if (!tileImage) continue`).
- Generating art: use the **`mockup-to-sprite`** skill for plants/objects and **`new-terrain-tile`**
  for terrain. See `DESIGN-SYSTEM.md`.

---

## Persistence

**Real, per-user, via Supabase** (Batch 2). `GardenContext` loads `friends`+`plants` through
`src/lib/garden.ts` (`fetchGarden`) when a session appears and clears on sign-out. `addPlant`
awaits `createFriendWithPlant` (a plant only appears if its rows exist); drag commits are
optimistic locally and persisted in the background (`persistPlantPosition` — failures are logged
via `logPlacement('PERSIST FAILED')`, local state keeps the new tile). Grid positions persist as
`grid_position_x/y` (0–9, matching the 10×10 map); `k` is client-only. Plant sprites are never
stored — re-derived from `plant_type` via `resolvePlantByType`. While loading, `GardenScreen`
shows a spinner; once the load settles with zero plants it overlays the "plant your first friend"
prompt whose CTA opens Add Friend — the tile map still renders underneath. See `DATA-MODEL.md`
for the mapping invariants.

---

## Decay, wilt & pause (Batch 4)

**Death is CUT — ratified product decision.** Wilt is the only negative state; `is_dead`,
`death_timestamp`, and `revive_logs` are legacy. Do not build on them.

- **Decay is computed client-side at load** (`effectiveHydration` in `src/lib/garden.ts`):
  `stored − decay_rate_per_day × days since last_hydration_update`, clamped 0–100, rounded.
  Nothing writes decayed values back; the DB keeps the last true snapshot. No timer runs while
  the app is open — hydration updates on the next garden load.
- **Wilt is visual only**: `hydration <= WILT_THRESHOLD` (30, exported from `garden.ts`) renders
  the sprite at reduced opacity with a 💧 badge (`DraggablePlant`).
- **Pause (vacation freeze)**: `users.is_paused` + `paused_at`. While paused, decay is computed
  only up to `paused_at`. The Settings "Pause Garden" toggle calls the `set_garden_paused` RPC —
  pause stamps `paused_at`; unpause shifts every plant's `last_hydration_update` forward by the
  pause duration, so no decay accrues while away. `GardenContext.gardenPaused` mirrors the
  persisted flag.

---

## Garden share (Batch 3)

The 📸 button in `TopBar` captures the garden via **`react-native-view-shot`'s `captureRef`** on
`gardenContainerRef` and hands the PNG to **`expo-sharing`**. It must stay a native view snapshot
of the container — tiles render in Skia but plants are RN views layered on top, so a Skia
`makeImageSnapshot` would capture the ground and none of the plants. Both packages are native
modules: changing them requires `npx expo run:ios`.

---

## Known dead code & inconsistencies

Worth knowing before you "fix" something that was never wired up:

- `depthKey()` is **unused** — tiles paint in a naive `for j { for i }` order, and plant depth uses
  `zIndex: j * 10 + i`, which is a *different* ordering than the tile paint order.
- `PlantTile.tsx` exports the `Plant` type and `PLANT_EMOJIS`, but its component is never rendered.
- `getVisibleTileBounds`, `findNearestValidTile`, `getValidPlacementTiles` are unused.
- `MapData` is declared twice — `types/garden.ts` (`ground`) and `exampleMap.ts` (legacy, `tiles`).
  `exampleMap` points both at the same array.
- `Entity.spriteId` is vestigial; it is always `'plant'`.
- `exampleMap` is imported *directly* by `GardenContext` and `DraggablePlant` even though `TileMap`
  takes `map` as a prop. A second map would break validation and hit-testing.
- `calculatePanBounds` hardcodes 10×10 assumptions and pans on X only.
- `DraggablePlant` does not guard on `containerFrame.width === 0`, so a first frame with origin
  `(0, 0)` is possible.
