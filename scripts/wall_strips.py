#!/usr/bin/env python3
"""
wall_strips.py — build the garden's static perimeter wall strips by UV-sampling
the wall mockups onto the tile engine's exact geometry.

The mockups (garden-foreground1.png / garden.background1.png) are whole-scene
layers with organic AI geometry. This script resamples their art so the wall
base line runs exactly along the outer edge of the perimeter tiles of a
GRID_N x GRID_N map (40x20 diamond pitch), making alignment seamless by
construction. One continuous image per L — no segments, no seams.

Front L (from garden-foreground1.png):
  - left wing base:  world (-200, 90) -> (0, 190)   [outer edges of j=9 row]
  - right wing base: world (200, 90) -> (0, 190)    [outer edges of i=9 column]
  - includes the gate arch on the right wing, grass lip + dirt skirt below
    the base line (skirt depth matches the tiles' 20px side depth).

World coords are relative to tile (0,0)'s base point (camera added at render).
The strip's world anchor (top-left) and size are printed and must match the
constants in src/data/walls.ts.

Back L (from garden-background.png):
  - back-left wing base:  world (-200, 90) -> (0, -10)  [outer edges of i=0 column]
  - back-right wing base: world (0, -10) -> (200, 90)   [outer edges of j=0 row]
  - wall band above the base line + a small grass foot below it that overlaps
    the back tiles' rims (blends the wall into the field). Drawn in the Skia
    canvas after tiles, behind all plants.

Usage (from repo root):
  python3 scripts/wall_strips.py front
  python3 scripts/wall_strips.py back
"""

import sys
import numpy as np
from PIL import Image

GRID_N = 10
TILE_W, TILE_H = 40, 20
WING = GRID_N * TILE_W / 2          # 200 world px horizontal per wing
H_UP = 88                            # wall + gate arch height above base line
H_DOWN = 20                          # grass lip + dirt skirt (= tile side depth)
PAD = 2

# --- garden-foreground1.png measurements (fitted grass-surface lines) ---
FG_SRC = 'assets/images/garden/garden-foreground1.png'
FG_LEFT_X0, FG_CORNER_X, FG_RIGHT_X1 = 24.0, 520.0, 1013.0
FG_LEFT_C = 571.5    # left wing:  y = 571.5 + 0.5x
FG_RIGHT_C = 1091.5  # right wing: y = 1091.5 - 0.5x


def quantize32(arr: np.ndarray) -> np.ndarray:
    opaque = arr[arr[..., 3] > 0]
    if len(opaque) == 0 or len(np.unique(opaque.reshape(-1, 4), axis=0)) <= 40:
        return arr
    img = Image.fromarray(arr, 'RGBA')
    rgb = img.convert('RGB').quantize(colors=32, method=Image.MEDIANCUT, dither=Image.NONE)
    q = np.asarray(rgb.convert('RGBA')).copy()
    q[..., 3] = arr[..., 3]
    return q


def build_front() -> None:
    src = np.asarray(Image.open(FG_SRC).convert('RGBA'))
    mh, mw = src.shape[:2]

    scale_l = (FG_CORNER_X - FG_LEFT_X0) / WING    # mockup px per world px
    scale_r = (FG_RIGHT_X1 - FG_CORNER_X) / WING

    out_w = int(2 * (WING + PAD))
    corner_base_y = (GRID_N - 1) * TILE_H + TILE_H / 2  # front corner bottom vertex: 190
    end_base_y = (GRID_N - 1) * TILE_H / 2              # side corner outer vertices: 90
    y0_world = end_base_y - H_UP - PAD
    y1_world = corner_base_y + H_DOWN + PAD
    out_h = int(y1_world - y0_world)

    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)

    for py in range(out_h):
        for px in range(out_w):
            x_e = px - (WING + PAD)
            y_e = py + y0_world
            if abs(x_e) > WING:
                continue
            base_y = corner_base_y - 0.5 * abs(x_e)  # 190 at corner, 90 at ends
            dy = y_e - base_y
            if dy < -H_UP or dy > H_DOWN:
                continue
            if x_e <= 0:
                t = (x_e + WING) / WING              # 0 at outer end, 1 at corner
                x_m = FG_LEFT_X0 + t * (FG_CORNER_X - FG_LEFT_X0)
                line_y = FG_LEFT_C + 0.5 * x_m
                y_m = line_y + dy * scale_l
            else:
                t = (WING - x_e) / WING
                x_m = FG_RIGHT_X1 - t * (FG_RIGHT_X1 - FG_CORNER_X)
                line_y = FG_RIGHT_C - 0.5 * x_m
                y_m = line_y + dy * scale_r
            sx, sy = int(round(x_m)), int(round(y_m))
            if 0 <= sx < mw and 0 <= sy < mh and src[sy, sx, 3] > 128:
                out[py, px] = src[sy, sx]
                out[py, px, 3] = 255

    out = quantize32(out)
    path = 'assets/images/garden/walls/wall-front-strip.png'
    Image.fromarray(out, 'RGBA').save(path)
    print(f'wrote {path}: {out_w}x{out_h}')
    print(f'world anchor (top-left): ({-(WING + PAD):.0f}, {y0_world:.0f})')


