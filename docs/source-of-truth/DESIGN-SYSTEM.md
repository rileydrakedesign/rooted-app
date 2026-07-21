# DESIGN-SYSTEM.md — Visual Language & Asset Pipeline

> **Source of truth** for tokens, shared components, and how art gets made.
> Theme rationale and screen-by-screen UX notes live in `docs/garden-ui-navigation-analysis.md`.

Aesthetic: **Cozy Greenhouse** — warm, pixel-art, tactile. Chunky pixel buttons, soft beige/green
palette, VT323 for anything interactive.

---

## Tokens — `src/constants/theme.ts`

Never hardcode a hex, spacing value, or radius in a component. Import from `theme.ts`; if a value
is missing, add it there.

**`Colors`**

| Group | Tokens |
|---|---|
| Primary | `forestGreen` `#2D5016` · `sageGreen` `#8BA888` · `warmBeige` `#F4EDD3` · `warmWood` `#8B5A3C` · `terracotta` `#C74E3A` |
| Hydration status | `hydrationHigh` `#4CAF50` (60–100) · `hydrationMedium` `#FFC107` (20–59) · `hydrationLow` `#F44336` (0–19) · `streakGold` `#FFD700` |
| Text / UI | `textPrimary` `#212121` · `textSecondary` `#757575` · `border` `#E0E0E0` · `white` · `black` · `transparent` |
| Buttons | `buttonPrimary` `#B8916B` · `buttonPrimaryLight` `#D4A574` (top/left edge) · `buttonPrimaryDark` `#8B6F47` (bottom/right edge) |
| Misc | `notificationOrange` `#FF9F66` |

**`Spacing`** `tiny` 4 · `small` 8 · `medium` 16 · `large` 24 · `xLarge` 32
**`BorderRadius`** `small` 8 · `medium` 10 · `large` 12
**`ComponentSizes`** `buttonHeightSmall` 40 · `buttonHeightLarge` 56 · `inputFieldHeight` 48 ·
`topBarHeight` 60 · `bottomBarHeight` 80 · `iconSmall/Medium/Large` 24/32/48

---

## Typography — `src/constants/fonts.ts`

Three Google Fonts, loaded in `App.tsx`. Reference them via the `Fonts` constant, never by raw
family string.

| Role | Family | Used for |
|---|---|---|
| `Fonts.heading` | `Rubik_700Bold` | Titles (stands in for Realtime Rounded) |
| `Fonts.subtext` | `Nunito_700Bold` | Body/subtext (stands in for Corporative Sans) |
| `Fonts.pixel` | `VT323_400Regular` | **Buttons and inputs only** — the pixel voice |

`FontSizes` — titles 36/32/28 · body 20/18/16 · buttons 20/27/16 · `inputText` 16 · `caption`/`label` 14.

---

## Shared components — `src/components/`

Compose these; don't rebuild them per-screen.

| Component | Notes |
|---|---|
| `PixelButton` | The primary CTA. 3-tone beveled pixel edges from the `buttonPrimary*` tokens. |
| `PixelInput` | Text field in the pixel style; VT323 at `inputText`. |
| `ProgressBar` | Hydration / onboarding progress. Color it from the hydration tokens. |
| `BackButton` | Standard back affordance (headers are hidden app-wide). |

Garden-specific components (`TileMap`, `DraggablePlant`, `PlantInfoPanel`, `TopBar`) are documented
in [`GARDEN.md`](GARDEN.md).

---

## Asset pipeline

**Two pipelines, and the choice is not a preference — it is determined by what you're making.**

### Objects that sit *on* a tile — plants, decorations → `mockup-to-sprite` skill

AI mockup PNG → `scripts/pixelize.py` → Aseprite. The script trims transparent margins so the
sprite reaches the canvas edge, takes the **median color per cell** (robust to the block-drift and
anti-aliasing in AI "fake pixel art"), snaps alpha to fully on/off, and quantizes to a small
palette.

**Costs zero PixelLab generations. Never use PixelLab for an asset that has a mockup.**

The tight bottom crop is load-bearing: `PLANT_ANCHOR_OFFSET_Y_IMAGE = PLANT_SIZE` assumes opaque
pixels reach the image's bottom edge, so the sprite's visual base lands on the tile. A sprite with
transparent padding at the bottom will float.

### Terrain tiles → `new-terrain-tile` skill

Terrain must be a geometrically exact 2:1 isometric block (64px canvas, diamond top spanning the
full width) or it will not tessellate. **PixelLab `create_isometric_tile` guarantees this; AI
mockups do not** — so terrain is *always* generated with PixelLab.

Raw PixelLab output is **never** used directly: it carries decorative "diorama" fringe that breaks
tiling and must go through `scripts/seamless_tile.py` and `scripts/mockup_tile.py` first.

New tiles must be registered in **both** `TILE_IMAGES` (`src/data/exampleMap.ts`) and the
`useImage` hook list in `TileMap.tsx`, or they silently fail to render.

### Supporting scripts

| Script | Purpose |
|---|---|
| `scripts/pixelize.py` | Mockup → true pixel art (median-cell downsample, palette quantize) |
| `scripts/seamless_tile.py` | Make a PixelLab tile tessellate |
| `scripts/mockup_tile.py` | Tile post-processing / cleanup |
| `scripts/scene_preview.py` | Render a contact sheet / scene preview to eyeball new art in context |

Art lives in `assets/images/plants/pixel/` and `assets/images/garden/tiles/`. Plant sprites are
referenced by static `require()` from the plant catalog, which is currently duplicated in
`ChoosePlantScreen` and `Onboarding6ChoosePlant` — adding a plant means editing both.
