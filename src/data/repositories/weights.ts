import type { LocalDate, WeightEntry } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';

export interface WeightRepository {
  /** Oldest first. */
  live(): Live<WeightEntry[]>;
  /** One weight per day: logging again that day replaces it. */
  set(date: LocalDate, kg: number): Promise<WeightEntry>;
  update(entry: WeightEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

export function weightRepository({ db, newId }: RepoContext): WeightRepository {
  return {
    live: () =>
      live(async () =>
        (await db.weights.orderBy('date').toArray()).map(({ id, date, kg }) => ({ id, date, kg })),
      ),
    async set(date, kg) {
      return db.transaction('rw', db.weights, async () => {
        const existing = await db.weights.where('date').equals(date).first();
        const entry: WeightEntry = { id: existing?.id ?? newId(), date, kg };
        await db.weights.put(entry);
        return entry;
      });
    },
    async update(entry) {
      await db.transaction('rw', db.weights, async () => {
        // Moving to a date that already has a weight replaces that one.
        const clash = await db.weights.where('date').equals(entry.date).first();
        if (clash && clash.id !== entry.id) await db.weights.delete(clash.id);
        await db.weights.put(entry);
      });
    },
    async remove(id) {
      await db.weights.delete(id);
    },
  };
}
