import { expect, test } from '@playwright/test';

test('logs a custom food and changes the date', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nothing logged today' })).toBeVisible();

  await page.getByRole('button', { name: 'Add food' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add food' });
  await sheet.getByRole('tab', { name: 'Manual' }).click();
  // No field spills past the sheet's edge on a phone.
  const spill = await sheet.evaluate((d) => {
    const edge = d.getBoundingClientRect().right;
    return [...d.querySelectorAll('input')]
      .filter((i) => i.offsetParent !== null)
      .map((i) => Math.round(i.getBoundingClientRect().right - edge))
      .filter((px) => px > 0);
  });
  expect(spill).toEqual([]);
  await sheet.getByLabel('Name').fill('Chicken adobo');
  await sheet.getByRole('radio', { name: 'Per serving' }).check();
  await sheet.getByLabel('Protein').fill('28');
  await sheet.getByLabel('Carbs').fill('4');
  await sheet.getByLabel('Fat').fill('18');
  await sheet.getByRole('button', { name: 'Save food' }).click();

  const detail = page.getByRole('dialog', { name: 'Chicken adobo' });
  await detail.getByRole('radio', { name: 'Lunch' }).check();
  await expect(detail.getByRole('region', { name: 'This amount' })).toContainText('290 kcal');
  await detail.getByRole('button', { name: 'Add to log' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'Added to Lunch' })).toBeVisible();
  const label = page.getByRole('region', { name: 'Daily Facts' });
  await expect(label).toContainText('290');
  await expect(page.getByRole('region', { name: 'Lunch' })).toContainText('Chicken adobo');

  await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByRole('heading', { name: 'Nothing logged for this day' })).toBeVisible();
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect(page.getByRole('region', { name: 'Lunch' })).toContainText('Chicken adobo');

  // Survives a reload: it's in IndexedDB.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Lunch' })).toContainText('Chicken adobo');
});
