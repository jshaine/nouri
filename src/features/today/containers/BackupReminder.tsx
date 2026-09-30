import { useState } from 'react';
import { Link } from 'react-router';
import type { SettingsRepository } from '@/data';
import { backupDue } from '@/domain';
import { Button, useLive } from '@/ui';
import styles from './TodayContainer.module.css';

interface BackupReminderProps {
  settings: Pick<SettingsRepository, 'live'>;
  hasData: boolean;
  now: () => Date;
}

/** A gentle nudge when the last backup is over 14 days old (or never). */
export function BackupReminder({ settings, hasData, now }: BackupReminderProps) {
  const s = useLive(() => settings.live(), [settings]);
  const [dismissed, setDismissed] = useState(false);
  if (!s.value || dismissed || !backupDue(s.value.lastBackupAt, now(), hasData)) return null;
  return (
    <div className={styles.reminder} role="status">
      <p>
        Your log lives only on this phone. <Link to="/settings">Back up now</Link> to keep a copy.
      </p>
      <Button
        variant="ghost"
        onClick={() => {
          setDismissed(true);
        }}
      >
        Not now
      </Button>
    </div>
  );
}
