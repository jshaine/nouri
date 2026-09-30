import { compareDates, type LocalDate } from './dates';
import { KCAL_PER_GRAM, kcalFromMacros } from './nutrition';

export interface MacroPercents {
  c: number;
  p: number;
  f: number;
}

export interface DailyGoal {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

/**
 * A goal that applies from `effectiveFrom` until a newer record replaces it,
 * so changing goals never rewrites past days.
 */
export type GoalRecord = DailyGoal & {
  id: string;
  effectiveFrom: LocalDate;
} & ({ macroMode: 'percent'; percents: MacroPercents } | { macroMode: 'grams' });

/** Macro percents move in 5% steps and always total 100. */
export const PERCENT_STEP = 5;

/** The goal for a day: the latest record with effectiveFrom <= day. */
export function goalForDate<G extends Pick<GoalRecord, 'effectiveFrom'>>(
  records: readonly G[],
  day: LocalDate,
): G | undefined {
  let best: G | undefined;
  for (const r of records) {
    if (compareDates(r.effectiveFrom, day) > 0) continue;
    if (!best || compareDates(r.effectiveFrom, best.effectiveFrom) >= 0) best = r;
  }
  return best;
}

export function isValidPercents(p: MacroPercents): boolean {
  const parts = [p.c, p.p, p.f];
  return (
    parts.every((v) => Number.isInteger(v) && v >= 0 && v % PERCENT_STEP === 0) &&
    parts.reduce((a, b) => a + b, 0) === 100
  );
}

/** Grams = kcal × % ÷ 4 (carbs, protein) or ÷ 9 (fat), rounded to whole grams. */
export function gramsFromPercents(kcal: number, percents: MacroPercents): DailyGoal {
  if (!isValidPercents(percents)) {
    throw new RangeError('Macro percents must be 5% steps that total 100%.');
  }
  return {
    kcal,
    c: Math.round((kcal * percents.c) / 100 / KCAL_PER_GRAM.carbs),
    p: Math.round((kcal * percents.p) / 100 / KCAL_PER_GRAM.protein),
    f: Math.round((kcal * percents.f) / 100 / KCAL_PER_GRAM.fat),
  };
}

/** Direct gram targets: calories follow as 4P + 4C + 9F. */
export function goalFromGrams(p: number, c: number, f: number): DailyGoal {
  return { kcal: Math.round(kcalFromMacros(p, c, f)), p, c, f };
}

/** Scales a goal to a different calorie budget keeping its macro proportions. */
export function scaleGoal(goal: DailyGoal, kcal: number): DailyGoal {
  if (!(goal.kcal > 0)) return { ...goal, kcal };
  const k = kcal / goal.kcal;
  return { kcal, p: Math.round(goal.p * k), c: Math.round(goal.c * k), f: Math.round(goal.f * k) };
}
