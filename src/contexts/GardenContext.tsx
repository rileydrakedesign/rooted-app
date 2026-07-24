/**
 * GardenContext
 *
 * Manages garden state including plants and their placement on the tile grid.
 *
 * State model: `plants` is the single source of truth; `occupancy` is DERIVED
 * from it with useMemo (never mutated imperatively), so state updaters stay
 * pure and occupancy can never drift out of sync with the plants array.
 *
 * Persistence: state is loaded from Supabase per signed-in user (fetchGarden)
 * and cleared on sign-out. Writes go through src/lib/garden.ts — addPlant
 * awaits the DB insert; position updates commit locally first (optimistic)
 * and persist in the background.
 */

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { Plant } from '../types/garden';
import { useFriends } from './FriendsContext';
import { OccupancyMap, buildOccupancy } from '../utils/occupancy';
import { TileCoord, Entity } from '../types/garden';
import { canPlaceEntity } from '../utils/placementRules';
import { MapData } from '../data/exampleMap';
import { GARDEN_MAPS, GardenThemeId, isGardenTheme, mapForTheme } from '../data/maps';
import { logPlacement } from '../utils/debugLog';
import { syncWidgetSnapshot } from '../lib/widgetSync';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { enqueueLog, flushLogQueue, generateUUID } from '../lib/logQueue';
import {
  fetchGarden,
  createFriendWithPlant,
  persistPlantPosition,
  persistNotificationPrefs,
  setGardenPausedRemote,
  logInteractionRemote,
  InteractionType,
  mapFrequency,
  HYDRATION_WEIGHTS,
  LogResult,
  multiplierFor,
} from '../lib/garden';
import {
  Balances,
  RestoreCurrency,
  RestoreResult,
  restoreStreakRemote,
} from '../lib/economy';
import {
  ShopItem,
  fetchCatalog,
  fetchOwnedSkus,
  purchaseItemRemote,
  PurchaseOutcome,
  setPlantAttachmentRemote,
} from '../lib/shop';
import {
  DecorItem,
  fetchGardenLayout,
  fetchDecor,
  persistGardenTheme,
  placeDecorRemote,
  persistDecorPosition,
  removeDecorRemote,
} from '../lib/garden';
import {
  NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  rescheduleAllNotifications,
} from '../lib/notifications';
import {
  createLinkInvite,
  acceptLinkInvite,
  AcceptResult,
  registerPushToken,
  sendPartnerPush,
  subscribeToLinkEvents,
} from '../lib/links';
import { ContactFrequency } from '../lib/garden';
import { configurePurchases, FREE_PLANT_CAP } from '../lib/purchases';
import {
  NudgeRow,
  NudgeType,
  fetchUnseenNudges,
  markNudgeSeen,
  playHapticSignature,
  subscribeToNudges,
} from '../lib/nudges';
import { playPreview } from '../lib/musicBox';

