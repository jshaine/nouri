import type { Food } from '@/domain';
import { createInProcessFoodDatabase } from './foodDatabase';
import type { WorkerRequest, WorkerResponse } from './protocol';
import { createWorkerFoodDatabase, type WorkerLike } from './workerClient';

const rice: Food = {
  key: 'usda:1',
  source: 'usda',
  name: 'Rice, white, cooked',
  aliases: ['kanin'],
  basis: { kind: '100g' },
  nutrients: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
  portions: [],
};
const local = () =>
  createInProcessFoodDatabase(() => Promise.resolve({ foods: [rice], sources: { usda: 'USDA' } }));

/** A fake worker that runs the in-process database, like the real one. */
function fakeWorker(behavior: 'ok' | 'fail' | 'crash' = 'ok') {
  const db = local();
  const sent: WorkerRequest[] = [];
  const terminate = vi.fn();
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    terminate,
    postMessage(msg) {
      sent.push(msg);
      const reply = (data: WorkerResponse) => {
        queueMicrotask(() => {
          worker.onmessage?.({ data });
        });
      };
      if (msg.type === 'init') {
        if (behavior === 'crash') {
          queueMicrotask(() => {
            worker.onerror?.(new Error('script error'));
          });
        } else if (behavior === 'fail')
          reply({ type: 'failed', message: 'Couldn’t load the food list.' });
        else
          void db.ready().then((info) => {
            reply({ type: 'ready', info });
          });
      } else if (msg.type === 'search') {
        void db.search(msg.query, msg.limit).then((foods) => {
          reply({ type: 'search', id: msg.id, foods });
        });
      } else {
        void db.get(msg.key).then((food) => {
          reply({ type: 'get', id: msg.id, food });
        });
      }
    },
  };
  return { worker, sent, terminate };
}

describe('createWorkerFoodDatabase', () => {
  it('starts the worker lazily, then searches and looks up through it', async () => {
    const { worker, sent } = fakeWorker();
    const create = vi.fn(() => worker);
    const db = createWorkerFoodDatabase(create, local, '/');
    expect(create).not.toHaveBeenCalled();
    expect(await db.ready()).toEqual({ count: 1, sources: { usda: 'USDA' } });
    expect((await db.search('kanin')).map((f) => f.key)).toEqual(['usda:1']);
    expect(await db.get('usda:1')).toEqual(rice);
    expect(await db.get('usda:2')).toBeUndefined();
    expect(create).toHaveBeenCalledOnce();
    expect(sent[0]).toEqual({ type: 'init', base: '/' });
  });

  it('matches concurrent answers to their questions', async () => {
    const db = createWorkerFoodDatabase(() => fakeWorker().worker, local, '/');
    const [a, b] = await Promise.all([db.search('kanin'), db.search('zzzz')]);
    expect(a).toHaveLength(1);
    expect(b).toEqual([]);
  });

  it('reports a load failure with its message', async () => {
    const db = createWorkerFoodDatabase(() => fakeWorker('fail').worker, local, '/');
    await expect(db.ready()).rejects.toThrow('Couldn’t load the food list.');
  });

  it('falls back to in-process when the worker crashes or cannot be created', async () => {
    const crashing = fakeWorker('crash');
    const db = createWorkerFoodDatabase(() => crashing.worker, local, '/');
    expect((await db.search('kanin')).map((f) => f.key)).toEqual(['usda:1']);
    expect(crashing.terminate).toHaveBeenCalled();

    const db2 = createWorkerFoodDatabase(
      () => {
        throw new Error('Workers blocked');
      },
      local,
      '/',
    );
    expect(await db2.ready()).toEqual({ count: 1, sources: { usda: 'USDA' } });
    expect(await db2.get('usda:1')).toEqual(rice);
  });
});
