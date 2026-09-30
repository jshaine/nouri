import { createFoodSearch, type Food, type FoodPack, type FoodSearch } from '@/domain';

export interface FoodDatabaseInfo {
  count: number;
  sources: FoodPack['sources'];
}

/** The bundled foods (USDA, and FNRI when included), searchable offline. */
export interface FoodDatabase {
  /** Resolves once loaded and indexed; rejects with a user-facing message. */
  ready(): Promise<FoodDatabaseInfo>;
  search(query: string, limit?: number): Promise<Food[]>;
  get(key: string): Promise<Food | undefined>;
}

/** Runs on the current thread. Used by tests, the worker itself, and as a fallback. */
export function createInProcessFoodDatabase(
  load: () => Promise<{ foods: Food[]; sources: FoodPack['sources'] }>,
): FoodDatabase {
  let started: Promise<{ search: FoodSearch; info: FoodDatabaseInfo }> | undefined;
  const start = () =>
    (started ??= load().then(({ foods, sources }) => {
      const search = createFoodSearch(foods);
      return { search, info: { count: search.size, sources } };
    }));
  return {
    ready: async () => (await start()).info,
    search: async (query, limit) => (await start()).search.search(query, limit),
    get: async (key) => (await start()).search.get(key),
  };
}
