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

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
const status = (code: number) =>
  Promise.resolve({ ok: false, status: code, json: () => Promise.reject(new Error('no body')) });

describe('loadBundledFoods', () => {
  it('loads USDA and FNRI, FNRI first, with both credits', async () => {
    const fetchFn = vi.fn((url: string) =>
      url.endsWith('foods.json') ? ok(usdaPack) : ok(fnriPack),
    );
    const { foods, sources } = await loadBundledFoods(fetchFn, '/nouri/');
    expect(fetchFn).toHaveBeenCalledWith('/nouri/foods.json');
    expect(fetchFn).toHaveBeenCalledWith('/nouri/foods-fnri.json');
    expect(foods.map((f) => f.key)).toEqual(['fnri:sinigang', 'usda:1']);
    expect(sources).toEqual({ usda: 'USDA FoodData Central', fnri: 'FNRI PhilFCT' });
  });

  it('works without the FNRI file (404, network error, or an HTML fallback page)', async () => {
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
