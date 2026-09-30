import {
  customFoodToFood,
  defaultPortions,
  EMPTY_CUSTOM_FOOD,
  foodToCustomFoodInput,
  validateCustomFood,
  type CustomFoodInput,
} from './customFood';

const input = (over: Partial<CustomFoodInput>): CustomFoodInput => ({
  ...EMPTY_CUSTOM_FOOD,
  name: 'Chicken adobo',
  p: '28',
  c: '4',
  f: '18',
  ...over,
});

function errorsOf(i: CustomFoodInput) {
  const r = validateCustomFood(i);
  if (r.ok) throw new Error('expected errors');
  return r.errors;
}
function valueOf(i: CustomFoodInput) {
  const r = validateCustomFood(i);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
}

describe('validateCustomFood', () => {
  it('accepts a per-100 g food and tidies the name and aliases', () => {
    const v = valueOf(
      input({
        name: '  Pandesal   classic ',
        aliases: 'pan de sal, , Pandesal classic, pan de sal',
        kcal: '290',
      }),
    );
    expect(v).toEqual({
      name: 'Pandesal classic',
      aliases: ['pan de sal'],
      basis: { kind: '100g' },
      kcal: 290,
      p: 28,
      c: 4,
      f: 18,
    });
  });

  it('keeps kcal out when empty so 4P + 4C + 9F is used', () => {
    expect(valueOf(input({})).kcal).toBeUndefined();
  });

  it('stores a per-serving food without inventing a weight', () => {
    expect(valueOf(input({ basis: 'serving' })).basis).toEqual({ kind: 'serving' });
  });

  it('records the serving weight when known, accepting comma decimals', () => {
    const v = valueOf(input({ basis: 'serving', servingGrams: '180,5', fiber: '1.2' }));
    expect(v.basis).toEqual({ kind: 'serving', servingGrams: 180.5 });
    expect(v.fiber).toBe(1.2);
  });

  it('ignores a serving weight on per-100 g foods', () => {
    expect(valueOf(input({ servingGrams: 'abc' })).basis).toEqual({ kind: '100g' });
  });

  it('explains a missing name and missing macros', () => {
    const e = errorsOf({ ...EMPTY_CUSTOM_FOOD });
    expect(e.name).toMatch(/Add a name/);
    expect(e.p).toMatch(/Use 0 if there is none/);
    expect(e.c).toBeDefined();
    expect(e.f).toBeDefined();
  });

  it('limits the name length', () => {
    expect(errorsOf(input({ name: 'x'.repeat(81) })).name).toMatch(/under 80/);
  });

  it('explains non-numbers', () => {
    const e = errorsOf(input({ p: 'lots', kcal: '1.', fiber: '-1' }));
    expect(e.p).toMatch(/as a number/);
    expect(e.kcal).toMatch(/leave it empty/);
    expect(e.fiber).toMatch(/as a number/);
  });

  it.each(['0', 'abc', '6000'])('rejects serving weight %j', (servingGrams) => {
    expect(errorsOf(input({ basis: 'serving', servingGrams })).servingGrams).toMatch(
      /serving weight/,
    );
  });

  it('catches macros heavier than the food', () => {
    expect(errorsOf(input({ p: '50', c: '40', f: '20' })).f).toMatch(
      /110 g, more than the 100 g basis/,
    );
    expect(errorsOf(input({ basis: 'serving', servingGrams: '30' })).f).toMatch(/30 g serving/);
  });

  it('allows any macro weight when the serving weight is unknown', () => {
    expect(validateCustomFood(input({ basis: 'serving', p: '80', c: '60' })).ok).toBe(true);
  });

  it('catches impossible calories per 100 g', () => {
    expect(errorsOf(input({ kcal: '950' })).kcal).toMatch(/more than pure fat/);
    expect(validateCustomFood(input({ basis: 'serving', kcal: '950' })).ok).toBe(true);
  });
});

describe('custom food to Food', () => {
  it('gives serving foods a "1 serving" portion by weight or by count', () => {
    expect(defaultPortions({ kind: '100g' })).toEqual([]);
    expect(defaultPortions({ kind: 'serving' })).toEqual([{ label: '1 serving', servings: 1 }]);
    expect(defaultPortions({ kind: 'serving', servingGrams: 200 })).toEqual([
      { label: '1 serving', grams: 200 },
    ]);
  });

  it('builds a keyed custom Food', () => {
    const draft = valueOf(input({ basis: 'serving', kcal: '300', fiber: '2' }));
    const food = customFoodToFood('abc', draft);
    expect(food).toMatchObject({
      key: 'custom:abc',
      source: 'custom',
      nutrients: { kcal: 300, p: 28, c: 4, f: 18, fiber: 2 },
      portions: [{ label: '1 serving', servings: 1 }],
    });
    expect(customFoodToFood('abc', valueOf(input({})), []).nutrients).toEqual({
      p: 28,
      c: 4,
      f: 18,
    });
  });
});

describe('foodToCustomFoodInput', () => {
  it('round-trips through validation', () => {
    const original = input({
      basis: 'serving',
      servingGrams: '180',
      aliases: 'adobo, manok',
      kcal: '300',
      fiber: '1',
    });
    const food = customFoodToFood('x', valueOf(original));
    const back = foodToCustomFoodInput(food);
    expect(back).toEqual({ ...original, aliases: 'adobo, manok' });
    expect(valueOf(back)).toEqual(valueOf(original));
  });

  it('leaves optional fields empty', () => {
    const food = customFoodToFood('x', valueOf(input({})));
    expect(foodToCustomFoodInput(food)).toMatchObject({
      basis: '100g',
      servingGrams: '',
      kcal: '',
      fiber: '',
    });
  });
});
