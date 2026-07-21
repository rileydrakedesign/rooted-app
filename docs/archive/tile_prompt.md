You are implementing an isometric tile grid renderer for a React Native iOS app.

Constraints:
- Use TypeScript.
- Use @shopify/react-native-skia for rendering (Canvas + Image).
- Tiles are diamond 2:1: tileW=64, tileH=32 (make constants).
- The logical map is a 2D array of tile IDs (strings or ints).
- Provide functions:
  - gridToScreen(i,j,originX,originY) -> {x,y}
  - screenToGrid(x,y,originX,originY) -> {i,j} (approx)
  - depthKey(i,j,k=0) for sorting sprites/objects
- Render tiles by iterating visible tiles only (culling):
  - Given camera {x,y} and viewport {width,height}, compute tile bounds to draw.
- Add a simple pan gesture to move the camera.
- Add tap handling: on tap, convert to grid coords and highlight the selected tile.
- Load tile images from a dictionary: { [tileId]: require('...') }.
- Create:
  1) isoMath.ts (math + helpers)
  2) TileMap.tsx (Skia renderer component)
  3) exampleMap.ts (sample 30x30 map data)
  4) App.tsx example that mounts TileMap.

Implementation details:
- Anchor each tile image so its bottom-center aligns with the tile center point.
- Ensure crisp pixel art: no smoothing / nearest-neighbor if possible.
- Include comments explaining how to extend for multi-tile objects later.
Return the full code for the four files.
