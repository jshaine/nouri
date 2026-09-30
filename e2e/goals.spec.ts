import { expect, test } from '@playwright/test';

test('sets manual goals and a theme in Settings', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Daily calories').fill('2000');
  await page.getByLabel('Macro split').selectOption('high-protein');
  await page.getByRole('button', { name: 'Save goals' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Goals saved' })).toBeVisible();

  await page.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
  const label = page.getByRole('region', { name: 'Daily Facts' });
  await expect(label).toContainText('Goal 2,000');
  await expect(label).toContainText('2,000 left');
  await expect(label).toContainText('/ 150 g'); // protein 30% of 2000 kcal

  // The forced theme applies before first paint on the next launch.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
