/**
 * USDA FoodData Central (Foundation + SR Legacy) → packed foods.
 * All nutrient amounts in food_nutrient.csv are per 100 g.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { kcalFromMacros, type PackedFood, type PackedPortion } from '../../src/domain/index.ts';
import { readCsvFile } from './csv.ts';

export const NUTRIENT = {
  energyKcal: 1008,
  energyAtwaterGeneral: 2047,
  energyAtwaterSpecific: 2048,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
} as const;
const WANTED = new Set<number>(Object.values(NUTRIENT));

export type DatasetKind = 'foundation' | 'sr_legacy';
const DATA_TYPES: Record<DatasetKind, string> = {
  foundation: 'foundation_food',
  sr_legacy: 'sr_legacy_food',
};
const MAX_PORTIONS = 8;

export interface RawPortion {
  amount: number;
  unit: string;
  modifier: string;
  description: string;
  grams: number;
}

export interface RawFood {
  id: string;
  description: string;
  kind: DatasetKind;
  nutrients: Map<number, number>;
  portions: RawPortion[];
}

export type SkipReason = 'missing-macros';

const round = (n: number, places: number) => {
  const k = 10 ** places;
  return Math.round(n * k) / k;
};

function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(round(n, 2));
}

/** A readable household measure: "1 cup, chopped", "2 slices", "1 medium". */
export function portionLabel(p: RawPortion): string | null {
  const description = p.description.trim();
  if (description && !/quantity not specified/i.test(description)) {
    return /^\d/.test(description) ? description : `${formatAmount(p.amount || 1)} ${description}`;
  }
  const unit = p.unit && p.unit !== 'undetermined' ? p.unit : '';
  const modifier = p.modifier.trim();
  if (!unit && !modifier) return null;
  const head = `${formatAmount(p.amount || 1)} ${unit || modifier}`;
  return unit && modifier ? `${head}, ${modifier}` : head;
}

function packPortions(portions: readonly RawPortion[]): PackedPortion[] {
  const seen = new Set<string>();
  const out: PackedPortion[] = [];
  for (const p of portions) {
    if (!(p.grams > 0)) continue;
    const label = portionLabel(p);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push([label, round(p.grams, 1)]);
    if (out.length === MAX_PORTIONS) break;
  }
  return out;
}

/**
 * Per 100 g: kcal from 1008; Foundation falls back to Atwater 2047 then 2048;
 * any food then falls back to 4P + 4C + 9F. Foods missing P, C or F are skipped.
 */
export function packUsdaFood(
  food: RawFood,
  aliases: readonly string[] = [],
): PackedFood | SkipReason {
  const n = food.nutrients;
  const p = n.get(NUTRIENT.protein);
  const f = n.get(NUTRIENT.fat);
  const c = n.get(NUTRIENT.carbs);
  if (p === undefined || f === undefined || c === undefined) return 'missing-macros';
  let kcal = n.get(NUTRIENT.energyKcal);
  if (kcal === undefined && food.kind === 'foundation') {
    kcal = n.get(NUTRIENT.energyAtwaterGeneral) ?? n.get(NUTRIENT.energyAtwaterSpecific);
  }
  kcal ??= kcalFromMacros(p, c, f);
  const fiber = n.get(NUTRIENT.fiber);
  return [
    food.id,
    food.description.trim(),
    Math.round(kcal),
    round(p, 1),
    round(c, 1),
    round(f, 1),
    fiber === undefined ? null : round(fiber, 1),
    packPortions(food.portions),
    [...aliases],
  ];
}

const num = (s: string | undefined) => {
  const v = Number.parseFloat(s ?? '');
  return Number.isFinite(v) ? v : undefined;
};

/** Reads one extracted FDC download folder (food.csv, food_nutrient.csv, ...). */
export async function readUsdaDataset(dir: string, kind: DatasetKind): Promise<RawFood[]> {
  const file = (name: string) => join(dir, name);
  for (const name of ['food.csv', 'food_nutrient.csv']) {
    if (!existsSync(file(name)))
      throw new Error(`Missing ${file(name)}. See data/raw/usda/README.md.`);
  }
  const foods = new Map<string, RawFood>();
  await readCsvFile(file('food.csv'), (r) => {
    const id = r.fdc_id;
    if (id && r.data_type === DATA_TYPES[kind] && r.description) {
      foods.set(id, { id, description: r.description, kind, nutrients: new Map(), portions: [] });
    }
  });
  await readCsvFile(file('food_nutrient.csv'), (r) => {
    const nutrient = num(r.nutrient_id);
    const amount = num(r.amount);
    const food = r.fdc_id ? foods.get(r.fdc_id) : undefined;
    if (food && nutrient !== undefined && WANTED.has(nutrient) && amount !== undefined) {
      food.nutrients.set(nutrient, amount);
    }
  });
  const units = new Map<string, string>();
  if (existsSync(file('measure_unit.csv'))) {
    await readCsvFile(file('measure_unit.csv'), (r) => {
      if (r.id && r.name) units.set(r.id, r.name);
    });
  }
  if (existsSync(file('food_portion.csv'))) {
    const rows: { food: RawFood; seq: number; portion: RawPortion }[] = [];
    await readCsvFile(file('food_portion.csv'), (r) => {
      const food = r.fdc_id ? foods.get(r.fdc_id) : undefined;
      const grams = num(r.gram_weight);
      if (!food || grams === undefined) return;
      rows.push({
        food,
        seq: num(r.seq_num) ?? 0,
        portion: {
          amount: num(r.amount) ?? 1,
          unit: units.get(r.measure_unit_id ?? '') ?? '',
          modifier: r.modifier ?? '',
          description: r.portion_description ?? '',
          grams,
        },
      });
    });
    rows.sort((a, b) => a.seq - b.seq).forEach(({ food, portion }) => food.portions.push(portion));
  }
  return [...foods.values()];
}
