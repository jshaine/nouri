import { gramsPerBasis, type EntryUnit, type Food, type Nutrients, type Portion } from './food';
import type { Macro } from './macros';

/** Energy per gram of each macro (Atwater general factors). */
export const KCAL_PER_GRAM: Readonly<Record<Macro, number>> = { protein: 4, carbs: 4, fat: 9 };

export interface MacroTotals {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export const ZERO_TOTALS: MacroTotals = { kcal: 0, p: 0, c: 0, f: 0 };

/** 4P + 4C + 9F. */
export function kcalFromMacros(p: number, c: number, f: number): number {
  return p * KCAL_PER_GRAM.protein + c * KCAL_PER_GRAM.carbs + f * KCAL_PER_GRAM.fat;
}

/** A food's calories: its own kcal when present, otherwise from its macros. */
export function caloriesOf(n: Nutrients): number {
  return n.kcal ?? kcalFromMacros(n.p, n.c, n.f);
}

export class UnitError extends Error {
  override name = 'UnitError';
}

/**
 * How many basis amounts `amount` of `unit` is. Throws UnitError when the
 * unit can't be converted (grams for a serving food of unknown weight, or a
 * portion the food doesn't have).
 */
export function basisFactor(
  food: Pick<Food, 'basis'>,
  portions: readonly Portion[],
  amount: number,
  unit: EntryUnit,
): number {
  const perBasis = gramsPerBasis(food.basis);
  if (unit.kind === 'grams') {
    if (perBasis === null) throw new UnitError('This food has no gram weight; use a portion.');
    return amount / perBasis;
  }
  const portion = portions.find((p) => p.label === unit.label);
  if (!portion) throw new UnitError(`Unknown portion "${unit.label}".`);
  if ('servings' in portion) {
    if (food.basis.kind !== 'serving') throw new UnitError('Servings need a per-serving food.');
    return amount * portion.servings;
  }
  if (perBasis === null) throw new UnitError('This food has no gram weight; use a portion.');
  return (amount * portion.grams) / perBasis;
}

/** Totals for `amount` of `unit` of a food. */
export function nutrientsFor(
  food: Food,
  portions: readonly Portion[],
  amount: number,
  unit: EntryUnit,
): MacroTotals {
  const k = basisFactor(food, portions, amount, unit);
  const n = food.nutrients;
  return { kcal: caloriesOf(n) * k, p: n.p * k, c: n.c * k, f: n.f * k };
}

/** Scales a logged snapshot to a new amount of the same unit (foods may be gone by then). */
export function rescaleTotals(totals: MacroTotals, from: number, to: number): MacroTotals {
  if (!(from > 0)) throw new RangeError('The original amount must be positive.');
  const k = to / from;
  return { kcal: totals.kcal * k, p: totals.p * k, c: totals.c * k, f: totals.f * k };
}

export function sumTotals(items: readonly MacroTotals[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, t) => ({ kcal: acc.kcal + t.kcal, p: acc.p + t.p, c: acc.c + t.c, f: acc.f + t.f }),
    ZERO_TOTALS,
  );
}

/**
 * Share of energy from each macro, in whole percents that total 100 (largest
 * remainder), based on 4/4/9 so it is consistent even when kcal came from a label.
 */
export function calorieSplit(t: Pick<MacroTotals, 'p' | 'c' | 'f'>): Record<Macro, number> {
  const energy: Record<Macro, number> = {
    protein: Math.max(0, t.p) * KCAL_PER_GRAM.protein,
    carbs: Math.max(0, t.c) * KCAL_PER_GRAM.carbs,
    fat: Math.max(0, t.f) * KCAL_PER_GRAM.fat,
  };
  const total = energy.protein + energy.carbs + energy.fat;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
  return largestRemainder(energy, total);
}

function largestRemainder(parts: Record<Macro, number>, total: number): Record<Macro, number> {
  const macros = Object.keys(parts) as Macro[];
  const exact = macros.map((m) => ({ m, v: (parts[m] / total) * 100 }));
  const result = Object.fromEntries(exact.map(({ m, v }) => [m, Math.floor(v)])) as Record<
    Macro,
    number
  >;
  let left = 100 - macros.reduce((s, m) => s + result[m], 0);
  for (const { m } of [...exact].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (left <= 0) break;
    result[m] += 1;
    left -= 1;
  }
  return result;
}
