import { useEffect, useState } from 'react';
import {
  foodResolver,
  type CustomFoodRepository,
  type FoodDatabase,
  type UsageRepository,
} from '@/data';
import type { Food } from '@/domain';
import { useLive } from '@/ui';

interface Repos {
  usage: Pick<UsageRepository, 'liveRecents' | 'liveFavorites'>;
  customFoods: Pick<CustomFoodRepository, 'get'>;
  foods: Pick<FoodDatabase, 'get'>;
}

/** Favorites and recents as foods. Foods that no longer exist are left out. */
export function useUsageFoods(repos: Repos) {
  const recents = useLive(() => repos.usage.liveRecents(), [repos.usage]);
  const favorites = useLive(() => repos.usage.liveFavorites(), [repos.usage]);
  const [foods, setFoods] = useState<{ favorites: Food[]; recents: Food[] }>();

  useEffect(() => {
    if (!recents.value || !favorites.value) return;
    let active = true;
    const resolve = foodResolver(repos);
    const load = async (keys: string[]) =>
      (await Promise.all(keys.map(resolve))).filter((f): f is Food => f !== undefined);
    const favoriteKeys = favorites.value.map((f) => f.foodKey);
    const recentKeys = recents.value.map((r) => r.foodKey).filter((k) => !favoriteKeys.includes(k));
    void Promise.all([load(favoriteKeys), load(recentKeys)]).then(([fav, rec]) => {
      if (active) setFoods({ favorites: fav, recents: rec });
    });
    return () => {
      active = false;
    };
  }, [recents.value, favorites.value, repos]);

  return foods;
}
