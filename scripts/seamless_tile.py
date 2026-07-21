#!/usr/bin/env python3
"""
seamless_tile.py — flatten a PixelLab isometric block tile so it tessellates
seamlessly on a 2:1 diamond grid.

PixelLab block tiles are drawn as standalone dioramas: decorative fringe
(grass tufts, rim shading) overhangs all four edges of the top face. Tiled
on a grid, every tile's border stays visible as a diamond lattice.

This script reconstructs an idealized tile:
  1. Top face: pixels near the diamond edge are replaced by reflecting
     inward across an interior ring, so the interior texture continues
     cleanly to the exact mathematical edge.
  2. Anything outside the top-face diamond in the upper half is cleared
     (removes tufts poking above the silhouette).
  3. Side faces: green overhang pixels are replaced with dirt sampled
     from directly below in the same column.

Geometry assumption (PixelLab "block", 64x64): top face diamond spans the
full canvas width, vertices (32,0) (64,16) (32,32) (0,16); side faces fill
the lower half.

Usage:
  python3 scripts/seamless_tile.py input.png output.png [--edge 0.55]
"""

import argparse
import numpy as np
from PIL import Image


def seamless(src_path: str, out_path: str, edge: float = 0.55) -> None:
    im = Image.open(src_path).convert('RGBA')
    a = np.asarray(im).copy()
    size = a.shape[0]
    half_w = size / 2.0
    half_h = size / 4.0
    cx = (size - 1) / 2.0
    cy = (size / 4.0) - 0.5  # top-face diamond center

    def diamond_d(x, y):
        return abs(x - cx) / half_w + abs(y - cy) / half_h

    src = a.copy()

    for y in range(size):
        for x in range(size):
            d = diamond_d(x, y)
            in_upper = y <= cy + half_h  # top-face vertical span

            if d <= 1.0 and in_upper:
                if d > edge:
                    # Reflect inward across the `edge` ring to extend the
                    # interior texture out to the exact diamond boundary.
                    d_ref = max(0.05, 2 * edge - d)
                    s = d_ref / d
                    sx = int(round(cx + (x - cx) * s))
                    sy = int(round(cy + (y - cy) * s))
                    sx = min(max(sx, 0), size - 1)
                    sy = min(max(sy, 0), size - 1)
                    a[y, x] = src[sy, sx]
                a[y, x, 3] = 255
            elif y < cy and d > 1.0:
                # Above the diamond, outside it: clear stray tufts
                a[y, x] = (0, 0, 0, 0)
            elif y > cy and d > 1.0 and a[y, x, 3] > 0:
                # Side faces: replace green overhang with dirt from below
                r, g, b = int(a[y, x, 0]), int(a[y, x, 1]), int(a[y, x, 2])
                if g > r + 10 and g > b + 10:  # green-dominant pixel
                    yy = y
                    while yy < size - 1:
                        yy += 1
                        rr, gg, bb, aa2 = (int(v) for v in a[yy, x])
                        if aa2 > 0 and not (gg > rr + 10 and gg > bb + 10):
                            a[y, x] = a[yy, x]
                            break

    Image.fromarray(a, 'RGBA').save(out_path)
    print(f'{out_path}: seamless top face written')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('input')
    p.add_argument('output')
    p.add_argument('--edge', type=float, default=0.55,
                   help='interior ring (0-1) beyond which edge pixels are rebuilt (default 0.55)')
    args = p.parse_args()
    seamless(args.input, args.output, args.edge)
