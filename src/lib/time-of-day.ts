/**
 * Time-of-day theming (docs/design.md §2, §8): the site's light follows the visitor's local time.
 * `prefers-color-scheme: dark` is a tie-breaker — dark preference keeps the site in evening/night.
 */
import type { Theme, ThemePreference } from './themes';

export type ColorScheme = 'light' | 'dark' | 'no-preference';

/**
 * Local hours at which each theme begins, in ascending order. The first entry covers midnight.
 * Also passed to the inline pre-paint script in BaseLayout, so it stays plain data.
 */
export const themeSchedule: readonly (readonly [fromHour: number, theme: Theme])[] = [
  [0, 'night'],
  [5, 'dawn'],
  [9, 'day'],
  [17, 'evening'],
  [23, 'night'],
];

/** Under a dark colour-scheme preference the light themes give way to their nearest dark neighbour. */
export const darkSchemeTheme: Readonly<Partial<Record<Theme, Theme>>> = {
  dawn: 'night',
  day: 'evening',
};

export function themeForHour(hour: number, scheme: ColorScheme = 'no-preference'): Theme {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error(`time-of-day: invalid hour ${hour}`);
  let theme: Theme = 'night';
  for (const [from, name] of themeSchedule) if (hour >= from) theme = name;
  return scheme === 'dark' ? (darkSchemeTheme[theme] ?? theme) : theme;
}

/** The theme to show: a pinned theme wins; `auto` follows the clock. */
export function resolveTheme(preference: ThemePreference, hour: number, scheme: ColorScheme = 'no-preference'): Theme {
  return preference === 'auto' ? themeForHour(hour, scheme) : preference;
}

/** Milliseconds from `now` until the next scheduled theme boundary (for re-checking the theme without polling). */
export function msUntilNextBoundary(now: Date): number {
  const hour = now.getHours();
  const nextHour = themeSchedule.map(([from]) => from).find((from) => from > hour) ?? 24;
  const next = new Date(now);
  next.setHours(nextHour, 0, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}
