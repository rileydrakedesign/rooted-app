/**
 * Garden Pass purchases (Batch 17, decision D3: RevenueCat).
 *
 * Config-gated: without EXPO_PUBLIC_REVENUECAT_IOS_KEY in .env the module
 * is a graceful no-op (paywall shows "not available yet") — the app never
 * crashes on a missing key or in the simulator. Entitlement TRUTH lives
 * server-side (users.is_premium via the revenuecat-webhook Edge Function +
 * RPC/trigger checks); the SDK is only the storefront.
 *
 * Guardrails (§8): soft walls, warm copy, zero guilt. Cash never touches
 * care, currency, or recovery — the Pass sells capacity and keepsakes only.
 */

import { Platform } from 'react-native';

const RC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;

export const PASS_PRICES = { monthly: '$4.99/mo', yearly: '$29.99/yr' }; // defaults #16
export const FREE_PLANT_CAP = 12;

export interface PassOffering {
  monthlyPackage: unknown | null;
  yearlyPackage: unknown | null;
}

let configured = false;

function getPurchases(): any | null {
  if (Platform.OS !== 'ios' || !RC_KEY) return null;
  try {
    // Lazy require: the native module only exists after the Batch 17 rebuild.
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

/** Configure once per signed-in user (appUserID = Supabase user id, which
 *  is what the webhook maps back to users.id). */
export async function configurePurchases(userId: string): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases) return false;
  try {
    if (!configured) {
      Purchases.configure({ apiKey: RC_KEY, appUserID: userId });
      configured = true;
    } else {
      await Purchases.logIn(userId);
    }
    return true;
  } catch (e) {
    if (__DEV__) console.log('[PASS] configure skipped:', e);
    return false;
  }
}

export async function fetchPassOffering(): Promise<PassOffering | null> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return {
      monthlyPackage: current.monthly ?? null,
      yearlyPackage: current.annual ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Purchase a package. Server truth arrives via the RevenueCat webhook →
 * users.is_premium; callers refresh the garden afterwards rather than
 * trusting the client result.
 */
export async function purchasePassPackage(pkg: unknown): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return false;
  try {
    await Purchases.purchasePackage(pkg);
    return true;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    throw e;
  }
}

export async function restorePassPurchases(): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases || !configured) return false;
  try {
    const info = await Purchases.restorePurchases();
    return Object.keys(info?.entitlements?.active ?? {}).length > 0;
  } catch {
    return false;
  }
}

export function passAvailable(): boolean {
  return getPurchases() !== null;
}
