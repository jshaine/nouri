import type { BackupRepository, SettingsRepository } from '@/data';
import { useLive } from '@/ui';
import { BackupPanel } from '../components/BackupPanel';
import { useBackup } from '../hooks/useBackup';

export interface BackupContainerProps {
  repos: { backup: BackupRepository; settings: Pick<SettingsRepository, 'live' | 'set'> };
  now?: () => Date;
}

export function BackupContainer({ repos, now }: BackupContainerProps) {
  const settings = useLive(() => repos.settings.live(), [repos.settings]);
  const b = useBackup(repos, now);
  const last = settings.value?.lastBackupAt;
  const checked =
    b.phase.kind === 'checked' || b.phase.kind === 'confirm-replace' ? b.phase.check : undefined;
  return (
    <BackupPanel
      lastBackup={
        last
          ? new Date(last).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : undefined
      }
      busy={b.phase.kind === 'busy'}
      checked={checked}
      confirmingReplace={b.phase.kind === 'confirm-replace'}
      message={b.message}
      onExport={() => {
        void b.exportNow();
      }}
      onFile={(f) => {
        void b.choose(f);
      }}
      onMerge={() => {
        void b.restore('merge');
      }}
      onAskReplace={b.askReplace}
      onReplace={() => {
        void b.restore('replace');
      }}
      onCancel={b.cancel}
    />
  );
}
