/** Holds "a new version is waiting" until the user chooses to reload. */
export interface UpdateState {
  available: boolean;
  apply?: () => Promise<void>;
}

type Listener = () => void;

export function createUpdateStore() {
  let state: UpdateState = { available: false };
  const listeners = new Set<Listener>();
  return {
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: () => state,
    /** Called by the service worker registration when an update is ready. */
    offer: (apply: () => Promise<void>) => {
      state = { available: true, apply };
      listeners.forEach((l) => {
        l();
      });
    },
    /** "Later": hide until the next update or launch. */
    dismiss: () => {
      state = { available: false };
      listeners.forEach((l) => {
        l();
      });
    },
  };
}

export type UpdateStore = ReturnType<typeof createUpdateStore>;

/** The app-wide store, fed by registerServiceWorker in main.tsx. */
export const updateStore = createUpdateStore();
