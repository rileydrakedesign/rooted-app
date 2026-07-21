#!/usr/bin/env python3
"""
scene_preview.py — render the garden scene exactly as the app's tile engine
draws it (40x20 diamond spacing, back-to-front, bottom-anchored plants),
without launching the app.

Reads the LAYOUT strings directly from src/data/exampleMap.ts so the preview
never drifts from the real map. Tile images come from TILE_FILES below —
add an entry when you add a tile ID.

Usage (from repo root):
  python3 scripts/scene_preview.py [out.png]   # default: assets/scene-preview.png
"""

import re
import sys
from PIL import Image

TILE_W, TILE_H = 40, 20
TILES_DIR = 'assets/images/garden/tiles'
PLANTS_DIR = 'assets/images/plants/pixel'

# tile id -> live image file (keep in sync with TILE_IMAGES in exampleMap.ts)
TILE_FILES = {
    '2': 'grass-block-64.png',
    '3': 'soil-tilled-block-64.png',
    '4': 'path-cobble-block-64.png',
    '5': 'water-block-64.png',
    '6': 'grass-flowers-block-64.png',
}

# demo plants shown on bed tiles: (sprite name, i, j)
DEMO_PLANTS = [('sunflower', 2, 2), ('cactus', 2, 4), ('monstera', 7, 3), ('ficus', 7, 2)]

# static wall strips: (file, world anchor x, world anchor y, layer) — anchors
# are printed by scripts/wall_strips.py and must match src/data/walls.ts.
# layer 'back' pastes after tiles/before plants; 'front' pastes after plants.
WALL_STRIPS = [
    ('assets/images/garden/walls/wall-back-strip.png', -202, -52, 'back'),
    ('assets/images/garden/walls/wall-front-strip.png', -202, 0, 'front'),
]


def read_layout(path: str = 'src/data/exampleMap.ts') -> list:
    src = open(path).read()
    block = re.search(r'const LAYOUT.*?=\s*\[(.*?)\];', src, re.S).group(1)
    rows = re.findall(r"'([0-9]+)'", block)
    assert rows, 'no LAYOUT rows found in exampleMap.ts'
    return rows


def render(out_path: str) -> None:
    layout = read_layout()
    h, w = len(layout), len(layout[0])
    tiles = {k: Image.open(f'{TILES_DIR}/{v}').convert('RGBA').resize((TILE_W, TILE_W), Image.NEAREST)
             for k, v in TILE_FILES.items()}

    ox = (h * TILE_W) // 2 + TILE_W
    oy = 60
    canvas = Image.new('RGBA', ((w + h) * TILE_W // 2 + 2 * TILE_W, (w + h) * TILE_H // 2 + 160),
                       (240, 234, 220, 255))

    for j in range(h):
        for i in range(w):
            ch = layout[j][i]
            if ch not in tiles:
                continue
            x = (i - j) * (TILE_W // 2) + ox
            y = (i + j) * (TILE_H // 2) + oy
            canvas.paste(tiles[ch], (x - TILE_W // 2, y - TILE_H // 2), tiles[ch])

    def paste_strips(layer):
        for path, ax, ay, lay in WALL_STRIPS:
            if lay != layer:
                continue
            try:
                strip = Image.open(path).convert('RGBA')
            except FileNotFoundError:
                continue
            canvas.paste(strip, (ox + ax, oy + ay), strip)

    paste_strips('back')

    for name, i, j in DEMO_PLANTS:
        try:
            im = Image.open(f'{PLANTS_DIR}/{name}-128.png').convert('RGBA')
        except FileNotFoundError:
            continue
        ph = 55
        pw = round(im.width * ph / im.height)
        im = im.resize((pw, ph), Image.NEAREST)
        x = (i - j) * (TILE_W // 2) + ox
        y = (i + j) * (TILE_H // 2) + oy
        canvas.paste(im, (x - pw // 2, y - ph + 4), im)

    paste_strips('front')

    canvas.resize((canvas.width * 2, canvas.height * 2), Image.NEAREST).save(out_path)
    print('saved', out_path)


if __name__ == '__main__':
    render(sys.argv[1] if len(sys.argv) > 1 else 'assets/scene-preview.png')
