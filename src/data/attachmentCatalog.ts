/**
 * Attachment sprite registry (Batch 10) — maps shop asset_key → sprite.
 *
 * ART PIPELINE: every entry is null until its sprite lands (user-designed
 * mockups → mockup-to-sprite). A null sprite renders nothing visually but
 * the equip state persists and composites the moment art is added here —
 * add the require() and the garden/widget pick it up.
 *
 * Nameplates are the exception: they render as a styled text plate (no
 * sprite needed), so they work today.
 */

export interface AttachmentAsset {
  /** Sprite over/under the plant, or null while art is pending. */
  image: any | null;
  /** Layer relative to the plant sprite. Pots sit under, others over. */
  layer: 'under' | 'over';
}

export const ATTACHMENT_ASSETS: Record<string, AttachmentAsset> = {
  pot_terracotta: { image: null, layer: 'under' },
  pot_ceramic_blue: { image: null, layer: 'under' },
  pot_stone: { image: null, layer: 'under' },
  pot_golden_ring: { image: null, layer: 'under' },
  acc_fairy_lights: { image: null, layer: 'over' },
  acc_wind_chime: { image: null, layer: 'over' },
  acc_bee_charm: { image: null, layer: 'over' },
  bloom_spring: { image: null, layer: 'over' },
  bloom_moonflower: { image: null, layer: 'over' },
  bloom_rare_aurora: { image: null, layer: 'over' },
  // plate_wooden / plate_painted intentionally absent — nameplates render
  // as text plates in DraggablePlant, not sprites.
};

import { Colors } from '../constants/theme';

/** Which nameplate style a sku maps to (text-rendered). */
export const NAMEPLATE_STYLES: Record<string, { background: string; text: string }> = {
  'plate-wooden': { background: Colors.warmWood, text: Colors.cream },
  'plate-painted': { background: Colors.waterBlue, text: Colors.white },
};

/** shop asset_key for a sku is stored DB-side; this maps sku → asset_key for the seeded catalog. */
export const SKU_ASSET_KEYS: Record<string, string> = {
  'pot-terracotta': 'pot_terracotta',
  'pot-ceramic-blue': 'pot_ceramic_blue',
  'pot-stone': 'pot_stone',
  'pot-golden-ring': 'pot_golden_ring',
  'acc-fairy-lights': 'acc_fairy_lights',
  'acc-wind-chime': 'acc_wind_chime',
  'acc-bee-charm': 'acc_bee_charm',
  'bloom-spring': 'bloom_spring',
  'bloom-moonflower': 'bloom_moonflower',
  'bloom-rare-aurora': 'bloom_rare_aurora',
};
