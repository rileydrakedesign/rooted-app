/**
 * Shop service (Batch 10) — catalog, inventory, purchases, attachments.
 * Purchases go through the atomic `purchase_item` RPC (ledger spend +
 * inventory grant, idempotency-keyed); attachment equips are plain
 * owner-scoped writes (not economic).
 */

import { supabase } from './supabase';
import { Database } from '../types/database';
import { Balances } from './economy';

export type ShopItem = Database['public']['Tables']['shop_items']['Row'];
export type UserItem = Database['public']['Tables']['user_items']['Row'];

export type ShopCategory = 'pot' | 'nameplate' | 'accessory' | 'bloom' | 'garden_theme' | 'decor';

export async function fetchCatalog(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('sort', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOwnedSkus(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_items')
    .select('sku')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.sku);
}

export type PurchaseScope = 'self' | 'gift' | 'shared';

export interface PurchaseOutcome {
  sku: string;
  price: number;
  currency: 'points' | 'gems';
  scope: PurchaseScope;
  recipientUserId: string | null;
  balances: Balances;
}

/**
 * Buy for yourself, gift to a linked partner, or buy a matching set
 * (Batch 15, default #14: buyer pays full, both receive). Gift/shared
 * require the link id; the RPC enforces membership + capability tier.
 */
export async function purchaseItemRemote(
  sku: string,
  currency?: 'points' | 'gems',
  scope: PurchaseScope = 'self',
  linkId?: string
): Promise<PurchaseOutcome> {
  const { data, error } = await supabase.rpc('purchase_item', {
    p_sku: sku,
    p_currency: currency,
    p_scope: scope,
    p_link_id: linkId,
  });
  if (error) throw error;
  const r = data as {
    sku: string;
    price: number;
    currency: 'points' | 'gems';
    scope: PurchaseScope;
    recipient_user_id: string | null;
    points_balance: number;
    gems_balance: number;
  };
  return {
    sku: r.sku,
    price: r.price,
    currency: r.currency,
    scope: r.scope,
    recipientUserId: r.recipient_user_id,
    balances: { points: r.points_balance, gems: r.gems_balance },
  };
}

/**
 * Equip (or clear, sku = null) a cosmetic on a plant slot. `dbPlantId` is
 * the internal plants.id carried on the client Plant as `dbPlantId`.
 */
export async function setPlantAttachmentRemote(
  dbPlantId: string,
  slot: string,
  sku: string | null
): Promise<void> {
  if (sku === null) {
    const { error } = await supabase
      .from('plant_attachments')
      .delete()
      .eq('plant_id', dbPlantId)
      .eq('slot', slot);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('plant_attachments')
    .upsert(
      { plant_id: dbPlantId, slot, sku },
      { onConflict: 'plant_id,slot' }
    );
  if (error) throw error;
}
