/** Time-of-day themes (docs/design.md §2, §8). `evening` is the SSR / no-JS / link-preview look. */
export const themes = ['dawn', 'day', 'evening', 'night'] as const;

export type Theme = (typeof themes)[number];

/** `auto` = follow the visitor's local time (phase 2); otherwise a theme pinned in «Схема». */
export type ThemePreference = Theme | 'auto';

export const defaultTheme: Theme = 'evening';

/** localStorage key shared by the theme store and the inline pre-paint script in BaseLayout. */
export const THEME_STORAGE_KEY = 'vp:theme';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (themes as readonly string[]).includes(value);
}

export function parseThemePreference(value: unknown): ThemePreference {
  return isTheme(value) ? value : 'auto';
}
