Add drag-to-place for characters on an isometric tilemap in React Native using @shopify/react-native-skia.

Existing:
- gridToScreen and screenToGrid exist in isoMath.ts
- TileMap.tsx renders tiles via Skia Canvas
- Entities are rendered with bottom-center anchoring to tile center.

Goal:
- User can long-press a character, drag it around, and drop it onto a tile.
- During drag, compute hovered tile from finger position.
- Highlight hovered tile:
  - green outline if valid placement
  - red outline if invalid
- On drop:
  - if valid: commit entity.tile and update occupancy
  - else: snap back to original tile

Implementation details:
- Add DragState:
  { entityId, startTile, currentScreen:{x,y}, hoveredTile?:TileCoord, valid:boolean }
- Use react-native-gesture-handler (PanGestureHandler) or Skia touch handlers—choose the simplest robust approach.
- Provide a diamond hit-test to resolve correct tile selection at edges (not just rounding i/j).
- Snap preview to hovered tile center for pixel crispness (no subpixel).
- Keep render order correct (depth sort including dragging entity).

Return updated code for:
- isoMath.ts (add hit-test helpers)
- TileMap.tsx (drag state + highlight render)
- entities.ts (sample entity list)
