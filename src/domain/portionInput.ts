import { gramsPerBasis, supportsGrams, type EntryUnit, type Food, type Portion } from './food';
import { basisFactor } from './nutrition';
import { parseDecimal } from './numbers';

export const PORTION_LABEL_MAX = 40;
const MAX_GRAMS = 5000;
const MAX_SERVINGS = 50;

export type PortionErrors = Partial<Record<'label' | 'amount', string>>;

/** Portions by weight when the food's weight is known, otherwise in servings. */
export function portionKind(food: Food): 'grams' | 'servings' {
  return supportsGrams(food) ? 'grams' : 'servings';
}

/** Validates a custom portion like "1 cup kanin" = 160 g. */
export function validatePortion(
  food: Food,
  label: string,
  amountText: string,
): { ok: true; value: Portion } | { ok: false; errors: PortionErrors } {
  const errors: PortionErrors = {};
  const name = label.trim().replace(/\s+/g, ' ');
  const kind = portionKind(food);
  if (!name) errors.label = 'Name the portion, like “1 cup kanin” or “1 bowl”.';
  else if (name.length > PORTION_LABEL_MAX)
    errors.label = `Keep the name under ${PORTION_LABEL_MAX} characters.`;
  else if (name.toLowerCase() === 'grams')
    errors.label = '“grams” is already an option. Pick another name.';

  const amount = parseDecimal(amountText);
  const max = kind === 'grams' ? MAX_GRAMS : MAX_SERVINGS;
  if (amount === null || amount <= 0 || amount > max) {
    errors.amount =
      kind === 'grams'
        ? 'Enter how many grams this portion weighs, like 160.'
        : 'Enter how many servings this portion is, like 0.5 or 2.';
  }
  if (errors.label || errors.amount || amount === null) return { ok: false, errors };
  return {
    ok: true,
    value: kind === 'grams' ? { label: name, grams: amount } : { label: name, servings: amount },
  };
}

/** Adds or replaces (same name, any case) a portion in a list. */
export function upsertPortion(portions: readonly Portion[], portion: Portion): Portion[] {
  const key = portion.label.toLowerCase();
  return [...portions.filter((p) => p.label.toLowerCase() !== key), portion];
}

/** The current selection as a portion amount: grams if weighed, else servings (to prefill "Save portion"). */
export function selectionAsPortionAmount(
  food: Food,
  portions: readonly Portion[],
  amount: number,
  unit: EntryUnit,
): number {
  const factor = basisFactor(food, portions, amount, unit);
  const perBasis = gramsPerBasis(food.basis);
  const value = perBasis === null ? factor : factor * perBasis;
  return Math.round(value * 10) / 10;
}
