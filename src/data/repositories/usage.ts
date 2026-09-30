import type { FoodKey } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';
import type { UsageRow } from '../rows';

export const RECENT_LIMIT = 30;

export interface FoodUsage {
  foodKey: FoodKey;
  lastUsed: number;
  useCount: number;
}

export interface UsageRepository {
  /** Called after a food is logged. */
  recordUse(foodKey: FoodKey): Promise<void>;
  /** Most recently used first. */
  liveRecents(limit?: number): Live<FoodUsage[]>;
  /** Most recently starred first. */
  liveFavorites(): Live<FoodUsage[]>;
  isFavorite(foodKey: FoodKey): Live<boolean>;
  setFavorite(foodKey: FoodKey, favorite: boolean): Promise<void>;
}

const toUsage = (r: UsageRow): FoodUsage => ({
  foodKey: r.foodKey,
  lastUsed: r.lastUsed,
  useCount: r.useCount,
});

export function usageRepository({ db, now }: RepoContext): UsageRepository {
  return {
    async recordUse(foodKey) {
      await db.transaction('rw', db.recents, async () => {
        const row = await db.recents.get(foodKey);
        await db.recents.put({ foodKey, lastUsed: now(), useCount: (row?.useCount ?? 0) + 1 });
      });
    },
    liveRecents: (limit = RECENT_LIMIT) =>
      live(async () =>
        (await db.recents.orderBy('lastUsed').reverse().limit(limit).toArray()).map(toUsage),
      ),
    liveFavorites: () =>
      live(async () => (await db.favorites.orderBy('lastUsed').reverse().toArray()).map(toUsage)),
    isFavorite: (foodKey) => live(async () => (await db.favorites.get(foodKey)) !== undefined),
    async setFavorite(foodKey, favorite) {
      if (favorite) await db.favorites.put({ foodKey, lastUsed: now(), useCount: 0 });
      else await db.favorites.delete(foodKey);
    },
  };
}