# --- garden-background.png measurements (fitted wall-base lines) ---
BG_SRC = 'assets/images/garden/garden-background.png'
BG_LEFT_X0, BG_TOP_X, BG_RIGHT_X1 = 23.0, 507.0, 1008.0
BG_LEFT_C = 620.0    # back-left wing:  y = 620.0 - 0.5x
BG_RIGHT_C = 113.2   # back-right wing: y = 113.2 + 0.5x
BG_H_UP = 40         # wall height above base (world px)
BG_FOOT = 10         # grass foot below base overlapping tile rims


def build_back() -> None:
    src = np.asarray(Image.open(BG_SRC).convert('RGBA'))
    mh, mw = src.shape[:2]

    scale_l = (BG_TOP_X - BG_LEFT_X0) / WING
    scale_r = (BG_RIGHT_X1 - BG_TOP_X) / WING

    top_base_y = -TILE_H / 2                    # top corner outer vertex: -10
    end_base_y = (GRID_N - 1) * TILE_H / 2      # side corner outer vertices: 90
    y0_world = top_base_y - BG_H_UP - PAD
    y1_world = end_base_y + BG_FOOT + PAD
    out_w = int(2 * (WING + PAD))
    out_h = int(y1_world - y0_world)

    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)

    for py in range(out_h):
        for px in range(out_w):
            x_e = px - (WING + PAD)
            y_e = py + y0_world
            if abs(x_e) > WING:
                continue
            base_y = top_base_y + 0.5 * abs(x_e)  # -10 at top corner, 90 at ends
            dy = y_e - base_y
            if dy < -BG_H_UP or dy > BG_FOOT:
                continue
            if x_e <= 0:
                t = (x_e + WING) / WING           # 0 at left corner, 1 at top
                x_m = BG_LEFT_X0 + t * (BG_TOP_X - BG_LEFT_X0)
                line_y = BG_LEFT_C - 0.5 * x_m
                y_m = line_y + dy * scale_l
            else:
                t = x_e / WING                    # 0 at top corner, 1 at right
                x_m = BG_TOP_X + t * (BG_RIGHT_X1 - BG_TOP_X)
                line_y = BG_RIGHT_C + 0.5 * x_m
                y_m = line_y + dy * scale_r
            sx, sy = int(round(x_m)), int(round(y_m))
            if 0 <= sx < mw and 0 <= sy < mh and src[sy, sx, 3] > 128:
                out[py, px] = src[sy, sx]
                out[py, px, 3] = 255

    out = quantize32(out)
    path = 'assets/images/garden/walls/wall-back-strip.png'
    Image.fromarray(out, 'RGBA').save(path)
    print(f'wrote {path}: {out_w}x{out_h}')
    print(f'world anchor (top-left): ({-(WING + PAD):.0f}, {y0_world:.0f})')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'front'
    if which == 'front':
        build_front()
    elif which == 'back':
        build_back()
    else:
        raise SystemExit(f'unknown target {which!r}')
