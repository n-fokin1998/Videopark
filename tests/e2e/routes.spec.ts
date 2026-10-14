import { expect, test } from './fixtures';
import { expectNoA11yViolations, expectNoHorizontalScroll, pinTheme, ru, stationName, stations } from './helpers';

const themesToAudit = ['evening', 'day'] as const;

for (const station of stations) {
  test.describe(`${station.id} (${station.path})`, () => {
    test('renders its station sign and footer', async ({ page }) => {
      const response = await page.goto(station.path);
      expect(response?.status()).toBe(200);
      const expectedHeading = station.id === 'platform' ? ru.site.name : stationName(station);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(expectedHeading);
      await expect(page).toHaveTitle(
        station.id === 'platform' ? ru.site.name : `${stationName(station)} — ${ru.site.name}`,
      );
      await expect(page.getByRole('navigation', { name: ru.a11y.lineNav })).toBeVisible();
      await expect(page.getByRole('navigation', { name: ru.line.onward })).toBeVisible();
      await expectNoHorizontalScroll(page);
    });

    for (const theme of themesToAudit) {
      test(`has no serious a11y violations (${theme})`, async ({ page }) => {
        await pinTheme(page, theme);
        await page.goto(station.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expectNoA11yViolations(page);
      });
    }
  });
}

test.describe('404', () => {
  test('says the station is closed and lists the line', async ({ page }) => {
    const response = await page.goto('/no-such-station');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ru.notFound.title);
    await expect(page.getByText(ru.notFound.text)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: ru.line.stationsHeading })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  for (const theme of themesToAudit) {
    test(`has no serious a11y violations (${theme})`, async ({ page }) => {
      await pinTheme(page, theme);
      await page.goto('/no-such-station');
      await expectNoA11yViolations(page);
    });
  }
});
