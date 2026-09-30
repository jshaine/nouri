import { validateCustomFood, EMPTY_CUSTOM_FOOD, type CustomFoodDraft } from '@/domain';
import { createTestRepositories, firstValue } from '../testing';

function draft(over: Partial<typeof EMPTY_CUSTOM_FOOD>): CustomFoodDraft {
  const r = validateCustomFood({
    ...EMPTY_CUSTOM_FOOD,
    name: 'Adobo',
    p: '28',
    c: '4',
    f: '18',
    ...over,
  });
  if (!r.ok) throw new Error('bad draft');
  return r.value;
}

describe('customFoodRepository', () => {
  it('creates per-100 g foods with no portions', async () => {
    const { repos } = createTestRepositories();
    const food = await repos.customFoods.create(draft({ kcal: '290' }));
    expect(food).toMatchObject({
      key: 'custom:id-1',
      source: 'custom',
      basis: { kind: '100g' },
      nutrients: { kcal: 290, p: 28, c: 4, f: 18 },
      portions: [],
    });
    expect(await repos.customFoods.get('id-1')).toEqual(food);
  });

  it('stores per-serving foods of unknown weight as "1 serving"', async () => {
    const { repos, db } = createTestRepositories();
    const food = await repos.customFoods.create(draft({ basis: 'serving' }));
    expect(food.basis).toEqual({ kind: 'serving' });
    expect(food.portions).toEqual([{ label: '1 serving', servings: 1 }]);
    const row = await db.customFoods.get('id-1');
    expect(row).not.toHaveProperty('servingGrams');
  });

  it('keeps a known serving weight and optional fiber', async () => {
    const { repos } = createTestRepositories();
    const food = await repos.customFoods.create(
      draft({ basis: 'serving', servingGrams: '200', fiber: '3' }),
    );
    expect(food.basis).toEqual({ kind: 'serving', servingGrams: 200 });
    expect(food.portions).toEqual([{ label: '1 serving', grams: 200 }]);
    expect(food.nutrients.fiber).toBe(3);
  });

  it('updates in place, keeping createdAt and extra portions', async () => {
    const { repos, db, tick } = createTestRepositories();
    await repos.customFoods.create(draft({ basis: 'serving' }));
    const row = await db.customFoods.get('id-1');
    await db.customFoods.put({
      ...row!,
      portions: [...row!.portions, { label: 'bowl', servings: 2 }],
    });
    tick();
    const updated = await repos.customFoods.update(
      'id-1',
      draft({ name: 'Adobong manok', basis: 'serving', servingGrams: '180' }),
    );
    expect(updated.name).toBe('Adobong manok');
    expect(updated.portions).toEqual([
      { label: '1 serving', grams: 180 },
      { label: 'bowl', servings: 2 },
    ]);
    const saved = await db.customFoods.get('id-1');
    expect(saved!.updatedAt).toBeGreaterThan(saved!.createdAt);
  });

  it('refuses to update a missing food', async () => {
    const { repos } = createTestRepositories();
    await expect(repos.customFoods.update('nope', draft({}))).rejects.toThrow(/no longer exists/);
  });

  it('lists live, sorted by name, and reflects removals', async () => {
    const { repos } = createTestRepositories();
    await repos.customFoods.create(draft({ name: 'Turon' }));
    await repos.customFoods.create(draft({ name: 'Arroz caldo' }));
    expect((await firstValue(repos.customFoods.live())).map((f) => f.name)).toEqual([
      'Arroz caldo',
      'Turon',
    ]);
    await repos.customFoods.remove('id-1');
    expect((await firstValue(repos.customFoods.live())).map((f) => f.name)).toEqual([
      'Arroz caldo',
    ]);
    expect(await repos.customFoods.get('id-1')).toBeUndefined();
  });
});
