import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { FOOD_PACK_VERSION, type FoodPack, type PackedFood } from '../../src/domain/index.ts';
import { aliasesFor } from './aliases.ts';
import { packUsdaFood, readUsdaDataset, type DatasetKind } from './usda.ts';

export const USDA_CREDIT = 'USDA FoodData Central (Foundation Foods and SR Legacy), public domain';
/** Target from the spec: keep the download light for phones. */
export const GZIP_BUDGET_BYTES = 1.5 * 1024 * 1024;
const DATASETS: readonly DatasetKind[] = ['foundation', 'sr_legacy'];

export interface BuildOptions {
  usdaDir: string;
  outFile: string;
  now?: () => Date;
  /** Extra sources (FNRI) merged into the pack. */
  extra?: Pick<FoodPack, 'fnri'> & { credit?: string };
}

export interface BuildReport {
  counts: { usda: number; fnri: number };
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
  const fnri = [...(opts.extra?.fnri ?? [])].sort(byName);
  const pack: FoodPack = {
    v: FOOD_PACK_VERSION,
    generatedAt: (opts.now?.() ?? new Date()).toISOString(),
    sources: {
      usda: USDA_CREDIT,
      ...(opts.extra?.credit && fnri.length > 0 ? { fnri: opts.extra.credit } : {}),
    },
    usda: usda.sort(byName),
    fnri,
  };
  const json = JSON.stringify(pack);
  await mkdir(dirname(opts.outFile), { recursive: true });
  await writeFile(opts.outFile, json);
  const gzipBytes = gzipSync(json, { level: 9 }).byteLength;
  return {
    counts: { usda: usda.length, fnri: fnri.length },
    skipped,
    datasets,
    bytes: Buffer.byteLength(json),
    gzipBytes,
    overBudget: gzipBytes > GZIP_BUDGET_BYTES,
  };
}

export function formatReport(r: BuildReport): string {
  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  return [
    `USDA datasets: ${r.datasets.join(', ')}`,
    `Foods: ${r.counts.usda + r.counts.fnri} (USDA ${r.counts.usda}, FNRI ${r.counts.fnri})`,
    `Skipped: ${r.skipped.missingMacros} missing protein/fat/carbs, ${r.skipped.duplicateNames} duplicate names`,
    `Size: ${kb(r.bytes)} raw, ${kb(r.gzipBytes)} gzip${r.overBudget ? '  ⚠ over the 1.5 MB budget' : ''}`,
  ].join('\n');
}
