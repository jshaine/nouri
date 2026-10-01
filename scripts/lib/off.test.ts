import { packOffProduct, packOffProducts } from './off.ts';

const product = (over: Record<string, unknown> = {}, nutriments: Record<string, unknown> = {}) => ({
  code: '4800016644504',
  product_name: 'Classic White Bread',
  brands: 'Gardenia',
  serving_size: '2 slices (56 g)',
  serving_quantity: 56,
  serving_quantity_unit: 'g',
  product_quantity_unit: 'g',
  data_quality_errors_tags: [],
  ...over,
  nutriments: {
    'energy-kcal_100g': 273.2,
    proteins_100g: 8.93,
    carbohydrates_100g: 55.36,
    fat_100g: 1.79,
    fiber_100g: 2.5,
    ...nutriments,
  },
});

describe('packOffProduct', () => {
  it('packs per 100 g with the brand in front and the label serving as a portion', () => {
    expect(packOffProduct(product())).toEqual([
      '4800016644504',
      'Gardenia Classic White Bread',
      273,
      8.9,
      55.4,
      1.8,
      2.5,
      [['2 slices', 56]],
      [],
    ]);
  });

  it('keeps a name that already has the brand, and tidies all-caps names', () => {
    const packed = packOffProduct(product({ product_name: 'GARDENIA HIGH FIBER WHEAT BREAD' }));
    expect(packed[1]).toBe('Gardenia High Fiber Wheat Bread');
    expect(packOffProduct(product({ product_name: 'Tuna Flakes', brands: 'Century' }))[1]).toBe(
      'Century Tuna Flakes',
    );
    expect(packOffProduct(product({ brands: ['San Marino', 'Century Pacific'] }))[1]).toBe(
      'San Marino Classic White Bread',
    );
  });

  it('labels a bare weight as one serving, and leaves out a serving without a weight', () => {
    expect(packOffProduct(product({ serving_size: '56 g' }))[7]).toEqual([['1 serving', 56]]);
    expect(packOffProduct(product({ serving_quantity: undefined }))[7]).toEqual([]);
  });

  it('recovers the serving weight from per-serving values (search results)', () => {
    const fromSearch = product(
      { serving_size: undefined, serving_quantity: undefined, serving_quantity_unit: undefined },
      { 'energy-kcal_serving': 153, proteins_serving: 5 },
    );
    expect(packOffProduct(fromSearch)[7]).toEqual([['1 serving', 56]]);
  });

  it('keeps drink powders sold by weight', () => {
    const powder = product({ categories_tags: ['en:beverages'], quantity: '500 g' });
    expect(typeof packOffProduct(powder)).not.toBe('string');
  });

  it('works out kcal from kJ when only kJ is given', () => {
    const packed = packOffProduct(
      product({}, { 'energy-kcal_100g': undefined, 'energy-kj_100g': 1143 }),
    );
    expect(packed[2]).toBe(273);
  });

  it.each([
    ['no name', product({ product_name: '', product_name_en: '' }), 'no-name'],
    ['a drink (per 100 ml)', product({ product_quantity_unit: 'ml' }), 'liquid'],
    ['a drink by its pack size', product({ quantity: '1 L' }), 'liquid'],
    ['a drink with no weight', product({ categories_tags: ['en:beverages'] }), 'liquid'],
    ['missing fat', product({}, { fat_100g: undefined }), 'missing-macros'],
    ['more than 100 g of macros', product({}, { carbohydrates_100g: 99 }), 'impossible'],
    // A per-serving value typed into the per-100 g box: 153 kcal but macros say 273.
    [
      'kcal that the macros contradict',
      product({}, { 'energy-kcal_100g': 153 }),
      'energy-mismatch',
    ],
    ['flagged by Open Food Facts', product({ data_quality_errors_tags: ['en:x'] }), 'flagged'],
  ])('skips %s', (_, raw, reason) => {
    expect(packOffProduct(raw)).toBe(reason);
  });
});

