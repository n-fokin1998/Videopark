import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { escapeRegExp, lineStations, ru, stationName, trackMediaPlay } from './helpers';

const nextLink = (page: Page) => page.getByRole('link', { name: escapeRegExp(ru.line.next) });

function previousLink(page: Page, name: string) {
  return page.getByRole('link', { name: ru.line.previousStation.replace('{name}', name) });
}

/** After a client-side navigation the new <h1> has focus and the station is announced. */
async function expectArrivedAt(page: Page, path: string, name: string, heading: string) {
  await expect(page).toHaveURL(path);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('[data-route-announcer]')).toHaveText(ru.a11y.stationAnnounce.replace('{name}', name));
}

const headingFor = (index: number) => {
  const station = lineStations[index]!;
  return station.id === 'platform' ? ru.site.name : stationName(station);
};

test('walks the whole line forward and back, keyboard only, without starting audio', async ({ page }) => {
  const mediaPlays = await trackMediaPlay(page);
  await page.goto('/');

  for (let i = 1; i < lineStations.length; i++) {
    const link = nextLink(page);
    await link.focus();
    await page.keyboard.press('Enter');
    await expectArrivedAt(page, lineStations[i]!.path, stationName(lineStations[i]!), headingFor(i));
    await expect(page.locator('html')).toHaveAttribute('data-direction', 'forward');
  }

  // Terminal: no next station, «Конечная», transfer to Женя.
  await expect(nextLink(page)).toHaveCount(0);
  await expect(page.getByText(ru.line.terminal)).toBeVisible();
  await expect(
    page.getByRole('link', { name: ru.line.transferTo.replace('{name}', ru.station.zhenya.name) }),
  ).toBeVisible();

  for (let i = lineStations.length - 2; i >= 0; i--) {
    const link = previousLink(page, stationName(lineStations[i]!));
    await link.focus();
    await page.keyboard.press('Enter');
    await expectArrivedAt(page, lineStations[i]!.path, stationName(lineStations[i]!), headingFor(i));
    await expect(page.locator('html')).toHaveAttribute('data-direction', 'back');
  }

  expect(await mediaPlays()).toBe(0);
});

test('navigates without full page reloads (the player will survive)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { __marker: boolean }).__marker = true;
  });
  await nextLink(page).click();
  await expect(page).toHaveURL('/music');
  expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
});

test('transfers from История to Женя and back to the line', async ({ page }) => {
  await page.goto('/history');
  await page.getByRole('link', { name: ru.line.transferTo.replace('{name}', ru.station.zhenya.name) }).click();
  await expectArrivedAt(page, '/zhenya', ru.station.zhenya.name, ru.station.zhenya.name);
  await expect(page.locator('html')).toHaveAttribute('data-direction', 'none');
  await page.getByRole('link', { name: ru.line.transferTo.replace('{name}', ru.station.brovary.name) }).click();
  await expectArrivedAt(page, '/brovary', ru.station.brovary.name, ru.station.brovary.name);
});

test('the line indicator marks the current station', async ({ page }) => {
  await page.goto('/lyrics');
  const nav = page.getByRole('navigation', { name: ru.a11y.lineNav });
  await expect(nav.getByRole('link', { name: ru.station.lyrics.name })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: ru.station.photos.name }).click();
  await expect(page).toHaveURL('/photos');
  await expect(nav.getByRole('link', { name: ru.station.photos.name })).toHaveAttribute('aria-current', 'page');
});

test('skip link moves focus to the content', async ({ page, browserName, isMobile }) => {
  test.skip(isMobile, 'no Tab key on touch devices');
  test.skip(browserName === 'webkit', 'WebKit only tabs to links with the Option key by default');
  await page.goto('/music');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: ru.a11y.skipToContent });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('still walks the line', async ({ page }) => {
    await page.goto('/');
    await nextLink(page).click();
    await expectArrivedAt(page, '/music', ru.station.music.name, ru.station.music.name);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every line station is readable and linked', async ({ page }) => {
    await page.goto('/');
    for (let i = 1; i < lineStations.length; i++) {
      await nextLink(page).click();
      await expect(page).toHaveURL(lineStations[i]!.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(headingFor(i));
    }
  });
});
