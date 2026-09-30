import { expect, test } from '@playwright/test';

test('app loads on Today and switches tabs', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav).toBeVisible();
  await expect(page).toHaveTitle('Today · Nouri');
  await nav.getByRole('link', { name: 'History' }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page).toHaveTitle('History · Nouri');
});

test('deep links load directly', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
