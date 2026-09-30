import type { Food } from '@/domain';
import {
  createInProcessFoodDatabase,
  type FoodDatabase,
  type FoodDatabaseInfo,
} from './foodDatabase';
import { loadBundledFoods } from './loadFoods';
import type { WorkerRequest, WorkerResponse } from './protocol';

export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  onmessage: ((event: { data: WorkerResponse }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  terminate(): void;
}

type Target =
  | { kind: 'worker'; worker: WorkerLike; info: FoodDatabaseInfo }
  | { kind: 'local'; db: FoodDatabase };

type Answer = Food[] | Food | undefined;

/**
 * Talks to the food index worker, starting it on first use. If the worker
 * can't start (old browser, blocked script), indexes in-process instead.
 */
export function createWorkerFoodDatabase(
  createWorker: () => WorkerLike,
  fallback: () => FoodDatabase,
  base: string,
): FoodDatabase {
  const pending = new Map<number, (answer: Answer) => void>();
  let nextId = 0;
  let started: Promise<Target> | undefined;

  const local = (): Target => ({ kind: 'local', db: fallback() });

  const start = () =>
    (started ??= new Promise<Target>((resolve, reject) => {
      let worker: WorkerLike;
      try {
        worker = createWorker();
      } catch {
        resolve(local());
        return;
      }
      let ready = false;
      worker.onerror = () => {
        if (ready) return;
        worker.terminate();
        resolve(local());
      };
      worker.onmessage = ({ data }) => {
        if (data.type === 'ready') {
          ready = true;
          resolve({ kind: 'worker', worker, info: data.info });
        } else if (data.type === 'failed') {
          reject(new Error(data.message));
        } else {
          const done = pending.get(data.id);
          pending.delete(data.id);
          done?.(data.type === 'search' ? data.foods : data.food);
        }
      };
      worker.postMessage({ type: 'init', base });
    }));

  const ask = (worker: WorkerLike, request: (id: number) => WorkerRequest) =>
    new Promise<Answer>((resolve) => {
      nextId += 1;
      pending.set(nextId, resolve);
      worker.postMessage(request(nextId));
    });

  return {
    async ready() {
      const t = await start();
      return t.kind === 'worker' ? t.info : t.db.ready();
    },
    async search(query, limit) {
      const t = await start();
      if (t.kind === 'local') return t.db.search(query, limit);
      return (await ask(t.worker, (id) => ({ type: 'search', id, query, limit }))) as Food[];
    },
    async get(key) {
      const t = await start();
      if (t.kind === 'local') return t.db.get(key);
      return (await ask(t.worker, (id) => ({ type: 'get', id, key }))) as Food | undefined;
    },
  };
}

/** The app's food database: a worker when available, else in-process. */
export function openFoodDatabase(base: string = import.meta.env.BASE_URL): FoodDatabase {
  const load = () => loadBundledFoods((url) => fetch(url), base);
  if (typeof Worker === 'undefined') return createInProcessFoodDatabase(load);
  return createWorkerFoodDatabase(
    () =>
      new Worker(new URL('./foodIndex.worker.ts', import.meta.url), {
        type: 'module',
      }) as unknown as WorkerLike,
    () => createInProcessFoodDatabase(load),
    base,
  );
}
