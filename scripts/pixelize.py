#!/usr/bin/env python3
"""
pixelize.py — convert AI-generated "fake pixel art" mockups into true,
editable pixel art ready for Aseprite.

AI mockups render chunky pixel-art-style blocks, but the blocks drift off
any uniform grid, edges are anti-aliased, and each block contains color
noise. A plain nearest-neighbor resize samples one arbitrary point per
cell, keeping thousands of near-duplicate colors and a soft alpha fringe.

This script instead:
  1. Trims the source to its opaque bounding box so the sprite fills the
     output canvas with no transparent margins (disable with --no-trim).
  2. Splits the trimmed source into cells and takes the MEDIAN color of
     each cell (robust to block drift and edge bleed). The longer side
     gets --size cells; the shorter side is proportional, so the output
     is generally non-square.
  3. Thresholds alpha to fully opaque / fully transparent.
  4. Quantizes opaque pixels to a small adaptive palette.

Output is a clean PNG with a tiny palette — open it in Aseprite and
switch to Indexed color mode for palette-based editing.

Usage:
  python3 scripts/pixelize.py input.png output.png [--size 128] [--colors 32] [--no-trim]
"""

import argparse
import numpy as np
from PIL import Image


def pixelize(src_path: str, out_path: str, size: int, colors: int,
             alpha_threshold: int = 128, trim: bool = True) -> None:
    im = Image.open(src_path).convert('RGBA')

    if trim:
        # Crop to the opaque bounding box so the sprite fills the canvas
        mask = im.getchannel('A').point(lambda v: 255 if v >= alpha_threshold else 0)
        bbox = mask.getbbox()
        if bbox:
            im = im.crop(bbox)

    a = np.asarray(im)
    h, w = a.shape[:2]

    # The longer side gets `size` cells; the shorter side is proportional
    # so cells stay square-ish and the sprite keeps its aspect ratio.
    if h >= w:
        out_h, out_w = size, max(1, round(size * w / h))
    else:
        out_w, out_h = size, max(1, round(size * h / w))
    ys = np.linspace(0, h, out_h + 1).astype(int)
    xs = np.linspace(0, w, out_w + 1).astype(int)

    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)
    for j in range(out_h):
        for i in range(out_w):
            cell = a[ys[j]:ys[j + 1], xs[i]:xs[i + 1]].reshape(-1, 4)
            alpha_med = np.median(cell[:, 3])
            if alpha_med < alpha_threshold:
                continue  # transparent cell
            opaque = cell[cell[:, 3] >= alpha_threshold]
            med = np.median(opaque[:, :3], axis=0)
            out[j, i, :3] = med.astype(np.uint8)
            out[j, i, 3] = 255

    result = Image.fromarray(out, 'RGBA')

    # Quantize opaque colors to a small palette (alpha handled separately)
    rgb = result.convert('RGB').quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE)
    quantized = rgb.convert('RGBA')
    q = np.asarray(quantized).copy()
    q[..., 3] = out[..., 3]  # restore binary alpha

    final = Image.fromarray(q, 'RGBA')
    final.save(out_path)

    unique = len(np.unique(q[q[..., 3] == 255].reshape(-1, 4), axis=0))
    print(f'{out_path}: {out_w}x{out_h}, {unique} unique opaque colors')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('input')
    p.add_argument('output')
    p.add_argument('--size', type=int, default=128, help='output size of the longer side (default 128)')
    p.add_argument('--colors', type=int, default=32, help='palette size (default 32)')
    p.add_argument('--no-trim', action='store_true', help='keep transparent margins instead of cropping to content')
    args = p.parse_args()
    pixelize(args.input, args.output, args.size, args.colors, trim=not args.no_trim)
