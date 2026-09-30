import {
  customFoodToFood,
  defaultPortions,
  type CustomFoodDraft,
  type Food,
  type FoodBasis,
} from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';
import type { CustomFoodRow } from '../rows';

export interface CustomFoodRepository {
  live(): Live<Food[]>;
  get(id: string): Promise<Food | undefined>;
  create(draft: CustomFoodDraft): Promise<Food>;
  update(id: string, draft: CustomFoodDraft): Promise<Food>;
  remove(id: string): Promise<void>;
}

function toBasis(row: CustomFoodRow): FoodBasis {
  if (row.basis === '100g') return { kind: '100g' };
  return row.servingGrams === undefined
    ? { kind: 'serving' }
    : { kind: 'serving', servingGrams: row.servingGrams };
}

export function rowToFood(row: CustomFoodRow): Food {
  const draft: CustomFoodDraft = {
    name: row.name,
    aliases: row.aliases,
    basis: toBasis(row),
    p: row.p,
    c: row.c,
    f: row.f,
  };
  if (row.kcal !== undefined) draft.kcal = row.kcal;
  if (row.fiber !== undefined) draft.fiber = row.fiber;
  return customFoodToFood(row.id, draft, row.portions);
}

function draftFields(draft: CustomFoodDraft) {
  const fields: Omit<CustomFoodRow, 'id' | 'portions' | 'createdAt' | 'updatedAt'> = {
    name: draft.name,
    aliases: draft.aliases,
    source: 'custom',
    basis: draft.basis.kind,
    p: draft.p,
    c: draft.c,
    f: draft.f,
  };
  if (draft.basis.kind === 'serving' && draft.basis.servingGrams !== undefined) {
    fields.servingGrams = draft.basis.servingGrams;
  }
  if (draft.kcal !== undefined) fields.kcal = draft.kcal;
  if (draft.fiber !== undefined) fields.fiber = draft.fiber;
  return fields;
}

export function customFoodRepository({ db, now, newId }: RepoContext): CustomFoodRepository {
  const byName = (a: CustomFoodRow, b: CustomFoodRow) => a.name.localeCompare(b.name);

  return {
    live: () => live(async () => (await db.customFoods.toArray()).sort(byName).map(rowToFood)),

    async get(id) {
      const row = await db.customFoods.get(id);
      return row && rowToFood(row);
    },

    async create(draft) {
      const t = now();
      const row: CustomFoodRow = {
        id: newId(),
        ...draftFields(draft),
        portions: defaultPortions(draft.basis),
        createdAt: t,
        updatedAt: t,
      };
      await db.customFoods.add(row);
      return rowToFood(row);
    },

    async update(id, draft) {
      return db.transaction('rw', db.customFoods, async () => {
        const existing = await db.customFoods.get(id);
        if (!existing) throw new Error('That food no longer exists.');
        // The basis serving portion follows the basis; extra portions stay.
        const extras = existing.portions.filter(
          (p) => p.label !== defaultPortions(toBasis(existing))[0]?.label,
        );
        const row: CustomFoodRow = {
          id,
          ...draftFields(draft),
          portions: [...defaultPortions(draft.basis), ...extras],
          createdAt: existing.createdAt,
          updatedAt: now(),
        };
        await db.customFoods.put(row);
        return rowToFood(row);
      });
    },

    async remove(id) {
      // Past entries keep their own snapshot, so they are untouched.
      await db.customFoods.delete(id);
    },
  };
}
