import { createTestRepositories, firstValue } from '../testing';

describe('usageRepository', () => {
  it('records uses, counting repeats, most recent first', async () => {
    const { repos, tick } = createTestRepositories();
    await repos.usage.recordUse('usda:1');
    tick();
    await repos.usage.recordUse('custom:a');
    tick();
    await repos.usage.recordUse('usda:1');
    const recents = await firstValue(repos.usage.liveRecents());
    expect(recents.map((r) => [r.foodKey, r.useCount])).toEqual([
      ['usda:1', 2],
      ['custom:a', 1],
    ]);
  });

  it('limits recents', async () => {
    const { repos, tick } = createTestRepositories();
    for (let i = 0; i < 5; i += 1) {
      await repos.usage.recordUse(`usda:${i}`);
      tick();
    }
    expect((await firstValue(repos.usage.liveRecents(2))).map((r) => r.foodKey)).toEqual([
      'usda:4',
      'usda:3',
    ]);
  });

  it('stars and unstars favorites', async () => {
    const { repos, tick } = createTestRepositories();
    await repos.usage.setFavorite('usda:1', true);
    tick();
    await repos.usage.setFavorite('fnri:sinigang', true);
    expect(await firstValue(repos.usage.isFavorite('usda:1'))).toBe(true);
    expect((await firstValue(repos.usage.liveFavorites())).map((f) => f.foodKey)).toEqual([
      'fnri:sinigang',
      'usda:1',
    ]);
    await repos.usage.setFavorite('usda:1', false);
    expect(await firstValue(repos.usage.isFavorite('usda:1'))).toBe(false);
    await repos.usage.setFavorite('usda:404', false); // no-op
    expect(await firstValue(repos.usage.liveFavorites())).toHaveLength(1);
  });
});
