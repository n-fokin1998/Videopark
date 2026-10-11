/**
 * Locale configuration. Keep `locales` in sync with `i18n.locales` in astro.config.mjs.
 * A locale is generated only once it is listed in `enabledLocales` (docs/i18n.md §7).
 */
export const locales = ['ru', 'uk', 'en'] as const;

export type Locale = (typeof locales)[number];

/** Served without a URL prefix (D-007). */
export const defaultLocale: Locale = 'ru';

export const enabledLocales: readonly Locale[] = ['ru'];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function isEnabledLocale(value: unknown): value is Locale {
  return isLocale(value) && enabledLocales.includes(value);
}
