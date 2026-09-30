import { goalForDate, type LocalDate } from '@/domain';
import { createTestRepositories, firstValue } from '../testing';

const day = (s: string) => s as LocalDate;

describe('goalRepository', () => {
  it('adds dated records and keeps past days on their old goal', async () => {
    const { repos } = createTestRepositories();
    await repos.goals.setFrom(day('2026-09-01'), {
      kcal: 2000,
      p: 100,
      c: 250,
      f: 67,
      macroMode: 'percent',
      percents: { c: 50, p: 20, f: 30 },
    });
    await repos.goals.setFrom(day('2026-09-20'), {
      kcal: 1800,
      p: 140,
      c: 180,
      f: 60,
      macroMode: 'grams',
    });
    const all = await repos.goals.all();
    expect(all.map((g) => g.effectiveFrom)).toEqual(['2026-09-01', '2026-09-20']);
    expect(goalForDate(all, day('2026-09-10'))?.kcal).toBe(2000);
    expect(goalForDate(all, day('2026-09-30'))?.kcal).toBe(1800);
    expect(all[0]).toMatchObject({ macroMode: 'percent', percents: { c: 50, p: 20, f: 30 } });
    expect(all[1]).not.toHaveProperty('percents');
  });

  it('replaces the record when the goal changes twice on the same day', async () => {
    const { repos } = createTestRepositories();
    const first = await repos.goals.setFrom(day('2026-09-30'), {
      kcal: 2000,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    const second = await repos.goals.setFrom(day('2026-09-30'), {
      kcal: 1900,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    expect(second.id).toBe(first.id);
    const all = await firstValue(repos.goals.live());
    expect(all).toHaveLength(1);
    expect(all[0]?.kcal).toBe(1900);
  });

  it('treats a percent row without percents as grams', async () => {
    const { repos, db } = createTestRepositories();
    await db.goals.add({
      id: 'x',
      effectiveFrom: day('2026-09-01'),
      kcal: 1,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'percent',
    });
    expect((await repos.goals.all())[0]?.macroMode).toBe('grams');
  });
});
