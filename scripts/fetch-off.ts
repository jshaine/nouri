/**
 * Downloads every Philippine product from Open Food Facts (ODbL) into
 * data/raw/off/philippines.json; npm run build:foods then keeps the ones whose
 * nutrition facts are complete and consistent. Run: npm run fetch:off.
 * Uses Open Food Facts' search service (one request per 100 products).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { OFF_FIELDS } from './lib/off.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${root}data/raw/off/philippines.json`;
const SEARCH = 'https://search.openfoodfacts.org/search';
const USER_AGENT = 'Nouri food log build script (https://github.com/jshaine/nouri)';
const PAGE_SIZE = 100;
const PAUSE_MS = 1_500;
const RETRIES = 5;
const RETRY_PAUSE_MS = 30_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson<T>(url: string, what: string): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.ok && res.headers.get('content-type')?.includes('json'))
        return (await res.json()) as T;
      console.warn(`${what}: HTTP ${res.status}, attempt ${attempt}`);
    } catch (error) {
      console.warn(`${what}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (attempt === RETRIES) throw new Error(`Open Food Facts kept failing on ${what}.`);
    await sleep(RETRY_PAUSE_MS * attempt);
  }
}

try {
  const products: unknown[] = [];
  for (let n = 1; ; n += 1) {
    const params = new URLSearchParams({
      q: 'countries_tags:"en:philippines"',
      page_size: String(PAGE_SIZE),
      page: String(n),
      sort_by: 'code',
      fields: OFF_FIELDS.join(','),
    });
    const body = await getJson<{ count: number; hits: unknown[] }>(
      `${SEARCH}?${params}`,
      `page ${n}`,
    );
    products.push(...body.hits);
    console.log(`page ${n}: ${products.length} / ${body.count}`);
    if (body.hits.length === 0 || products.length >= body.count) break;
    await sleep(PAUSE_MS);
  }
  await mkdir(`${root}data/raw/off`, { recursive: true });
  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), products }));
  console.log(`Saved ${products.length} products to data/raw/off/philippines.json`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
