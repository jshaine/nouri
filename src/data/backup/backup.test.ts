import type { LocalDate } from '@/domain';
import { SCHEMA_VERSION } from '../db';
import { createTestRepositories, firstValue } from '../testing';
import { checkBackup, exportBackup, importBackup } from './backup';

const day = (s: string) => s as LocalDate;

async function seeded() {
  const t = createTestRepositories();
  const { repos } = t;
  const food = await repos.customFoods.create({
    name: 'Turon',
    aliases: [],
    basis: { kind: 'serving' },
    p: 2,
    c: 40,
    f: 8,
  });
  await repos.entries.add({
    date: day('2026-09-30'),
    meal: 'snacks',
    foodKey: food.key,
    amount: 1,
    unit: { kind: 'portion', label: '1 serving' },
    name: 'Turon',
    source: 'custom',
    totals: { kcal: 240, p: 2, c: 40, f: 8 },
  });
  await repos.goals.setFrom(day('2026-09-01'), {
    kcal: 1850,
    p: 1,
    c: 1,
    f: 1,
    macroMode: 'grams',
  });
  await repos.profile.update({ sex: 'female', heightCm: 160 });
  await repos.weights.set(day('2026-09-30'), 65);
  await repos.exercise.set(day('2026-09-30'), 200);
  await repos.usage.recordUse(food.key);
  await repos.usage.setFavorite('usda:1', true);
  await repos.portionOverrides.save('usda:1', { label: '1 cup rice', grams: 160 });
  await repos.settings.set('theme', 'dark');
  await repos.settings.set('onboardingDone', true);
  await repos.settings.set('lastBackupAt', 123);
  return t;
}

describe('backup', () => {
  it('exports every table as a versioned file, without device-only state', async () => {
    const { db } = await seeded();
    const file = await exportBackup(db, new Date('2026-10-01T00:00:00Z'));
    expect(file).toMatchObject({
      app: 'nouri',
      format: 1,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-10-01T00:00:00.000Z',
    });
    const counts = Object.fromEntries(
      Object.entries(file.tables).map(([k, v]) => [k, (v as unknown[]).length]),
    );
    expect(counts).toEqual({
      customFoods: 1,
      portionOverrides: 1,
      entries: 1,
      goals: 1,
      profile: 1,
      weights: 1,
      exercise: 1,
      recents: 1,
      favorites: 1,
      meta: 2,
    });
    expect(file.tables.meta.map((m) => m.key).sort()).toEqual(['onboardingDone', 'theme']);
  });

  it('round-trips through JSON into an empty device (replace)', async () => {
    const { db } = await seeded();
    const json: unknown = JSON.parse(JSON.stringify(await exportBackup(db)));
    const target = createTestRepositories();
    const result = checkBackup(json);
    if (!result.ok) throw new Error(result.error);
    expect(result.check.skipped).toBe(0);
    await importBackup(target.db, result.check.backup, 'replace');
    expect((await firstValue(target.repos.entries.liveForDate(day('2026-09-30'))))[0]?.name).toBe(
      'Turon',
    );
    expect((await target.repos.profile.get()).heightCm).toBe(160);
    expect((await target.repos.settings.get()).theme).toBe('dark');
    expect(await firstValue(target.repos.portionOverrides.live('usda:1'))).toEqual([
      { label: '1 cup rice', grams: 160 },
    ]);
  });

  it('replace wipes what was here; merge only adds what is missing', async () => {
    const source = await seeded();
    const file = await exportBackup(source.db);
    const target = createTestRepositories();
    await target.repos.weights.set(day('2026-09-30'), 70); // same day, different id
    await target.repos.goals.setFrom(day('2026-09-01'), {
      kcal: 2000,
      p: 1,
      c: 1,
      f: 1,
      macroMode: 'grams',
    });
    const goalId = (await target.repos.goals.all())[0]!.id;
    // Give the backup's goal the same id: merge must not overwrite it.
    file.tables.goals[0]!.id = goalId;

    await importBackup(target.db, file, 'merge');
    expect((await target.repos.goals.all()).map((g) => g.kcal)).toEqual([2000]);
    expect(await firstValue(target.repos.weights.live())).toHaveLength(2);

    await importBackup(target.db, file, 'replace');
    expect((await target.repos.goals.all()).map((g) => g.kcal)).toEqual([1850]);
    expect((await firstValue(target.repos.weights.live())).map((w) => w.kg)).toEqual([65]);
  });

  it.each([
    [null, /isn’t a Nouri backup/],
    [{ app: 'other' }, /isn’t a Nouri backup/],
    [{ app: 'nouri', format: 2, schemaVersion: 1 }, /different version/],
    [
      { app: 'nouri', format: 1, schemaVersion: SCHEMA_VERSION + 1, tables: {} },
      /newer version of Nouri/,
    ],
    [{ app: 'nouri', format: 1, schemaVersion: 1 }, /incomplete/],
    [{ app: 'nouri', format: 1, schemaVersion: 1, tables: { entries: 'x' } }, /damaged/],
  ])('rejects %j', (json, message) => {
    const r = checkBackup(json);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });

  it('skips rows the app could not read and counts them', async () => {
    const { db } = await seeded();
    const file = await exportBackup(db);
    const tables = {
      ...file.tables,
      entries: [...file.tables.entries, { id: 'bad', date: 'yesterday' }],
      weights: [...file.tables.weights, 'nope'],
    };
    const r = checkBackup({ ...file, tables });
    expect(r.ok && r.check).toMatchObject({ skipped: 2, counts: { entries: 1, weights: 1 } });
  });

  it('keeps device-only settings on replace', async () => {
    const { db } = await seeded();
    const file = await exportBackup(db);
    const target = createTestRepositories();
    await target.repos.settings.set('persistGranted', true);
    await importBackup(target.db, file, 'replace');
    expect((await target.repos.settings.get()).persistGranted).toBe(true);
  });
});
