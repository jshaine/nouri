import MiniSearch from 'minisearch';
import type { Food } from './food';

export const DEFAULT_RESULT_LIMIT = 30;

/** USDA names read "Main food, detail, …": a hit on the main food ranks higher. */
const MAIN_FOOD_BOOST = 2;
/** All-caps brand names (e.g. "HORMEL …") rank below generic foods. */
const BRAND_PENALTY = 0.6;
const BRAND = /^[A-Z0-9&'’.\- ]{4,}(,|$)/;

/** Lowercase and strip accents so "piñakbet" matches "pinakbet". */
export function normalizeTerm(term: string): string {
  return term.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export interface FoodSearch {
  readonly size: number;
  search(query: string, limit?: number): Food[];
  get(key: string): Food | undefined;
}

interface Doc {
  id: string;
  name: string;
  aliases: string;
}

/**
 * Offline, typo-tolerant search over names and aliases (Filipino or English).
 * Every word must match (prefix or fuzzy), so "chiken brest" finds chicken
 * breast; alias hits rank high so "kanin" puts cooked rice first.
 */
export function createFoodSearch(foods: readonly Food[]): FoodSearch {
  const byKey = new Map<string, Food>(foods.map((f) => [f.key, f]));
  const index = new MiniSearch<Doc>({
    fields: ['name', 'aliases'],
    idField: 'id',
    processTerm: (term) => normalizeTerm(term),
    searchOptions: {
      combineWith: 'AND',
      prefix: true,
      // Two edits from 5 letters (covers swapped letters like "itlgo"), one at 4.
      fuzzy: (term) => (term.length >= 5 ? 0.4 : term.length === 4 ? 0.25 : false),
      // Exact and prefix hits outrank fuzzy ones, so typo tolerance only fills in.
      weights: { fuzzy: 0.1, prefix: 0.5 },
      boost: { name: 1, aliases: 2 },
      boostDocument: (id, term) => {
        const food = byKey.get(String(id));
        if (!food) return 1;
        const main = normalizeTerm(food.name.split(',')[0] ?? '');
        let boost = main.split(/\s+/).some((w) => w.startsWith(term)) ? MAIN_FOOD_BOOST : 1;
        if (BRAND.test(food.name)) boost *= BRAND_PENALTY;
        return boost;
      },
    },
  });
  index.addAll(
    [...byKey.values()].map((f) => ({ id: f.key, name: f.name, aliases: f.aliases.join(' ') })),
  );

  return {
    size: byKey.size,
    get: (key) => byKey.get(key),
    search(query, limit = DEFAULT_RESULT_LIMIT) {
      const q = query.trim();
      if (!q) return [];
      const results: Food[] = [];
      for (const hit of index.search(q)) {
        const food = byKey.get(String(hit.id));
        if (food) results.push(food);
        if (results.length === limit) break;
      }
      return results;
    },
  };
}
