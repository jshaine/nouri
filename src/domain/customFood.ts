import {
  foodKey,
  GRAMS_PER_OUNCE,
  SERVING_PORTION_LABEL,
  type Food,
  type FoodBasis,
  type Portion,
} from './food';
import { parseDecimal } from './numbers';

/** Raw text from the custom food form. */
export interface CustomFoodInput {
  name: string;
  aliases: string;
  basis: '100g' | 'serving';
  /** Only for per-serving foods; empty when the weight is unknown. */
  servingGrams: string;
  /** The unit servingGrams is typed in; stored as grams either way. */
  servingUnit: 'g' | 'oz';
  kcal: string;
  p: string;
  c: string;
  f: string;
  fiber: string;
}

export type CustomFoodField = Exclude<keyof CustomFoodInput, 'basis'>;
export type CustomFoodErrors = Partial<Record<CustomFoodField, string>>;

export interface CustomFoodDraft {
  name: string;
  aliases: string[];
  basis: FoodBasis;
  kcal?: number;
  p: number;
  c: number;
  f: number;
  fiber?: number;
}

export const NAME_MAX = 80;
/** Pure fat is ~900 kcal per 100 g; anything above is a typo. */
export const MAX_KCAL_PER_100G = 900;
const MAX_SERVING_GRAMS = 5000;

export const EMPTY_CUSTOM_FOOD: CustomFoodInput = {
  name: '',
  aliases: '',
  basis: '100g',
  servingGrams: '',
  servingUnit: 'g',
  kcal: '',
  p: '',
  c: '',
  f: '',
  fiber: '',
};

type Result = { ok: true; value: CustomFoodDraft } | { ok: false; errors: CustomFoodErrors };

/** Validates the form. Every message says what is wrong and how to fix it. */
export function validateCustomFood(input: CustomFoodInput): Result {
  const errors: CustomFoodErrors = {};
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'Add a name so you can find this food later.';
  else if (name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters.`;

  const number = (field: CustomFoodField, label: string, required: boolean) => {
    const text = input[field].trim();
    if (!text) {
      if (required) errors[field] = `Enter ${label} in grams. Use 0 if there is none.`;
      return undefined;
    }
    const value = parseDecimal(text);
    if (value === null) errors[field] = `Enter ${label} as a number, like 12.5.`;
    return value ?? undefined;
  };

  const p = number('p', 'protein', true);
  const c = number('c', 'carbs', true);
  const f = number('f', 'fat', true);
  const fiber = number('fiber', 'fiber', false);
  const kcalText = input.kcal.trim();
  const kcalParsed = kcalText ? parseDecimal(kcalText) : undefined;
  if (kcalParsed === null) {
    errors.kcal = 'Enter calories as a number, or leave it empty to use 4P + 4C + 9F.';
  }
  const kcal = kcalParsed ?? undefined;

  let servingGrams: number | undefined;
  if (input.basis === 'serving' && input.servingGrams.trim()) {
    const typed = parseDecimal(input.servingGrams);
    const g = typed === null ? null : input.servingUnit === 'oz' ? typed * GRAMS_PER_OUNCE : typed;
    if (g === null || g <= 0 || g > MAX_SERVING_GRAMS) {
      errors.servingGrams = `Enter the serving weight in ${
        input.servingUnit === 'oz' ? 'ounces' : 'grams'
      }, or leave it empty if you don’t know it.`;
    } else servingGrams = Math.round(g * 10) / 10;
  }

  // Macros can't weigh more than the food itself.
  const weight = input.basis === '100g' ? 100 : servingGrams;
  const macroGrams = (p ?? 0) + (c ?? 0) + (f ?? 0);
  if (weight !== undefined && macroGrams > weight && !errors.p && !errors.c && !errors.f) {
    errors.f = `Protein, carbs and fat add up to ${macroGrams} g, more than the ${weight} g ${
      input.basis === '100g' ? 'basis' : 'serving'
    }. Check the numbers on the label.`;
  }
  if (input.basis === '100g' && kcal !== undefined && kcal > MAX_KCAL_PER_100G) {
    errors.kcal = `${kcal} kcal per 100 g is more than pure fat (${MAX_KCAL_PER_100G}). Check the number.`;
  }

  if (Object.keys(errors).length > 0 || p === undefined || c === undefined || f === undefined) {
    return { ok: false, errors };
  }
  const aliases = input.aliases
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a && a.toLowerCase() !== name.toLowerCase());
  const basis: FoodBasis =
    input.basis === '100g'
      ? { kind: '100g' }
      : servingGrams === undefined
        ? { kind: 'serving' }
        : { kind: 'serving', servingGrams };

  const draft: CustomFoodDraft = { name, aliases: [...new Set(aliases)], basis, p, c, f };
  if (kcal !== undefined) draft.kcal = kcal;
  if (fiber !== undefined) draft.fiber = fiber;
  return { ok: true, value: draft };
}

/** The portion list a custom food starts with. */
export function defaultPortions(basis: FoodBasis): Portion[] {
  if (basis.kind === '100g') return [];
  return basis.servingGrams === undefined
    ? [{ label: SERVING_PORTION_LABEL, servings: 1 }]
    : [{ label: SERVING_PORTION_LABEL, grams: basis.servingGrams }];
}

/** Builds the domain Food for a saved custom food. */
export function customFoodToFood(id: string, draft: CustomFoodDraft, portions?: Portion[]): Food {
  const nutrients: Food['nutrients'] = { p: draft.p, c: draft.c, f: draft.f };
  if (draft.kcal !== undefined) nutrients.kcal = draft.kcal;
  if (draft.fiber !== undefined) nutrients.fiber = draft.fiber;
  return {
    key: foodKey('custom', id),
    source: 'custom',
    name: draft.name,
    aliases: draft.aliases,
    basis: draft.basis,
    nutrients,
    portions: portions ?? defaultPortions(draft.basis),
  };
}

/** The form text for editing an existing custom food. */
export function foodToCustomFoodInput(food: Food): CustomFoodInput {
  const text = (n: number | undefined) => (n === undefined ? '' : String(n));
  return {
    name: food.name,
    aliases: food.aliases.join(', '),
    basis: food.basis.kind,
    servingGrams: food.basis.kind === 'serving' ? text(food.basis.servingGrams) : '',
    servingUnit: 'g',
    kcal: text(food.nutrients.kcal),
    p: text(food.nutrients.p),
    c: text(food.nutrients.c),
    f: text(food.nutrients.f),
    fiber: text(food.nutrients.fiber),
  };
}
