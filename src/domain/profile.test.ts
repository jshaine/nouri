import type { LocalDate } from './dates';
import {
  calculatorInputFrom,
  DEFAULT_PROFILE,
  isWeeklyGoal,
  latestWeight,
  type Profile,
} from './profile';

const today = '2026-09-30' as LocalDate;
const full: Profile = {
  ...DEFAULT_PROFILE,
  sex: 'female',
  birthDate: '1996-05-01' as LocalDate,
  heightCm: 160,
  goalWeightKg: 58,
  activity: 'light',
  weeklyGoalKg: -0.5,
};
const split = { c: 50, p: 20, f: 30 };

describe('calculatorInputFrom', () => {
  it('builds the input with age from the birth date and the latest weight', () => {
    expect(calculatorInputFrom(full, 65, today, split)).toEqual({
      ok: true,
      input: {
        sex: 'female',
        age: 30,
        heightCm: 160,
        currentKg: 65,
        goalKg: 58,
        activity: 'light',
        weeklyGoalKg: -0.5,
        percents: split,
      },
    });
  });

  it('lists everything still missing', () => {
    expect(calculatorInputFrom(DEFAULT_PROFILE, undefined, today, split)).toEqual({
      ok: false,
      missing: [
        'sex',
        'birthDate',
        'heightCm',
        'goalWeightKg',
        'activity',
        'weeklyGoalKg',
        'weight',
      ],
    });
    expect(calculatorInputFrom(full, undefined, today, split)).toEqual({
      ok: false,
      missing: ['weight'],
    });
  });
});

describe('latestWeight', () => {
  const weights = [
    { id: 'a', date: '2026-09-01' as LocalDate, kg: 66 },
    { id: 'b', date: '2026-09-28' as LocalDate, kg: 65 },
    { id: 'c', date: '2026-09-15' as LocalDate, kg: 65.5 },
  ];
  it('finds the most recent, optionally on or before a day', () => {
    expect(latestWeight(weights)?.id).toBe('b');
    expect(latestWeight(weights, '2026-09-20' as LocalDate)?.id).toBe('c');
    expect(latestWeight([])).toBeUndefined();
  });
});

describe('isWeeklyGoal', () => {
  it('accepts only the offered paces', () => {
    expect(isWeeklyGoal(-0.5)).toBe(true);
    expect(isWeeklyGoal(-0.6)).toBe(false);
    expect(isWeeklyGoal('0')).toBe(false);
  });
});
