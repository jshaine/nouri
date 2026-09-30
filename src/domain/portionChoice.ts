import {
  availablePortions,
  GRAMS_PER_OUNCE,
  supportsGrams,
  unitShortLabel,
  type EntryUnit,
  type Food,
  type Portion,
} from './food';
import { nutrientsFor } from './nutrition';

/** One choice in the portion picker. `id` is stable for form controls. */
export interface UnitOption {
  id: string;
  unit: EntryUnit;
  label: string;
}

export const GRAMS_OPTION_ID = 'g';
export const OUNCES_OPTION_ID = 'oz';
const PORTION_PREFIX = 'portion:';

/** Default amount when grams are picked: one basis serving if weighed, else 100 g. */
export const DEFAULT_GRAMS = 100;
/** About 100 g. */
export const DEFAULT_OUNCES = 3.5;
/** Quantity steps for the stepper. */
export const GRAM_STEP = 10;
export const OUNCE_STEP = 0.5;
export const PORTION_STEP = 0.5;

function portionLabel(p: Portion): string {
  return 'grams' in p ? `${p.label} (${Math.round(p.grams)} g)` : p.label;
}

/** Portions first (they're how people eat), then grams when the weight is known. */
export function unitOptions(food: Food, overrides: readonly Portion[] = []): UnitOption[] {
  const options: UnitOption[] = availablePortions(food, overrides).map((p) => ({
    id: PORTION_PREFIX + p.label,
    unit: { kind: 'portion', label: p.label },
    label: portionLabel(p),
  }));
  if (supportsGrams(food)) {
    options.push({ id: GRAMS_OPTION_ID, unit: { kind: 'grams' }, label: 'grams' });
    options.push({ id: OUNCES_OPTION_ID, unit: { kind: 'ounces' }, label: 'ounces' });
  }
  return options;
}

export function optionForUnit(
  options: readonly UnitOption[],
  unit: EntryUnit,
): UnitOption | undefined {
  return options.find((o) =>
    unit.kind === 'portion'
      ? o.unit.kind === 'portion' && o.unit.label === unit.label
      : o.unit.kind === unit.kind,
  );
}

/** The starting unit and amount for logging a food. */
export function defaultChoice(
  food: Food,
  overrides: readonly Portion[] = [],
): { unit: EntryUnit; amount: number } {
  const [first] = unitOptions(food, overrides);
  if (!first) throw new Error(`"${food.name}" has no way to be measured.`);
  return { unit: first.unit, amount: defaultAmount(food, first.unit) };
}

export function defaultAmount(food: Food, unit: EntryUnit): number {
  if (unit.kind === 'portion') return 1;
  const serving = food.basis.kind === 'serving' ? food.basis.servingGrams : undefined;
  if (unit.kind === 'ounces') {
    return serving === undefined ? DEFAULT_OUNCES : Math.round((serving / GRAMS_PER_OUNCE) * 2) / 2;
  }
  return serving ?? DEFAULT_GRAMS;
}

export function stepFor(unit: EntryUnit): number {
  return unit.kind === 'grams' ? GRAM_STEP : unit.kind === 'ounces' ? OUNCE_STEP : PORTION_STEP;
}

/** What a search result shows: calories for the default portion, e.g. "205 kcal · 1 cup (158 g)". */
export function defaultPortionSummary(
  food: Food,
  overrides: readonly Portion[] = [],
): { kcal: number; portion: string } {
  const { unit, amount } = defaultChoice(food, overrides);
  const option = optionForUnit(unitOptions(food, overrides), unit);
  const portions = availablePortions(food, overrides);
  const kcal = Math.round(nutrientsFor(food, portions, amount, unit).kcal);
  const portion =
    unit.kind === 'portion' ? (option?.label ?? unit.label) : `${amount} ${unitShortLabel(unit)}`;
  return { kcal, portion };
}