interface GardenContextType {
  plants: Plant[];
  /** True while the signed-in user's garden is being fetched. */
  loading: boolean;
  addPlant: (
    friendName: string,
    plantType: Plant['plantType'],
    image: any,
    frequency?: string
  ) => Promise<void>;
  updatePlantPosition: (plantId: string, newTile: TileCoord) => void;
  canPlaceAt: (tile: TileCoord, excludePlantId?: string) => { ok: boolean; reason?: string };
  selectedPlant: Plant | null;
  setSelectedPlant: (plant: Plant | null) => void;
  occupancy: OccupancyMap;
  /** Vacation freeze — while true, hydration decay is frozen (persisted per user). */
  gardenPaused: boolean;
  setGardenPaused: (paused: boolean) => Promise<void>;
  /**
   * Log contact with a friend (the care loop). Returns the full result —
   * hydration, streak, and what was minted (Batch 9).
   * `occurredAt` backdates the streak credit (ISO, clamped to 48 h by the RPC).
   */
  logInteraction: (
    friendId: string,
    type: InteractionType,
    note?: string,
    occurredAt?: string
  ) => Promise<LogResult>;
  /** Notification preferences (Batch 8) — persisted on users.notification_prefs. */
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: (prefs: NotificationPrefs) => Promise<void>;
  /** Points/gems balances (Batch 9) — cached from users, updated on every log. */
  balances: Balances;
  /** Buy back a broken streak (spec §1). Refreshes the garden on success. */
  restoreStreak: (friendId: string, currency: RestoreCurrency) => Promise<RestoreResult>;
  /** Shop (Batch 10): active catalog + skus the user owns. */
  shopCatalog: ShopItem[];
  ownedSkus: string[];
  purchaseItem: (
    sku: string,
    currency?: 'points' | 'gems',
    scope?: 'self' | 'gift' | 'shared',
    linkId?: string
  ) => Promise<PurchaseOutcome>;
  /** Equip (sku) or clear (null) a cosmetic slot on a plant. */
  equipAttachment: (friendId: string, slot: string, sku: string | null) => Promise<void>;
  /** Multi-map (Batch 12): the active theme + its map. All hit-testing and
   *  placement must use activeMap, never a direct exampleMap import. */
  gardenTheme: GardenThemeId;
  activeMap: MapData;
  setGardenTheme: (theme: GardenThemeId) => Promise<void>;
  /** Themes the user can equip (free default + owned theme skus). */
  availableThemes: GardenThemeId[];
  /** Placed decor (Batch 12) — persisted in decorative_items. */
  decorItems: DecorItem[];
  placeDecor: (sku: string, name: string) => Promise<boolean>;
  moveDecor: (id: string, tile: TileCoord) => void;
  removeDecor: (id: string) => Promise<void>;
  /** Aggregate-only signals for reactive decor (spec §3 — never per-friend). */
  gardenSignals: { avgHydration: number; windowsSatisfiedPct: number };
  /** Nudge landing animations (Batch 14): friendId → active nudge type. */
  nudgeEffects: Record<string, NudgeType>;
  /** Garden Pass (Batch 17): server-truth premium flag + downgrade
   *  soft-locks (plants beyond the free cap go view-only, never deleted). */
  isPremium: boolean;
  lockedPlantIds: string[];
  /** Linking (Batch 13). */
  createInvite: (friendId: string) => Promise<string>;
  acceptInvite: (
    code: string,
    plantType: Plant['plantType'],
    frequency: ContactFrequency
  ) => Promise<AcceptResult>;
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

function validateAt(
  map: MapData,
  occ: OccupancyMap,
  tile: TileCoord,
  excludePlantId?: string
): { ok: boolean; reason?: string } {
  const dummyEntity: Entity = {
    id: excludePlantId || 'temp',
    kind: 'character',
    tile,
    spriteId: 'plant',
  };
  return canPlaceEntity(map, occ, dummyEntity, tile);
}

function findFirstFreeTile(
  map: MapData,
  plants: Plant[],
  decor: DecorItem[]
): TileCoord | null {
  const occ = buildOccupancy([
    ...plants.map((p) => ({ id: p.id, tile: p.position })),
    ...decor.map((d) => ({ id: d.id, tile: d.position })),
  ]);
  for (let j = 0; j < map.height; j++) {
    for (let i = 0; i < map.width; i++) {
      const tile: TileCoord = { i, j, k: 0 };
      if (validateAt(map, occ, tile).ok) return tile;
    }
  }
  return null;
}

function GardenProviderInner({ children }: { children: ReactNode }) {
  // Populated from the DB per signed-in user; cleared on sign-out.
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [gardenPaused, setGardenPausedState] = useState(false);
  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS
  );
  const [balances, setBalances] = useState<Balances>({ points: 0, gems: 0 });
  const [shopCatalog, setShopCatalog] = useState<ShopItem[]>([]);
  const [ownedSkus, setOwnedSkus] = useState<string[]>([]);
  const [gardenTheme, setGardenThemeState] = useState<GardenThemeId>('cozy_greenhouse');
  const [decorItems, setDecorItems] = useState<DecorItem[]>([]);
  const [nudgeEffects, setNudgeEffects] = useState<Record<string, NudgeType>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const { friends, setAllFriends, appendFriend, updateFriendHydration } = useFriends();
  const { user, initializing } = useAuth();

  // Freshest plants for async callers (addPlant runs after awaits, when the
  // closure's `plants` may be stale).
  const plantsRef = useRef<Plant[]>(plants);
  plantsRef.current = plants;

