/** The three tracked macronutrients, in display order. */
export const MACROS = ['protein', 'carbs', 'fat'] as const;
export type Macro = (typeof MACROS)[number];

/** Single letter shown next to every macro so color is never the only cue. */
export const MACRO_LETTER: Readonly<Record<Macro, string>> = {
  protein: 'P',
  carbs: 'C',
  fat: 'F',
};

export const MACRO_NAME: Readonly<Record<Macro, string>> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

/** Where a food's numbers come from. Shown as a badge wherever a food appears. */
export const FOOD_SOURCES = ['usda', 'fnri', 'custom'] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

export const FOOD_SOURCE_LABEL: Readonly<Record<FoodSource, string>> = {
  usda: 'USDA',
  fnri: 'FNRI',
  custom: 'Custom',
};

export const FOOD_SOURCE_DESCRIPTION: Readonly<Record<FoodSource, string>> = {
  usda: 'USDA FoodData Central',
  fnri: 'FNRI Philippine Food Composition Tables',
  custom: 'Your own entry',
};
