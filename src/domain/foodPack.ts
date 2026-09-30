import { foodKey, type Food, type Portion } from './food';
import type { FoodSource } from './macros';

/**
 * public/foods.json: the bundled food database, compact so it stays small
 * over the wire. Every bundled food is per 100 g. Written by
 * scripts/build-foods.ts, read (and validated) by the app.
 */
export const FOOD_PACK_VERSION = 1;

/** [label, grams] */
export type PackedPortion = [string, number];

/** [id, name, kcal, protein, carbs, fat, fiber | null, portions, aliases] */
export type PackedFood = [
  string,
  string,
  number,
  number,
  number,
  number,
  number | null,
  PackedPortion[],
  string[],
];

export interface FoodPack {
  v: typeof FOOD_PACK_VERSION;
  generatedAt: string;
  /** Human-readable credit per included source, shown in Settings. */
  sources: Partial<Record<Exclude<FoodSource, 'custom'>, string>>;
  usda: PackedFood[];
  fnri: PackedFood[];
}

export class FoodPackError extends Error {
  override name = 'FoodPackError';
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

function decodeFood(raw: unknown, source: 'usda' | 'fnri'): Food | null {
  if (!Array.isArray(raw)) return null;
  const [id, name, kcal, p, c, f, fiber, portions, aliases] = raw as unknown[];
  if (!isStr(id) || !isStr(name) || ![kcal, p, c, f].every(isNum)) return null;
  const nutrients: Food['nutrients'] = {
    kcal: kcal as number,
    p: p as number,
    c: c as number,
    f: f as number,
  };
  if (isNum(fiber)) nutrients.fiber = fiber;
  const parsedPortions: Portion[] = Array.isArray(portions)
    ? portions.flatMap((x: unknown) =>
        Array.isArray(x) && isStr(x[0]) && isNum(x[1]) && x[1] > 0
          ? [{ label: x[0], grams: x[1] }]
          : [],
      )
    : [];
  return {
    key: foodKey(source, id),
    source,
    name,
    aliases: Array.isArray(aliases) ? aliases.filter(isStr) : [],
    basis: { kind: '100g' },
    nutrients,
    portions: parsedPortions,
  };
}

/** Validates and expands foods.json. Malformed foods are skipped, not fatal. */
export function decodeFoodPack(json: unknown): {
  foods: Food[];
  sources: FoodPack['sources'];
  skipped: number;
} {
  if (typeof json !== 'object' || json === null)
    throw new FoodPackError('The food database is not valid JSON.');
  const pack = json as Partial<Record<keyof FoodPack, unknown>>;
  if (pack.v !== FOOD_PACK_VERSION)
    throw new FoodPackError(`Unsupported food database version: ${String(pack.v)}.`);
  const foods: Food[] = [];
  let skipped = 0;
  for (const source of ['usda', 'fnri'] as const) {
    const list = pack[source];
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const food = decodeFood(raw, source);
      if (food) foods.push(food);
      else skipped += 1;
    }
  }
  const sources: FoodPack['sources'] = {};
  if (typeof pack.sources === 'object' && pack.sources !== null) {
    for (const [k, v] of Object.entries(pack.sources)) {
      if ((k === 'usda' || k === 'fnri') && isStr(v)) sources[k] = v;
    }
  }
  return { foods, sources, skipped };
}