  // Which user the current state belongs to; guards duplicate loads (e.g.
  // TOKEN_REFRESHED) and stale fetches landing after a sign-out.
  const currentUserIdRef = useRef<string | null>(null);
  // In-flight load; addPlant awaits it so a slow fetch can't replace state
  // right after an append.
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const loadGardenForUser = useCallback(
    (userId: string | null, opts?: { refresh?: boolean }) => {
      // refresh: re-fetch for the already-loaded user (foreground decay
      // refresh) — skips the duplicate-load guard and the loading spinner.
      if (!opts?.refresh && userId !== null && userId === currentUserIdRef.current) return;
      currentUserIdRef.current = userId;

      if (!userId) {
        setAllFriends([]);
        setPlants([]);
        setDecorItems([]);
        setGardenThemeState('cozy_greenhouse');
        setGardenPausedState(false);
        setLoading(false);
        loadPromiseRef.current = null;
        syncWidgetSnapshot([], [], false); // clear the home-screen widget too
        return;
      }

      if (!opts?.refresh) setLoading(true);
      loadPromiseRef.current = (async () => {
        try {
          // Replay any logs that failed offline BEFORE fetching, so the
          // fetched hydration already reflects the replayed care.
          await flushLogQueue().catch(() => 0);
          const {
            friends,
            plants: loadedPlants,
            isPaused,
            notificationPrefs: loadedPrefs,
            balances: loadedBalances,
            isPremium: loadedPremium,
          } = await fetchGarden(userId);
          if (currentUserIdRef.current === userId) {
            setAllFriends(friends);
            setPlants(loadedPlants);
            setGardenPausedState(isPaused);
            setNotificationPrefsState(loadedPrefs);
            setBalances(loadedBalances);
            setIsPremium(loadedPremium);
          }

          // Shop, layout, and decor state load best-effort alongside.
          const [catalog, owned, layout, decor] = await Promise.all([
            fetchCatalog().catch(() => [] as ShopItem[]),
            fetchOwnedSkus(userId).catch(() => [] as string[]),
            fetchGardenLayout(userId).catch(() => ({ theme: 'cozy_greenhouse' })),
            fetchDecor(userId).catch(() => [] as DecorItem[]),
          ]);
          if (currentUserIdRef.current === userId) {
            setShopCatalog(catalog);
            setOwnedSkus(owned);
            setGardenThemeState(
              isGardenTheme(layout.theme) ? layout.theme : 'cozy_greenhouse'
            );
            setDecorItems(decor);
          }
        } catch (e) {
          console.warn('[GARDEN] load failed:', e);
        } finally {
          if (currentUserIdRef.current === userId) setLoading(false);
        }
      })();
    },
    [setAllFriends]
  );

  // Auth is owned by AuthContext; the garden just follows the signed-in
  // user id (load on sign-in, clear on sign-out).
  useEffect(() => {
    if (initializing) return;
    loadGardenForUser(user?.id ?? null);
  }, [initializing, user?.id, loadGardenForUser]);

