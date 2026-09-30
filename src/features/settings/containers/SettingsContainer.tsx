import { useState } from 'react';
import type {
  BackupRepository,
  GoalRepository,
  ProfileRepository,
  SettingsRepository,
} from '@/data';
import { THEME_PREFERENCES, type ThemePreference } from '@/domain';
import { BackupContainer } from '@/features/backup';
import { GoalsContainer } from '@/features/goals';
import { SegmentedControl, useDocumentTitle, useLive } from '@/ui';
import { SettingsSection } from '../components/SettingsSection';
import { StorageStatus } from '../components/StorageStatus';
import styles from '../components/Settings.module.css';

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};
const THEME_OPTIONS = THEME_PREFERENCES.map((t) => ({ value: t, label: THEME_LABEL[t] }));
const EXERCISE_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
] as const;

export interface SettingsContainerProps {
  repos: {
    goals: Pick<GoalRepository, 'live' | 'setFrom'>;
    settings: Pick<SettingsRepository, 'live' | 'set'>;
    profile: Pick<ProfileRepository, 'live' | 'update'>;
    backup: BackupRepository;
  };
  now?: () => Date;
  version?: string;
}

export function SettingsContainer({
  repos,
  now,
  version = __APP_VERSION__,
}: SettingsContainerProps) {
  useDocumentTitle('Settings');
  const settings = useLive(() => repos.settings.live(), [repos.settings]);
  const s = settings.value;
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const [pendingExercise, setPendingExercise] = useState<boolean>();
  // Show the tapped theme at once; the saved value catches up via the live query.
  const [pendingTheme, setPendingTheme] = useState<ThemePreference>();

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Settings</h1>
      <SettingsSection title="Goals">
        <GoalsContainer repo={repos.goals} {...(now ? { now } : {})} />
      </SettingsSection>
      <SettingsSection title="Exercise calories">
        {profile.value && (
          <>
            <SegmentedControl
              label="Add exercise to the day’s goal"
              options={EXERCISE_OPTIONS}
              value={(pendingExercise ?? profile.value.exerciseCaloriesEnabled) ? 'on' : 'off'}
              onChange={(v) => {
                setPendingExercise(v === 'on');
                void repos.profile.update({ exerciseCaloriesEnabled: v === 'on' });
              }}
            />
            <p className={styles.meta}>
              When on, Today gets an Exercise field and that day’s goal grows by the calories you
              burned.
            </p>
          </>
        )}
      </SettingsSection>
      <SettingsSection title="Appearance">
        {s && (
          <SegmentedControl
            label="Theme"
            options={THEME_OPTIONS}
            value={pendingTheme ?? s.theme}
            onChange={(theme) => {
              setPendingTheme(theme);
              void repos.settings.set('theme', theme);
            }}
          />
        )}
      </SettingsSection>
      <SettingsSection title="Backup">
        <BackupContainer repos={repos} {...(now ? { now } : {})} />
      </SettingsSection>
      <SettingsSection title="Storage">
        {s && <StorageStatus granted={s.persistGranted} />}
      </SettingsSection>
      <SettingsSection title="About">
        <p className={styles.meta}>Nouri {version}. Your data stays on this device.</p>
      </SettingsSection>
    </div>
  );
}
