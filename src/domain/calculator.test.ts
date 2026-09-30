import {
  activityFactor,
  bmr,
  calculateGoals,
  minimumGoalWeightKg,
  roundPercents,
  weeklyGoalOptions,
  FLOOR_MESSAGE,
  type CalculatorInput,
} from './calculator';

const woman: CalculatorInput = {
  sex: 'female',
  age: 30,
  heightCm: 160,
  currentKg: 65,
  goalKg: 58,
  activity: 'light',
  weeklyGoalKg: -0.5,
  percents: { c: 50, p: 20, f: 30 },
};

function ok(input: CalculatorInput) {
  const r = calculateGoals(input);
  if (!r.ok) throw new Error(JSON.stringify(r.problem));
  return r.result;
}

describe('BMR (Mifflin-St Jeor)', () => {
  it('uses +5 for male and −161 for female', () => {
    expect(bmr('female', 65, 160, 30)).toBe(1339);
    expect(bmr('male', 80, 175, 40)).toBe(1698.75);
  });
});

describe('activity', () => {
  it.each([
    ['sedentary', 1.2],
    ['light', 1.375],
    ['active', 1.55],
    ['very-active', 1.725],
  ] as const)('%s multiplies by %s', (level, factor) => {
    expect(activityFactor(level)).toBe(factor);
  });
});

describe('calculateGoals', () => {
  it('works through BMR, maintenance, the weekly adjustment and rounding to 10', () => {
    const r = ok(woman);
    expect(r.bmr).toBe(1339);
    expect(r.maintenance).toBe(1841); // 1339 × 1.375
    expect(r.adjustment).toBe(-550); // 0.5 kg × 1100
    expect(r.goal.kcal).toBe(1290); // 1291.1 → 1290
    expect(r.floored).toBe(false);
  });

  it('turns the calories into gram targets from the macro split', () => {
    expect(ok(woman).goal).toEqual({ kcal: 1290, c: 161, p: 65, f: 43 });
    expect(ok({ ...woman, percents: { c: 40, p: 30, f: 30 } }).goal).toEqual({
      kcal: 1290,
      c: 129,
      p: 97,
      f: 43,
    });
  });

  it('maintains and gains', () => {
    const man = {
      ...woman,
      sex: 'male' as const,
      age: 40,
      heightCm: 175,
      currentKg: 80,
      activity: 'sedentary' as const,
    };
    expect(ok({ ...man, goalKg: 80, weeklyGoalKg: 0 }).goal.kcal).toBe(2040); // 2038.5
    expect(ok({ ...man, goalKg: 85, weeklyGoalKg: 0.5 })).toMatchObject({
      adjustment: 550,
      goal: { kcal: 2590 },
    });
  });

  it('raises a goal below the floor to it (1200 female, 1500 male)', () => {
    const small = {
      ...woman,
      age: 50,
      heightCm: 150,
      currentKg: 50,
      goalKg: 45,
      activity: 'sedentary' as const,
      weeklyGoalKg: -1 as const,
    };
    expect(ok(small)).toMatchObject({ floored: true, goal: { kcal: 1200 } });
    const man = { ...small, sex: 'male' as const };
    expect(ok(man)).toMatchObject({ floored: true, goal: { kcal: 1500 } });
    expect(FLOOR_MESSAGE).toMatch(/slower than the selected pace/);
  });

  it('does not flag a target just above the floor that rounds down to it', () => {
    // BMR 1462 × 1.2 = 1754.4; − 550 = 1204.4 → 1200, but above the floor.
    const r = ok({
      ...woman,
      currentKg: 77.3,
      goalKg: 60,
      activity: 'sedentary',
      weeklyGoalKg: -0.5,
    });
    expect(r).toMatchObject({ bmr: 1462, floored: false, goal: { kcal: 1200 } });
  });

  it('is for adults only', () => {
    expect(calculateGoals({ ...woman, age: 17 })).toEqual({
      ok: false,
      problem: { kind: 'minor' },
    });
    expect(calculateGoals({ ...woman, age: 18 }).ok).toBe(true);
  });

  it('refuses a goal weight under BMI 18.5, naming the lowest allowed', () => {
    expect(calculateGoals({ ...woman, goalKg: 47 })).toEqual({
      ok: false,
      problem: { kind: 'goal-below-healthy', minimumKg: 47.4 },
    });
    expect(calculateGoals({ ...woman, goalKg: 47.4 }).ok).toBe(true);
  });

  it('refuses a pace that goes the wrong way', () => {
    expect(calculateGoals({ ...woman, goalKg: 70, weeklyGoalKg: -0.5 })).toEqual({
      ok: false,
      problem: { kind: 'pace-mismatch' },
    });
  });
});

describe('minimumGoalWeightKg', () => {
  it('is BMI 18.5 for the height, rounded up', () => {
    expect(minimumGoalWeightKg(160)).toBe(47.4); // 47.36
    expect(minimumGoalWeightKg(175)).toBe(56.7); // 56.656
  });
});

describe('weeklyGoalOptions', () => {
  it('offers losing only when the goal is lower, gaining only when higher', () => {
    expect(weeklyGoalOptions(65, 58)).toEqual([-1, -0.75, -0.5, -0.25, 0]);
    expect(weeklyGoalOptions(65, 65)).toEqual([0]);
    expect(weeklyGoalOptions(65, 70)).toEqual([0, 0.25, 0.5]);
  });
});

describe('roundPercents', () => {
  it('rounds to 5% steps that total exactly 100', () => {
    expect(roundPercents({ c: 33, p: 33, f: 34 })).toEqual({ c: 35, p: 30, f: 35 });
    expect(roundPercents({ c: 50, p: 20, f: 30 })).toEqual({ c: 50, p: 20, f: 30 });
    expect(roundPercents({ c: 0, p: 0, f: 0 })).toEqual({ c: 50, p: 20, f: 30 });
  });

  it('always totals 100 in 5% steps, for any input', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) % 1000) / 10;
    for (let i = 0; i < 500; i += 1) {
      const r = roundPercents({ c: rand(), p: rand(), f: rand() });
      expect(r.c + r.p + r.f).toBe(100);
      for (const v of [r.c, r.p, r.f]) {
        expect(v % 5).toBe(0);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('ignores negative shares', () => {
    expect(roundPercents({ c: -10, p: 50, f: 50 })).toEqual({ c: 0, p: 50, f: 50 });
  });
});
