import type { Food } from './food';
import {
  portionKind,
  selectionAsPortionAmount,
  upsertPortion,
  validatePortion,
} from './portionInput';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice',
  aliases: [],
  basis: { kind: '100g' },
  nutrients: { p: 1, c: 1, f: 1 },
  portions: [],
};
const adobo: Food = { ...rice, key: 'custom:a', basis: { kind: 'serving' } };

describe('validatePortion', () => {
  it('saves a weighed portion', () => {
    expect(validatePortion(rice, '  1 cup   kanin ', '160')).toEqual({
      ok: true,
      value: { label: '1 cup kanin', grams: 160 },
    });
  });

  it('uses servings when the weight is unknown', () => {
    expect(portionKind(adobo)).toBe('servings');
    expect(validatePortion(adobo, 'half plate', '0,5')).toEqual({
      ok: true,
      value: { label: 'half plate', servings: 0.5 },
    });
  });

  it.each([
    ['', '160', 'label', /Name the portion/],
    ['x'.repeat(41), '160', 'label', /under 40/],
    ['Grams', '160', 'label', /already an option/],
    ['1 cup', '', 'amount', /how many grams/],
    ['1 cup', '0', 'amount', /how many grams/],
    ['1 cup', '9000', 'amount', /how many grams/],
  ] as const)('rejects %j / %j', (label, amount, field, message) => {
    const r = validatePortion(rice, label, amount);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[field]).toMatch(message);
  });

  it('explains servings too', () => {
    const r = validatePortion(adobo, 'plate', '100');
    expect(!r.ok && r.errors.amount).toMatch(/how many servings/);
  });
});

describe('upsertPortion', () => {
  it('replaces a portion with the same name', () => {
    expect(
      upsertPortion(
        [
          { label: '1 Cup Kanin', grams: 150 },
          { label: 'bowl', grams: 300 },
        ],
        { label: '1 cup kanin', grams: 160 },
      ),
    ).toEqual([
      { label: 'bowl', grams: 300 },
      { label: '1 cup kanin', grams: 160 },
    ]);
  });
});

describe('selectionAsPortionAmount', () => {
  it('turns the current selection into grams for weighed foods', () => {
    const portions = [{ label: '1 cup', grams: 158 }];
    expect(selectionAsPortionAmount(rice, portions, 1.5, { kind: 'portion', label: '1 cup' })).toBe(
      237,
    );
    expect(selectionAsPortionAmount(rice, portions, 120, { kind: 'grams' })).toBe(120);
  });

  it('uses servings when the weight is unknown', () => {
    const portions = [{ label: '1 serving', servings: 1 }];
    expect(
      selectionAsPortionAmount(adobo, portions, 0.5, { kind: 'portion', label: '1 serving' }),
    ).toBe(0.5);
  });
});
