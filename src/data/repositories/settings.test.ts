import { DEFAULT_SETTINGS } from './settings';
import { createTestRepositories, firstValue } from '../testing';

describe('settingsRepository', () => {
  it('starts with defaults', async () => {
    const { repos } = createTestRepositories();
    expect(await repos.settings.get()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves values and emits them live', async () => {
    const { repos } = createTestRepositories();
    await repos.settings.set('theme', 'dark');
    await repos.settings.set('lastBackupAt', 123);
    await repos.settings.set('persistGranted', true);
    await repos.settings.set('onboardingDone', true);
    expect(await firstValue(repos.settings.live())).toEqual({
      theme: 'dark',
      lastBackupAt: 123,
      persistGranted: true,
      onboardingDone: true,
    });
  });

  it('falls back to defaults for malformed stored values', async () => {
    const { repos, db } = createTestRepositories();
    await db.meta.bulkPut([
      { key: 'theme', value: 'purple' },
      { key: 'lastBackupAt', value: 'yesterday' },
      { key: 'persistGranted', value: 1 },
      { key: 'onboardingDone', value: 'yes' },
    ]);
    expect(await repos.settings.get()).toEqual(DEFAULT_SETTINGS);
  });
});
