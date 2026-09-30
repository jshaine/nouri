import type { LocalDate } from './dates';
import {
  goalForDate,
  goalFromGrams,
  goalWithExercise,
  gramsFromPercents,
  isValidPercents,
  scaleGoal,
} from './goals';

const rec = (id: string, effectiveFrom: string) => ({
  id,
  effectiveFrom: effectiveFrom as LocalDate,
});
const day = (s: string) => s as LocalDate;

describe('goalForDate', () => {
  const records = [rec('b', '2026-09-15'), rec('a', '2026-09-01'), rec('c', '2026-10-01')];

  it('picks the latest record on or before the day', () => {
    expect(goalForDate(records, day('2026-09-20'))?.id).toBe('b');
    expect(goalForDate(records, day('2026-09-15'))?.id).toBe('b');
    expect(goalForDate(records, day('2026-09-14'))?.id).toBe('a');
    expect(goalForDate(records, day('2026-10-05'))?.id).toBe('c');
  });

  it('is undefined before the first goal', () => {
    expect(goalForDate(records, day('2026-08-31'))).toBeUndefined();
    expect(goalForDate<ReturnType<typeof rec>>([], day('2026-09-30'))).toBeUndefined();
  });

  it('prefers the later-listed record when two share a date', () => {
    expect(
      goalForDate([rec('old', '2026-09-30'), rec('new', '2026-09-30')], day('2026-09-30'))?.id,
    ).toBe('new');
  });
});

describe('percents', () => {
  it('requires 5% steps totalling 100', () => {
    expect(isValidPercents({ c: 50, p: 20, f: 30 })).toBe(true);
    expect(isValidPercents({ c: 50, p: 20, f: 25 })).toBe(false);
    expect(isValidPercents({ c: 52, p: 18, f: 30 })).toBe(false);
    expect(isValidPercents({ c: 110, p: -10, f: 0 })).toBe(false);
    expect(isValidPercents({ c: 50.5, p: 19.5, f: 30 })).toBe(false);
  });

  it('converts percents to whole grams', () => {
    expect(gramsFromPercents(2000, { c: 50, p: 20, f: 30 })).toEqual({
      kcal: 2000,
      c: 250,
      p: 100,
      f: 67,
    });
    expect(gramsFromPercents(1850, { c: 40, p: 30, f: 30 })).toEqual({
      kcal: 1850,
      c: 185,
      p: 139,
      f: 62,
    });
  });

  it('refuses invalid percents', () => {
    expect(() => gramsFromPercents(2000, { c: 50, p: 20, f: 20 })).toThrow(RangeError);
  });
});

describe('gram goals', () => {
  it('derives calories from grams', () => {
    expect(goalFromGrams(120, 200, 60)).toEqual({ kcal: 1820, p: 120, c: 200, f: 60 });
  });

  it('scales a goal to extra calories, keeping proportions', () => {
    expect(scaleGoal({ kcal: 2000, p: 100, c: 250, f: 67 }, 2300)).toEqual({
      kcal: 2300,
      p: 115,
      c: 288,
      f: 77,
    });
    expect(scaleGoal({ kcal: 0, p: 0, c: 0, f: 0 }, 300)).toEqual({ kcal: 300, p: 0, c: 0, f: 0 });
  });
});

describe('goalWithExercise', () => {
  it('adds exercise calories and scales the macros', () => {
    expect(goalWithExercise({ kcal: 2000, p: 100, c: 250, f: 67 }, 300)).toEqual({
      kcal: 2300,
      p: 115,
      c: 288,
      f: 77,
    });
  });

  it('leaves the goal alone without exercise', () => {
    const g = { kcal: 2000, p: 100, c: 250, f: 67 };
    expect(goalWithExercise(g, 0)).toBe(g);
  });
});
