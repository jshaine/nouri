import {
  ACTIVITY_LEVELS,
  CALORIE_FLOOR,
  KCAL_PER_KG_PER_WEEK,
  type CalculatorInput,
  type CalculatorResult,
} from './calculator';

export const ESTIMATE_NOTE = 'Estimates based on standard formulas; individual needs vary.';

const n = (v: number) => Math.round(v).toLocaleString('en-US');
const d = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-US');

/** "How this is calculated": each step with the user's own numbers. */
export function explainCalculation(input: CalculatorInput, result: CalculatorResult): string[] {
  const activity = ACTIVITY_LEVELS.find((a) => a.id === input.activity);
  const sexTerm = input.sex === 'male' ? '+ 5' : '− 161';
  const pace = input.weeklyGoalKg;
  const steps = [
    `BMR (Mifflin-St Jeor): 10 × ${d(input.currentKg)} kg + 6.25 × ${d(input.heightCm)} cm − 5 × ${input.age} ${sexTerm} = ${n(result.bmr)} kcal.`,
    `Maintenance: ${n(result.bmr)} × ${activity?.factor ?? 1.2} (${activity?.label ?? 'Not very active'}) = ${n(result.maintenance)} kcal.`,
    pace === 0
      ? 'Weekly goal: maintain, so no adjustment.'
      : `Weekly goal: ${pace < 0 ? 'lose' : 'gain'} ${Math.abs(pace)} kg × ${n(KCAL_PER_KG_PER_WEEK)} = ${pace < 0 ? '−' : '+'}${n(Math.abs(result.adjustment))} kcal a day.`,
    result.floored
      ? `That’s below the minimum recommended ${n(CALORIE_FLOOR[input.sex])} kcal, so the goal is set to ${n(result.goal.kcal)} kcal.`
      : `Rounded to the nearest 10: ${n(result.goal.kcal)} kcal a day.`,
    `Macros: ${input.percents.c}% carbs = ${result.goal.c} g, ${input.percents.p}% protein = ${result.goal.p} g (4 kcal per gram), ${input.percents.f}% fat = ${result.goal.f} g (9 kcal per gram).`,
  ];
  return steps;
}
