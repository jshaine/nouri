import { isMeal, mealForTime } from './meals';

const at = (h: number, m = 0) => new Date(2026, 8, 30, h, m);

describe('mealForTime', () => {
  it.each([
    [0, 30, 'snacks'],
    [4, 0, 'breakfast'],
    [10, 29, 'breakfast'],
    [10, 30, 'lunch'],
    [14, 29, 'lunch'],
    [15, 0, 'snacks'],
    [17, 30, 'dinner'],
    [21, 29, 'dinner'],
    [22, 0, 'snacks'],
  ] as const)('%i:%i is %s', (h, m, meal) => {
    expect(mealForTime(at(h, m))).toBe(meal);
  });
});

describe('isMeal', () => {
  it('accepts only the four meals', () => {
    expect(isMeal('lunch')).toBe(true);
    expect(isMeal('merienda')).toBe(false);
    expect(isMeal(undefined)).toBe(false);
  });
});
