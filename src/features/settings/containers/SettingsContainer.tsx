import { useState } from 'react';
import type { GoalRepository, SettingsRepository } from '@/data';
import { THEME_PREFERENCES, type ThemePreference } from '@/domain';
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

export interface SettingsContainerProps {
  repos: {
    goals: Pick<GoalRepository, 'live' | 'setFrom'>;
    settings: Pick<SettingsRepository, 'live' | 'set'>;
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
  // Show the tapped theme at once; the saved value catches up via the live query.
  const [pendingTheme, setPendingTheme] = useState<ThemePreference>();

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Settings</h1>
      <SettingsSection title="Goals">
        <GoalsContainer repo={repos.goals} {...(now ? { now } : {})} />
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
      <SettingsSection title="Storage">
        {s && <StorageStatus granted={s.persistGranted} />}
      </SettingsSection>
      <SettingsSection title="About">
        <p className={styles.meta}>Nouri {version}. Your data stays on this device.</p>
      </SettingsSection>
    </div>
  );
}
