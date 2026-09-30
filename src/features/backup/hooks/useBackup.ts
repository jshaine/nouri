import { useState } from 'react';
import type { BackupCheck, BackupRepository, ImportMode, SettingsRepository } from '@/data';
import { toLocalDate } from '@/domain';

type Phase =
  | { kind: 'idle' }
  | { kind: 'checked'; check: BackupCheck }
  | { kind: 'confirm-replace'; check: BackupCheck }
  | { kind: 'busy' };

export interface BackupMessage {
  kind: 'ok' | 'error';
  text: string;
}

/** Saves the file with the share sheet on phones, or downloads it elsewhere. */
async function deliver(
  json: string,
  filename: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([json], filename, { type: 'application/json' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Nouri backup' });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

export function useBackup(
  repos: { backup: BackupRepository; settings: Pick<SettingsRepository, 'set'> },
  now: () => Date = () => new Date(),
) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [message, setMessage] = useState<BackupMessage>();

  return {
    phase,
    message,
    async exportNow() {
      setMessage(undefined);
      setPhase({ kind: 'busy' });
      try {
        const json = JSON.stringify(await repos.backup.export());
        const result = await deliver(json, `nouri-backup-${toLocalDate(now())}.json`);
        if (result !== 'cancelled') {
          await repos.settings.set('lastBackupAt', now().getTime());
          setMessage({
            kind: 'ok',
            text: 'Backup saved. Keep the file somewhere safe, like Files or Drive.',
          });
        }
      } catch {
        setMessage({
          kind: 'error',
          text: 'Couldn’t create the backup. Try again; your data is unchanged.',
        });
      } finally {
        setPhase({ kind: 'idle' });
      }
    },
    async choose(file: File) {
      setMessage(undefined);
      let json: unknown;
      try {
        json = JSON.parse(await file.text());
      } catch {
        setMessage({
          kind: 'error',
          text: 'That file isn’t a Nouri backup. Pick a file you exported from Nouri.',
        });
        return;
      }
      const r = repos.backup.check(json);
      if (!r.ok) setMessage({ kind: 'error', text: r.error });
      else setPhase({ kind: 'checked', check: r.check });
    },
    askReplace: () => {
      setPhase((p) => (p.kind === 'checked' ? { kind: 'confirm-replace', check: p.check } : p));
    },
    cancel: () => {
      setPhase({ kind: 'idle' });
    },
    async restore(mode: ImportMode) {
      if (phase.kind !== 'checked' && phase.kind !== 'confirm-replace') return;
      const { backup } = phase.check;
      setPhase({ kind: 'busy' });
      try {
        await repos.backup.import(backup, mode);
        setMessage({
          kind: 'ok',
          text:
            mode === 'replace'
              ? 'Restored. This phone now has the backup’s data.'
              : 'Merged. Anything new from the backup was added.',
        });
      } catch {
        setMessage({
          kind: 'error',
          text: 'Couldn’t restore the backup. Nothing was changed; try again.',
        });
      } finally {
        setPhase({ kind: 'idle' });
      }
    },
  };
}
