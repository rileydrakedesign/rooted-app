---
name: new-terrain-tile
description: Generate a new isometric terrain tile for the garden (PixelLab → seamless post-processing → app integration). Use when adding a new ground/tile type (sand, snow, stone, tilled variant, etc.) to the garden scene. Terrain must tessellate on the 2:1 diamond grid, so tiles are ALWAYS generated with PixelLab, never with the mockup-pixelize pipeline.
---

# New Terrain Tile Pipeline

Terrain tiles must be geometrically exact 2:1 isometric blocks (64px canvas, diamond top spanning full width) or they won't tessellate. PixelLab `create_isometric_tile` guarantees this; AI mockups don't. Raw PixelLab output is NEVER used directly — it has decorative "diorama" fringe that breaks tiling and must go through the two post-processing scripts.

## Budget check (do this first)

Each tile costs 1 generation. Check the remaining balance with the PixelLab MCP (`get_balance`). If the account is still on trial, confirm with the user before spending more than ~2 generations. Never use `create_tiles_pro` / other batch tools (20–40 generations per call).

## 1. Generate

Call `mcp__pixellab__create_isometric_tile` with:
- `description`: `"<surface> on top, sides are plain smooth dark brown earth soil cross-section underground dirt"` — keep the sides clause verbatim; only vary the surface phrase (e.g. "golden dry sand with small pebbles").
- `tile_shape: "block"`, `size: 64`, `shading: "basic shading"`, `outline: "lineless"`, `seed: 1337` (the terrain style anchor — always 1337 unless the user wants a style break).

## 2. Download (poll — takes 20s to ~8 min)

Isometric tiles persist on PixelLab (no 8-hour deletion), but download immediately anyway. The download URL 404s until generation completes, so poll:

```bash
cd assets/images/garden/tiles
until curl -s "https://api.pixellab.ai/mcp/isometric-tile/<TILE_ID>/download" -o raw/<name>-block-64.png \
  && file raw/<name>-block-64.png | grep -q "PNG image"; do sleep 15; done
```

Naming: `<surface>-block-64.png` (e.g. `sand-block-64.png`). Raw always goes in `raw/`.

## 3. Post-process (both steps, in order, from repo root)

```bash
python3 scripts/seamless_tile.py assets/images/garden/tiles/raw/<name>-block-64.png assets/images/garden/tiles/<name>-block-64.png
python3 scripts/mockup_tile.py --apply assets/images/garden/tiles/<name>-block-64.png
```

Step 1 strips the fringe so the surface runs to the exact diamond edges; step 2 replaces the sides with the shared mockup dirt cross-section (sampled from `singleTileGarden.png`) and quantizes to 32 colors.

## 4. Integrate

1. `src/data/exampleMap.ts`: add the next tile ID to the header comment, `TILE_IMAGES` (require the new png), and place the ID character in `LAYOUT` where wanted. If the tile has special rules, extend `generateMetadata` (e.g. water is `walkable: false`; only tilled soil `3` is `placeable`).
2. `src/components/garden/TileMap.tsx`: add one `useImage(TILE_IMAGES[n])` call and a matching entry in the `tileImages` record (hooks must stay unconditional — one per ID).
3. `assets/pixellab-manifest.json`: append an asset entry (file, tool, pixellab_id, description, settings incl. seed, date, notes). This is the style bible — never skip it.

## 5. Verify

```bash
python3 scripts/scene_preview.py   # renders assets/scene-preview.png with the real LAYOUT + engine math
open assets/scene-preview.png
```

Check: no pinhole gaps or fringe lattice at tile seams, sides match the other tiles, style fits the muted mockup palette. Add the new tile file to `TILE_FILES` in `scripts/scene_preview.py` too. For a live check, run the app (expo dev client on simulator) and inspect at zoom 1.0 and 2.5.
