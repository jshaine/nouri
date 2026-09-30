import type { EntryRepository, GoalRepository } from '@/data';
import { goalForDate, groupByMeal, totalsOf, type Entry, type LocalDate } from '@/domain';
import { useLive } from '@/ui';

interface Repos {
  entries: Pick<EntryRepository, 'liveForDate'>;
  goals: Pick<GoalRepository, 'live'>;
}

/** Everything the Today screen shows for one day, kept live. */
export function useDayLog(repos: Repos, date: LocalDate) {
  const entries = useLive(() => repos.entries.liveForDate(date), [repos.entries, date]);
  const goals = useLive(() => repos.goals.live(), [repos.goals]);
  const list: readonly Entry[] = entries.value ?? [];
  const record = goals.value ? goalForDate(goals.value, date) : undefined;
  return {
    loaded: entries.status !== 'loading' || entries.value !== undefined,
    failed: entries.status === 'error' || goals.status === 'error',
    entries: list,
    groups: groupByMeal(list),
    totals: totalsOf(list),
    goal: record && { kcal: record.kcal, p: record.p, c: record.c, f: record.f },
  };
}
