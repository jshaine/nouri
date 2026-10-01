import { expect, test } from '@playwright/test';

test('first launch: about you → activity → goal → plan → Today', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'Welcome to Nouri' })).toBeVisible();
  await page.getByRole('button', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible();
  await page.getByRole('radio', { name: 'Female' }).check();
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Height').fill('160');
  await page.getByLabel('Current weight').fill('65');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'How active are you?' })).toBeVisible();
  await page.locator('label', { hasText: 'Lightly active' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Your goal' })).toBeVisible();
  await page.locator('label', { hasText: 'Lose weight' }).click();
  await page.getByLabel('Goal weight').fill('58');
  await expect(page.getByRole('radio', { name: /Lose 0.5 kg per week/ })).toBeChecked();
  await page.getByRole('button', { name: 'See my plan' }).click();

  await expect(page.getByRole('heading', { name: 'Your plan' })).toBeVisible();
  await page.getByText('How this is calculated').click();
  await expect(page.getByText(/= 1,339 kcal\./)).toBeVisible();
  await page.getByRole('button', { name: 'Use this plan and start' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: 'Daily Facts' })).toContainText('Goal 1,290');

  // Setup doesn't come back once finished, and the plan stays editable in Settings.
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});