  // Hydration only decays at fetch time, so refresh on foreground — plants
  // that got thirsty while the app was backgrounded update without a manual
  // reload. Silent (no spinner) and skipped when signed out.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && currentUserIdRef.current) {
        loadGardenForUser(currentUserIdRef.current, { refresh: true });
      }
    });
    return () => sub.remove();
  }, [loadGardenForUser]);

  // Mirror every settled garden state to the home-screen widget (App Group
  // snapshot + timeline reload) AND reschedule all local notifications
  // (D2's cancel-all-and-reschedule engine) — covers load, add, log, pause
  // and pref changes. Rescheduling on every settled state is what
  // guarantees "never fire about someone you already contacted".
  useEffect(() => {
    if (!loading && currentUserIdRef.current) {
      syncWidgetSnapshot(plants, friends, gardenPaused);
      rescheduleAllNotifications(
        plants,
        friends,
        gardenPaused,
        notificationPrefs,
        currentUserIdRef.current
      );
    }
  }, [plants, friends, gardenPaused, notificationPrefs, loading]);

  // A nudge landing: brief plant animation + the friend's signature buzz.
  const handleIncomingNudge = useCallback(
    (nudge: NudgeRow) => {
      const plant = plantsRef.current.find((p) => p.linkId === nudge.link_id);
      if (!plant) return;
      setNudgeEffects((prev) => ({ ...prev, [plant.id]: nudge.type as NudgeType }));
      const friend = friends.find((f) => f.id === plant.id);
      playHapticSignature(friend?.hapticSignature ?? 'pulse');
      // Music Box: a song nudge sways the plant while its preview plays.
      const payload = nudge.payload as { song?: { previewUrl?: string } } | null;
      if (nudge.type === 'song' && payload?.song?.previewUrl) {
        playPreview(payload.song.previewUrl);
      }
      markNudgeSeen(nudge.id).catch(() => {});
      setTimeout(() => {
        setNudgeEffects((prev) => {
          const next = { ...prev };
          delete next[plant.id];
          return next;
        });
      }, 4000);
    },
    [friends]
  );

  // Nudges arriving while away: replay unseen ones once per load.
  useEffect(() => {
    if (loading || !user?.id) return;
    fetchUnseenNudges(user.id)
      .then((unseen) => {
        for (const nudge of unseen.slice(-3)) handleIncomingNudge(nudge);
        for (const nudge of unseen.slice(0, -3)) markNudgeSeen(nudge.id).catch(() => {});
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  // Live nudges on my links.
  useEffect(() => {
    if (!user?.id) return;
    const linkIds = plants.map((p) => p.linkId).filter((id): id is string => id !== null);
    if (linkIds.length === 0) return;
    return subscribeToNudges(user.id, linkIds, handleIncomingNudge);
  }, [user?.id, plants, handleIncomingNudge]);

  // Push-token registration once per signed-in user (Batch 13) + the
  // RevenueCat storefront (Batch 17; graceful no-op without a key).
  useEffect(() => {
    if (user?.id) {
      registerPushToken(user.id);
      configurePurchases(user.id);
    }
  }, [user?.id]);

  // Downgrade soft-lock: plants beyond the free cap (oldest first keep
  // their spot) turn view-only. Never deleted (spec §7).
  const lockedPlantIds = useMemo(() => {
    if (isPremium || plants.length <= FREE_PLANT_CAP) return [];
    // plants arrive in created_at order from fetchGarden — the oldest 12
    // keep their spot; newer ones rest until the Pass returns.
    return plants.slice(FREE_PLANT_CAP).map((p) => p.id);
  }, [isPremium, plants]);

  // Live watering moments: partner inserts on link_events → silent refresh.
  useEffect(() => {
    if (!user?.id) return;
    const linkIds = plants.map((p) => p.linkId).filter((id): id is string => id !== null);
    if (linkIds.length === 0) return;
    const unsubscribe = subscribeToLinkEvents(user.id, linkIds, () => {
      loadGardenForUser(user.id, { refresh: true });
    });
    return unsubscribe;
  }, [user?.id, plants, loadGardenForUser]);

  // The active map follows the equipped theme (D4 multi-map).
  const activeMap = useMemo(() => mapForTheme(gardenTheme), [gardenTheme]);

  // Occupancy is derived from plants + placed decor — never mutated directly
  const occupancy = useMemo(
    () =>
      buildOccupancy([
        ...plants.map((p) => ({ id: p.id, tile: p.position })),
        ...decorItems.map((d) => ({ id: d.id, tile: d.position })),
      ]),
    [plants, decorItems]
  );

  /**
   * Check if a tile placement is valid (parameterized by the active map)
   */
  const canPlaceAt = useCallback(
    (tile: TileCoord, excludePlantId?: string) =>
      validateAt(activeMap, occupancy, tile, excludePlantId),
    [activeMap, occupancy]
  );

  // Aggregate-only reactive-decor signals (spec §3): average hydration and
  // the share of streak windows currently satisfied. Never any single
  // relationship.
  const gardenSignals = useMemo(() => {
    if (plants.length === 0) return { avgHydration: 100, windowsSatisfiedPct: 0 };
    const avgHydration =
      plants.reduce((sum, p) => sum + p.hydration, 0) / plants.length;
    const windowsSatisfiedPct =
      (plants.filter((p) => p.windowSatisfied).length / plants.length) * 100;
    return {
      avgHydration: Math.round(avgHydration),
      windowsSatisfiedPct: Math.round(windowsSatisfiedPct),
    };
  }, [plants]);

  const decorRef = useRef<DecorItem[]>(decorItems);
  decorRef.current = decorItems;

  /** Equip a garden theme (free default or an owned theme sku). */
  const setGardenTheme = useCallback(
    async (theme: GardenThemeId) => {
      if (!user) return;
      const def = GARDEN_MAPS[theme];
      if (def.sku && !ownedSkus.includes(def.sku)) {
        throw new Error('Theme not owned yet — visit the shop.');
      }
      const previous = gardenTheme;
      setGardenThemeState(theme);
      try {
        await persistGardenTheme(user.id, theme);
      } catch (e) {
        setGardenThemeState(previous);
        throw e;
      }
    },
    [user, ownedSkus, gardenTheme]
  );

  /** Place an owned decor item on the first free tile. False = garden full. */
  const placeDecor = useCallback(
    async (sku: string, name: string): Promise<boolean> => {
      if (!user) return false;
      const tile = findFirstFreeTile(activeMap, plantsRef.current, decorRef.current);
      if (!tile) return false;
      const item = await placeDecorRemote({
        userId: user.id,
        sku,
        name,
        position: tile,
      });
      setDecorItems((prev) => [...prev, item]);
      return true;
    },
    [user, activeMap]
  );

  /** Move decor to a tile (optimistic; same validation path as plants). */
  const moveDecor = useCallback(
    (id: string, tile: TileCoord) => {
      const validation = validateAt(activeMap, occupancy, tile, id);
      if (!validation.ok) return;
      setDecorItems((prev) =>
        prev.map((d) => (d.id === id ? { ...d, position: { ...tile } } : d))
      );
      persistDecorPosition(id, tile).catch((e) =>
        console.warn('[GARDEN] decor persist failed:', e)
      );
    },
    [activeMap, occupancy]
  );

  const removeDecor = useCallback(async (id: string) => {
    setDecorItems((prev) => prev.filter((d) => d.id !== id));
    await removeDecorRemote(id).catch((e) =>
      console.warn('[GARDEN] decor remove failed:', e)
    );
  }, []);

  const availableThemes = useMemo(
    () =>
      (Object.values(GARDEN_MAPS))
        .filter((def) => def.sku === null || ownedSkus.includes(def.sku))
        .map((def) => def.id),
    [ownedSkus]
  );

  /**
   * Add a new friend + plant on the first free placeable tile. Awaits the DB
   * insert (friends + plants rows) and appends the persisted result, so a
   * plant only ever appears in the garden if it exists in the DB.
   * Throws on persistence failure — callers surface the error.
   */
  const addPlant = useCallback(
    async (
      friendName: string,
      plantType: Plant['plantType'],
      image: any,
      frequency?: string
    ) => {
      // Let any in-flight garden load settle so the fetch result can't
      // replace state and drop the plant we're about to append.
      if (loadPromiseRef.current) await loadPromiseRef.current;

      const availableTile = findFirstFreeTile(
        activeMap,
        plantsRef.current,
        decorRef.current
      );
      if (!availableTile) {
        console.warn('No available positions in garden');
        return;
      }

      if (!user) {
        console.warn('[GARDEN] addPlant with no authenticated user — not persisted');
        return;
      }

      const { friend, plant } = await createFriendWithPlant({
        userId: user.id,
        name: friendName,
        plantType,
        contactFrequency: mapFrequency(frequency),
        position: availableTile,
      });

      appendFriend(friend);
      setPlants((prev) => [...prev.filter((p) => p.id !== plant.id), plant]);
    },
    [appendFriend, user, activeMap]
  );

  /**
   * Update a plant's position on the grid.
   * Re-validates as a final guard, independent of the drag layer.
   * Local commit is optimistic; the DB write happens in the background.
   */
  const updatePlantPosition = useCallback(
    (plantId: string, newTile: TileCoord) => {
      const validation = canPlaceAt(newTile, plantId);
      if (!validation.ok) {
        logPlacement('COMMIT REJECTED', { plantId, newTile, reason: validation.reason });
        return;
      }

      logPlacement('COMMIT', { plantId, newTile });

      setPlants((prev) =>
        prev.map((p) =>
          p.id === plantId
            ? { ...p, position: { i: newTile.i, j: newTile.j, k: newTile.k } }
            : p
        )
      );

      persistPlantPosition(plantId, newTile).catch((e) => {
        logPlacement('PERSIST FAILED', { plantId, newTile, error: String(e) });
      });
    },
    [canPlaceAt]
  );

  /**
   * Pause/unpause hydration decay (vacation mode). Persists via the
   * set_garden_paused RPC; local flag updates only after the DB commits so
   * the toggle never lies about what's persisted.
   */
  const setGardenPaused = useCallback(async (paused: boolean) => {
    await setGardenPausedRemote(paused);
    setGardenPausedState(paused);
  }, []);

  /**
   * Update notification prefs: local state first (the reschedule effect
   * reacts immediately), then persist. Reverts locally on failure.
   */
  const setNotificationPrefs = useCallback(
    async (prefs: NotificationPrefs) => {
      if (!user) return;
      const previous = notificationPrefs;
      setNotificationPrefsState(prefs);
      try {
        await persistNotificationPrefs(user.id, prefs);
      } catch (e) {
        setNotificationPrefsState(previous);
        throw e;
      }
    },
    [user, notificationPrefs]
  );

  /**
   * Log contact with a friend. The RPC persists the restore and resets the
   * decay clock; local state updates optimistically with the identical
   * formula so client and DB agree without a refetch.
   *
   * Offline-resilient: on RPC failure the log is queued (with the same
   * client-generated interaction id, so replay is idempotent) and local
   * state still updates — a real connection never gets lost to bad signal.
   */
  const logInteraction = useCallback(
    async (
      friendId: string,
      type: InteractionType,
      note?: string,
      occurredAt?: string
    ): Promise<LogResult> => {
      if (!user) throw new Error('Not signed in');

      const plant = plantsRef.current.find((p) => p.id === friendId);
      const current = plant?.hydration ?? 0;
      const interactionId = generateUUID();
      let result: LogResult;
      try {
        result = await logInteractionRemote(user.id, friendId, type, current, {
          interactionId,
          note,
          occurredAt,
        });
      } catch (e) {
        console.warn('[GARDEN] log failed, queueing for replay:', e);
        await enqueueLog({
          interactionId,
          userId: user.id,
          friendId,
          type,
          note,
          occurredAt,
          queuedAt: new Date().toISOString(),
        });
        // Offline estimate mirroring the RPC's formulas; balances update
        // for real once the queue flushes and the garden refreshes.
        const estStreak = plant && !plant.windowSatisfied ? (plant?.streak ?? 0) + 1 : plant?.streak ?? 0;
        result = {
          hydration: Math.min(100, Math.round(current + HYDRATION_WEIGHTS[type])),
          streak: estStreak,
          pointsMinted: Math.round(HYDRATION_WEIGHTS[type] * multiplierFor(estStreak)),
          multiplier: multiplierFor(estStreak),
          gemsMinted: 0,
          fullMint: true,
          balances: null,
          offline: true,
          linked: plant?.linkId != null,
          partnerUserId: plant?.partnerUserId ?? null,
        };
      }

      if (result.balances) setBalances(result.balances);

      // Linked plants: a soft "watered" push to the partner (spec §4).
      if (result.linked && result.partnerUserId && !result.offline) {
        const friendName = plant?.friendName ?? 'Your friend';
        sendPartnerPush(
          result.partnerUserId,
          'Your plant got some sun',
          `${friendName === 'Your friend' ? 'Someone' : friendName} watered the plant you share.`,
          { url: 'rooted://friends' }
        );
      }

      // Mirror the RPC's streak satisfy locally (the DB already committed).
      setPlants((prev) =>
        prev.map((p) => {
          if (p.id !== friendId) return p;
          const firstOfWindow = !p.windowSatisfied;
          return {
            ...p,
            hydration: result.hydration,
            windowSatisfied: true,
            streak: firstOfWindow ? p.streak + 1 : p.streak,
            streakBest: firstOfWindow
              ? Math.max(p.streakBest, p.streak + 1)
              : p.streakBest,
          };
        })
      );
      updateFriendHydration(friendId, result.hydration);
      return result;
    },
    [updateFriendHydration, user]
  );

  /** Buy a shop item (self/gift/shared): RPC spends + grants atomically.
   *  A gifted item pings the partner over push (rides the nudge channel). */
  const purchaseItem = useCallback(
    async (
      sku: string,
      currency?: 'points' | 'gems',
      scope: 'self' | 'gift' | 'shared' = 'self',
      linkId?: string
    ): Promise<PurchaseOutcome> => {
      const outcome = await purchaseItemRemote(sku, currency, scope, linkId);
      setBalances(outcome.balances);
      if (scope !== 'gift') {
        setOwnedSkus((prev) => (prev.includes(sku) ? prev : [...prev, sku]));
      }
      if (outcome.recipientUserId) {
        sendPartnerPush(
          outcome.recipientUserId,
          scope === 'shared' ? 'A matching set arrived' : 'A gift landed in your garden',
          scope === 'shared'
            ? 'Your linked plant is wearing one half of a matching set — so is theirs.'
            : 'A friend left something on your plant. Come see.',
          { url: 'rooted://friends' }
        );
      }
      return outcome;
    },
    []
  );

  /**
   * Equip/clear a cosmetic slot. Optimistic: local plant state first, DB
   * write behind; reverts on failure.
   */
  const equipAttachment = useCallback(
    async (friendId: string, slot: string, sku: string | null) => {
      const plant = plantsRef.current.find((p) => p.id === friendId);
      if (!plant) return;
      const previous = plant.attachments;
      const next = [
        ...previous.filter((a) => a.slot !== slot),
        ...(sku ? [{ slot, sku }] : []),
      ];
      setPlants((prev) =>
        prev.map((p) => (p.id === friendId ? { ...p, attachments: next } : p))
      );
      try {
        await setPlantAttachmentRemote(plant.dbPlantId, slot, sku);
      } catch (e) {
        setPlants((prev) =>
          prev.map((p) => (p.id === friendId ? { ...p, attachments: previous } : p))
        );
        throw e;
      }
    },
    []
  );

  /** Create a link invite code for one of my friends (spec §4). */
  const createInvite = useCallback(async (friendId: string): Promise<string> => {
    return createLinkInvite(friendId);
  }, []);

  /**
   * Redeem an invite: the RPC creates my reciprocal friend+plant and
   * marries the streaks; we choose the tile client-side (placement rules
   * live here) and refresh afterwards.
   */
  const acceptInvite = useCallback(
    async (
      code: string,
      plantType: Plant['plantType'],
      frequency: ContactFrequency
    ): Promise<AcceptResult> => {
      if (!user) throw new Error('Not signed in');
      const tile =
        findFirstFreeTile(activeMap, plantsRef.current, decorRef.current) ?? {
          i: 0,
          j: 0,
          k: 0,
        };
      const result = await acceptLinkInvite({
        code,
        plantType,
        frequency,
        gridX: tile.i,
        gridY: tile.j,
      });
      loadGardenForUser(user.id, { refresh: true });
      return result;
    },
    [user, activeMap, loadGardenForUser]
  );

  /**
   * Buy back a broken streak, then hard-refresh the garden so plant streak
   * state reflects the server's re-armed window.
   */
  const restoreStreak = useCallback(
    async (friendId: string, currency: RestoreCurrency): Promise<RestoreResult> => {
      const result = await restoreStreakRemote(friendId, currency);
      setBalances(result.balances);
      if (user) loadGardenForUser(user.id, { refresh: true });
      return result;
    },
    [user, loadGardenForUser]
  );

  return (
    <GardenContext.Provider
      value={{
        plants,
        loading,
        addPlant,
        updatePlantPosition,
        canPlaceAt,
        selectedPlant,
        setSelectedPlant,
        occupancy,
        gardenPaused,
        setGardenPaused,
        logInteraction,
        notificationPrefs,
        setNotificationPrefs,
        balances,
        restoreStreak,
        shopCatalog,
        ownedSkus,
        purchaseItem,
        equipAttachment,
        gardenTheme,
        activeMap,
        setGardenTheme,
        availableThemes,
        decorItems,
        placeDecor,
        moveDecor,
        removeDecor,
        gardenSignals,
        nudgeEffects,
        isPremium,
        lockedPlantIds,
        createInvite,
        acceptInvite,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
}

// Wrapper that doesn't need useFriends
export function GardenProvider({ children }: { children: ReactNode }) {
  return <GardenProviderInner>{children}</GardenProviderInner>;
}

export function useGarden() {
  const context = useContext(GardenContext);
  if (context === undefined) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
}
