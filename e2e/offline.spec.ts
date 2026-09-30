import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorkerControl(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load isn't controlled yet; reload so the SW serves navigations.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

test('loads offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot navigate while offline');
  await waitForServiceWorkerControl(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
});

test('precaches the app shell', async ({ page }) => {
  // Runs on WebKit too, where a true offline reload can't be emulated: every
  // script and stylesheet the page loaded must be served from the precache.
  await waitForServiceWorkerControl(page);

  const missing = await page.evaluate(async () => {
    const urls = [
      '/index.html',
      '/manifest.webmanifest',
      ...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'), (s) => s.src),
      ...Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
        (l) => l.href,
      ),
    ];
    const results = await Promise.all(
      urls.map(async (url) => ({
        url,
        hit: Boolean(await caches.match(url, { ignoreSearch: true })),
      })),
    );
    return results.filter((r) => !r.hit).map((r) => r.url);
  });
  expect(missing).toEqual([]);
});
