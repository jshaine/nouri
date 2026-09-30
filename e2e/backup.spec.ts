import { expect, test } from '@playwright/test';
import { skipOnboarding } from './helpers';

test('backs up and restores into a fresh device', async ({ page, browser }) => {
  // Headless browsers can't show the share sheet; test the download path.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined });
  });
  await skipOnboarding(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Add food' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add food' });
  await sheet.getByRole('tab', { name: 'Manual' }).click();
  await sheet.getByLabel('Name', { exact: true }).fill('Lola’s turon');
  await sheet.getByLabel('Protein').fill('2');
  await sheet.getByLabel('Carbs').fill('40');
  await sheet.getByLabel('Fat').fill('8');
  await sheet.getByRole('button', { name: 'Save food' }).click();
  await page
    .getByRole('dialog', { name: 'Lola’s turon' })
    .getByRole('button', { name: 'Add to log' })
    .click();
  await expect(page.getByRole('main')).toContainText('Lola’s turon');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Settings' })
    .click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^nouri-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await download.path();
  await expect(page.getByText(/Backup saved/)).toBeVisible();

  // A brand-new browser profile stands in for a new phone.
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await skipOnboarding(other);
  await other.getByLabel('Restore from a backup').setInputFiles(file);
  await expect(other.getByRole('group', { name: 'Restore options' })).toContainText(
    '1 entry, 1 food',
  );
  await other.getByRole('button', { name: 'Replace everything' }).click();
  await other.getByRole('button', { name: 'Yes, replace' }).click();
  await expect(other.getByText(/^Restored\./)).toBeVisible();
  await other.goto('/');
  await expect(other.getByRole('button', { name: /Lola’s turon/ })).toBeVisible();
  await fresh.close();
});
