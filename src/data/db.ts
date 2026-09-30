import { Dexie, type EntityTable } from 'dexie';
import type {
  CustomFoodRow,
  EntryRow,
  ExerciseRow,
  GoalRow,
  MetaRow,
  PortionOverrideRow,
  ProfileRow,
  UsageRow,
  WeightRow,
} from './rows';

export const DB_NAME = 'nouri';

/**
 * Current schema version. See src/data/MIGRATIONS.md before changing it:
 * never edit a released version; add a new one with an upgrade function.
 */
export const SCHEMA_VERSION = 1;

export class NouriDb extends Dexie {
  customFoods!: EntityTable<CustomFoodRow, 'id'>;
  portionOverrides!: EntityTable<PortionOverrideRow, 'foodKey'>;
  entries!: EntityTable<EntryRow, 'id'>;
  goals!: EntityTable<GoalRow, 'id'>;
  profile!: EntityTable<ProfileRow, 'id'>;
  weights!: EntityTable<WeightRow, 'id'>;
  exercise!: EntityTable<ExerciseRow, 'id'>;
  recents!: EntityTable<UsageRow, 'foodKey'>;
  favorites!: EntityTable<UsageRow, 'foodKey'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor(name: string = DB_NAME) {
    // Your log's only copy is on this device: ask Chrome to flush each write to
    // disk before reporting it done, rather than its faster "relaxed" default.
    super(name, { chromeTransactionDurability: 'strict' });
    // Only indexed fields are listed; rows may hold more.
    this.version(1).stores({
      customFoods: 'id, name, updatedAt',
      portionOverrides: 'foodKey',
      entries: 'id, date, foodKey, createdAt',
      goals: 'id, effectiveFrom',
      profile: 'id',
      weights: 'id, date',
      exercise: 'id, date',
      recents: 'foodKey, lastUsed, useCount',
      favorites: 'foodKey, lastUsed',
      meta: 'key',
    });
  }
}
