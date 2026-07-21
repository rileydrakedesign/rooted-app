---
name: mockup-to-sprite
description: Convert an AI-generated pixel-art mockup PNG into a true, Aseprite-editable game sprite (plants, decorations, any object that sits ON a tile). Use when adding or updating plant/decoration art from a high-res mockup. Costs zero PixelLab generations — never use PixelLab for assets that have a mockup.
---

# Mockup → Sprite Pipeline

AI image tools produce "fake pixel art": chunky blocks that drift off any uniform grid, anti-aliased edges, thousands of near-duplicate colors. `scripts/pixelize.py` converts these into true pixel art: it trims transparent margins (sprite fills the canvas edge-to-edge), takes the median color per cell (robust to grid drift), snaps alpha to on/off, and quantizes to a small palette.

This pipeline is for anything that *stands on* a tile (plants, fences, pots, rocks). It is NOT for terrain tiles — those must tessellate exactly and use the `new-terrain-tile` skill instead.

## 1. Get the mockup

The user generates mockups externally (1024²+ PNG, transparent background). Style reference for prompting new ones: front-facing potted plant, subtle 3/4 view (visible pot rim/soil), single-color dark outline, warm saturated palette — see `assets/images/plants/*-plant.png`. Keep subject scale/framing consistent with those so `--size 128` yields a similar pixel density.

Mockups live in `assets/images/plants/` (or an equivalent mockups dir for other asset classes).

## 2. Convert

```bash
python3 scripts/pixelize.py assets/images/plants/<name>-plant.png assets/images/plants/pixel/<name>-128.png --size 128 --colors 32
```

- `--size 128` = longer output side; output is non-square (bbox-trimmed, no margins).
- `--colors 32` fits the plant style; tune per asset if gradients band.
- The script prints final dimensions and unique color count (expect ~31).

## 3. Integrate

- Plants: point the `require()` entries at the new file in `src/screens/ChoosePlantScreen.tsx` and `src/screens/onboarding/Onboarding6ChoosePlant.tsx` (PLANT_TYPES arrays). If it's a new species, also extend the `plantType` union + `PLANT_EMOJIS` in `src/components/garden/PlantTile.tsx` and the `plantTypeMap` in ChoosePlantScreen.
- Record it in `assets/pixellab-manifest.json` (tool: `scripts/pixelize.py`, source mockup path, settings, date).
- Note: sprites are bottom-trimmed, so the visual base sits at the container bottom; plant anchoring constants live in `src/components/garden/DraggablePlant.tsx` if a sprite looks sunk/floating.

## 4. Verify

- Quick look: upscale 3-4x with nearest-neighbor into a contact sheet, or run `python3 scripts/scene_preview.py` (add the sprite to `DEMO_PLANTS` to see it on a bed tile) and `open` the result.
- Compare against the source mockup — the sprite should read as the same asset at native pixel resolution.

## 5. Hand-edit (optional, the point of this pipeline)

Open the 128px PNG in Aseprite → `Sprite > Color Mode > Indexed` → the ~31-color palette becomes directly editable (bucket fills, palette swaps, outline cleanup). Export back to the same path — the app picks it up with no code changes.
