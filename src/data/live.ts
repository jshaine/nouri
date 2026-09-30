import { liveQuery } from 'dexie';

/** A value that re-emits whenever the tables it read from change. */
export interface Live<T> {
  subscribe(next: (value: T) => void, error?: (error: unknown) => void): { unsubscribe(): void };
}

export function live<T>(query: () => Promise<T>): Live<T> {
  const observable = liveQuery(query);
  return {
    subscribe(next, error) {
      const sub = observable.subscribe(next, error ?? null);
      return {
        unsubscribe() {
          sub.unsubscribe();
        },
      };
    },
  };
}
