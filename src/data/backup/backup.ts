import { SCHEMA_VERSION, type NouriDb } from '../db';
import {
  BACKUP_APP,
  BACKUP_FORMAT,
  PORTABLE_META_KEYS,
  ROW_CHECKS,
  TABLE_NAMES,
  type BackupFile,
  type BackupTables,
} from './format';

export type ImportMode = 'merge' | 'replace';

export interface BackupCheck {
  backup: BackupFile;
  /** Rows per table that will be imported. */
  counts: Record<keyof BackupTables, number>;
  /** Rows that couldn't be read and will be left out. */
  skipped: number;
}

/** Everything on this device, as a versioned file. */
export async function exportBackup(db: NouriDb, now = new Date()): Promise<BackupFile> {
  const tables = {} as Record<keyof BackupTables, unknown[]>;
  await db.transaction('r', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      const rows = await db.table(name).toArray();
      tables[name] =
        name === 'meta'
          ? rows.filter((r: { key: string }) => PORTABLE_META_KEYS.includes(r.key))
          : rows;
    }
  });
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    tables: tables as unknown as BackupTables,
  };
}

/** Checks a parsed file before anything is written. Messages say what to do. */
export function checkBackup(
  json: unknown,
): { ok: true; check: BackupCheck } | { ok: false; error: string } {
  if (typeof json !== 'object' || json === null)
    return {
      ok: false,
      error: 'That file isn’t a Nouri backup. Pick a file you exported from Nouri.',
    };
  const file = json as Partial<Record<keyof BackupFile, unknown>>;
  if (file.app !== BACKUP_APP)
    return {
      ok: false,
      error: 'That file isn’t a Nouri backup. Pick a file you exported from Nouri.',
    };
  if (file.format !== BACKUP_FORMAT || typeof file.schemaVersion !== 'number') {
    return {
      ok: false,
      error: 'This backup was made by a different version of Nouri and can’t be read here.',
    };
  }
  if (file.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        'This backup is from a newer version of Nouri. Update the app (reload it while online), then try again.',
    };
  }
  if (typeof file.tables !== 'object' || file.tables === null)
    return { ok: false, error: 'This backup is incomplete. Try exporting it again.' };
  const raw = file.tables as Partial<Record<keyof BackupTables, unknown>>;
  const tables = {} as Record<keyof BackupTables, unknown[]>;
  const counts = {} as Record<keyof BackupTables, number>;
  let skipped = 0;
  for (const name of TABLE_NAMES) {
    const list = raw[name] ?? [];
    if (!Array.isArray(list))
      return { ok: false, error: 'This backup is damaged. Try exporting it again.' };
    const good = list.filter(
      (r: unknown) =>
        typeof r === 'object' &&
        r !== null &&
        !Array.isArray(r) &&
        ROW_CHECKS[name](r as Record<string, unknown>),
    );
    skipped += list.length - good.length;
    tables[name] = good;
    counts[name] = good.length;
  }
  const backup: BackupFile = {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schemaVersion: file.schemaVersion,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    tables: tables as unknown as BackupTables,
  };
  return { ok: true, check: { backup, counts, skipped } };
}

/**
 * Writes a checked backup in one transaction. "replace" wipes this device's
 * data first; "merge" only adds rows that aren't here yet (nothing is overwritten).
 */
export async function importBackup(
  db: NouriDb,
  backup: BackupFile,
  mode: ImportMode,
): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      const table = db.table(name);
      const rows = backup.tables[name] as unknown[];
      if (mode === 'replace') {
        if (name === 'meta') await table.where('key').anyOf(PORTABLE_META_KEYS).delete();
        else await table.clear();
        await table.bulkPut(rows);
      } else {
        const keys = rows.map(
          (r) =>
            table.schema.primKey.keyPath &&
            (r as Record<string, unknown>)[table.schema.primKey.keyPath as string],
        );
        const existing = await table.bulkGet(keys as never[]);
        await table.bulkAdd(rows.filter((_, i) => existing[i] === undefined));
      }
    }
  });
}
