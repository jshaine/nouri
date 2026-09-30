/**
 * Loads, decodes and indexes the food list off the main thread, so the UI
 * never stutters or shifts while ~8,000 foods are indexed.
 */
import { createInProcessFoodDatabase, type FoodDatabase } from './foodDatabase';
import { loadBundledFoods } from './loadFoods';
import type { WorkerRequest, WorkerResponse } from './protocol';

/** The parts of the worker global we use (avoids mixing DOM and WebWorker libs). */
interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
}
const scope = self as unknown as WorkerScope;
let db: FoodDatabase | undefined;

const reply = (message: WorkerResponse) => {
  scope.postMessage(message);
};

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    db = createInProcessFoodDatabase(() => loadBundledFoods((url) => fetch(url), msg.base));
    db.ready().then(
      (info) => {
        reply({ type: 'ready', info });
      },
      (error: unknown) => {
        reply({ type: 'failed', message: error instanceof Error ? error.message : String(error) });
      },
    );
    return;
  }
  if (!db) return;
  if (msg.type === 'search') {
    void db.search(msg.query, msg.limit).then((foods) => {
      reply({ type: 'search', id: msg.id, foods });
    });
  } else {
    void db.get(msg.key).then((food) => {
      reply({ type: 'get', id: msg.id, food });
    });
  }
};
