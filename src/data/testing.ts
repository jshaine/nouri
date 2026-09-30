import { NouriDb } from './db';
import { createRepositories, type Repositories } from './repositories';

let dbCount = 0;

/**
 * Fresh repositories on an isolated fake-indexeddb database, with a
 * controllable clock and sequential ids. For tests only.
 */
export function createTestRepositories(start = Date.UTC(2026, 8, 30, 4)) {
  dbCount += 1;
  const db = new NouriDb(`nouri-test-${dbCount}`);
  const clock = { now: start };
  let id = 0;
  const repos: Repositories = createRepositories({
    db,
    now: () => clock.now,
    newId: () => `id-${++id}`,
  });
  return { db, repos, clock, tick: (ms = 1000) => (clock.now += ms) };
}

/** Resolves with the first value a Live emits. */
export function firstValue<T>(source: {
  subscribe(next: (v: T) => void, error?: (e: unknown) => void): { unsubscribe(): void };
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const sub = source.subscribe((v) => {
      resolve(v);
      queueMicrotask(() => {
        sub.unsubscribe();
      });
    }, reject);
  });
}
