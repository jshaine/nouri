import type { FoodPack } from '@/domain';
import { FOODS_UNAVAILABLE, loadBundledFoods } from './loadFoods';

const usdaPack: FoodPack = {
  v: 1,
  generatedAt: 'x',
  sources: { usda: 'USDA FoodData Central' },
  usda: [['1', 'Rice, cooked', 130, 2.7, 28, 0.3, null, [], ['kanin']]],
  fnri: [],
};
const fnriPack: FoodPack = {
  v: 1,
  generatedAt: 'x',
  sources: { fnri: 'FNRI PhilFCT' },
  usda: [],
  fnri: [['sinigang', 'Sinigang', 60, 5, 3, 3, null, [], []]],
};

const phPack: FoodPack = {
  v: 1,
  generatedAt: 'x',
  sources: { off: 'Open Food Facts' },
  usda: [],
  fnri: [],
  off: [
    ['4800', 'Gardenia Classic White Bread', 273, 8.9, 55.4, 1.8, null, [['2 slices', 56]], []],
  ],
};

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const status = (code: number) =>
  Promise.resolve({ ok: false, status: code, json: () => Promise.reject(new Error('no body')) });

describe('loadBundledFoods', () => {
  it('loads every pack, Philippine ones before USDA, with each credit', async () => {
    const packs: Record<string, FoodPack> = {
      '/nouri/foods.json': usdaPack,
      '/nouri/foods-fnri.json': fnriPack,
      '/nouri/foods-ph.json': phPack,
    };
    const fetchFn = vi.fn((url: string) => (packs[url] ? ok(packs[url]) : status(404)));
    const { foods, sources } = await loadBundledFoods(fetchFn, '/nouri/');
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(foods.map((f) => f.key)).toEqual(['fnri:sinigang', 'off:4800', 'usda:1']);
    expect(foods[1]?.portions).toEqual([{ label: '2 slices', grams: 56 }]);
    expect(sources).toEqual({
      usda: 'USDA FoodData Central',
      fnri: 'FNRI PhilFCT',
      off: 'Open Food Facts',
    });
  });

  it('works without the optional files (404, network error, or an HTML fallback page)', async () => {
    for (const fnri of [
      status(404),
      Promise.reject(new Error('offline')),
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('<html>')),
      }),
    ]) {
      const { foods, sources } = await loadBundledFoods((url) =>
        url.endsWith('foods.json') ? ok(usdaPack) : fnri,
      );
      expect(foods.map((f) => f.key)).toEqual(['usda:1']);
      expect(sources).toEqual({ usda: 'USDA FoodData Central' });
    }
  });

  it('explains what to do when the main list cannot load', async () => {
    await expect(loadBundledFoods(() => status(500))).rejects.toThrow(FOODS_UNAVAILABLE);
    await expect(loadBundledFoods(() => Promise.reject(new Error('offline')))).rejects.toThrow(
      FOODS_UNAVAILABLE,
    );
  });
});
