/**
 * Static perimeter wall strips.
 *
 * Each strip is one continuous image built by scripts/wall_strips.py, which
 * UV-samples the wall mockups onto the tile engine's exact geometry — the
 * wall base line runs along the outer edge of the perimeter tiles, so
 * alignment with the grid is seamless by construction.
 *
 * anchor = world coordinates of the image's top-left corner, relative to
 * tile (0,0)'s base point (the same world space gridToScreen produces).
 * Values are printed by wall_strips.py — keep them in sync.
 *
 * Walls are static scenery: not interactive, no occupancy, fixed z-order
 * (front strip above all plants — nothing can ever stand in front of it).
 */

export interface WallStrip {
  image: any;
  anchorX: number; // world px
  anchorY: number; // world px
  width: number;   // image px == world px (drawn 1:1 at scale 1)
  height: number;
}

export const FRONT_WALL: WallStrip = {
  image: require('../../assets/images/garden/walls/wall-front-strip.png'),
  anchorX: -202,
  anchorY: 0,
  width: 404,
  height: 212,
};

/**
 * Back perimeter wall L. Unlike FRONT_WALL (an RN overlay above plants),
 * this is drawn inside TileMap's Skia canvas right after the tiles: its
 * grass foot overlaps the back tiles' rims, and plants — which are RN views
 * above the canvas — are always in front of it, which is isometrically
 * correct for a wall on the back edges.
 */
export const BACK_WALL: WallStrip = {
  image: require('../../assets/images/garden/walls/wall-back-strip.png'),
  anchorX: -202,
  anchorY: -52,
  width: 404,
  height: 154,
};
