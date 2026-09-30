import {
  goalFromGrams,
  gramsFromPercents,
  isValidPercents,
  PERCENT_STEP,
  type DailyGoal,
  type MacroPercents,
} from './goals';
import { parseDecimal } from './numbers';

export const MACRO_PRESETS = [
  { id: 'default', label: 'Default', percents: { c: 50, p: 20, f: 30 } },
  { id: 'high-protein', label: 'High protein', percents: { c: 40, p: 30, f: 30 } },
  { id: 'low-carb', label: 'Low carb', percents: { c: 25, p: 35, f: 40 } },
] as const satisfies readonly { id: string; label: string; percents: MacroPercents }[];

export type PresetId = (typeof MACRO_PRESETS)[number]['id'] | 'custom';

export function presetFor(percents: MacroPercents): PresetId {
  const match = MACRO_PRESETS.find(
    (p) =>
      p.percents.c === percents.c && p.percents.p === percents.p && p.percents.f === percents.f,
  );
  return match?.id ?? 'custom';
}

/** Sanity bounds for manually entered goals (not health advice; the calculator applies floors). */
export const GOAL_KCAL_MIN = 500;
export const GOAL_KCAL_MAX = 10000;
const GRAMS_MAX = 1000;

export interface GoalFormInput {
  mode: 'percent' | 'grams';
  kcal: string;
  percents: MacroPercents;
  p: string;
  c: string;
  f: string;
}

export type GoalFormErrors = Partial<Record<'kcal' | 'percents' | 'p' | 'c' | 'f', string>>;

export type GoalDraft = DailyGoal &
  ({ macroMode: 'percent'; percents: MacroPercents } | { macroMode: 'grams' });

export function percentTotal(p: MacroPercents): number {
  return p.c + p.p + p.f;
}

/** Validates the goal form; messages say how to fix the problem. */
export function validateGoalForm(
  input: GoalFormInput,
): { ok: true; value: GoalDraft } | { ok: false; errors: GoalFormErrors } {
  const errors: GoalFormErrors = {};

  if (input.mode === 'percent') {
    const kcal = parseDecimal(input.kcal);
    if (kcal === null) errors.kcal = 'Enter a daily calorie goal, like 1850.';
    else if (kcal < GOAL_KCAL_MIN || kcal > GOAL_KCAL_MAX) {
      errors.kcal = `Enter a goal between ${GOAL_KCAL_MIN} and ${GOAL_KCAL_MAX} kcal.`;
    }
    if (!isValidPercents(input.percents)) {
      const total = percentTotal(input.percents);
      errors.percents =
        total === 100
          ? `Use steps of ${PERCENT_STEP}%.`
          : `Carbs, protein and fat add up to ${total}%. Adjust them to total 100%.`;
    }
    if (kcal === null || errors.kcal || errors.percents) return { ok: false, errors };
    const rounded = Math.round(kcal);
    return {
      ok: true,
      value: {
        ...gramsFromPercents(rounded, input.percents),
        macroMode: 'percent',
        percents: input.percents,
      },
    };
  }

  const grams = (field: 'p' | 'c' | 'f', name: string) => {
    const value = parseDecimal(input[field]);
    if (value === null) errors[field] = `Enter ${name} in grams. Use 0 if you have no target.`;
    else if (value > GRAMS_MAX) errors[field] = `Enter ${name} under ${GRAMS_MAX} g.`;
    return value === null ? 0 : Math.round(value);
  };
  const p = grams('p', 'protein');
  const c = grams('c', 'carbs');
  const f = grams('f', 'fat');
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const goal = goalFromGrams(p, c, f);
  if (goal.kcal < GOAL_KCAL_MIN) {
    return {
      ok: false,
      errors: {
        f: `That's ${goal.kcal} kcal a day. Raise your targets to at least ${GOAL_KCAL_MIN} kcal.`,
      },
    };
  }
  return { ok: true, value: { ...goal, macroMode: 'grams' } };
}

/** Form values for an existing goal (or sensible defaults for a first goal). */
export function goalToForm(goal: GoalDraft | undefined): GoalFormInput {
  if (!goal) {
    return {
      mode: 'percent',
      kcal: '',
      percents: { ...MACRO_PRESETS[0].percents },
      p: '',
      c: '',
      f: '',
    };
  }
  return {
    mode: goal.macroMode,
    kcal: String(goal.kcal),
    percents:
      goal.macroMode === 'percent' ? { ...goal.percents } : { ...MACRO_PRESETS[0].percents },
    p: String(goal.p),
    c: String(goal.c),
    f: String(goal.f),
  };
}
