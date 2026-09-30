import type { NouriDb } from './db';

/** What repositories need besides the database; injectable for tests. */
export interface RepoContext {
  db: NouriDb;
  now: () => number;
  newId: () => string;
}

export function defaultContext(db: NouriDb): RepoContext {
  return { db, now: () => Date.now(), newId: () => crypto.randomUUID() };
}
