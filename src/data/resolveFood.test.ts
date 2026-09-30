import type { Food } from '@/domain';
import { foodResolver } from './resolveFood';
import { createTestRepositories } from './testing';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { p: 1, c: 1, f: 1 },
  portions: [],
};

describe('foodResolver', () => {
  it('resolves custom and bundled foods, and nothing for bad or missing keys', async () => {
    const { repos } = createTestRepositories(undefined, [rice]);
    const mine = await repos.customFoods.create({
      name: 'Turon',
      aliases: [],
      basis: { kind: 'serving' },
      p: 2,
      c: 40,
      f: 8,
    });
    const resolve = foodResolver(repos);
    expect(await resolve('usda:1')).toEqual(rice);
    expect((await resolve(mine.key))?.name).toBe('Turon');
    expect(await resolve('custom:gone')).toBeUndefined();
    expect(await resolve('nonsense')).toBeUndefined();
  });
});
