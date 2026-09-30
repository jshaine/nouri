import { expect, type Page } from '@playwright/test';

/** First launch opens setup; most tests start from a set-up app. */
export async function skipOnboarding(page: Page) {
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'Skip, I’ll set goals myself' }).click();
  await expect(page).toHaveURL(/\/settings$/);
}
