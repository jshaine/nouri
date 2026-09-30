import type { LocalDate } from './dates';
import { unitShortLabel, type EntryUnit, type FoodKey } from './food';
import type { FoodSource } from './macros';
import type { Meal } from './meals';
import { rescaleTotals, sumTotals, type MacroTotals } from './nutrition';

/**
 * One logged item. `totals`, `name` and `source` are a snapshot taken when
 * it was logged, so editing or deleting the food never changes past days.
 */
export interface Entry {
  id: string;
  date: LocalDate;
  meal: Meal;
  foodKey: FoodKey;
  amount: number;
  unit: EntryUnit;
  name: string;
  source: FoodSource;
  totals: MacroTotals;
  createdAt: number;
}

export type NewEntry = Omit<Entry, 'id' | 'createdAt'>;

/** Changes an entry's amount (same unit) by scaling its snapshot. */
export function withAmount(entry: Entry, amount: number): Entry {
  return { ...entry, amount, totals: rescaleTotals(entry.totals, entry.amount, amount) };
}

export function totalsOf(entries: readonly Pick<Entry, 'totals'>[]): MacroTotals {
  return sumTotals(entries.map((e) => e.totals));
}

/** Entries grouped by meal (in meal order), oldest first within each meal. */
export function groupByMeal<E extends Pick<Entry, 'meal' | 'createdAt'>>(
  entries: readonly E[],
): Record<Meal, E[]> {
  const groups: Record<Meal, E[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  for (const e of [...entries].sort((a, b) => a.createdAt - b.createdAt)) groups[e.meal].push(e);
  return groups;
}

export function unitLabel(unit: EntryUnit): string {
  return unitShortLabel(unit);
}
