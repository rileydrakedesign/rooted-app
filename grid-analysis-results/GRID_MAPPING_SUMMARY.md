# Grid Mapping Analysis Summary

## Source Asset
- **File**: gardenBackground1.png
- **Dimensions**: 1000x1000px
- **Playable Area**:
  - Width: 976px
  - Height: 509px
  - Bounds: (7, 246) to (983, 755)

## Grid Structure
- **Type**: Isometric 2:1 ratio diamond grid
- **Size**: 10 rows × 10 columns
- **Valid positions**: 59 out of 100 (41 extend beyond playable bounds)

## Isometric Vectors
The grid is defined by two fundamental vectors:

1. **Vector 1 (Southeast)**: (86.52, -43.38)
   - Angle: ~26.6° below horizontal
   - Moving from (0,0) to (1,0)

2. **Vector 2 (Southwest)**: (-86.62, -43.33)
   - Angle: ~153.4° from horizontal
   - Moving from (0,0) to (0,1)

## Grid Origin
- **Position**: (491.47, 937.59)
- **Location**: Bottom-center of the playable diamond
- **Grid coordinate**: (0, 0)

## Accuracy
- **Average alignment error**: 29.83px
- **Best alignment**: Center region (5,5) with 0px error
- **Method**: Direct pixel analysis with isometric vector calculation

## Coordinate System
```
Row 9: Bottom (9,9) is at top-center visually
Row 0: Top (0,0) is at bottom-center visually
       Col 0-9 progresses left to right in isometric view
```

## Key Points (in source image coordinates)
- **(0,0)**: (491, 938) - Bottom-center
- **(9,0)**: (1270, 547) - Right edge
- **(0,9)**: (-288, 548) - Left edge
- **(9,9)**: (491, 157) - Top-center
- **(5,5)**: (491, 504) - Center (perfect alignment)

## Implementation Notes
The generated `gardenGrid.ts` file:
- Uses pre-calculated grid positions stored as offsets from center
- Scales automatically based on screen size
- Maintains accuracy across different device dimensions
- Handles image centering and resizeMode="contain" correctly
