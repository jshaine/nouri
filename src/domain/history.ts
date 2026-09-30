import type { LocalDate } from './dates';
import { totalsOf, type Entry } from './entries';
import type { DailyGoal } from './goals';
import { ZERO_TOTALS, type MacroTotals } from './nutrition';

export interface DaySummary {
  date: LocalDate;
  totals: MacroTotals;
  logged: boolean;
  goal?: DailyGoal | undefined;
}

export interface WeekSummary {
  days: DaySummary[];
  loggedDays: number;
  /** Averages over logged days only, so empty days don't pull them down. */
  average: MacroTotals | undefined;
}

export function summarizeWeek(
  days: readonly LocalDate[],
  entries: readonly Entry[],
  goalFor: (date: LocalDate) => DailyGoal | undefined,
): WeekSummary {
  const byDate = new Map<string, Entry[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  const summaries = days.map((date) => {
    const list = byDate.get(date) ?? [];
    return {
      date,
      totals: list.length ? totalsOf(list) : ZERO_TOTALS,
      logged: list.length > 0,
      goal: goalFor(date),
    };
  });
  const logged = summaries.filter((d) => d.logged);
  const average =
    logged.length === 0
      ? undefined
      : (Object.fromEntries(
          (['kcal', 'p', 'c', 'f'] as const).map((k) => [
            k,
            logged.reduce((s, d) => s + d.totals[k], 0) / logged.length,
          ]),
        ) as unknown as MacroTotals);
  return { days: summaries, loggedDays: logged.length, average };
}
