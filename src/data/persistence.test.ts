import { ensurePersistentStorage } from './persistence';
import { createTestRepositories } from './testing';

const storage = (persisted: boolean, persist: boolean | Error) => ({
  persisted: vi.fn(() => Promise.resolve(persisted)),
  persist: vi.fn(() =>
    persist instanceof Error ? Promise.reject(persist) : Promise.resolve(persist),
  ),
});

describe('ensurePersistentStorage', () => {
  it('asks once and remembers the answer', async () => {
    const { repos } = createTestRepositories();
    const s = storage(false, true);
    expect(await ensurePersistentStorage(repos.settings, s)).toBe(true);
    expect(await ensurePersistentStorage(repos.settings, s)).toBe(true);
    expect(s.persist).toHaveBeenCalledOnce();
    expect((await repos.settings.get()).persistGranted).toBe(true);
  });

  it('does not ask again when already persisted', async () => {
    const { repos } = createTestRepositories();
    const s = storage(true, false);
    expect(await ensurePersistentStorage(repos.settings, s)).toBe(true);
    expect(s.persist).not.toHaveBeenCalled();
  });

  it('records a refusal, a failure, or no support as not granted', async () => {
    for (const s of [storage(false, false), storage(false, new Error('nope')), undefined]) {
      const { repos } = createTestRepositories();
      expect(await ensurePersistentStorage(repos.settings, s)).toBe(false);
      expect((await repos.settings.get()).persistGranted).toBe(false);
    }
  });
});
