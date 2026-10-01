import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { FOOD_PACK_VERSION, type FoodPack, type PackedFood } from '../../src/domain/index.ts';
import { aliasesFor } from './aliases.ts';
import { FNRI_CREDIT, readFnriFile } from './fnri.ts';
import { OFF_CREDIT, packOffProducts, type OffSkip } from './off.ts';
import { packUsdaFood, readUsdaDataset, type DatasetKind } from './usda.ts';

export const USDA_CREDIT = 'USDA FoodData Central (Foundation Foods and SR Legacy), public domain';
/** Target from the spec: keep the download light for phones. */
export const GZIP_BUDGET_BYTES = 1.5 * 1024 * 1024;
const DATASETS: readonly DatasetKind[] = ['foundation', 'sr_legacy'];

export interface BuildOptions {
  usdaDir: string;
  /** USDA only (public domain): committed to git. */
  outFile: string;
  /** Optional PhilFCT CSV obtained with permission. */
  fnriFile?: string;
  /**
   * FNRI foods go to their own file, which is gitignored: the data is
   * copyrighted and the repository is public.
   */
  fnriOutFile?: string;
  /** Optional Open Food Facts download (npm run fetch:off). */
  offFile?: string;
  /** Open Food Facts foods (ODbL, attributed): committed, in their own file. */
  offOutFile?: string;
  now?: () => Date;
}

export interface BuildReport {
  counts: { usda: number; fnri: number; off: number };
  /** null when no Open Food Facts download was found. */
  off: { skipped: Partial<Record<OffSkip, number>> } | null;
  /** null when no FNRI file was found. */
  fnri: { problems: string[] } | null;
  skipped: { missingMacros: number; duplicateNames: number };
  datasets: DatasetKind[];
  bytes: number;
  gzipBytes: number;
  overBudget: boolean;
}

export async function buildFoodPack(opts: BuildOptions): Promise<BuildReport> {
  const usda: PackedFood[] = [];
  const names = new Set<string>();
  const skipped = { missingMacros: 0, duplicateNames: 0 };
  const datasets: DatasetKind[] = [];

  // Foundation first: its newer analyses win when SR Legacy has the same name.
  for (const kind of DATASETS) {
    const dir = join(opts.usdaDir, kind);
    if (!existsSync(dir)) continue;
    datasets.push(kind);
    for (const food of await readUsdaDataset(dir, kind)) {
      const packed = packUsdaFood(food, aliasesFor(food.description));
      if (packed === 'missing-macros') {
        skipped.missingMacros += 1;
        continue;
      }
      const name = packed[1].toLowerCase();
      if (names.has(name)) {
        skipped.duplicateNames += 1;
        continue;
      }
      names.add(name);
      usda.push(packed);
    }
  }
  if (datasets.length === 0) {
    throw new Error(
      `No USDA data found in ${opts.usdaDir}. Download the Foundation Foods and SR Legacy CSVs: see data/raw/usda/README.md.`,
    );
  }

  const byName = (a: PackedFood, b: PackedFood) => a[1].localeCompare(b[1]);
  const generatedAt = (opts.now?.() ?? new Date()).toISOString();
  const write = async (file: string, pack: FoodPack) => {
    const json = JSON.stringify(pack);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, json);
    return json;
  };

  const usdaJson = await write(opts.outFile, {
    v: FOOD_PACK_VERSION,
    generatedAt,
    sources: { usda: USDA_CREDIT },
    usda: usda.sort(byName),
    fnri: [],
  });

  const fnri = opts.fnriFile ? await readFnriFile(opts.fnriFile) : null;
  let fnriJson = '';
  if (fnri && opts.fnriOutFile) {
    fnriJson = await write(opts.fnriOutFile, {
      v: FOOD_PACK_VERSION,
      generatedAt,
      sources: { fnri: FNRI_CREDIT },
      usda: [],
      fnri: [...fnri.foods].sort(byName),
    });
  } else if (opts.fnriOutFile) {
    await rm(opts.fnriOutFile, { force: true }); // no stale FNRI file after removing the CSV
  }

  const off = opts.offFile && existsSync(opts.offFile) ? await readOffFile(opts.offFile) : null;
  let offJson = '';
  if (off && opts.offOutFile) {
    offJson = await write(opts.offOutFile, {
      v: FOOD_PACK_VERSION,
      generatedAt,
      sources: { off: OFF_CREDIT },
      usda: [],
      fnri: [],
      off: [...off.foods].sort(byName),
    });
  }

  const files = [usdaJson, fnriJson, offJson].filter(Boolean);
  const gzipBytes = files.reduce((sum, f) => sum + gzipSync(f, { level: 9 }).byteLength, 0);
  return {
    counts: { usda: usda.length, fnri: fnri?.foods.length ?? 0, off: off?.foods.length ?? 0 },
    fnri: fnri && { problems: fnri.problems },
    off: off && { skipped: off.skipped },
    skipped,
    datasets,
    bytes: files.reduce((sum, f) => sum + Buffer.byteLength(f), 0),
    gzipBytes,
    overBudget: gzipBytes > GZIP_BUDGET_BYTES,
  };
}

async function readOffFile(file: string) {
  const json = JSON.parse(await readFile(file, 'utf8')) as { products?: unknown };
  if (!Array.isArray(json.products)) throw new Error(`${file} has no "products" list.`);
  return packOffProducts(json.products);
}

export function formatReport(r: BuildReport): string {
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  return [
    `USDA datasets: ${r.datasets.join(', ')}`,
    `Foods: ${r.counts.usda + r.counts.fnri + r.counts.off} (USDA ${r.counts.usda}, FNRI ${r.counts.fnri}, Open Food Facts ${r.counts.off})`,
    `Skipped: ${r.skipped.missingMacros} missing protein/fat/carbs, ${r.skipped.duplicateNames} duplicate names`,
    r.fnri
      ? `FNRI: ${r.counts.fnri} foods${r.fnri.problems.length ? `, ${r.fnri.problems.length} problem(s):\n  ${r.fnri.problems.join('\n  ')}` : ''}`
      : 'FNRI: data/raw/fnri/philfct.csv not found, skipped (see data/raw/fnri/README.md)',
    r.off
      ? `Open Food Facts skipped: ${
          Object.entries(r.off.skipped)
            .map(([why, n]) => `${n} ${why}`)
            .join(', ') || 'none'
        }`
      : 'Open Food Facts: data/raw/off/philippines.json not found, kept the committed foods-ph.json (npm run fetch:off)',
    `Size: ${kb(r.bytes)} raw, ${kb(r.gzipBytes)} gzip${r.overBudget ? '  ⚠ over the 1.5 MB budget' : ''}`,
  ].join('\n');
}
