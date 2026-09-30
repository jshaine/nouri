import { join } from 'node:path';
import { packFnriRows, readFnriFile, slugId } from './fnri';

const FIXTURE = join(process.cwd(), 'scripts/fixtures/fnri/philfct.csv');

describe('readFnriFile (fictional fixture)', () => {
  it('returns null when the file is absent', async () => {
    expect(await readFnriFile(join(process.cwd(), 'nope.csv'))).toBeNull();
  });

  it('packs valid rows per 100 g and reports problems by line', async () => {
    const result = await readFnriFile(FIXTURE);
    const byName = Object.fromEntries(result!.foods.map((f) => [f[1], f]));
    expect(byName['Sinigang na baboy (sample)']).toEqual([
      'sinigang-na-baboy-sample',
      'Sinigang na baboy (sample)',
      60,
      5,
      3,
      3,
      0.8,
      [
        ['1 bowl', 250],
        ['1 cup', 240],
      ],
      ['sour soup', 'pork sour soup'],
    ]);
    // No kcal: 4P + 4C + 9F. No fiber: null.
    expect(byName['Adobong manok (sample)']?.slice(2, 7)).toEqual([196, 20, 2, 12, null]);
    // basis_g 50 → doubled to per 100 g.
    expect(byName['Pandesal (sample)']?.slice(2, 7)).toEqual([290, 9, 56, 3, 2]);
    expect(result!.problems).toEqual([
      'Line 6: missing name.',
      'Line 7 (Turon (sample)): not a number: kcal.',
      'Line 8 (Kakanin (sample)): protein_g, fat_g and carbs_g are required.',
      'Line 9 (Suman (sample)): portion "1 piece" has no portion_g; portion skipped.',
    ]);
  });
});

describe('packFnriRows', () => {
  it('requires the core columns', () => {
    expect(packFnriRows([], ['name', 'kcal']).problems[0]).toMatch(/protein_g, fat_g, carbs_g/);
  });

  it('rejects a zero basis', () => {
    const r = packFnriRows(
      [{ name: 'X', kcal: '1', protein_g: '1', fat_g: '1', carbs_g: '1', basis_g: '0' }],
      ['name', 'kcal', 'protein_g', 'fat_g', 'carbs_g', 'basis_g'],
    );
    expect(r.problems).toEqual(['Line 2 (X): basis_g must be more than 0.']);
  });
});

describe('slugId', () => {
  it('makes stable ASCII ids', () => {
    expect(slugId('  Piñakbet  (Ilocano) ')).toBe('pinakbet-ilocano');
  });
});
