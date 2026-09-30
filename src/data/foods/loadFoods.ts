import { decodeFoodPack, type Food, type FoodPack } from '@/domain';

export interface BundledFoods {
  foods: Food[];
  sources: FoodPack['sources'];
}

export const FOODS_UNAVAILABLE =
  'Couldn’t load the food list. Open Nouri once while online; after that it works offline.';

type Fetch = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/**
 * Loads foods.json (required) and foods-fnri.json (only present in builds
 * that include FNRI data). The service worker serves both offline.
 */
export async function loadBundledFoods(fetchFn: Fetch, base = '/'): Promise<BundledFoods> {
  let main: Awaited<ReturnType<Fetch>>;
  try {
    main = await fetchFn(`${base}foods.json`);
  } catch {
    throw new Error(FOODS_UNAVAILABLE);
  }
  if (!main.ok) throw new Error(FOODS_UNAVAILABLE);
  const usda = decodeFoodPack(await main.json());

  let fnri: ReturnType<typeof decodeFoodPack> | undefined;
  try {
    const res = await fetchFn(`${base}foods-fnri.json`);
    // Dev servers answer unknown paths with index.html; only accept real JSON.
    if (res.ok) fnri = decodeFoodPack(await res.json());
  } catch {
    fnri = undefined; // optional file: absent, offline, or not JSON
  }
  return {
    foods: [...(fnri?.foods ?? []), ...usda.foods],
    sources: { ...usda.sources, ...(fnri?.sources ?? {}) },
  };
}
