/**
 * Builds public/foods.json from the USDA (and, if present, FNRI) raw data.
 * Run: npm run build:foods. See data/raw/usda/README.md for the downloads.
 */
import { fileURLToPath } from 'node:url';
import { buildFoodPack, formatReport } from './lib/build.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

try {
  const report = await buildFoodPack({
    usdaDir: `${root}data/raw/usda`,
    outFile: `${root}public/foods.json`,
    fnriFile: `${root}data/raw/fnri/philfct.csv`,
    fnriOutFile: `${root}public/foods-fnri.json`,
  });
  console.log(formatReport(report));
  if (report.overBudget) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
