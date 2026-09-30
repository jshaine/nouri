import type { LocalDate, NewEntry } from '@/domain';
import { createTestRepositories, firstValue } from '../testing';

const day = (s: string) => s as LocalDate;
const entry = (over: Partial<NewEntry> = {}): NewEntry => ({
  date: day('2026-09-30'),
  meal: 'lunch',
  foodKey: 'custom:a',
  amount: 1,
  unit: { kind: 'portion', label: '1 serving' },
  name: 'Adobo',
  source: 'custom',
  totals: { kcal: 290, p: 28, c: 4, f: 18 },
  ...over,
});

describe('entryRepository', () => {
  it('adds entries with an id and timestamp and lists them by day', async () => {
    const { repos, tick } = createTestRepositories();
    const a = await repos.entries.add(entry());
    tick();
    await repos.entries.add(entry({ date: day('2026-09-29') }));
    tick();
    const c = await repos.entries.add(entry({ meal: 'dinner' }));
    const today = await firstValue(repos.entries.liveForDate(day('2026-09-30')));
    expect(today.map((e) => e.id)).toEqual([a.id, c.id]);
    expect(today[0]).toEqual(a);
  });

  it('reads an inclusive range', async () => {
    const { repos } = createTestRepositories();
    for (const d of ['2026-09-27', '2026-09-28', '2026-09-30', '2026-10-01'])
      await repos.entries.add(entry({ date: day(d) }));
    const range = await repos.entries.forRange(day('2026-09-28'), day('2026-09-30'));
    expect(range.map((e) => e.date)).toEqual(['2026-09-28', '2026-09-30']);
    const liveRange = await firstValue(
      repos.entries.liveForRange(day('2026-09-28'), day('2026-09-30')),
    );
    expect(liveRange.map((e) => e.date)).toEqual(['2026-09-28', '2026-09-30']);
  });

  it('updates and rejects updates to missing entries', async () => {
    const { repos } = createTestRepositories();
    const a = await repos.entries.add(entry());
    await repos.entries.update({ ...a, meal: 'snacks' });
    expect((await firstValue(repos.entries.liveForDate(a.date)))[0]?.meal).toBe('snacks');
    await expect(repos.entries.update({ ...a, id: 'gone' })).rejects.toThrow(/no longer exists/);
  });

  it('removes and restores an entry exactly (undo)', async () => {
    const { repos } = createTestRepositories();
    const a = await repos.entries.add(entry());
    const removed = await repos.entries.remove(a.id);
    expect(removed).toEqual(a);
    expect(await firstValue(repos.entries.liveForDate(a.date))).toEqual([]);
    await repos.entries.restore(removed!);
    expect(await firstValue(repos.entries.liveForDate(a.date))).toEqual([a]);
    expect(await repos.entries.remove('gone')).toBeUndefined();
  });

  it('knows whether anything was ever logged', async () => {
    const { repos } = createTestRepositories();
    expect(await repos.entries.hasAny()).toBe(false);
    await repos.entries.add(entry());
    expect(await repos.entries.hasAny()).toBe(true);
  });

  it('keeps the snapshot when the food changes', async () => {
    const { repos } = createTestRepositories();
    const a = await repos.entries.add(entry());
    await repos.customFoods.remove('a');
    expect((await firstValue(repos.entries.liveForDate(a.date)))[0]?.totals).toEqual(a.totals);
  });
});
