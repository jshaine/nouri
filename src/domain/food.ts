import type { FoodSource } from './macros';

/** Stable reference to a food across sources: "usda:171077", "custom:9f2…". */
export type FoodKey = `${FoodSource}:${string}`;

export function foodKey(source: FoodSource, id: string): FoodKey {
  return `${source}:${id}`;
}

export function parseFoodKey(key: string): { source: FoodSource; id: string } | null {
  const match = /^(usda|fnri|custom):(.+)$/.exec(key);
  if (!match?.[1] || !match[2]) return null;
  return { source: match[1] as FoodSource, id: match[2] };
}

/** Macros for one basis amount. `kcal` is optional: derived as 4P + 4C + 9F when missing. */
export interface Nutrients {
  kcal?: number;
  p: number;
  c: number;
  f: number;
  fiber?: number;
}

/**
 * A household measure. It is either a known gram weight, or a number of the
 * food's basis servings when the weight is unknown (never a made-up weight).
 */
export type Portion = { label: string; grams: number } | { label: string; servings: number };

/**
 * What `nutrients` describes:
 * - "100g": per 100 g (USDA, FNRI, custom foods entered per 100 g)
 * - "serving": per one serving; `servingGrams` only if the weight is known
 */
export type FoodBasis = { kind: '100g' } | { kind: 'serving'; servingGrams?: number };

export interface Food {
  key: FoodKey;
  source: FoodSource;
  name: string;
  aliases: readonly string[];
  basis: FoodBasis;
  nutrients: Nutrients;
  portions: readonly Portion[];
}

/** An entry's unit: grams, or the label of one of the food's portions. */
export type EntryUnit = { kind: 'grams' } | { kind: 'portion'; label: string };

export const GRAMS_PER_100G_BASIS = 100;
export const SERVING_PORTION_LABEL = '1 serving';

/** Grams in one basis amount, or null when a serving's weight is unknown. */
export function gramsPerBasis(basis: FoodBasis): number | null {
  if (basis.kind === '100g') return GRAMS_PER_100G_BASIS;
  return basis.servingGrams ?? null;
}

/** Whether amounts of this food can be entered in grams. */
export function supportsGrams(food: Pick<Food, 'basis'>): boolean {
  return gramsPerBasis(food.basis) !== null;
}

/** The portions a food offers, with the basis serving first for serving foods. */
export function availablePortions(food: Food, overrides: readonly Portion[] = []): Portion[] {
  const all = [...food.portions, ...overrides];
  const seen = new Set<string>();
  return all.filter((p) => {
    const id = p.label.trim().toLowerCase();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