describe('per-serving values typed as per 100 g', () => {
  it('skips dry foods that are too light to be per 100 g', () => {
    // SkyFlakes Fit: 120 kcal is the 25 g pack, not 100 g.
    const crackers = product(
      { product_name: 'SkyFlakes Fit Crackers', brands: 'M.Y. San', quantity: '25g' },
      { 'energy-kcal_100g': 120, proteins_100g: 3, carbohydrates_100g: 17, fat_100g: 5 },
    );
    expect(packOffProduct(crackers)).toBe('per-serving');
    const tagged = product(
      { product_name: 'Hansel', categories_tags: ['en:biscuits'] },
      { 'energy-kcal_100g': 140, proteins_100g: 3, carbohydrates_100g: 21, fat_100g: 5 },
    );
    expect(packOffProduct(tagged)).toBe('per-serving');
  });

  it('skips canned meat and fish too low in protein, but not meat-flavored snacks', () => {
    const tuna = { 'energy-kcal_100g': 93, proteins_100g: 7, carbohydrates_100g: 5, fat_100g: 5 };
    expect(packOffProduct(product({ product_name: 'Corned Tuna' }, tuna))).toBe('per-serving');
    expect(
      typeof packOffProduct(product({ product_name: 'Corned Beef Flavor Rice Mix' }, tuna)),
    ).toBe('object');
  });

  it('drops the smaller of two same-brand products whose numbers share one ratio', () => {
    const per100 = {
      'energy-kcal_100g': 166,
      proteins_100g: 12.5,
      carbohydrates_100g: 8.9,
      fat_100g: 8.9,
    };
    const perServing = {
      'energy-kcal_100g': 93,
      proteins_100g: 7,
      carbohydrates_100g: 5,
      fat_100g: 5,
    };
    const { foods, skipped } = packOffProducts([
      product({ code: '1', brands: 'San Marino', product_name: 'Corned Tuna' }, per100),
      product({ code: '2', brands: 'San Marino', product_name: 'Tuna Spread' }, perServing),
    ]);
    expect(foods.map((f) => f[1])).toEqual(['San Marino Corned Tuna']);
    expect(skipped['per-serving']).toBe(1);
  });
});

describe('portions', () => {
  it('offers a single-serve pack by its net weight, and one piece of a multipack', () => {
    const bare = { serving_size: undefined, serving_quantity: undefined };
    expect(packOffProduct(product({ ...bare, quantity: '55 g' }))[7]).toEqual([['1 pack', 55]]);
    expect(packOffProduct(product({ ...bare, quantity: '10 x 25 g' }))[7]).toEqual([
      ['1 piece', 25],
    ]);
    expect(packOffProduct(product({ ...bare, quantity: '600 g' }))[7]).toEqual([]);
    expect(packOffProduct(product({ quantity: '56 g' }))[7]).toEqual([['2 slices', 56]]);
  });

  it('title-cases all-lowercase names and uses the brand for a brand-only name', () => {
    expect(packOffProduct(product({ product_name: 'lucky me beef', brands: '' }))[1]).toBe(
      'Lucky Me Beef',
    );
    expect(packOffProduct(product({ product_name: 'San marino', brands: 'San Marino' }))[1]).toBe(
      'San Marino',
    );
  });
});

describe('packOffProducts', () => {
  it('keeps one product per name, preferring one with a serving, and counts what it skipped', () => {
    const { foods, skipped } = packOffProducts([
      product({ code: '1', serving_quantity: undefined }),
      product({ code: '2' }),
      product({ code: '3' }),
      product({ code: '2', product_name: 'Other name' }),
      product({ code: '4', product_quantity_unit: 'ml' }),
    ]);
    expect(foods.map((f) => f[0])).toEqual(['2']);
    expect(skipped).toEqual({ duplicate: 3, liquid: 1 });
  });
});
