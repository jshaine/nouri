import type { LocalDate } from './dates';
import { weekOf } from './dates';
import type { Entry } from './entries';
import { summarizeWeek } from './history';

const d = (s: string) => s as LocalDate;
const entry = (date: string, kcal: number, p = 10): Entry => ({
  id: `${date}-${kcal}`,
  date: d(date),
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 1,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'x',
  source: 'custom',
  totals: { kcal, p, c: 0, f: 0 },
  createdAt: 1,
});

describe('summarizeWeek', () => {
  const week = weekOf(d('2026-09-30'));

  it('totals each day and averages over logged days only', () => {
    const s = summarizeWeek(
      week,
      [entry('2026-09-28', 1800), entry('2026-09-28', 200), entry('2026-09-30', 1600, 30)],
      (date) => (date >= '2026-09-29' ? { kcal: 1850, p: 1, c: 1, f: 1 } : undefined),
    );
    expect(s.days).toHaveLength(7);
    expect(s.days[0]).toMatchObject({
      date: '2026-09-28',
      logged: true,
      totals: { kcal: 2000, p: 20 },
      goal: undefined,
    });
    expect(s.days[1]).toMatchObject({ logged: false, totals: { kcal: 0 }, goal: { kcal: 1850 } });
    expect(s.loggedDays).toBe(2);
    expect(s.average).toEqual({ kcal: 1800, p: 25, c: 0, f: 0 });
  });

  it('has no average for an empty week', () => {
    expect(summarizeWeek(week, [], () => undefined)).toMatchObject({
      loggedDays: 0,
      average: undefined,
    });
  });
});
