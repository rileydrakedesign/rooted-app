# New Plant Placement Architecture

## Key Principle: Separation of Concerns

### ✅ What Changed:

**Before:**
- Plants tracked screen position
- Complex camera syncing with shared values
- Screen coordinates mixed with game logic
- Broke on different screen sizes
- 400+ lines of complex coordinate math

**After:**
- Plants only know grid position (i, j, k)
- Two pure functions handle all conversion
- Game logic independent of screen/camera
- Works on any device/zoom level
- ~200 lines of clean code

## Architecture

### 1. Data Model (Pure Grid Space)
```typescript
Plant {
  id: string
  position: { x: number, y: number }  // Grid coordinates (0-9)
  // ... other game data
}
```

**Plants never store screen coordinates!**

### 2. Rendering (Pure Functions)

**Grid → Screen:**
```typescript
calculateScreenPosition(gridI, gridJ) {
  1. Grid → World: gridToScreen(i, j, camera)
  2. Add tile offset: world + TILE_TOP_OFFSET
  3. Apply zoom: (world - origin) * scale + origin
  4. Convert anchor → topLeft: screen - offset

  return { x, y }  // Screen pixels
}
```

**Screen → Grid:**
```typescript
calculateGridTile(screenX, screenY) {
  1. Screen → World: inverse zoom transform
  2. Remove tile offset: world - TILE_TOP_OFFSET
  3. World → Grid: screenToGridDiamond(world, camera)

  return { i, j, k }  // Grid coordinates
}
```

### 3. Drag Interaction (Simple Logic)

```typescript
onStart:
  - Get finger position
  - Calculate hovered tile
  - Snap visual to tile center
  - Report drag state (for highlight)

onUpdate:
  - Get finger position
  - Calculate hovered tile
  - Snap visual to tile center
  - Report drag state

onEnd:
  - Validate hovered tile
  - If valid: updatePlantPosition(grid coords)
  - If invalid: snap back to original
```

**Key insight:** Plant's logical position doesn't change during drag. Only the visual updates.

## Why This Works Better

### ✅ Screen Size Independence
- Grid coordinates never change
- Rendering adapts to any screen
- No hardcoded pixel values in logic

### ✅ Zoom Independence
- Game logic works at any zoom level
- Pure functions handle transformation
- No camera syncing needed

### ✅ Simple Debugging
- Grid position is source of truth
- Each conversion is a pure function
- Easy to test: grid(5,5) → screen(x,y) → grid(5,5)

### ✅ Maintainable
- Clear separation: logic vs rendering
- Two functions handle all conversions
- No shared value complexity

## Testing Scenarios

This architecture automatically handles:
- ✅ Different screen sizes (iPhone SE, Pro Max, iPad)
- ✅ Different zoom levels (1x, 2x, 2.5x)
- ✅ Camera panning (grid stays fixed)
- ✅ Orientation changes (grid is independent)

## Key Files

- `DraggablePlant.tsx` - 200 lines (was 400+)
  - Two pure functions: `calculateScreenPosition`, `calculateGridTile`
  - Simple drag logic
  - No camera syncing

- `GardenContext.tsx` - Stores plants with grid coords only
- `TileMap.tsx` - Renders tiles using same grid→screen function

## Performance

**Before:**
- useEffect syncing 4 shared values on every camera change
- Complex coordinate transforms on every drag update
- Screen space calculations in multiple places

**After:**
- Single useEffect updates visual when grid position changes
- Pure functions (no side effects, easily memoizable)
- All coordinate math in two centralized functions

## Future Benefits

This architecture makes it easy to add:
- Multi-tile entities (just store size in grid space)
- Pathfinding (works in grid space)
- Entity interactions (check grid distance)
- Save/load (just save grid coordinates)
- Multiplayer (sync grid positions, not screen coords)
