import type { PackedFood, PackedPortion } from '../../src/domain/index.ts';

/**
 * Philippine products from Open Food Facts (ODbL): nutrition facts typed in
 * from package labels by volunteers. The build keeps only products whose
 * numbers hang together, because a typo on a label page is common.
 */
export const OFF_CREDIT =
  'Open Food Facts (openfoodfacts.org), Philippine products, from package labels; ODbL';

/**
 * Fields the build reads, as the search service returns them. The product API
 * also has serving_size, *_quantity_unit and data_quality_errors_tags; they
 * are used when present (older downloads, tests).
 */
export const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'brands',
  'quantity',
  'categories_tags',
  'nutriments',
] as const;

export type OffSkip =
  | 'no-name'
  | 'missing-macros'
  | 'liquid'
  | 'impossible'
  | 'per-serving'
  | 'energy-mismatch'
  | 'flagged'
  | 'duplicate';

/** Per 100 g, protein + carbs + fat can't pass 100 g (a little slack for label rounding). */
const MAX_MACRO_GRAMS = 102;
/** Pure fat is 900 kcal per 100 g. */
const MAX_KCAL = 902;
/** Labeled kcal must sit near 4P + 4C + 9F: within 20%, or 25 kcal for light foods. */
const ENERGY_TOLERANCE = 0.2;
const ENERGY_SLACK_KCAL = 25;
const KJ_PER_KCAL = 4.184;
const MAX_SERVING_GRAMS = 1000;
/** A whole pack is a useful portion only for single-serve sizes. */
const MAX_PACK_PORTION_GRAMS = 250;

/**
 * The most common label error: the per-serving column typed into the per-100 g
 * box. The numbers still agree with each other, so it's caught by what the food
 * is. Dry foods are never this light, and canned or processed meat and fish
 * never this low in protein. A food left out by mistake is safer than a wrong one.
 */
const DRY_FOOD =
  /cracker|biscuit|cookie|wafer|\bchips?\b|crisps|noodle|pancit canton|cereal|\boats?\b|granola|chocolate|candy|candies|flour|powder|creamer|polvoron|pretzel|popcorn|chicharon|peanuts?\b|nuts\b/i;
const DRY_TAGS = [
  'en:biscuits',
  'en:crackers',
  'en:chips-and-fries',
  'en:instant-noodles',
  'en:breakfast-cereals',
  'en:chocolates',
  'en:candies',
];
const DRY_MIN_KCAL = 250;
const MEAT_FISH =
  /corned|tuna|sardine|luncheon|meat ?loaf|beef loaf|sausage|hot ?dog|cheese ?dog|longganisa|tocino|bacon|\bspam\b|vienna/i;
/** Words that make a meat word a flavor, not the food (chicken-flavored chips). */
const NOT_THE_FOOD = /flavou?r|seasoning|sauce|broth|cube|soup|spread|mix\b/i;
const MEAT_FISH_MIN_PROTEIN = 8;
/** Two products of one brand whose numbers share one ratio: the smaller is a serving. */
const SAME_RATIO_TOLERANCE = 0.1;
const SERVING_RATIO_RANGE = [0.1, 0.9] as const;

function looksPerServing(
  name: string,
  tags: readonly string[],
  kcal: number,
  protein: number,
): boolean {
  const dry = DRY_FOOD.test(name) || tags.some((t) => DRY_TAGS.includes(t));
  if (dry) return kcal < DRY_MIN_KCAL;
  return MEAT_FISH.test(name) && !NOT_THE_FOOD.test(name) && protein < MEAT_FISH_MIN_PROTEIN;
}

/** The net weight on the pack as a portion: "155 g" → ["1 pack", 155]; "10 x 25 g" → ["1 piece", 25]. */
function packPortion(quantity: string): PackedPortion | null {
  const multi = /^\s*\d+\s*[x×]\s*([\d.,]+)\s*g\s*$/i.exec(quantity);
  if (multi?.[1]) {
    const g = Number(multi[1].replace(',', '.'));
    return g > 0 && g <= MAX_SERVING_GRAMS ? ['1 piece', round(g, 1)] : null;
  }
  const single = /^\s*([\d.,]+)\s*(g|grams?|kg)\s*$/i.exec(quantity);
  if (!single?.[1] || !single[2]) return null;
  const g = Number(single[1].replace(',', '.')) * (single[2].toLowerCase() === 'kg' ? 1000 : 1);
  return g > 0 && g <= MAX_PACK_PORTION_GRAMS ? ['1 pack', round(g, 1)] : null;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))
      ? Number(v)
      : null;
