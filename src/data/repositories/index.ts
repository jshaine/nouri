import { defaultContext, type RepoContext } from '../context';
import { NouriDb } from '../db';
import { openFoodDatabase, type FoodDatabase } from '../foods';
import { customFoodRepository, type CustomFoodRepository } from './customFoods';
import { entryRepository, type EntryRepository } from './entries';
import { goalRepository, type GoalRepository } from './goals';
import { settingsRepository, type SettingsRepository } from './settings';
import { usageRepository, type UsageRepository } from './usage';

export interface Repositories {
  customFoods: CustomFoodRepository;
  entries: EntryRepository;
  goals: GoalRepository;
  settings: SettingsRepository;
  /** Recently logged and favorite foods. */
  usage: UsageRepository;
  /** Bundled USDA/FNRI foods (read-only, searchable). */
  foods: FoodDatabase;
}

export function createRepositories(ctx: RepoContext, foods: FoodDatabase): Repositories {
  return {
    foods,
    customFoods: customFoodRepository(ctx),
    entries: entryRepository(ctx),
    goals: goalRepository(ctx),
    settings: settingsRepository(ctx),
    usage: usageRepository(ctx),
  };
}

/** The app's repositories on the real "nouri" database. */
export function openRepositories(
  db: NouriDb = new NouriDb(),
  foods: FoodDatabase = openFoodDatabase(),
): Repositories {
  return createRepositories(defaultContext(db), foods);
}

export type {
  CustomFoodRepository,
  EntryRepository,
  GoalRepository,
  SettingsRepository,
  UsageRepository,
};
export { RECENT_LIMIT, type FoodUsage } from './usage';
export type { GoalInput } from './goals';
export { DEFAULT_SETTINGS, type Settings } from './settings';
