import { expect, test } from '@playwright/test';

test('first launch: details → suggested goals from the calculator → Today', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'Welcome to Nouri' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByLabel('Current weight').fill('65');
  await page.getByRole('radio', { name: 'Female' }).check();
  await page.getByLabel('Birth date').fill('1996-05-01');
  await page.getByLabel('Birth date').blur();
  await page.getByLabel('Height').fill('160');
  await page.getByLabel('Height').blur();
  await page.getByLabel('Goal weight').fill('58');
  await page.getByLabel('Goal weight').blur();
  await page.locator('label', { hasText: 'Lightly active' }).click();
  await expect(page.getByRole('radio', { name: /Lightly active/ })).toBeChecked();
  await page.getByLabel('Weekly goal').selectOption({ label: 'Maintain my weight' });
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Suggested goals' })).toBeVisible();
  await expect(page.getByText('Daily goal')).toBeVisible();
  await page.getByText('How this is calculated').click();
  await expect(page.getByText(/= 1,339 kcal\./)).toBeVisible();
  await page.getByRole('button', { name: 'Use these goals' }).click();
  await expect(page.getByText(/Goals updated/)).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('button', { name: 'Start logging' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: 'Daily Facts' })).toContainText('Goal 1,840');

  // Setup doesn't come back once finished.
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});
