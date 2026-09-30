import type { LocalDate } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';

/** Exercise calories per day (only used when exercise calories are turned on). */
export interface ExerciseRepository {
  liveForDate(date: LocalDate): Live<number>;
  /** 0 clears the day. */
  set(date: LocalDate, kcal: number): Promise<void>;
}

export function exerciseRepository({ db, newId }: RepoContext): ExerciseRepository {
  return {
    liveForDate: (date) =>
      live(async () => (await db.exercise.where('date').equals(date).first())?.kcal ?? 0),
    async set(date, kcal) {
      await db.transaction('rw', db.exercise, async () => {
        const existing = await db.exercise.where('date').equals(date).first();
        if (kcal <= 0) {
          if (existing) await db.exercise.delete(existing.id);
          return;
        }
        await db.exercise.put({ id: existing?.id ?? newId(), date, kcal: Math.round(kcal) });
      });
    },
  };
}