const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');
const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;

/** "HIGH FIBER WHEAT BREAD" or "lucky me beef" → title case; mixed case is left alone. */
function tidyCase(text: string): string {
  const letters = text.replace(/[^A-Za-z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '').length;
  const allLower = upper === 0;
  if (letters.length < 4 || (!allLower && upper / letters.length < 0.6)) return text;
  return text.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** The product's display name, with the brand in front unless it's already there. */
function displayName(p: Record<string, unknown>): { name: string; brand: string } {
  // A comma-separated string from the product API, a list from the search service.
  const brands = Array.isArray(p.brands) ? p.brands.map(str).join(',') : str(p.brands);
  const brand = tidyCase(brands.split(',')[0]?.trim() ?? '');
  const product = tidyCase(str(p.product_name_en) || str(p.product_name));
  if (!product) return { name: '', brand };
  if (!brand) return { name: product, brand };
  if (product.toLowerCase() === brand.toLowerCase()) return { name: brand, brand };
  const hasBrand = product.toLowerCase().includes(brand.toLowerCase());
  return { name: hasBrand ? product : `${brand} ${product}`, brand };
}

/**
 * The serving weight in grams: the label's, or recovered from the per-serving
 * values Open Food Facts calculates as per-100 g × serving weight.
 */
function servingGrams(p: Record<string, unknown>, n: Record<string, unknown>): number | null {
  const unit = str(p.serving_quantity_unit).toLowerCase();
  if (unit && unit !== 'g') return null;
  const labeled = num(p.serving_quantity);
  if (labeled !== null) return labeled;
  for (const key of ['energy-kcal', 'proteins', 'carbohydrates', 'fat']) {
    const per100 = num(n[`${key}_100g`]);
    const perServing = num(n[`${key}_serving`]);
    if (per100 && perServing && per100 > 0) return (perServing / per100) * 100;
  }
  return null;
}

/** "2 slices (64 g)" → ["2 slices", 64]; otherwise ["1 serving", grams]. */
function servingPortion(
  p: Record<string, unknown>,
  n: Record<string, unknown>,
): PackedPortion | null {
  const grams = servingGrams(p, n);
  if (grams === null || grams <= 0 || grams > MAX_SERVING_GRAMS) return null;
  const label = /^(.+?)\s*\(\s*[\d.,]+\s*g\s*\)$/i.exec(str(p.serving_size))?.[1];
  const tidy = label && !/^[\d.,]+\s*g$/i.test(label) ? label.toLowerCase() : '1 serving';
  return [tidy, round(grams, 1)];
}

const LIQUID_UNIT = /^(ml|cl|dl|l|liters?|litres?|fl ?oz)$/i;
const QUANTITY_UNIT = /([a-z][a-z ]*)\s*$/i;

/** Drinks are labeled per 100 ml; a drink with no weight on the pack is left out too. */
function isLiquid(p: Record<string, unknown>): boolean {
  const units = [p.product_quantity_unit, p.serving_quantity_unit].map((u) => str(u));
  const packUnit = QUANTITY_UNIT.exec(str(p.quantity))?.[1]?.trim() ?? '';
  if ([...units, packUnit].some((u) => LIQUID_UNIT.test(u))) return true;
  const drink = Array.isArray(p.categories_tags) && p.categories_tags.includes('en:beverages');
  return drink && !/^(g|kg|grams?)$/i.test(packUnit);
}

/** One product as a bundled food, or why it was left out. */
export function packOffProduct(raw: unknown): PackedFood | OffSkip {
  if (typeof raw !== 'object' || raw === null) return 'no-name';
  const p = raw as Record<string, unknown>;
  const code = str(p.code);
  const { name, brand } = displayName(p);
  if (!code || !name) return 'no-name';
  if (isLiquid(p)) return 'liquid';
  const n: Record<string, unknown> =
    typeof p.nutriments === 'object' && p.nutriments !== null
      ? (p.nutriments as Record<string, unknown>)
      : {};
  const get = (key: string) => num(n[`${key}_100g`]);
  const [prot, carbs, fat] = [get('proteins'), get('carbohydrates'), get('fat')];
  const kj = get('energy-kj') ?? get('energy');
  const kcal = get('energy-kcal') ?? (kj === null ? null : kj / KJ_PER_KCAL);
  if (prot === null || carbs === null || fat === null || kcal === null) return 'missing-macros';
  if ([prot, carbs, fat, kcal].some((v) => v < 0)) return 'impossible';
  if (prot + carbs + fat > MAX_MACRO_GRAMS || kcal > MAX_KCAL) return 'impossible';
  const expected = 4 * prot + 4 * carbs + 9 * fat;
  if (Math.abs(kcal - expected) > Math.max(ENERGY_SLACK_KCAL, expected * ENERGY_TOLERANCE))
    return 'energy-mismatch';
  if (Array.isArray(p.data_quality_errors_tags) && p.data_quality_errors_tags.length > 0)
    return 'flagged';
  const tags = Array.isArray(p.categories_tags) ? p.categories_tags.map(str) : [];
  if (looksPerServing(name, tags, kcal, prot)) return 'per-serving';
  const fiber = get('fiber');
  const portions = [servingPortion(p, n), packPortion(str(p.quantity))].filter(
    (x, i, all): x is PackedPortion => x !== null && all.findIndex((y) => y?.[1] === x[1]) === i,
  );
  return [
    code,
    name,
    round(kcal, 0),
    round(prot, 1),
    round(carbs, 1),
    round(fat, 1),
    fiber === null || fiber < 0 ? null : round(fiber, 1),
    portions,
    brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? [brand] : [],
  ];
}

/** All usable products, one per barcode and per name (the first with a serving wins). */
export function packOffProducts(raw: readonly unknown[]): {
  foods: PackedFood[];
  skipped: Partial<Record<OffSkip, number>>;
} {
  const skipped: Partial<Record<OffSkip, number>> = {};
  const byName = new Map<string, PackedFood>();
  const codes = new Set<string>();
  for (const product of raw) {
    const packed = packOffProduct(product);
    if (typeof packed === 'string') {
      skipped[packed] = (skipped[packed] ?? 0) + 1;
      continue;
    }
    const key = packed[1].toLowerCase();
    const earlier = byName.get(key);
    if (codes.has(packed[0]) || (earlier && (earlier[7].length > 0 || packed[7].length === 0))) {
      skipped.duplicate = (skipped.duplicate ?? 0) + 1;
      continue;
    }
    if (earlier) skipped.duplicate = (skipped.duplicate ?? 0) + 1;
    codes.add(packed[0]);
    byName.set(key, packed);
  }
  const foods = dropServingCopies([...byName.values()]);
  if (foods.length < byName.size)
    skipped['per-serving'] = (skipped['per-serving'] ?? 0) + byName.size - foods.length;
  return { foods, skipped };
}

/** Within a brand, drops a product whose numbers are all one fraction of another's. */
function dropServingCopies(foods: PackedFood[]): PackedFood[] {
  const brandOf = (f: PackedFood) => (f[8][0] ?? f[1].split(' ')[0] ?? '').toLowerCase();
  const byBrand = new Map<string, PackedFood[]>();
  for (const f of foods) byBrand.set(brandOf(f), [...(byBrand.get(brandOf(f)) ?? []), f]);
  const copies = new Set<PackedFood>();
  for (const group of byBrand.values()) {
    for (const small of group) {
      const big = group.find((other) => other !== small && isServingOf(small, other));
      if (big) copies.add(small);
    }
  }
  return foods.filter((f) => !copies.has(f));
}

function isServingOf(small: PackedFood, big: PackedFood): boolean {
  if (big[2] <= 0) return false;
  const ratio = small[2] / big[2];
  const [min, max] = SERVING_RATIO_RANGE;
  if (ratio < min || ratio > max) return false;
  // Protein, carbs and fat shrink by the same ratio (within 10%, or 0.6 g for label rounding).
  return ([3, 4, 5] as const).every(
    (i) =>
      Math.abs(small[i] - big[i] * ratio) <= Math.max(0.6, big[i] * ratio * SAME_RATIO_TOLERANCE),
  );
}
