import type { Food } from './food';
import { defaultAmount, defaultChoice, optionForUnit, stepFor, unitOptions } from './portionChoice';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { p: 2.7, c: 28, f: 0.3 },
  portions: [{ label: '1 cup', grams: 158.4 }],
};
const adobo: Food = {
  ...rice,
  key: 'custom:a',
  basis: { kind: 'serving' },
  portions: [{ label: '1 serving', servings: 1 }],
};
const weighed: Food = {
  ...adobo,
  basis: { kind: 'serving', servingGrams: 180 },
  portions: [{ label: '1 serving', grams: 180 }],
};
const plain: Food = { ...rice, portions: [] };

describe('unitOptions', () => {
  it('lists portions with their weight, then grams', () => {
    expect(unitOptions(rice, [{ label: '1 cup kanin', grams: 160 }]).map((o) => o.label)).toEqual([
      '1 cup (158 g)',
      '1 cup kanin (160 g)',
      'grams',
    ]);
  });

  it('never offers grams for a serving of unknown weight', () => {
    expect(unitOptions(adobo).map((o) => o.label)).toEqual(['1 serving']);
  });

  it('finds the option for a unit', () => {
    const options = unitOptions(rice);
    expect(optionForUnit(options, { kind: 'grams' })?.id).toBe('g');
    expect(optionForUnit(options, { kind: 'portion', label: '1 cup' })?.id).toBe('portion:1 cup');
    expect(optionForUnit(options, { kind: 'portion', label: 'bowl' })).toBeUndefined();
  });
});

describe('defaults', () => {
  it('starts with one of the first portion', () => {
    expect(defaultChoice(rice)).toEqual({ unit: { kind: 'portion', label: '1 cup' }, amount: 1 });
  });

  it('starts at 100 g when there are no portions', () => {
    expect(defaultChoice(plain)).toEqual({ unit: { kind: 'grams' }, amount: 100 });
  });

  it('uses the serving weight as the gram default for weighed servings', () => {
    expect(defaultAmount(weighed, { kind: 'grams' })).toBe(180);
  });

  it('refuses a food that cannot be measured', () => {
    expect(() => defaultChoice({ ...adobo, portions: [] })).toThrow(/no way to be measured/);
  });

  it('steps grams by 10 and portions by a half', () => {
    expect(stepFor({ kind: 'grams' })).toBe(10);
    expect(stepFor({ kind: 'portion', label: 'x' })).toBe(0.5);
  });
});
