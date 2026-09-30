import type { GoalRecord, LocalDate, MacroPercents } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';
import type { GoalRow } from '../rows';

export type GoalInput =
  | { kcal: number; p: number; c: number; f: number; macroMode: 'percent'; percents: MacroPercents }
  | { kcal: number; p: number; c: number; f: number; macroMode: 'grams' };

export interface GoalRepository {
  /** All goal records, oldest first. */
  live(): Live<GoalRecord[]>;
  all(): Promise<GoalRecord[]>;
  /**
   * Sets the goal from `date` onward. Past days keep their goals; a second
   * change on the same day replaces that day's record.
   */
  setFrom(date: LocalDate, goal: GoalInput): Promise<GoalRecord>;
}

export function rowToGoal(row: GoalRow): GoalRecord {
  const base = {
    id: row.id,
    effectiveFrom: row.effectiveFrom,
    kcal: row.kcal,
    p: row.p,
    c: row.c,
    f: row.f,
  };
  return row.macroMode === 'percent' && row.percents
    ? { ...base, macroMode: 'percent', percents: row.percents }
    : { ...base, macroMode: 'grams' };
}

export function goalRepository({ db, newId }: RepoContext): GoalRepository {
  const all = async () => (await db.goals.orderBy('effectiveFrom').toArray()).map(rowToGoal);

  return {
    live: () => live(all),
    all,
    async setFrom(date, goal) {
      return db.transaction('rw', db.goals, async () => {
        const sameDay = await db.goals.where('effectiveFrom').equals(date).first();
        const row: GoalRow = { ...goal, id: sameDay?.id ?? newId(), effectiveFrom: date };
        await db.goals.put(row);
        return rowToGoal(row);
      });
    },
  };
}
