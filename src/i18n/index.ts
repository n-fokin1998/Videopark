// Intentionally tiny: re-exports server/client-safe helpers only.
export { defaultLocale, enabledLocales, isEnabledLocale, isLocale, locales, type Locale } from './config';
export { plural, strings, t, translate, useTranslations, type TranslationKey, type TranslationParams } from './t';
export { interpolate } from './format';
export { localizedPath, normalizePath, parseLocalizedPath } from './routes';
