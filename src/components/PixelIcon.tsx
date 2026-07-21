import React from 'react';
import { SvgXml } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { PIXEL_ICONS, PixelIconName } from './icons/pixelIcons';

export type { PixelIconName };

interface PixelIconProps {
  name: PixelIconName;
  /** Rendered square size in pt. Icons are drawn on a 24×24 grid. */
  size?: number;
  color?: string;
}

/**
 * The app's single icon primitive — replaces all emoji "icons".
 * Icons come from the HackerNoon Pixel Icon Library (CC BY 4.0, see
 * src/components/icons/pixelIcons.ts); tint via `color`, which the
 * single-color SVGs inherit as fill.
 */
export default function PixelIcon({
  name,
  size = 24,
  color = Colors.forestGreen,
}: PixelIconProps) {
  return (
    <SvgXml xml={PIXEL_ICONS[name]} width={size} height={size} fill={color} />
  );
}
