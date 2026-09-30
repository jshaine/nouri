import { decodeFoodPack, FoodPackError, type FoodPack } from './foodPack';

const pack: FoodPack = {
  v: 1,
  generatedAt: '2026-09-30T00:00:00Z',
  sources: { usda: 'USDA FoodData Central' },
  usda: [['168878', 'Rice, white, cooked', 130, 2.7, 28.2, 0.3, 0.4, [['1 cup', 158]], ['kanin']]],
  fnri: [['A1', 'Sinigang na baboy', 60, 5, 3, 3, null, [], ['sour soup']]],
};

describe('decodeFoodPack', () => {
  it('expands compact foods into per-100 g Foods', () => {
    const { foods, sources, skipped } = decodeFoodPack(pack);
    expect(skipped).toBe(0);
    expect(sources).toEqual({ usda: 'USDA FoodData Central' });
    expect(foods[0]).toEqual({
      key: 'usda:168878',
      source: 'usda',
      name: 'Rice, white, cooked',
      aliases: ['kanin'],
      basis: { kind: '100g' },
      nutrients: { kcal: 130, p: 2.7, c: 28.2, f: 0.3, fiber: 0.4 },
      portions: [{ label: '1 cup', grams: 158 }],
    });
    expect(foods[1]).toMatchObject({
      key: 'fnri:A1',
      source: 'fnri',
      nutrients: { kcal: 60, p: 5, c: 3, f: 3 },
    });
    expect(foods[1]?.nutrients).not.toHaveProperty('fiber');
  });

  it('skips malformed foods and bad portions instead of failing', () => {
    const { foods, skipped } = decodeFoodPack({
      ...pack,
      usda: [
        [
          '1',
          'ok',
          1,
          1,
          1,
          1,
          null,
          [
            ['bad', 0],
            ['cup', 'x'],
            ['slice', 30],
          ],
          [3, 'alias'],
        ],
        ['2', 'no kcal', null, 1, 1, 1, null, [], []],
        'nonsense',
      ],
      fnri: 'nope',
      sources: { usda: 5, other: 'x' },
    });
    expect(skipped).toBe(2);
    expect(foods).toHaveLength(1);
    expect(foods[0]?.portions).toEqual([{ label: 'slice', grams: 30 }]);
    expect(foods[0]?.aliases).toEqual(['alias']);
  });

  it('tolerates missing portions and aliases', () => {
    const { foods } = decodeFoodPack({ v: 1, usda: [['1', 'x', 1, 1, 1, 1, 0]] });
    expect(foods[0]).toMatchObject({ portions: [], aliases: [], nutrients: { fiber: 0 } });
  });

  it.each([null, 'x', { v: 2 }, {}])('rejects %j', (json) => {
    expect(() => decodeFoodPack(json)).toThrow(FoodPackError);
  });
});
