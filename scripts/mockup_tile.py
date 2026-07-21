#!/usr/bin/env python3
"""
mockup_tile.py — build the garden's 64px terrain tiles by sampling the
hand-picked mockup block (assets/images/garden/singleTileGarden.png)
directly onto exact 2:1 isometric block geometry.

- grass-block-64: top face AND dirt sides UV-mapped straight from the
  mockup, so the tile inherits its subtle mottled texture and grass lip.
- grass-flowers-block-64: same base + flower pixels harvested from the
  raw PixelLab wildflower tile (positions align, both are 64px blocks).
- soil/path/water: keep their (seam-fixed) PixelLab top faces, but get
  the mockup-derived dirt sides so every tile shares one cross-section.

All outputs are quantized to a 32-color palette (Aseprite-friendly).

Geometry (64x64 block): top-face diamond vertices (32,0) (64,16) (32,32)
(0,16); side faces extend 32px below the lower diamond edges.

Usage (from repo root):
  python3 scripts/mockup_tile.py                 # full rebuild of the 5 core tiles
  python3 scripts/mockup_tile.py --apply X.png   # single tile: mockup sides + quantize, in place
"""

import argparse
import numpy as np
from PIL import Image

SIZE = 64
HALF_W, HALF_H = SIZE / 2.0, SIZE / 4.0
CX, CY = (SIZE - 1) / 2.0, SIZE / 4.0 - 0.5

TILES_DIR = 'assets/images/garden/tiles'

# Mockup top-face diamond vertices (measured via color-distance mask)
M_TOP = np.array([515.0, 271.0])
M_RIGHT = np.array([834.0, 428.0])
M_BOTTOM = np.array([515.0, 610.0])
M_LEFT = np.array([190.0, 443.0])
M_SIDE_DEPTH = 350.0  # dirt cross-section height below the diamond


def diamond_uv(x: float, y: float):
    """Map tile pixel -> (u, v) along the two diamond edge axes, each in [0,1]."""
    dx = (x - CX) / HALF_W
    dy = (y - CY) / HALF_H
    u = (dx + dy) / 2.0 + 0.5  # 0 at left vertex, 1 at right
    v = (dy - dx) / 2.0 + 0.5  # 0 at top vertex, 1 at bottom
    return u, v


def build_grass(mockup: np.ndarray) -> np.ndarray:
    mh, mw = mockup.shape[:2]
    out = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)

    for y in range(SIZE):
        for x in range(SIZE):
            u, v = diamond_uv(x, y)
            d = abs(x - CX) / HALF_W + abs(y - CY) / HALF_H

            if d <= 1.06 and y <= CY + HALF_H + 1:
                # Top face, slightly overdrawn (d<=1.06) so scaled rendering
                # can't open pinhole gaps at tile seams. Sample with a 5%
                # inset to skip the mockup's rim highlight.
                uu = 0.05 + 0.90 * min(max(u, 0.0), 1.0)
                vv = 0.05 + 0.90 * min(max(v, 0.0), 1.0)
                p = M_TOP + uu * (M_RIGHT - M_TOP) + vv * (M_LEFT - M_TOP)
                sx, sy = int(round(p[0])), int(round(p[1]))
                sx, sy = min(max(sx, 0), mw - 1), min(max(sy, 0), mh - 1)
                out[y, x] = mockup[sy, sx]
                out[y, x, 3] = 255
            elif y > CY and d > 1.0 and y < SIZE:
                # Side faces below the lower diamond edges
                # left face: x in [0, 32]; right face mirrored
                if x <= CX:
                    # lower-left diamond edge: (0, CY+0.5) -> (CX, CY+HALF_H), slope 0.5
                    edge_y = (CY + 0.5) + 0.5 * (x + 0.5)
                    frac_u = (x + 0.5) / (SIZE / 2.0)  # 0 at left vertex -> 1 at bottom
                    e0, e1 = M_LEFT, M_BOTTOM
                else:
                    edge_y = (CY + 0.5) + 0.5 * (SIZE - 0.5 - x)
                    frac_u = (SIZE - 0.5 - x) / (SIZE / 2.0)
                    e0, e1 = M_RIGHT, M_BOTTOM
                depth = y - edge_y
                if depth < 0 or depth >= SIZE / 2.0:
                    continue
                w = depth / (SIZE / 2.0)
                p = e0 + frac_u * (e1 - e0)
                sx = int(round(p[0]))
                sy = int(round(p[1] + w * M_SIDE_DEPTH))
                sx, sy = min(max(sx, 0), mw - 1), min(max(sy, 0), mh - 1)
                if mockup[sy, sx, 3] > 128:
                    out[y, x] = mockup[sy, sx]
                    out[y, x, 3] = 255
    return out


