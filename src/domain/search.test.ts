import { readProjectFile } from '@/test/readProjectFile';
import type { Food } from './food';
import { decodeFoodPack } from './foodPack';
import { createFoodSearch, normalizeTerm } from './search';

const food = (key: string, name: string, aliases: string[] = []): Food => ({
  key: key as Food['key'],
  source: key.startsWith('fnri') ? 'fnri' : 'usda',
  name,
  aliases,
  basis: { kind: '100g' },
  nutrients: { p: 1, c: 1, f: 1 },
  portions: [],
});

const FOODS = [
  food('usda:1', 'Rice, white, long-grain, regular, enriched, cooked', ['kanin', 'sinaing']),
  food('usda:2', 'Rice, white, long-grain, regular, raw, enriched', ['bigas']),
  food('usda:3', 'Chicken, broilers or fryers, breast, meat only, cooked, roasted', ['manok']),
  food('fnri:sinigang', 'Sinigang na baboy', ['sour soup', 'pork sour soup']),
  food('fnri:pinakbet', 'Piñakbet'),
];

describe('createFoodSearch', () => {
  const search = createFoodSearch(FOODS);

  it('finds foods by Filipino alias, ranking the alias match first', () => {
    expect(search.search('kanin')[0]?.key).toBe('usda:1');
  });

  it('matches both name and name_alt, so "sinigang" and "sour soup" both work', () => {
    expect(search.search('sinigang')[0]?.key).toBe('fnri:sinigang');
    expect(search.search('sour soup')[0]?.key).toBe('fnri:sinigang');
  });

  it('tolerates typos and partial words', () => {
    expect(search.search('sinigan')[0]?.key).toBe('fnri:sinigang');
    expect(search.search('chiken brest')[0]?.key).toBe('usda:3');
    expect(search.search('manok')[0]?.key).toBe('usda:3');
    expect(search.search('ric')[0]?.name).toMatch(/^Rice/);
  });

  it('ignores accents in both directions', () => {
    expect(search.search('pinakbet')[0]?.key).toBe('fnri:pinakbet');
    expect(normalizeTerm('PIÑAKBET')).toBe('pinakbet');
  });

  it('requires every word to match', () => {
    expect(search.search('rice raw').map((f) => f.key)).toEqual(['usda:2']);
  });

  it('returns nothing for blank queries and respects the limit', () => {
    expect(search.search('   ')).toEqual([]);
    expect(search.search('rice', 1)).toHaveLength(1);
  });

  it('looks foods up by key', () => {
    expect(search.size).toBe(5);
    expect(search.get('usda:2')?.aliases).toEqual(['bigas']);
    expect(search.get('usda:404')).toBeUndefined();
  });
});

describe('search over the bundled foods.json', () => {
  const { foods } = decodeFoodPack(JSON.parse(readProjectFile('public/foods.json')));
  const search = createFoodSearch(foods);

  it('indexes every bundled food', () => {
    expect(search.size).toBe(foods.length);
    expect(foods.length).toBeGreaterThan(8000);
  });

  it.each([
    ['kanin', /^Rice, white/],
    ['itlog', /^Egg/],
    ['bangus', /milkfish/],
    ['chicken breast roasted', /^Chicken.*breast/],
    ['banana', /^Bananas/],
  ])('"%s" finds a sensible first result', (query, name) => {
    expect(search.search(query)[0]?.name).toMatch(name);
  });

  it('answers well under 50 ms', () => {
    const queries = [
      'kanin',
      'chicken',
      'sinigang',
      'itlog',
      'pork adobo',
      'banan',
      'milk',
      'bread wheat',
    ];
    search.search('warm up');
    const start = performance.now();
    for (let i = 0; i < 5; i += 1) queries.forEach((q) => search.search(q));
    const perQuery = (performance.now() - start) / (queries.length * 5);
    expect(perQuery).toBeLessThan(50);
  });
});
