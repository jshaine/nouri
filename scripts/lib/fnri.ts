/**
 * FNRI Philippine Food Composition Tables (PhilFCT) importer. The data is
 * copyrighted and has no public bulk download, so this only reads a CSV you
 * obtained with permission (schema: data/raw/fnri/README.md). Never scrape.
 */
import { existsSync } from 'node:fs';
import { kcalFromMacros, type PackedFood, type PackedPortion } from '../../src/domain/index.ts';
import { readCsvFile, type Row } from './csv.ts';

export const FNRI_CREDIT =
  'FNRI Philippine Food Composition Tables (PhilFCT), used with permission';
export const REQUIRED_COLUMNS = ['name', 'kcal', 'protein_g', 'fat_g', 'carbs_g'] as const;
const DEFAULT_BASIS_G = 100;

export interface FnriResult {
  foods: PackedFood[];
  /** Human-readable problems with line numbers; those rows are skipped. */
  problems: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Stable id from the name, so recents and portion overrides survive rebuilds. */
export function slugId(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseNumber(text: string | undefined): number | undefined | null {
  const t = (text ?? '').trim();
  if (t === '') return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Validates rows and converts them to per-100 g packed foods. */
export function packFnriRows(rows: readonly Row[], header: readonly string[]): FnriResult {
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      foods: [],
      problems: [`Missing required column(s): ${missing.join(', ')}. See data/raw/fnri/README.md.`],
    };
  }
  const problems: string[] = [];
  const byId = new Map<string, PackedFood>();

  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const name = (row.name ?? '').trim().replace(/\s+/g, ' ');
    if (!name) {
      problems.push(`Line ${line}: missing name.`);
      return;
    }
    const values = {
      kcal: parseNumber(row.kcal),
      p: parseNumber(row.protein_g),
      f: parseNumber(row.fat_g),
      c: parseNumber(row.carbs_g),
      fiber: parseNumber(row.fiber_g),
      basis: parseNumber(row.basis_g),
      portionG: parseNumber(row.portion_g),
    };
    const bad = Object.entries(values)
      .filter(([, v]) => v === null)
      .map(([key]) => key);
    if (bad.length > 0) {
      problems.push(`Line ${line} (${name}): not a number: ${bad.join(', ')}.`);
      return;
    }
    // No nulls are left after the check above.
    const num = (v: number | null | undefined) => (v === null ? undefined : v);
    const [p, c, f, kcal, fiber, basisG, portionG] = [
      num(values.p),
      num(values.c),
      num(values.f),
      num(values.kcal),
      num(values.fiber),
      num(values.basis),
      num(values.portionG),
    ];
    if (p === undefined || c === undefined || f === undefined) {
      problems.push(`Line ${line} (${name}): protein_g, fat_g and carbs_g are required.`);
      return;
    }
    const basis = basisG ?? DEFAULT_BASIS_G;
    if (!(basis > 0)) {
      problems.push(`Line ${line} (${name}): basis_g must be more than 0.`);
      return;
    }
    const k = DEFAULT_BASIS_G / basis; // normalize to per 100 g
    const portionLabel = (row.portion_label ?? '').trim();
    const portion: PackedPortion | undefined =
      portionLabel && portionG ? [portionLabel, round1(portionG)] : undefined;
    if (portionLabel && !portionG) {
      problems.push(
        `Line ${line} (${name}): portion "${portionLabel}" has no portion_g; portion skipped.`,
      );
    }

    const id = slugId(name);
    const existing = byId.get(id);
    if (existing) {
      // The same food on several rows adds portions (e.g. "1 cup", "1 bowl").
      if (portion && !existing[7].some(([l]) => l.toLowerCase() === portion[0].toLowerCase()))
        existing[7].push(portion);
      return;
    }
    const aliases = (row.name_alt ?? '')
      .split(/[;|]/)
      .map((a) => a.trim())
      .filter((a) => a && a.toLowerCase() !== name.toLowerCase());
    byId.set(id, [
      id,
      name,
      Math.round((kcal ?? kcalFromMacros(p, c, f)) * k),
      round1(p * k),
      round1(c * k),
      round1(f * k),
      fiber === undefined ? null : round1(fiber * k),
      portion ? [portion] : [],
      [...new Set(aliases)],
    ]);
  });
  return { foods: [...byId.values()], problems };
}

/** Reads data/raw/fnri/philfct.csv, or returns null when it isn't there. */
export async function readFnriFile(path: string): Promise<FnriResult | null> {
  if (!existsSync(path)) return null;
  const rows: Row[] = [];
  const header = await readCsvFile(path, (row) => rows.push(row));
  return packFnriRows(rows, header);
}
