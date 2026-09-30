import { isThemePreference, type ThemePreference } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';

/** App-level state kept in the meta table. */
export interface Settings {
  theme: ThemePreference;
  /** Epoch ms of the last backup export, or null if never. */
  lastBackupAt: number | null;
  /** Result of navigator.storage.persist(); null until asked. */
  persistGranted: boolean | null;
  onboardingDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  lastBackupAt: null,
  persistGranted: null,
  onboardingDone: false,
};

type Validators = { [K in keyof Settings]: (v: unknown) => v is Settings[K] };
const isNullableNumber = (v: unknown): v is number | null => v === null || typeof v === 'number';
const isNullableBoolean = (v: unknown): v is boolean | null => v === null || typeof v === 'boolean';
const VALID: Validators = {
  theme: isThemePreference,
  lastBackupAt: isNullableNumber,
  persistGranted: isNullableBoolean,
  onboardingDone: (v): v is boolean => typeof v === 'boolean',
};
const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

export interface SettingsRepository {
  live(): Live<Settings>;
  get(): Promise<Settings>;
  set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void>;
}

export function settingsRepository({ db }: RepoContext): SettingsRepository {
  const get = async (): Promise<Settings> => {
    const rows = await db.meta.bulkGet(KEYS);
    const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    KEYS.forEach((key, i) => {
      const value = rows[i]?.value;
      // Ignore anything malformed (old versions, bad imports): fall back to defaults.
      if (VALID[key](value)) settings[key] = value;
    });
    return settings as unknown as Settings;
  };

  return {
    live: () => live(get),
    get,
    async set(key, value) {
      await db.meta.put({ key, value });
    },
  };
}
