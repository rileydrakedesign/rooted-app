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
import { Plant } from '../components/garden/PlantTile';
import { useFriends } from './FriendsContext';
import { OccupancyMap, buildOccupancy } from '../utils/occupancy';
import { TileCoord, Entity } from '../types/garden';
import { canPlaceEntity } from '../utils/placementRules';
import { exampleMap } from '../data/exampleMap';
import { logPlacement } from '../utils/debugLog';
import { supabase } from '../lib/supabase';
import { AppState } from 'react-native';
import {
  fetchGarden,
  createFriendWithPlant,
  persistPlantPosition,
  setGardenPausedRemote,
  logInteractionRemote,
  InteractionType,
  mapFrequency,
} from '../lib/garden';

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
  /** Log contact with a friend (the care loop). Returns the new hydration. */
  logInteraction: (friendId: string, type: InteractionType) => Promise<number>;
}

const GardenContext = createContext<GardenContextType | undefined>(undefined);

function validateAt(
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
  return canPlaceEntity(exampleMap, occ, dummyEntity, tile);
}

function findFirstFreeTile(plants: Plant[]): TileCoord | null {
  const occ = buildOccupancy(plants.map((p) => ({ id: p.id, tile: p.position })));
  for (let j = 0; j < exampleMap.height; j++) {
    for (let i = 0; i < exampleMap.width; i++) {
      const tile: TileCoord = { i, j, k: 0 };
      if (validateAt(occ, tile).ok) return tile;
    }
  }
  return null;
}

function GardenProviderInner({ children }: { children: ReactNode }) {
  // Populated from the DB per signed-in user; cleared on sign-out.
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [gardenPaused, setGardenPausedState] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const { setAllFriends, appendFriend, updateFriendHydration } = useFriends();

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
        setGardenPausedState(false);
        setLoading(false);
        loadPromiseRef.current = null;
        return;
      }

      if (!opts?.refresh) setLoading(true);
      loadPromiseRef.current = (async () => {
        try {
          const { friends, plants: loadedPlants, isPaused } = await fetchGarden(userId);
          if (currentUserIdRef.current === userId) {
            setAllFriends(friends);
            setPlants(loadedPlants);
            setGardenPausedState(isPaused);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadGardenForUser(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Deferred: supabase-js holds an internal lock during this callback;
      // calling back into the client synchronously can deadlock.
      setTimeout(() => loadGardenForUser(session?.user?.id ?? null), 0);
    });

    return () => subscription.unsubscribe();
  }, [loadGardenForUser]);

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

  // Occupancy is derived from the plants array — never mutated directly
  const occupancy = useMemo(
    () => buildOccupancy(plants.map((p) => ({ id: p.id, tile: p.position }))),
    [plants]
  );

  /**
   * Check if a tile placement is valid
   */
  const canPlaceAt = useCallback(
    (tile: TileCoord, excludePlantId?: string) => validateAt(occupancy, tile, excludePlantId),
    [occupancy]
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

      const availableTile = findFirstFreeTile(plantsRef.current);
      if (!availableTile) {
        console.warn('No available positions in garden');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    [appendFriend]
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
   * Log contact with a friend. The RPC persists the restore and resets the
   * decay clock; local state updates optimistically with the identical
   * formula so client and DB agree without a refetch.
   */
  const logInteraction = useCallback(
    async (friendId: string, type: InteractionType): Promise<number> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const plant = plantsRef.current.find((p) => p.id === friendId);
      const current = plant?.hydration ?? 0;
      const newHydration = await logInteractionRemote(user.id, friendId, type, current);

      setPlants((prev) =>
        prev.map((p) => (p.id === friendId ? { ...p, hydration: newHydration } : p))
      );
      updateFriendHydration(friendId, newHydration);
      return newHydration;
    },
    [updateFriendHydration]
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
