import type { SettingsRepository } from './repositories';

type StorageManagerLike = Pick<StorageManager, 'persist' | 'persisted'>;

function defaultStorage(): StorageManagerLike | undefined {
  return typeof navigator !== 'undefined' ? navigator.storage : undefined;
}

/**
 * Asks the browser not to evict Nouri's data under storage pressure. Called on
 * the first log; asks at most once and records the answer for Settings.
 */
export async function ensurePersistentStorage(
  settings: Pick<SettingsRepository, 'get' | 'set'>,
  storage: StorageManagerLike | undefined = defaultStorage(),
): Promise<boolean | null> {
  const { persistGranted } = await settings.get();
  if (persistGranted !== null) return persistGranted;
  let granted = false;
  try {
    granted = storage ? (await storage.persisted()) || (await storage.persist()) : false;
  } catch {
    granted = false;
  }
  await settings.set('persistGranted', granted);
  return granted;
}
