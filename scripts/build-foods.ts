/**
 * Builds public/foods.json from the USDA raw data, plus foods-fnri.json and
 * foods-ph.json (Open Food Facts) when those downloads are present.
 * Run: npm run build:foods. Each data/raw folder has a README for its download.
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
    offFile: `${root}data/raw/off/philippines.json`,
    offOutFile: `${root}public/foods-ph.json`,
  });
  console.log(formatReport(report));
  if (report.overBudget) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
