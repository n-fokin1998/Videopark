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
