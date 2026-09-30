import { calculateGoals, type CalculatorInput } from './calculator';
import { explainCalculation } from './calcExplanation';

const input: CalculatorInput = {
  sex: 'female',
  age: 30,
  heightCm: 160,
  currentKg: 65,
  goalKg: 58,
  activity: 'light',
  weeklyGoalKg: -0.5,
  percents: { c: 50, p: 20, f: 30 },
};

function explain(i: CalculatorInput) {
  const r = calculateGoals(i);
  if (!r.ok) throw new Error('bad input');
  return explainCalculation(i, r.result);
}

describe('explainCalculation', () => {
  it('shows each step with the user’s numbers', () => {
    expect(explain(input)).toEqual([
      'BMR (Mifflin-St Jeor): 10 × 65 kg + 6.25 × 160 cm − 5 × 30 − 161 = 1,339 kcal.',
      'Maintenance: 1,339 × 1.375 (Lightly active) = 1,841 kcal.',
      'Weekly goal: lose 0.5 kg × 1,100 = −550 kcal a day.',
      'Rounded to the nearest 10: 1,290 kcal a day.',
      'Macros: 50% carbs = 161 g, 20% protein = 65 g (4 kcal per gram), 30% fat = 43 g (9 kcal per gram).',
    ]);
  });

  it('covers maintaining, gaining, men and the floor', () => {
    expect(explain({ ...input, goalKg: 65, weeklyGoalKg: 0 })[2]).toBe(
      'Weekly goal: maintain, so no adjustment.',
    );
    expect(explain({ ...input, goalKg: 70, weeklyGoalKg: 0.25 })[2]).toBe(
      'Weekly goal: gain 0.25 kg × 1,100 = +275 kcal a day.',
    );
    expect(explain({ ...input, sex: 'male' })[0]).toMatch(/− 5 × 30 \+ 5 = /);
    const floored = explain({
      ...input,
      age: 50,
      heightCm: 150,
      currentKg: 50,
      goalKg: 45,
      activity: 'sedentary',
      weeklyGoalKg: -1,
    });
    expect(floored[3]).toBe(
      'That’s below the minimum recommended 1,200 kcal, so the goal is set to 1,200 kcal.',
    );
  });
});
