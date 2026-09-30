import {
  availablePortions,
  foodKey,
  gramsPerBasis,
  parseFoodKey,
  supportsGrams,
  type Food,
} from './food';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice, white, cooked',
  aliases: ['kanin'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};

describe('food keys', () => {
  it('round-trips source and id', () => {
    const key = foodKey('fnri', 'A-12:3');
    expect(key).toBe('fnri:A-12:3');
    expect(parseFoodKey(key)).toEqual({ source: 'fnri', id: 'A-12:3' });
  });

  it.each(['', 'usda', 'usda:', 'other:1'])('rejects %j', (key) => {
    expect(parseFoodKey(key)).toBeNull();
  });
});

describe('basis', () => {
  it('knows grams per basis', () => {
    expect(gramsPerBasis({ kind: '100g' })).toBe(100);
    expect(gramsPerBasis({ kind: 'serving', servingGrams: 250 })).toBe(250);
    expect(gramsPerBasis({ kind: 'serving' })).toBeNull();
  });

  it('only offers grams when the weight is known', () => {
    expect(supportsGrams(rice)).toBe(true);
    expect(supportsGrams({ basis: { kind: 'serving' } })).toBe(false);
  });
});

describe('availablePortions', () => {
  it('appends overrides and drops duplicate labels (case-insensitive)', () => {
    const portions = availablePortions(rice, [
      { label: '1 Cup', grams: 160 },
      { label: '1 cup kanin', grams: 160 },
    ]);
    expect(portions.map((p) => p.label)).toEqual(['1 cup', '1 cup kanin']);
  });
});
