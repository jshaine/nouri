import type {
  EntryRepository,
  ExerciseRepository,
  GoalRepository,
  ProfileRepository,
} from '@/data';
import {
  goalForDate,
  goalWithExercise,
  groupByMeal,
  totalsOf,
  type Entry,
  type LocalDate,
} from '@/domain';
import { useLive } from '@/ui';

interface Repos {
  entries: Pick<EntryRepository, 'liveForDate'>;
  goals: Pick<GoalRepository, 'live'>;
  profile: Pick<ProfileRepository, 'live'>;
  exercise: Pick<ExerciseRepository, 'liveForDate'>;
}

/** Everything the Today screen shows for one day, kept live. */
export function useDayLog(repos: Repos, date: LocalDate) {
  const entries = useLive(() => repos.entries.liveForDate(date), [repos.entries, date]);
  const goals = useLive(() => repos.goals.live(), [repos.goals]);
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const exercise = useLive(() => repos.exercise.liveForDate(date), [repos.exercise, date]);
  const list: readonly Entry[] = entries.value ?? [];
  const record = goals.value ? goalForDate(goals.value, date) : undefined;
  const exerciseEnabled = profile.value?.exerciseCaloriesEnabled === true;
  const exerciseKcal = exerciseEnabled ? (exercise.value ?? 0) : 0;
  const base = record && { kcal: record.kcal, p: record.p, c: record.c, f: record.f };
  return {
    loaded: entries.status !== 'loading' || entries.value !== undefined,
    failed: entries.status === 'error' || goals.status === 'error',
    entries: list,
    groups: groupByMeal(list),
    totals: totalsOf(list),
    /** The day's goal, including exercise calories when turned on. */
    goal: base && goalWithExercise(base, exerciseKcal),
    exerciseEnabled,
    exerciseKcal,
  };
}