def harvest_flowers(raw_flowers: np.ndarray, base: np.ndarray) -> np.ndarray:
    """Copy non-green flower pixels from the raw PixelLab wildflower tile top."""
    out = base.copy()
    for y in range(SIZE):
        for x in range(SIZE):
            d = abs(x - CX) / HALF_W + abs(y - CY) / HALF_H
            if d <= 0.9 and y <= CY + HALF_H and raw_flowers[y, x, 3] > 128:
                r, g, b = (int(v) for v in raw_flowers[y, x, :3])
                brightness = (r + g + b) / 3
                is_flower = (brightness > 170 and abs(r - g) < 60) or (r > g + 30)
                if is_flower:
                    out[y, x, :3] = raw_flowers[y, x, :3]
                    out[y, x, 3] = 255
    return out


def swap_sides(top_tile: np.ndarray, sides_from: np.ndarray) -> np.ndarray:
    """Keep top face of `top_tile`, take everything below/outside from `sides_from`.

    The overdraw ring (d in (1.0, 1.06]) is filled by extending the top
    tile's own edge pixels outward, so seams can't open pinholes and the
    grass template's green rim never leaks onto other terrain types.
    """
    out = sides_from.copy()
    for y in range(SIZE):
        for x in range(SIZE):
            d = abs(x - CX) / HALF_W + abs(y - CY) / HALF_H
            if d <= 1.06 and y <= CY + HALF_H + 1:
                if d <= 1.0 and top_tile[y, x, 3] > 0:
                    out[y, x] = top_tile[y, x]
                else:
                    s = 0.97 / max(d, 0.01)
                    sx = min(max(int(round(CX + (x - CX) * s)), 0), SIZE - 1)
                    sy = min(max(int(round(CY + (y - CY) * s)), 0), SIZE - 1)
                    out[y, x] = top_tile[sy, sx]
                out[y, x, 3] = 255
    return out


def quantize32(arr: np.ndarray) -> np.ndarray:
    # Skip if already palette-sized: re-quantizing collapses sparse accent
    # colors (e.g. the wildflower pixels) into the dominant surface color.
    opaque = arr[arr[..., 3] > 0]
    if len(np.unique(opaque.reshape(-1, 4), axis=0)) <= 40:
        return arr
    img = Image.fromarray(arr, 'RGBA')
    rgb = img.convert('RGB').quantize(colors=32, method=Image.MEDIANCUT, dither=Image.NONE)
    q = np.asarray(rgb.convert('RGBA')).copy()
    q[..., 3] = arr[..., 3]
    return q


def save(arr: np.ndarray, name: str) -> None:
    path = f'{TILES_DIR}/{name}.png'
    Image.fromarray(quantize32(arr), 'RGBA').save(path)
    print('wrote', path)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--apply', metavar='TILE_PNG', default=None,
                   help='apply mockup dirt sides + 32-color quantize to one seam-fixed 64px tile, in place')
    args = p.parse_args()

    mockup = np.asarray(Image.open('assets/images/garden/singleTileGarden.png').convert('RGBA'))
    # Quantize the base up front: later passes (flower stamping, side swaps)
    # then stay under the quantize32 no-op guard, so sparse accent pixels
    # are never merged away by a second median-cut.
    grass = quantize32(build_grass(mockup))

    if args.apply:
        cur = np.asarray(Image.open(args.apply).convert('RGBA'))
        out = quantize32(swap_sides(cur, grass))
        Image.fromarray(out, 'RGBA').save(args.apply)
        print('wrote', args.apply)
    else:
        save(grass, 'grass-block-64')

        raw_flowers = np.asarray(Image.open(f'{TILES_DIR}/raw/grass-flowers-block-64.png').convert('RGBA'))
        save(harvest_flowers(raw_flowers, grass), 'grass-flowers-block-64')

        # soil/path/water: current files already have seam-fixed tops; give them mockup sides
        for name in ['soil-tilled-block-64', 'path-cobble-block-64', 'water-block-64']:
            cur = np.asarray(Image.open(f'{TILES_DIR}/{name}.png').convert('RGBA'))
            save(swap_sides(cur, grass), name)
