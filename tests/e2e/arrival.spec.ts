import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { expectNoA11yViolations, firstVisit, ru, trackMediaPlay } from './helpers';

const overlay = (page: Page) => page.getByRole('dialog', { name: ru.platform.arrivalLabel });
const enterButton = (page: Page) => page.getByRole('button', { name: ru.platform.enter });
const heading = (page: Page) => page.getByRole('heading', { level: 1 });

test.describe('first visit', () => {
  test.use(firstVisit);

  test('arrives silently: «Войти на станцию» opens the doors onto the platform', async ({ page }) => {
    const mediaPlays = await trackMediaPlay(page);
    await page.goto('/');
    await expect(overlay(page)).toBeVisible();
    await expect(enterButton(page)).toBeFocused();
    // The page behind is inert while the overlay shows.
    expect(await page.locator('main').evaluate((main: HTMLElement) => main.inert)).toBe(true);

    await enterButton(page).click();
    await expect(overlay(page)).toBeHidden({ timeout: 5000 });
    await expect(heading(page)).toHaveText(ru.site.name);
    await expect(heading(page)).toBeFocused();
    expect(await page.locator('main').evaluate((main: HTMLElement) => main.inert)).toBe(false);
    expect(await mediaPlays()).toBe(0);

    // Arrived once: the next visit goes straight to the platform.
    await page.reload();
    await expect(overlay(page)).toBeHidden();
  });

  test('can be skipped with Esc', async ({ page }) => {
    await page.goto('/');
    await expect(overlay(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(overlay(page)).toBeHidden();
    await expect(heading(page)).toBeFocused();
  });

  test('can be skipped with «Пропустить»', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: ru.platform.skip }).click();
    await expect(overlay(page)).toBeHidden();
  });

  test('has no serious a11y violations while it shows', async ({ page }) => {
    await page.goto('/');
    await expect(overlay(page)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('is skipped for a deep link, which also counts as arriving', async ({ page }) => {
    await page.goto('/music');
    await expect(heading(page)).toHaveText(ru.station.music.name);
    await page.goto('/');
    await expect(overlay(page)).toBeHidden();
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('shows the final platform state immediately', async ({ page }) => {
      await page.goto('/');
      await expect(heading(page)).toHaveText(ru.site.name);
      await expect(overlay(page)).toBeHidden();
    });
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('renders the platform state (crawlers, link previews)', async ({ page }) => {
      await page.goto('/');
      await expect(overlay(page)).toBeHidden();
      await expect(heading(page)).toHaveText(ru.site.name);
      await expect(page.getByRole('heading', { level: 2, name: ru.platform.lineHeading })).toBeVisible();
    });
  });
});
