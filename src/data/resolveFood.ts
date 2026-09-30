import { parseFoodKey, type Food } from '@/domain';
import type { FoodDatabase } from './foods';
import type { CustomFoodRepository } from './repositories';

/** Looks up any food by key: custom foods in IndexedDB, bundled ones in the food database. */
export function foodResolver(repos: {
  customFoods: Pick<CustomFoodRepository, 'get'>;
  foods: Pick<FoodDatabase, 'get'>;
}): (key: string) => Promise<Food | undefined> {
  return async (key) => {
    const parsed = parseFoodKey(key);
    if (!parsed) return undefined;
    return parsed.source === 'custom' ? repos.customFoods.get(parsed.id) : repos.foods.get(key);
  };
}
