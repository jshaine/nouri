import { decodeFoodPack, type Food, type FoodPack } from '@/domain';

export interface BundledFoods {
  foods: Food[];
  sources: FoodPack['sources'];
}

export const FOODS_UNAVAILABLE =
  'Couldn’t load the food list. Open Nouri once while online; after that it works offline.';

type Fetch = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/** Optional packs, searched before USDA: present only in builds that include them. */
const OPTIONAL_PACKS = ['foods-fnri.json', 'foods-ph.json'] as const;

async function loadOptional(fetchFn: Fetch, url: string) {
  try {
    const res = await fetchFn(url);
    // Dev servers answer unknown paths with index.html; only accept real JSON.
    return res.ok ? decodeFoodPack(await res.json()) : undefined;
  } catch {
    return undefined; // optional file: absent, offline, or not JSON
  }
}

/**
 * Loads foods.json (required) and the optional packs: foods-fnri.json (FNRI,
 * never committed) and foods-ph.json (Philippine products from Open Food
 * Facts). The service worker serves them offline.
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
  const extra = await Promise.all(OPTIONAL_PACKS.map((f) => loadOptional(fetchFn, `${base}${f}`)));
  const packs = [...extra.filter((p) => p !== undefined), usda];
  return {
    foods: packs.flatMap((p) => p.foods),
    sources: Object.assign({}, ...packs.map((p) => p.sources)) as FoodPack['sources'],
  };
}
