import type {
  EntryUnit,
  FoodKey,
  FoodSource,
  LocalDate,
  MacroPercents,
  MacroTotals,
  Meal,
  Portion,
} from '@/domain';

/*
 * IndexedDB row shapes. Rows are plain JSON so a backup can round-trip them.
 * Repositories convert rows to domain types; nothing else reads rows.
 */

export interface CustomFoodRow {
  id: string;
  name: string;
  aliases: string[];
  source: 'custom';
  basis: '100g' | 'serving';
  /** Only for basis "serving", and only when the weight is known. */
  servingGrams?: number;
  kcal?: number;
  p: number;
  c: number;
  f: number;
  fiber?: number;
  portions: Portion[];
  createdAt: number;
  updatedAt: number;
}

export interface PortionOverrideRow {
  foodKey: FoodKey;
  portions: Portion[];
}

export interface EntryRow {
  id: string;
  date: LocalDate;
  meal: Meal;
  foodKey: FoodKey;
  amount: number;
  unit: EntryUnit;
  /** Snapshot at log time. */
  name: string;
  source: FoodSource;
  kcal: number;
  p: number;
  c: number;
  f: number;
  createdAt: number;
}

export interface GoalRow extends Pick<MacroTotals, 'kcal' | 'p' | 'c' | 'f'> {
  id: string;
  effectiveFrom: LocalDate;
  macroMode: 'percent' | 'grams';
  percents?: MacroPercents;
}

export interface ProfileRow {
  id: 'me';
  sex?: 'male' | 'female';
  birthDate?: LocalDate;
  heightCm?: number;
  goalWeightKg?: number;
  activityLevel?: 'sedentary' | 'light' | 'active' | 'very-active';
  weeklyGoalKg?: number;
  units: 'metric' | 'imperial';
  exerciseCaloriesEnabled: boolean;
}

export interface WeightRow {
  id: string;
  date: LocalDate;
  kg: number;
}

export interface ExerciseRow {
  id: string;
  date: LocalDate;
  kcal: number;
}

export interface UsageRow {
  foodKey: FoodKey;
  lastUsed: number;
  useCount: number;
}

/** Key-value app state: schemaVersion, lastBackupAt, persistGranted, theme, ... */
export interface MetaRow {
  key: string;
  value: unknown;
}
