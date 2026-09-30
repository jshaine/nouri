import { upsertPortion, type FoodKey, type Portion } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';

/**
 * Your own portions for any food (e.g. "1 cup kanin" = 160 g). Kept apart from
 * the bundled foods, which are never modified.
 */
export interface PortionOverrideRepository {
  live(foodKey: FoodKey): Live<Portion[]>;
  save(foodKey: FoodKey, portion: Portion): Promise<void>;
  remove(foodKey: FoodKey, label: string): Promise<void>;
}

export function portionOverrideRepository({ db }: RepoContext): PortionOverrideRepository {
  return {
    live: (foodKey) => live(async () => (await db.portionOverrides.get(foodKey))?.portions ?? []),
    async save(foodKey, portion) {
      await db.transaction('rw', db.portionOverrides, async () => {
        const row = await db.portionOverrides.get(foodKey);
        await db.portionOverrides.put({
          foodKey,
          portions: upsertPortion(row?.portions ?? [], portion),
        });
      });
    },
    async remove(foodKey, label) {
      await db.transaction('rw', db.portionOverrides, async () => {
        const row = await db.portionOverrides.get(foodKey);
        if (!row) return;
        const portions = row.portions.filter((p) => p.label.toLowerCase() !== label.toLowerCase());
        if (portions.length === 0) await db.portionOverrides.delete(foodKey);
        else await db.portionOverrides.put({ foodKey, portions });
      });
    },
  };
}
