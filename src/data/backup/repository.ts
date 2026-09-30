import type { RepoContext } from '../context';
import {
  checkBackup,
  exportBackup,
  importBackup,
  type BackupCheck,
  type ImportMode,
} from './backup';
import type { BackupFile } from './format';

export interface BackupRepository {
  export(): Promise<BackupFile>;
  check(json: unknown): { ok: true; check: BackupCheck } | { ok: false; error: string };
  import(backup: BackupFile, mode: ImportMode): Promise<void>;
}

export function backupRepository({ db, now }: RepoContext): BackupRepository {
  return {
    export: () => exportBackup(db, new Date(now())),
    check: checkBackup,
    import: (backup, mode) => importBackup(db, backup, mode),
  };
}
