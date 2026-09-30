export const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_NAME: Readonly<Record<Meal, string>> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export function isMeal(value: unknown): value is Meal {
  return typeof value === 'string' && (MEALS as readonly string[]).includes(value);
}

/** Minutes after midnight when each meal window opens. */
const MEAL_WINDOWS: readonly (readonly [number, Meal])[] = [
  [4 * 60, 'breakfast'], // 04:00
  [10 * 60 + 30, 'lunch'], // 10:30
  [14 * 60 + 30, 'snacks'], // 14:30 merienda
  [17 * 60 + 30, 'dinner'], // 17:30
  [21 * 60 + 30, 'snacks'], // 21:30 late snack
];

/** The meal a new entry defaults to at this local time. */
export function mealForTime(instant: Date): Meal {
  const minutes = instant.getHours() * 60 + instant.getMinutes();
  let meal: Meal = 'snacks'; // before 04:00
  for (const [start, m] of MEAL_WINDOWS) if (minutes >= start) meal = m;
  return meal;
}
