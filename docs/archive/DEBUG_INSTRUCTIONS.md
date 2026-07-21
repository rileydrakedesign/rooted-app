# Debug Instructions

## What to Look For

When you drag a plant, you'll see detailed console logs showing each coordinate transformation step:

### 1. **Initial Position Sync** (on app load)
Look for `📐 [COORDS] POSITION SYNC` logs showing:
- Plant grid position (i, j)
- Camera position
- Calculated screen position
- **Expected:** Plants should appear centered on their tiles

### 2. **Drag Start** (when you touch a plant)
Look for these logs in sequence:
```
🎯 [DRAG] START - Initial state
📐 [COORDS] Screen → World - Finger to world coords
📐 [COORDS] World → Grid - World to grid coords
📐 [COORDS] Grid → Plant Position - Final positioning
📐 [COORDS] TILE HIGHLIGHT - Highlight rendering
```

### 3. **Key Things to Check**

#### Camera Values
- Camera should be around `(187.5, 336)` when centered
- Scale should start at `1.0`
- PanOffset should be `0` when not panned

#### Screen to World Conversion
- Finger at screen center `(~187, ~400)` should convert to similar world coords when scale=1
- Check if `zoomOriginX` and `zoomOriginY` match your screen center

#### World to Grid Conversion
- World coords near camera position should map to grid `(5, 5)` (center of 10x10 grid)
- Negative grid coords or coords > 9 mean something is wrong

#### Grid to Plant Position
- A plant at grid `(5, 5)` should have screen position near camera position
- `tileBase` should be close to camera when plant is at grid center
- `anchorScreen` should be `tileBase + TILE_TOP_OFFSET_Y` adjusted for zoom

### 4. **Common Issues to Diagnose**

**Problem: Plant appears far from grid**
- Check `POSITION SYNC` - is `finalPosition` reasonable?
- Compare `camera` values in POSITION SYNC vs drag
- Are `cameraXShared` and `cameraX` in sync?

**Problem: Drag is jumpy**
- Check if camera values change during drag (they shouldn't)
- Look for scale changes during drag
- Check if `translateX/Y` jumps between updates

**Problem: Plant not aligned with hover**
- Compare `TILE HIGHLIGHT` screen pos with `Grid → Plant Position`
- They should match closely (within ~30-60px for anchor offset)
- If they're wildly different, coordinate systems are misaligned

### 5. **Quick Diagnostic Commands**

Open React Native debugger console and filter by:
- `[DRAG]` - See drag lifecycle
- `[COORDS]` - See coordinate transformations
- `POSITION SYNC` - See initial positioning
- `TILE HIGHLIGHT` - See where highlight appears

### 6. **Expected Values for Reference**

For a plant at grid position `(5, 5)` (center):
- `tileBase` (world): Should be near `(187.5, 336)` when camera is centered
- `anchorWorld`: `tileBase + (0, -45)` = around `(187.5, 291)`
- `anchorScreen` at scale=1: Same as `anchorWorld`
- `plantTopLeft` at scale=1: `anchorScreen - (37.5, 63.75)` = around `(150, 227)`

Screen dimensions: `375 x 812` (iPhone)
Zoom origin: `(187.5, 406)`

### 7. **How to Fix Issues**

Once you identify the problem in logs:

**If camera sync is wrong:**
- Check `cameraXShared.value` vs `cameraX` in logs
- May need to fix the `useEffect` sync

**If coordinate math is wrong:**
- Check if we're using world coords where we should use screen coords
- Verify zoom transform is applied correctly

**If plants start in wrong position:**
- Problem is in `tileToScreenAnchor()` function
- Check camera values being used

**If drag placement is wrong:**
- Problem is in `screenToTile()` function
- Check inverse zoom transformation
