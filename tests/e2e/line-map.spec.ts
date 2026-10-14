import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { expectNoA11yViolations, ru } from './helpers';

const mapButton = (page: Page) => page.getByRole('button', { name: ru.map.open, exact: true });
const map = (page: Page) => page.getByRole('dialog', { name: ru.map.title });

test('opens with the «Схема» button, closes with Esc and returns focus', async ({ page }) => {
  await page.goto('/lyrics');
  await mapButton(page).click();
  await expect(map(page)).toBeVisible();
  await expect(map(page).getByRole('link', { name: new RegExp(ru.station.lyrics.name) })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.keyboard.press('Escape');
  await expect(map(page)).toBeHidden();
  await expect(mapButton(page)).toBeFocused();
});

test('opens with M and jumps to a station with the map transition', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no hardware keyboard');
  await page.goto('/music');
  // The map script loads on idle; its button appears once it is ready.
  await expect(mapButton(page)).toBeVisible();
  await page.keyboard.press('KeyM');
  await expect(map(page)).toBeVisible();
  await map(page)
    .getByRole('link', { name: new RegExp(ru.station.brovary.name) })
    .click();
  await expect(page).toHaveURL('/brovary');
  await expect(map(page)).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-direction', 'map');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ru.station.brovary.name);
});

test('pins a theme and keeps it across navigation and reloads', async ({ page }) => {
  await page.goto('/');
  await mapButton(page).click();
  await map(page).getByRole('radio', { name: ru.theme.dawn }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dawn');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: new RegExp(ru.line.next) }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dawn');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dawn');
});

test('switches «Звук» on and off (off by default, persisted)', async ({ page }) => {
  await page.goto('/');
  await mapButton(page).click();
  const toggle = map(page).getByRole('button', { name: ru.sound.label });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await mapButton(page).click();
  await expect(map(page).getByRole('button', { name: ru.sound.label })).toHaveAttribute('aria-pressed', 'true');
});

test('has no serious a11y violations when open', async ({ page }) => {
  await page.goto('/video');
  await mapButton(page).click();
  await expect(map(page)).toBeVisible();
  await expectNoA11yViolations(page);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('hides the «Схема» button (the line indicator and footer still navigate)', async ({ page }) => {
    await page.goto('/music');
    await expect(mapButton(page)).toBeHidden();
    await expect(page.getByRole('navigation', { name: ru.a11y.lineNav })).toBeVisible();
  });
});
