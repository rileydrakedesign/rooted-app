/**
 * GardenCameraContext
 *
 * Owns the SINGLE source of truth for the garden camera: reanimated shared
 * values (cameraX, cameraY, scale) that live on the UI thread. They are
 * consumed by:
 *  - TileMap's Skia Group transform (via useDerivedValue)
 *  - DraggablePlant's useAnimatedStyle worklets
 *  - gesture worklets (pan/pinch mutate them directly, with clamping)
 *
 * There is deliberately NO React-state mirror of the camera — the old
 * runOnJS sync produced races where plants read a stale/flipping camera
 * mid-gesture and drifted off their tiles.
 *
 * The measured container frame (window offset + size of the garden view) is
 * plain React state: it changes only on layout, and its values are needed at
 * render time to derive the zoom origin.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';

/**
 * Measured frame of the garden container view (the canvas + plant overlay
 * area). offsetX/offsetY are window coordinates of the container's top-left
 * corner (for converting gesture absoluteX/Y → container-local coords).
 * width/height are the container's size (its center is the zoom origin).
 * width === 0 means "not measured yet" — consumers must guard on this.
 */
export interface ContainerFrame {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface GardenCameraContextType {
  cameraX: SharedValue<number>;
  cameraY: SharedValue<number>;
  scale: SharedValue<number>;
  containerFrame: ContainerFrame;
  setContainerFrame: (frame: ContainerFrame) => void;
}

const GardenCameraContext = createContext<GardenCameraContextType | undefined>(undefined);

export function GardenCameraProvider({ children }: { children: ReactNode }) {
  const cameraX = useSharedValue(0);
  const cameraY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [containerFrame, setContainerFrame] = useState<ContainerFrame>({
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
  });

  return (
    <GardenCameraContext.Provider
      value={{
        cameraX,
        cameraY,
        scale,
        containerFrame,
        setContainerFrame,
      }}
    >
      {children}
    </GardenCameraContext.Provider>
  );
}

export function useGardenCamera() {
  const context = useContext(GardenCameraContext);
  if (!context) {
    throw new Error('useGardenCamera must be used within GardenCameraProvider');
  }
  return context;
}
