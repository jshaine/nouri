import type { LocalDate } from '@/domain';
import { createTestRepositories, firstValue } from '../testing';

const day = (s: string) => s as LocalDate;

describe('profileRepository', () => {
  it('starts metric with exercise calories off, and merges updates', async () => {
    const { repos } = createTestRepositories();
    expect(await repos.profile.get()).toEqual({ units: 'metric', exerciseCaloriesEnabled: false });
    await repos.profile.update({ sex: 'female', heightCm: 160, activity: 'light' });
    await repos.profile.update({
      units: 'imperial',
      weeklyGoalKg: -0.5,
      birthDate: day('1996-05-01'),
      goalWeightKg: 58,
    });
    expect(await firstValue(repos.profile.live())).toEqual({
      units: 'imperial',
      exerciseCaloriesEnabled: false,
      sex: 'female',
      heightCm: 160,
      activity: 'light',
      weeklyGoalKg: -0.5,
      birthDate: '1996-05-01',
      goalWeightKg: 58,
    });
  });

  it('drops invalid stored values', async () => {
    const { repos, db } = createTestRepositories();
    await db.profile.put({
      id: 'me',
      units: 'metric',
      exerciseCaloriesEnabled: true,
      sex: 'other' as 'male',
      birthDate: day('1990-02-30'),
      heightCm: -1,
      activityLevel: 'couch' as 'light',
      weeklyGoalKg: -2,
    });
    expect(await repos.profile.get()).toEqual({ units: 'metric', exerciseCaloriesEnabled: true });
  });
});

describe('weightRepository', () => {
  it('keeps one weight per day, oldest first', async () => {
    const { repos } = createTestRepositories();
    await repos.weights.set(day('2026-09-28'), 65.4);
    const first = await repos.weights.set(day('2026-09-01'), 66);
    const again = await repos.weights.set(day('2026-09-01'), 65.9);
    expect(again.id).toBe(first.id);
    expect((await firstValue(repos.weights.live())).map((w) => [w.date, w.kg])).toEqual([
      ['2026-09-01', 65.9],
      ['2026-09-28', 65.4],
    ]);
  });

  it('edits (replacing a same-day clash) and deletes', async () => {
    const { repos } = createTestRepositories();
    const a = await repos.weights.set(day('2026-09-01'), 66);
    await repos.weights.set(day('2026-09-02'), 65.8);
    await repos.weights.update({ ...a, date: day('2026-09-02'), kg: 65.7 });
    expect(await firstValue(repos.weights.live())).toEqual([
      { id: a.id, date: '2026-09-02', kg: 65.7 },
    ]);
    await repos.weights.remove(a.id);
    expect(await firstValue(repos.weights.live())).toEqual([]);
  });
});

describe('exerciseRepository', () => {
  it('stores whole kcal per day and clears with 0', async () => {
    const { repos } = createTestRepositories();
    const d = day('2026-09-30');
    expect(await firstValue(repos.exercise.liveForDate(d))).toBe(0);
    await repos.exercise.set(d, 250.4);
    await repos.exercise.set(d, 300.6);
    expect(await firstValue(repos.exercise.liveForDate(d))).toBe(301);
    await repos.exercise.set(d, 0);
    expect(await firstValue(repos.exercise.liveForDate(d))).toBe(0);
    await repos.exercise.set(d, 0); // clearing twice is fine
  });
});
