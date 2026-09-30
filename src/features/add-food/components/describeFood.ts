import { defaultPortionSummary, formatNumber, type Food } from '@/domain';

/** "205 kcal · 1 cup (158 g)": calories for the portion the detail opens with. */
export function describeFood(food: Food): string {
  const { kcal, portion } = defaultPortionSummary(food);
  return `${formatNumber(kcal)} kcal · ${portion}`;
}
