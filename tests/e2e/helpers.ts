import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { ru } from '~/i18n/ui/ru';
import { THEME_STORAGE_KEY, type Theme } from '~/lib/themes';
import { lineStations, stations, type Station } from '~/lib/stations';

export { ru, lineStations, stations };

export const stationName = (station: Station): string => ru.station[station.id].name;

export const escapeRegExp = (text: string): RegExp => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

/** Pin a theme before any page script runs (same storage key as the pre-paint script). */
export async function pinTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
    },
    [THEME_STORAGE_KEY, theme] as const,
  );
}

/** Fail on serious/critical axe violations (accessibility rules). */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Count every attempt to start media playback (silence check, D-013). */
export async function trackMediaPlay(page: Page): Promise<() => Promise<number>> {
  await page.addInitScript(() => {
    const w = window as unknown as { __mediaPlays: number };
    w.__mediaPlays = 0;
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
      w.__mediaPlays += 1;
      return original.call(this);
    };
  });
  return () => page.evaluate(() => (window as unknown as { __mediaPlays: number }).__mediaPlays);
}

/** A first-time visitor: no arrival flag (overrides the returning-visitor storage state from playwright.config.ts). */
export const firstVisit = { storageState: { cookies: [], origins: [] } };

/** A silent mono WAV (8 kHz, 8-bit) — stands in for the generated `.m4a` files, which are git-ignored and use AAC. */
export function silentWav(seconds: number): Buffer {
  const rate = 8000;
  const samples = rate * seconds;
  const buffer = Buffer.alloc(44 + samples, 128);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples, 40);
  return buffer;
}

/** Serve every track as a silent WAV and every peaks file as a flat waveform (no dependency on `pnpm media`). */
export async function mockAudio(page: Page, seconds = 120): Promise<void> {
  const wav = silentWav(seconds);
  await page.route('**/media/audio/*.m4a', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: wav, headers: { 'Accept-Ranges': 'none' } }),
  );
  await page.route('**/media/audio/*.peaks.json', (route) =>
    route.fulfill({ json: { version: 1, duration: seconds, peaks: Array.from({ length: 800 }, () => 0.5) } }),
  );
}
