import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { packUsdaFood, portionLabel, readUsdaDataset, NUTRIENT, type RawFood } from './usda';

const p = (over: Partial<Parameters<typeof portionLabel>[0]>) => ({
  amount: 1,
  unit: '',
  modifier: '',
  description: '',
  grams: 10,
  ...over,
});

describe('portionLabel', () => {
  it.each([
    [p({ unit: 'cup' }), '1 cup'],
    [p({ unit: 'cup', modifier: 'chopped' }), '1 cup, chopped'],
    [p({ unit: 'undetermined', modifier: 'slice' }), '1 slice'],
    [p({ amount: 2, modifier: 'tbsp' }), '2 tbsp'],
    [p({ amount: 0.333, unit: 'cup' }), '0.33 cup'],
    [p({ description: '1 piece' }), '1 piece'],
    [p({ amount: 2, description: 'pieces' }), '2 pieces'],
    [p({ amount: 0, unit: 'cup' }), '1 cup'],
  ])('%j → %s', (portion, label) => {
    expect(portionLabel(portion)).toBe(label);
  });

  it('has no label without a unit, modifier or description', () => {
    expect(portionLabel(p({ description: 'Quantity not specified' }))).toBeNull();
  });
});

describe('packUsdaFood', () => {
  const food = (nutrients: [number, number][], kind: RawFood['kind'] = 'sr_legacy'): RawFood => ({
    id: '1',
    description: ' Test food ',
    kind,
    nutrients: new Map(nutrients),
    portions: [],
  });
  const macros: [number, number][] = [
    [NUTRIENT.protein, 10],
    [NUTRIENT.fat, 5],
    [NUTRIENT.carbs, 20],
  ];

  it('ignores Atwater energy for SR Legacy and falls back to macros', () => {
    const packed = packUsdaFood(food([...macros, [NUTRIENT.energyAtwaterGeneral, 999]]));
    expect(packed).toEqual(['1', 'Test food', 165, 10, 20, 5, null, [], []]);
  });

  it('caps portions at eight', () => {
    const f = food(macros);
    f.portions = Array.from({ length: 12 }, (_, i) => p({ unit: `unit${i}` }));
    const packed = packUsdaFood(f);
    expect(packed !== 'missing-macros' && packed[7]).toHaveLength(8);
  });
});

describe('readUsdaDataset', () => {
  it('points to the README when files are missing', async () => {
    await expect(readUsdaDataset(join(tmpdir(), 'missing-usda'), 'foundation')).rejects.toThrow(
      /README/,
    );
  });
});
