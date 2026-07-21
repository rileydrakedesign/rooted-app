/**
 * Debug Logging Utilities
 *
 * Centralized logging for coordinate transformations and drag debugging.
 */

export const DEBUG = {
  DRAG: true,        // Enable drag debugging
  COORDS: false,     // Enable coordinate transformation debugging (verbose)
  PLACEMENT: true,   // Enable placement validation debugging
};

export function logDrag(stage: string, data: any) {
  if (DEBUG.DRAG) {
    console.log(`🎯 [DRAG] ${stage}:`, JSON.stringify(data, null, 2));
  }
}

export function logCoords(stage: string, data: any) {
  if (DEBUG.COORDS) {
    console.log(`📐 [COORDS] ${stage}:`, JSON.stringify(data, null, 2));
  }
}

export function logPlacement(stage: string, data: any) {
  if (DEBUG.PLACEMENT) {
    console.log(`✅ [PLACEMENT] ${stage}:`, JSON.stringify(data, null, 2));
  }
}
