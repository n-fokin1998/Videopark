// Intentionally tiny: re-exports server/client-safe helpers only.
export { defaultLocale, enabledLocales, isEnabledLocale, isLocale, locales, type Locale } from './config';
export { plural, t, translate, useTranslations, type TranslationKey, type TranslationParams } from './t';
export { localizedPath, normalizePath, parseLocalizedPath } from './routes';
