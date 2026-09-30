import { availablePortions, supportsGrams, type EntryUnit, type Food, type Portion } from './food';

/** One choice in the portion picker. `id` is stable for form controls. */
export interface UnitOption {
  id: string;
  unit: EntryUnit;
  label: string;
}

export const GRAMS_OPTION_ID = 'g';
const PORTION_PREFIX = 'portion:';

/** Default amount when grams are picked: one basis serving if weighed, else 100 g. */
export const DEFAULT_GRAMS = 100;
/** Quantity steps for the stepper. */
export const GRAM_STEP = 10;
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
  }
  return options;
}

export function optionForUnit(
  options: readonly UnitOption[],
  unit: EntryUnit,
): UnitOption | undefined {
  return options.find((o) =>
    unit.kind === 'grams'
      ? o.unit.kind === 'grams'
      : o.unit.kind === 'portion' && o.unit.label === unit.label,
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
  return food.basis.kind === 'serving' && food.basis.servingGrams !== undefined
    ? food.basis.servingGrams
    : DEFAULT_GRAMS;
}

export function stepFor(unit: EntryUnit): number {
  return unit.kind === 'grams' ? GRAM_STEP : PORTION_STEP;
}
