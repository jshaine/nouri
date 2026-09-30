import { useEffect, useState, useSyncExternalStore, type DependencyList } from 'react';

/** Anything that pushes values over time (e.g. a repository's live query). */
export interface Subscribable<T> {
  subscribe(next: (value: T) => void, error?: (error: unknown) => void): { unsubscribe(): void };
}

export type LiveState<T> =
  | { status: 'loading'; value: T | undefined }
  | { status: 'ready'; value: T }
  | { status: 'error'; value: T | undefined; error: unknown };

/** Holds the latest state of whichever source is connected. */
class LiveStore<T> {
  private state: LiveState<T> = { status: 'loading', value: undefined };
  private readonly listeners = new Set<() => void>();
  private sub: { unsubscribe(): void } | undefined;

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = () => this.state;

  connect(source: Subscribable<T>) {
    this.disconnect();
    // Keep the previous value while the new source loads.
    this.set({ status: 'loading', value: this.state.value });
    this.sub = source.subscribe(
      (value) => {
        this.set({ status: 'ready', value });
      },
      (error) => {
        this.set({ status: 'error', value: this.state.value, error });
      },
    );
  }

  disconnect() {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  private set(next: LiveState<T>) {
    this.state = next;
    this.listeners.forEach((l) => {
      l();
    });
  }
}

/**
 * Subscribes to `create()` and re-subscribes when `deps` change. While a new
 * source loads, the previous value is kept so screens don't flash empty.
 */
export function useLive<T>(create: () => Subscribable<T>, deps: DependencyList): LiveState<T> {
  const [store] = useState(() => new LiveStore<T>());

  useEffect(() => {
    store.connect(create());
    return () => {
      store.disconnect();
    };
    // The caller owns the dependency list, like useMemo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
