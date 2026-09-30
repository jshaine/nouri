import { gramsFromPercents, type DailyGoal, type MacroPercents } from './goals';

export type Sex = 'male' | 'female';

/** Activity describes daily life, not workouts. */
export const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Not very active',
    description: 'Mostly sitting: desk job, student',
    factor: 1.2,
  },
  {
    id: 'light',
    label: 'Lightly active',
    description: 'On your feet a good part of the day: teacher, retail',
    factor: 1.375,
  },
  {
    id: 'active',
    label: 'Active',
    description: 'Physical activity much of the day: food server, nurse',
    factor: 1.55,
  },
  {
    id: 'very-active',
    label: 'Very active',
    description: 'Heavy physical work: construction, delivery',
    factor: 1.725,
  },
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]['id'];

/** kg per week; negative loses, positive gains. */
export const WEEKLY_GOALS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5] as const;
export type WeeklyGoal = (typeof WEEKLY_GOALS)[number];

export const KCAL_PER_KG_PER_WEEK = 1100;
export const MIN_BMI = 18.5;
export const ADULT_AGE = 18;
export const CALORIE_FLOOR: Readonly<Record<Sex, number>> = { female: 1200, male: 1500 };
export const FLOOR_MESSAGE =
  'Set to the minimum recommended intake. Weight loss will be slower than the selected pace.';
const ROUND_TO = 10;

/** Mifflin-St Jeor basal metabolic rate. */
export function bmr(sex: Sex, kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function activityFactor(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((a) => a.id === level)?.factor ?? 1.2;
}

/** The lowest goal weight at BMI 18.5 for a height, rounded up to 0.1 kg. */
export function minimumGoalWeightKg(heightCm: number): number {
  const m = heightCm / 100;
  return Math.ceil(MIN_BMI * m * m * 10) / 10;
}

/** "Lose" options only when the goal is lower, "gain" only when higher; maintain always. */
export function weeklyGoalOptions(currentKg: number, goalKg: number): WeeklyGoal[] {
  return WEEKLY_GOALS.filter((g) => g === 0 || (g < 0 ? goalKg < currentKg : goalKg > currentKg));
}

export interface CalculatorInput {
  sex: Sex;
  age: number;
  heightCm: number;
  currentKg: number;
  goalKg: number;
  activity: ActivityLevel;
  weeklyGoalKg: WeeklyGoal;
  percents: MacroPercents;
}

export interface CalculatorResult {
  bmr: number;
  maintenance: number;
  /** Daily kcal added (gain) or removed (loss, negative). */
  adjustment: number;
  goal: DailyGoal;
  /** True when the goal was raised to the minimum recommended intake. */
  floored: boolean;
}

export type CalculatorProblem =
  { kind: 'minor' } | { kind: 'goal-below-healthy'; minimumKg: number } | { kind: 'pace-mismatch' };

export const MINOR_MESSAGE =
  'This calculator is for adults. You can still set goals yourself in Settings.';

/** The full goal calculation. Returns a problem instead of unsafe numbers. */
export function calculateGoals(
  input: CalculatorInput,
): { ok: true; result: CalculatorResult } | { ok: false; problem: CalculatorProblem } {
  if (input.age < ADULT_AGE) return { ok: false, problem: { kind: 'minor' } };
  const minimumKg = minimumGoalWeightKg(input.heightCm);
  if (input.goalKg < minimumKg)
    return { ok: false, problem: { kind: 'goal-below-healthy', minimumKg } };
  if (!weeklyGoalOptions(input.currentKg, input.goalKg).includes(input.weeklyGoalKg)) {
    return { ok: false, problem: { kind: 'pace-mismatch' } };
  }

  const base = bmr(input.sex, input.currentKg, input.heightCm, input.age);
  const maintenance = base * activityFactor(input.activity);
  const adjustment = input.weeklyGoalKg * KCAL_PER_KG_PER_WEEK;
  const floor = CALORIE_FLOOR[input.sex];
  const target = maintenance + adjustment;
  const floored = target < floor;
  const kcal = floored ? floor : Math.round(target / ROUND_TO) * ROUND_TO;
  return {
    ok: true,
    result: {
      bmr: Math.round(base),
      maintenance: Math.round(maintenance),
      adjustment: Math.round(adjustment),
      goal: gramsFromPercents(kcal, input.percents),
      floored,
    },
  };
}

/**
 * Rounds any three shares to 5% steps that total exactly 100 (largest
 * remainder), e.g. for a custom split typed as 33/33/34.
 */
export function roundPercents(p: MacroPercents): MacroPercents {
  const keys = ['c', 'p', 'f'] as const;
  const total = keys.reduce((s, k) => s + Math.max(0, p[k]), 0);
  if (total === 0) return { c: 50, p: 20, f: 30 };
  const steps = keys.map((k) => ({ k, exact: (Math.max(0, p[k]) / total) * 20 }));
  const out = Object.fromEntries(steps.map(({ k, exact }) => [k, Math.floor(exact)])) as Record<
    'c' | 'p' | 'f',
    number
  >;
  let left = 20 - keys.reduce((s, k) => s + out[k], 0);
  for (const { k } of [...steps].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break;
    out[k] += 1;
    left -= 1;
  }
  return { c: out.c * 5, p: out.p * 5, f: out.f * 5 };
}
