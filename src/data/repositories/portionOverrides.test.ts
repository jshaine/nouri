import { createTestRepositories, firstValue } from '../testing';

describe('portionOverrideRepository', () => {
  it('saves, replaces by name and removes portions per food', async () => {
    const { repos, db } = createTestRepositories();
    const rice = 'usda:168878' as const;
    expect(await firstValue(repos.portionOverrides.live(rice))).toEqual([]);
    await repos.portionOverrides.save(rice, { label: '1 cup kanin', grams: 150 });
    await repos.portionOverrides.save(rice, { label: 'bowl', grams: 300 });
    await repos.portionOverrides.save(rice, { label: '1 Cup Kanin', grams: 160 });
    expect(await firstValue(repos.portionOverrides.live(rice))).toEqual([
      { label: 'bowl', grams: 300 },
      { label: '1 Cup Kanin', grams: 160 },
    ]);
    expect(await firstValue(repos.portionOverrides.live('usda:1'))).toEqual([]);

    await repos.portionOverrides.remove(rice, 'BOWL');
    await repos.portionOverrides.remove(rice, '1 cup kanin');
    expect(await db.portionOverrides.get(rice)).toBeUndefined();
    await repos.portionOverrides.remove(rice, 'nothing'); // no-op
  });
});
