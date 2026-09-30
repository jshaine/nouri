import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeFoodPack, type FoodPack } from '../../src/domain/index.ts';
import { buildFoodPack, formatReport } from './build';

const FIXTURES = join(process.cwd(), 'scripts/fixtures/usda');

async function build(extra?: Parameters<typeof buildFoodPack>[0]['extra']) {
  const outFile = join(mkdtempSync(join(tmpdir(), 'nouri-foods-')), 'foods.json');
  const report = await buildFoodPack({
    usdaDir: FIXTURES,
    outFile,
    now: () => new Date('2026-09-30T00:00:00Z'),
    extra,
  });
  const pack = JSON.parse(readFileSync(outFile, 'utf8')) as FoodPack;
  return { report, pack };
}

describe('buildFoodPack (USDA fixtures)', () => {
  it('keeps only Foundation and SR Legacy foods with P, C and F, per 100 g', async () => {
    const { report, pack } = await build();
    expect(report.datasets).toEqual(['foundation', 'sr_legacy']);
    expect(pack.usda.map((f) => f[1])).toEqual([
      'Bananas, raw',
      'Egg, whole, raw, fresh',
      'Fish, milkfish, raw',
      'Pork, loin, roasted',
      'Rice, white, long grain, cooked',
      'Rice, white, long-grain, regular, enriched, cooked',
    ]);
    // Kale (no fat) and tap water (no macros) are skipped; the sub-sample is not a food.
    expect(report.skipped.missingMacros).toBe(2);
    expect(report.counts).toEqual({ usda: 6, fnri: 0 });
  });

  it('uses kcal 1008, then Atwater 2047/2048 for Foundation, then 4P + 4C + 9F', async () => {
    const { pack } = await build();
    const kcal = Object.fromEntries(pack.usda.map((f) => [f[1], f[2]]));
    expect(kcal['Rice, white, long-grain, regular, enriched, cooked']).toBe(130); // 1008
    expect(kcal['Rice, white, long grain, cooked']).toBe(130); // 2047
    expect(kcal['Egg, whole, raw, fresh']).toBe(136); // 2048
    expect(kcal['Pork, loin, roasted']).toBe(186); // 4*27.3 + 4*0 + 9*8.5 = 185.7
  });

  it('extracts portions in order, skipping zero weights and duplicates', async () => {
    const { pack } = await build();
    const portions = Object.fromEntries(pack.usda.map((f) => [f[1], f[7]]));
    expect(portions['Rice, white, long grain, cooked']).toEqual([
      ['0.5 cup', 79],
      ['1 cup', 158],
    ]);
    expect(portions['Egg, whole, raw, fresh']).toEqual([['1 large', 50.3]]);
    expect(portions['Bananas, raw']).toEqual([
      ['1 medium (7" to 7-7/8" long)', 118],
      ['1 cup, mashed', 225],
    ]);
    expect(portions['Fish, milkfish, raw']).toEqual([['3 oz', 85]]);
  });

  it('adds Filipino aliases and keeps fiber when known', async () => {
    const { pack } = await build();
    const byName = Object.fromEntries(pack.usda.map((f) => [f[1], f]));
    expect(byName['Rice, white, long grain, cooked']?.[8]).toEqual(['kanin', 'sinaing']);
    expect(byName['Fish, milkfish, raw']?.[8]).toEqual(['bangus', 'isda']);
    expect(byName['Bananas, raw']?.[6]).toBe(2.6);
    expect(byName['Fish, milkfish, raw']?.[6]).toBeNull();
  });

  it('writes a pack the app can decode, with credits and a size report', async () => {
    const { report, pack } = await build();
    const { foods, skipped, sources } = decodeFoodPack(pack);
    expect(skipped).toBe(0);
    expect(foods).toHaveLength(6);
    expect(sources.usda).toMatch(/FoodData Central/);
    expect(pack.generatedAt).toBe('2026-09-30T00:00:00.000Z');
    expect(report.gzipBytes).toBeLessThan(report.bytes);
    expect(report.overBudget).toBe(false);
    expect(formatReport(report)).toMatch(/Foods: 6 \(USDA 6, FNRI 0\)[\s\S]*gzip$/);
  });

  it('merges extra FNRI foods and credits them', async () => {
    const { pack, report } = await build({
      fnri: [
        ['B2', 'Sinigang na baboy', 60, 5, 3, 3, null, [], []],
        ['A1', 'Adobong manok', 200, 20, 2, 12, null, [], []],
      ],
      credit: 'FNRI PhilFCT',
    });
    expect(pack.fnri.map((f) => f[1])).toEqual(['Adobong manok', 'Sinigang na baboy']);
    expect(pack.sources.fnri).toBe('FNRI PhilFCT');
    expect(report.counts.fnri).toBe(2);
  });

  it('explains where to get the data when it is missing', async () => {
    const outFile = join(mkdtempSync(join(tmpdir(), 'nouri-foods-')), 'foods.json');
    await expect(buildFoodPack({ usdaDir: join(tmpdir(), 'nope'), outFile })).rejects.toThrow(
      /data\/raw\/usda\/README.md/,
    );
  });
});
