import { expect, test, type Page } from '@playwright/test';
import { skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
});

async function openSearch(page: Page) {
  await page.getByRole('button', { name: 'Add food' }).click();
  return page
    .getByRole('dialog', { name: 'Add food' })
    .getByRole('searchbox', { name: 'Search foods' });
}

test('searches the bundled foods and logs one with computed macros', async ({ page }) => {
  await page.goto('/');
  const search = await openSearch(page);
  await search.fill('kanin');
  const results = page.getByRole('list', { name: 'Search results' });
  const first = results.getByRole('button').first();
  await expect(first).toContainText(/Rice, white/);
  await expect(first).toContainText(/kcal · 1 cup/);
  await first.click();

  const detail = page.getByRole('dialog', { name: /^Rice, white/ });
  await expect(detail.getByRole('region', { name: 'This amount' })).toContainText(/\d+ kcal/);
  await detail.getByRole('button', { name: 'Increase quantity' }).click();
  await detail.getByRole('button', { name: 'Add to log' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(/1\.5 × 1 cup/);
});

test('searches offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot navigate while offline');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  const search = await openSearch(page);
  await search.fill('itlog');
  await expect(
    page.getByRole('list', { name: 'Search results' }).getByRole('button').first(),
  ).toContainText(/Egg/);
});

test('finds Philippine packaged products from their labels', async ({ page }) => {
  await page.goto('/');
  const search = await openSearch(page);
  const first = page.getByRole('list', { name: 'Search results' }).getByRole('button').first();
  await search.fill('san marino');
  await expect(first).toContainText(/San Marino/);
  await search.fill('gardenia');
  await expect(first).toContainText(/Gardenia/);
  await expect(first).toContainText('Label');
  await first.click();
  const detail = page.getByRole('dialog', { name: /Gardenia/ });
  await expect(detail).toContainText('from the package label. Check it against your pack.');
  await expect(detail.getByRole('region', { name: 'This amount' })).toContainText(/\d+ kcal/);

  await page.goto('/settings');
  await expect(page.getByText(/Open Food Facts/)).toBeVisible();
});
