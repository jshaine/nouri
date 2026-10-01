import { expect, test, type Page } from '@playwright/test';
import { skipOnboarding } from './helpers';

/** Visible interactive elements that are too small or unnamed on the current screen. */
async function audit(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push('horizontal scroll');
    const els = document.querySelectorAll<HTMLElement>(
      'button, a[href], select, input:not([type=hidden]), textarea, [role=slider], [role=tab]',
    );
    for (const el of els) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!el.offsetParent || style.visibility === 'hidden' || rect.width === 0) continue;
      if (el.closest('dialog:not([open])')) continue;
      const hiddenInput =
        el instanceof HTMLInputElement &&
        (style.opacity === '0' || el.classList.contains('visually-hidden'));
      // Radios and file inputs are hidden; their visible label is the target.
      const target = hiddenInput
        ? (el.closest('label') ?? document.querySelector(`label[for="${el.id}"]`))
        : el;
      // Text fields and selects sit inside a 44px control box.
      const inField =
        (el instanceof HTMLInputElement && !hiddenInput) || el instanceof HTMLSelectElement;
      const box = inField ? (el.closest('[class*="control"]') ?? el) : target;
      const h = box?.getBoundingClientRect().height ?? 0;
      const name = el.getAttribute('aria-label') ?? el.textContent.trim();
      const labelled =
        el instanceof HTMLInputElement || el instanceof HTMLSelectElement
          ? (el.labels?.length ?? 0) > 0 || el.hasAttribute('aria-label')
          : name.length > 0;
      if (!labelled)
        problems.push(`unnamed ${el.tagName.toLowerCase()} ${el.outerHTML.slice(0, 80)}`);
      if (h < 44)
        problems.push(
          `small target (${Math.round(h)}px): ${el.tagName.toLowerCase()} "${name.slice(0, 30)}"`,
        );
    }
    return problems;
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`every screen passes the tap-target, name and overflow checks (${scheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await skipOnboarding(page);
    for (const path of ['/', '/history', '/profile', '/settings']) {
      await page.goto(path);
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
      await page.waitForTimeout(200);
      expect(await audit(page), path).toEqual([]);
    }
    await page.goto('/');
    await page.getByRole('button', { name: 'Add food' }).click();
    await page.getByRole('dialog', { name: 'Add food' }).getByRole('searchbox').fill('rice');
    await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible();
    expect(await audit(page), 'add food sheet').toEqual([]);
  });
}

test('every onboarding step passes the same checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/welcome');
  const check = async (heading: string) => {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(await audit(page), heading).toEqual([]);
  };
  await check('Welcome to Nouri');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Next' }).click(); // shows every error
  await check('About you');
  await page.getByRole('radio', { name: 'Female' }).check();
  await page.getByLabel('Age').fill('30');
  await page.getByLabel('Height').fill('160');
  await page.getByLabel('Current weight').fill('65');
  await page.getByRole('button', { name: 'Next' }).click();
  await check('How active are you?');
  await page.locator('label', { hasText: 'Lightly active' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('label', { hasText: 'Lose weight' }).click();
  await check('Your goal');
  await page.getByLabel('Goal weight').fill('58');
  await page.getByRole('button', { name: 'See my plan' }).click();
  await check('Your plan');
});
