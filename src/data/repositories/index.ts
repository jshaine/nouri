import { defaultContext, type RepoContext } from '../context';
import { NouriDb } from '../db';
import { customFoodRepository, type CustomFoodRepository } from './customFoods';
import { entryRepository, type EntryRepository } from './entries';
import { goalRepository, type GoalRepository } from './goals';
import { settingsRepository, type SettingsRepository } from './settings';

export interface Repositories {
  customFoods: CustomFoodRepository;
  entries: EntryRepository;
  goals: GoalRepository;
  settings: SettingsRepository;
}

export function createRepositories(ctx: RepoContext): Repositories {
  return {
    customFoods: customFoodRepository(ctx),
    entries: entryRepository(ctx),
    goals: goalRepository(ctx),
    settings: settingsRepository(ctx),
  };
}

/** The app's repositories on the real "nouri" database. */
export function openRepositories(db: NouriDb = new NouriDb()): Repositories {
  return createRepositories(defaultContext(db));
}

export type { CustomFoodRepository, EntryRepository, GoalRepository, SettingsRepository };
export type { GoalInput } from './goals';
export { DEFAULT_SETTINGS, type Settings } from './settings';
