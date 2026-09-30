import type { ActivityLevel, CalculatorInput, Sex, WeeklyGoal } from './calculator';
import { WEEKLY_GOALS } from './calculator';
import { ageOn, type LocalDate } from './dates';
import type { MacroPercents } from './goals';
import type { UnitSystem } from './units';

export interface Profile {
  sex?: Sex;
  birthDate?: LocalDate;
  heightCm?: number;
  goalWeightKg?: number;
  activity?: ActivityLevel;
  weeklyGoalKg?: WeeklyGoal;
  units: UnitSystem;
  exerciseCaloriesEnabled: boolean;
}

export const DEFAULT_PROFILE: Profile = { units: 'metric', exerciseCaloriesEnabled: false };

export interface WeightEntry {
  id: string;
  date: LocalDate;
  kg: number;
}

export type MissingField =
  'sex' | 'birthDate' | 'heightCm' | 'goalWeightKg' | 'activity' | 'weeklyGoalKg' | 'weight';

export const MISSING_LABEL: Readonly<Record<MissingField, string>> = {
  sex: 'sex',
  birthDate: 'birth date',
  heightCm: 'height',
  goalWeightKg: 'goal weight',
  activity: 'activity level',
  weeklyGoalKg: 'weekly goal',
  weight: 'current weight (log it below)',
};

export function isWeeklyGoal(value: unknown): value is WeeklyGoal {
  return typeof value === 'number' && (WEEKLY_GOALS as readonly number[]).includes(value);
}

/** The calculator's input from the profile and latest weight, or what's still missing. */
export function calculatorInputFrom(
  profile: Profile,
  currentKg: number | undefined,
  today: LocalDate,
  percents: MacroPercents,
): { ok: true; input: CalculatorInput } | { ok: false; missing: MissingField[] } {
  const { sex, birthDate, heightCm, goalWeightKg, activity, weeklyGoalKg } = profile;
  const missing: MissingField[] = [];
  if (!sex) missing.push('sex');
  if (!birthDate) missing.push('birthDate');
  if (heightCm === undefined) missing.push('heightCm');
  if (goalWeightKg === undefined) missing.push('goalWeightKg');
  if (!activity) missing.push('activity');
  if (weeklyGoalKg === undefined) missing.push('weeklyGoalKg');
  if (currentKg === undefined) missing.push('weight');
  if (
    !sex ||
    !birthDate ||
    heightCm === undefined ||
    goalWeightKg === undefined ||
    !activity ||
    weeklyGoalKg === undefined ||
    currentKg === undefined
  ) {
    return { ok: false, missing };
  }
  return {
    ok: true,
    input: {
      sex,
      age: ageOn(birthDate, today),
      heightCm,
      currentKg,
      goalKg: goalWeightKg,
      activity,
      weeklyGoalKg,
      percents,
    },
  };
}

/** The most recent weight on or before a day. */
export function latestWeight(
  weights: readonly WeightEntry[],
  onOrBefore?: LocalDate,
): WeightEntry | undefined {
  let best: WeightEntry | undefined;
  for (const w of weights) {
    if (onOrBefore && w.date > onOrBefore) continue;
    if (!best || w.date >= best.date) best = w;
  }
  return best;
}
