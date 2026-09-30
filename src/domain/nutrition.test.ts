import type { Food } from './food';
import {
  basisFactor,
  calorieSplit,
  caloriesOf,
  kcalFromMacros,
  nutrientsFor,
  rescaleTotals,
  sumTotals,
  UnitError,
} from './nutrition';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158 }],
};
const adobo: Food = {
  key: 'custom:a',
  source: 'custom',
  name: 'Chicken adobo',
  aliases: [],
  basis: { kind: 'serving' },
  nutrients: { p: 28, c: 4, f: 18 },
  portions: [
    { label: '1 serving', servings: 1 },
    { label: 'half serving', servings: 0.5 },
  ],
};
const weighedServing: Food = {
  ...adobo,
  basis: { kind: 'serving', servingGrams: 200 },
  portions: [{ label: '1 serving', grams: 200 }],
};

describe('calories', () => {
  it('uses 4P + 4C + 9F', () => {
    expect(kcalFromMacros(10, 20, 5)).toBe(165);
  });

  it('prefers the food’s own kcal and falls back to macros', () => {
    expect(caloriesOf({ kcal: 130, p: 2.7, c: 28, f: 0.3 })).toBe(130);
    expect(caloriesOf({ p: 28, c: 4, f: 18 })).toBe(290);
  });

  it('keeps an explicit 0 kcal instead of deriving it', () => {
    expect(caloriesOf({ kcal: 0, p: 1, c: 1, f: 1 })).toBe(0);
  });
});

describe('basisFactor', () => {
  it('converts grams against 100 g', () => {
    expect(basisFactor(rice, rice.portions, 250, { kind: 'grams' })).toBe(2.5);
  });

  it('converts gram portions', () => {
    expect(basisFactor(rice, rice.portions, 2, { kind: 'portion', label: '1 cup' })).toBeCloseTo(
      3.16,
    );
  });

  it('counts servings for per-serving foods of unknown weight', () => {
    expect(basisFactor(adobo, adobo.portions, 3, { kind: 'portion', label: 'half serving' })).toBe(
      1.5,
    );
  });

  it('converts grams for per-serving foods with a known weight', () => {
    expect(basisFactor(weighedServing, weighedServing.portions, 100, { kind: 'grams' })).toBe(0.5);
    expect(
      basisFactor(weighedServing, weighedServing.portions, 1, {
        kind: 'portion',
        label: '1 serving',
      }),
    ).toBe(1);
  });

  it('refuses grams when the serving weight is unknown', () => {
    expect(() => basisFactor(adobo, adobo.portions, 100, { kind: 'grams' })).toThrow(UnitError);
  });

  it('refuses a gram portion on a serving food of unknown weight', () => {
    expect(() =>
      basisFactor(adobo, [{ label: 'cup', grams: 100 }], 1, { kind: 'portion', label: 'cup' }),
    ).toThrow(UnitError);
  });

  it('refuses servings on a per-100 g food', () => {
    expect(() =>
      basisFactor(rice, [{ label: 'x', servings: 1 }], 1, { kind: 'portion', label: 'x' }),
    ).toThrow(/per-serving/);
  });

  it('refuses unknown portions', () => {
    expect(() => basisFactor(rice, rice.portions, 1, { kind: 'portion', label: 'bowl' })).toThrow(
      /Unknown portion/,
    );
  });
});

describe('nutrientsFor', () => {
  it('scales every macro and kcal', () => {
    const t = nutrientsFor(rice, rice.portions, 1, { kind: 'portion', label: '1 cup' });
    expect(t.kcal).toBeCloseTo(205.4);
    expect(t.p).toBeCloseTo(4.266);
    expect(t.c).toBeCloseTo(44.24);
    expect(t.f).toBeCloseTo(0.474);
  });

  it('derives kcal for foods without it', () => {
    expect(nutrientsFor(adobo, adobo.portions, 2, { kind: 'portion', label: '1 serving' })).toEqual(
      {
        kcal: 580,
        p: 56,
        c: 8,
        f: 36,
      },
    );
  });
});

describe('totals', () => {
  it('rescales a snapshot to a new amount', () => {
    expect(rescaleTotals({ kcal: 200, p: 10, c: 20, f: 8 }, 2, 3)).toEqual({
      kcal: 300,
      p: 15,
      c: 30,
      f: 12,
    });
  });

  it('rejects rescaling from a non-positive amount', () => {
    expect(() => rescaleTotals({ kcal: 1, p: 1, c: 1, f: 1 }, 0, 1)).toThrow(RangeError);
  });

  it('sums, starting from zero', () => {
    expect(sumTotals([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 });
    expect(
      sumTotals([
        { kcal: 100, p: 1, c: 2, f: 3 },
        { kcal: 50, p: 4, c: 5, f: 6 },
      ]),
    ).toEqual({ kcal: 150, p: 5, c: 7, f: 9 });
  });
});

describe('calorieSplit', () => {
  it('splits energy by 4/4/9 and totals exactly 100', () => {
    expect(calorieSplit({ p: 100, c: 250, f: 66.7 })).toEqual({ protein: 20, carbs: 50, fat: 30 });
  });

  it('distributes rounding remainders to the largest fractions', () => {
    const split = calorieSplit({ p: 1, c: 1, f: 1 }); // 4 / 4 / 9 of 17
    expect(split.protein + split.carbs + split.fat).toBe(100);
    expect(split).toEqual({ protein: 24, carbs: 23, fat: 53 });
  });

  it('is all zeros with nothing eaten, and ignores negatives', () => {
    expect(calorieSplit({ p: 0, c: 0, f: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 });
    expect(calorieSplit({ p: -5, c: 10, f: 0 })).toEqual({ protein: 0, carbs: 100, fat: 0 });
  });
});
