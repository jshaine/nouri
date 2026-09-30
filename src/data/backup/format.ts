import { isLocalDate, isMeal } from '@/domain';
import type {
  CustomFoodRow,
  EntryRow,
  ExerciseRow,
  GoalRow,
  PortionOverrideRow,
  ProfileRow,
  UsageRow,
  WeightRow,
} from '../rows';

/** Bump when the backup file's own layout changes (not the database schema). */
export const BACKUP_FORMAT = 1;
export const BACKUP_APP = 'nouri';

export interface BackupTables {
  customFoods: CustomFoodRow[];
  portionOverrides: PortionOverrideRow[];
  entries: EntryRow[];
  goals: GoalRow[];
  profile: ProfileRow[];
  weights: WeightRow[];
  exercise: ExerciseRow[];
  recents: UsageRow[];
  favorites: UsageRow[];
  /** Only portable settings (theme, onboarding); not backup or storage state. */
  meta: { key: string; value: unknown }[];
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  tables: BackupTables;
}

export const TABLE_NAMES = [
  'customFoods',
  'portionOverrides',
  'entries',
  'goals',
  'profile',
  'weights',
  'exercise',
  'recents',
  'favorites',
  'meta',
] as const satisfies readonly (keyof BackupTables)[];

export const PORTABLE_META_KEYS = ['theme', 'onboardingDone'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === 'string' && v.length > 0;
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const nonNeg = (v: unknown) => num(v) && (v as number) >= 0;
const key = (v: unknown) => typeof v === 'string' && /^(usda|fnri|custom):.+/.test(v);
const portions = (v: unknown) =>
  Array.isArray(v) &&
  v.every((p) => isObj(p) && str(p.label) && (nonNeg(p.grams) || nonNeg(p.servings)));
const unit = (v: unknown) =>
  isObj(v) && (v.kind === 'grams' || v.kind === 'ounces' || (v.kind === 'portion' && str(v.label)));

/** One check per table: enough to never store a row the app can't read. */
export const ROW_CHECKS: Record<keyof BackupTables, (r: Obj) => boolean> = {
  customFoods: (r) =>
    str(r.id) &&
    str(r.name) &&
    Array.isArray(r.aliases) &&
    (r.basis === '100g' || r.basis === 'serving') &&
    nonNeg(r.p) &&
    nonNeg(r.c) &&
    nonNeg(r.f) &&
    portions(r.portions),
  portionOverrides: (r) => key(r.foodKey) && portions(r.portions),
  entries: (r) =>
    str(r.id) &&
    isLocalDate(r.date) &&
    isMeal(r.meal) &&
    key(r.foodKey) &&
    nonNeg(r.amount) &&
    unit(r.unit) &&
    str(r.name) &&
    [r.kcal, r.p, r.c, r.f].every(nonNeg) &&
    num(r.createdAt),
  goals: (r) => str(r.id) && isLocalDate(r.effectiveFrom) && [r.kcal, r.p, r.c, r.f].every(nonNeg),
  profile: (r) => r.id === 'me',
  weights: (r) => str(r.id) && isLocalDate(r.date) && nonNeg(r.kg),
  exercise: (r) => str(r.id) && isLocalDate(r.date) && nonNeg(r.kcal),
  recents: (r) => key(r.foodKey) && num(r.lastUsed),
  favorites: (r) => key(r.foodKey) && num(r.lastUsed),
  meta: (r) => typeof r.key === 'string' && PORTABLE_META_KEYS.includes(r.key),
};
