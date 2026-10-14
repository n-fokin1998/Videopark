import { expect, test } from './fixtures';

/** The theme follows the visitor's local time unless one is pinned (docs/design.md §8). */
const cases = [
  { time: '2026-10-11T06:30:00', scheme: 'light', theme: 'dawn' },
  { time: '2026-10-11T12:00:00', scheme: 'light', theme: 'day' },
  { time: '2026-10-11T19:00:00', scheme: 'light', theme: 'evening' },
  { time: '2026-10-11T23:30:00', scheme: 'light', theme: 'night' },
  { time: '2026-10-11T12:00:00', scheme: 'dark', theme: 'evening' },
] as const;

for (const { time, scheme, theme } of cases) {
  test(`${time.slice(11, 16)} with a ${scheme} colour scheme → ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.clock.setFixedTime(new Date(time));
    await page.goto('/music');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });
}

test('changes theme at the next boundary without a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.clock.install({ time: new Date('2026-10-11T16:59:30') });
  await page.goto('/music');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await page.clock.runFor('01:00');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'evening');
});
