# Test and Share Logs

## What to Do:

1. **Restart the app** to get fresh logs

2. **Watch for these key logs** in order:
   ```
   📱 SCREEN DIMENSIONS - Screen size and center
   📐 [COORDS] TILEMAP CAMERA INIT - Initial camera setup
   📐 [COORDS] CAMERA SYNC - Camera sync to shared values
   📐 [COORDS] POSITION SYNC - Plant initial positioning
   ```

3. **Add a plant** if you don't have one (go to Add Friend screen)

4. **Drag the plant** and watch for:
   ```
   🎯 [DRAG] START - Initial drag state
   📐 [COORDS] Screen → World - Coordinate conversion
   📐 [COORDS] World → Grid - Grid calculation
   📐 [COORDS] Grid → Plant Position - Plant positioning
   📐 [COORDS] TILE HIGHLIGHT - Highlight rendering
   ```

5. **Copy ALL the logs** from app start through one complete drag operation

## What I Need to See:

Please share the **complete sequence** including:
- `📱 SCREEN DIMENSIONS`
- `TILEMAP CAMERA INIT`
- `CAMERA SYNC` (multiple times is OK)
- `POSITION SYNC` (when plant loads)
- `DRAG START` (when you start dragging)
- All the coordinate transformation logs during drag
- `TILE HIGHLIGHT` logs
- `DRAG END` logs

## Why This Helps:

The logs will show:
1. **Are screen dimensions correct?** (Expected 375x812 for iPhone X)
2. **Is camera initialized correctly?** (Should be 187.5, 326)
3. **Are shared values syncing?** (Compare context vs shared values)
4. **Where do coordinates go wrong?** (Track each transformation)

## Quick Check:

If you see:
- Camera X ≠ 187.5 → **Camera init problem**
- Shared cameraX ≠ context cameraX → **Sync problem**
- Grid coords negative or > 9 → **Screen→Grid conversion problem**
- Plant position way off from tile highlight → **Grid→Screen conversion problem**
