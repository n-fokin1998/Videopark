import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { escapeRegExp, lineStations, mockAudio, ru, trackMediaPlay } from './helpers';

const player = (page: Page) => page.getByRole('region', { name: ru.player.region });
const eveningButton = (page: Page) =>
  page
    .getByRole('region', { name: ru.player.eveningLabel })
    .getByRole('button', { name: escapeRegExp(ru.player.playTrack.split('{title}')[0] ?? '') });
const pauseButton = (page: Page) =>
  player(page).getByRole('button', { name: escapeRegExp(ru.player.pauseTrack.split('{title}')[0] ?? '') });
const playButton = (page: Page) =>
  player(page).getByRole('button', { name: escapeRegExp(ru.player.playTrack.split('{title}')[0] ?? '') });
const nextStation = (page: Page) => page.getByRole('link', { name: escapeRegExp(ru.line.next) });

/** Seconds shown in the bar's timecode («0:12 / 3:16»). */
async function position(page: Page): Promise<number> {
  const text = (await player(page).locator('.bar__time').textContent()) ?? '';
  const [m = '0', s = '0'] = (text.split('/')[0] ?? '').trim().split(':');
  return Number(m) * 60 + Number(s);
}

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await page.goto('/');
  test.skip((await eveningButton(page).count()) === 0, 'no generated audio (run `pnpm media`): nothing to play');
  // A server-rendered button does nothing until its island has hydrated (`client:visible`: scroll it into view).
  await eveningButton(page).scrollIntoViewIfNeeded();
  await page.locator('astro-island[component-url*="TrackOfTheEvening"]:not([ssr])').waitFor({ state: 'attached' });
  await page.locator('astro-island[component-url*="Player"]:not([ssr])').waitFor({ state: 'attached' });
});

test('is not on screen and silent until play is pressed', async ({ page }) => {
  const mediaPlays = await trackMediaPlay(page);
  await page.reload();
  await expect(player(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: ru.a11y.skipToPlayer })).toBeHidden();
  expect(await mediaPlays()).toBe(0);
});

test('keeps playing across every station of the line (no reload)', async ({ page, isMobile }) => {
  await page.evaluate(() => {
    (window as unknown as { __marker: boolean }).__marker = true;
  });
  await eveningButton(page).click();
  await expect(pauseButton(page)).toBeVisible();

  for (let i = 1; i < lineStations.length; i++) {
    await nextStation(page).click();
    await expect(page).toHaveURL(lineStations[i]!.path);
    await expect(pauseButton(page)).toBeVisible();
  }

  expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
  if (!isMobile) await expect.poll(() => position(page), { timeout: 10_000 }).toBeGreaterThan(0);
});

test('pauses and resumes from the bar and with Space', async ({ page, isMobile }) => {
  await eveningButton(page).click();
  await pauseButton(page).click();
  await expect(playButton(page)).toBeVisible();
  test.skip(isMobile, 'no hardware keyboard');
  await page.locator('h1').click();
  await page.keyboard.press('Space');
  await expect(pauseButton(page)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(playButton(page)).toBeVisible();
});

test('restores the queue paused after a reload — never autoplays', async ({ page }) => {
  await eveningButton(page).click();
  await expect(pauseButton(page)).toBeVisible();
  // Counts play() calls in the documents loaded from now on.
  const mediaPlays = await trackMediaPlay(page);
  await page.reload();
  await expect(player(page)).toBeVisible();
  await expect(playButton(page)).toBeVisible();
  expect(await mediaPlays()).toBe(0);
  await expect(page.getByRole('link', { name: ru.a11y.skipToPlayer })).toBeAttached();
});

test('opens the expanded player with a seek slider and closes it again', async ({ page }) => {
  await eveningButton(page).click();
  await player(page)
    .getByRole('button', { name: escapeRegExp(ru.player.expand) })
    .first()
    .click();
  const sheet = page.getByRole('dialog', { name: ru.player.sheet });
  await expect(sheet).toBeVisible();
  const slider = sheet.getByRole('slider', { name: ru.player.seek });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute('aria-valuetext', /\d+:\d{2} из \d+:\d{2}/);
  await sheet.getByRole('button', { name: ru.player.collapse }).click();
  await expect(sheet).toBeHidden();
});
