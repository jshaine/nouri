import type { LocalDate } from './dates';
import { groupByMeal, totalsOf, unitLabel, withAmount, type Entry } from './entries';

const base: Entry = {
  id: 'e1',
  date: '2026-09-30' as LocalDate,
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 2,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'Chicken adobo',
  source: 'custom',
  totals: { kcal: 580, p: 56, c: 8, f: 36 },
  createdAt: 2,
};

describe('entries', () => {
  it('changes the amount by scaling the snapshot', () => {
    const e = withAmount(base, 1);
    expect(e.amount).toBe(1);
    expect(e.totals).toEqual({ kcal: 290, p: 28, c: 4, f: 18 });
    expect(base.amount).toBe(2); // not mutated
  });

  it('totals a day', () => {
    expect(totalsOf([base, withAmount(base, 1)])).toEqual({ kcal: 870, p: 84, c: 12, f: 54 });
  });

  it('groups by meal in meal order, oldest first', () => {
    const groups = groupByMeal([
      { ...base, id: 'late', createdAt: 5 },
      { ...base, id: 'early', createdAt: 1 },
      { ...base, id: 'b', meal: 'breakfast' as const },
    ]);
    expect(Object.keys(groups)).toEqual(['breakfast', 'lunch', 'dinner', 'snacks']);
    expect(groups.lunch.map((e) => e.id)).toEqual(['early', 'late']);
    expect(groups.breakfast).toHaveLength(1);
    expect(groups.dinner).toEqual([]);
  });

  it('labels units', () => {
    expect(unitLabel({ kind: 'grams' })).toBe('g');
    expect(unitLabel({ kind: 'portion', label: '1 cup' })).toBe('1 cup');
  });
});
