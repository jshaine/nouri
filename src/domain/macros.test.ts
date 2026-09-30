import { FOOD_SOURCES, FOOD_SOURCE_LABEL, MACROS, MACRO_LETTER, MACRO_NAME } from './macros';

describe('macro constants', () => {
  it('gives every macro a unique letter and a name', () => {
    const letters = MACROS.map((m) => MACRO_LETTER[m]);
    expect(new Set(letters).size).toBe(MACROS.length);
    for (const m of MACROS) expect(MACRO_NAME[m]).toMatch(new RegExp(`^${MACRO_LETTER[m]}`));
  });

  it('labels every food source', () => {
    expect(FOOD_SOURCES.map((s) => FOOD_SOURCE_LABEL[s])).toEqual(['USDA', 'FNRI', 'Custom']);
  });
});
