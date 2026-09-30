import type { Entry, LocalDate, NewEntry } from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';
import type { EntryRow } from '../rows';

export interface EntryRepository {
  liveForDate(date: LocalDate): Live<Entry[]>;
  /** Entries between two days, inclusive. */
  forRange(from: LocalDate, to: LocalDate): Promise<Entry[]>;
  add(entry: NewEntry): Promise<Entry>;
  update(entry: Entry): Promise<void>;
  /** Deletes and returns the entry, so it can be restored (undo). */
  remove(id: string): Promise<Entry | undefined>;
  restore(entry: Entry): Promise<void>;
  /** Whether anything has ever been logged (for first-log behavior). */
  hasAny(): Promise<boolean>;
}

export function rowToEntry(row: EntryRow): Entry {
  const { kcal, p, c, f, ...rest } = row;
  return { ...rest, totals: { kcal, p, c, f } };
}

export function entryToRow(entry: Entry): EntryRow {
  const { totals, ...rest } = entry;
  return { ...rest, ...totals };
}

const byCreated = (a: EntryRow, b: EntryRow) => a.createdAt - b.createdAt;

export function entryRepository({ db, now, newId }: RepoContext): EntryRepository {
  return {
    liveForDate: (date) =>
      live(async () =>
        (await db.entries.where('date').equals(date).toArray()).sort(byCreated).map(rowToEntry),
      ),

    async forRange(from, to) {
      const rows = await db.entries.where('date').between(from, to, true, true).toArray();
      return rows.sort(byCreated).map(rowToEntry);
    },

    async add(input) {
      const entry: Entry = { ...input, id: newId(), createdAt: now() };
      await db.entries.add(entryToRow(entry));
      return entry;
    },

    async update(entry) {
      const count = await db.entries.update(entry.id, entryToRow(entry));
      if (count === 0) throw new Error('That entry no longer exists.');
    },

    async remove(id) {
      return db.transaction('rw', db.entries, async () => {
        const row = await db.entries.get(id);
        if (!row) return undefined;
        await db.entries.delete(id);
        return rowToEntry(row);
      });
    },

    async restore(entry) {
      await db.entries.put(entryToRow(entry));
    },

    async hasAny() {
      return (await db.entries.limit(1).count()) > 0;
    },
  };
}
