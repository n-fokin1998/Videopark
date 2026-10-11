import { persistentAtom } from '@nanostores/persistent';
import { parseThemePreference, THEME_STORAGE_KEY, type ThemePreference } from '~/lib/themes';

/** The visitor's pinned theme (persisted). `auto` follows the local time of day. */
export const $themePreference = persistentAtom<ThemePreference>(THEME_STORAGE_KEY, 'auto', {
  encode: (value) => value,
  decode: parseThemePreference,
});

export function pinTheme(preference: ThemePreference): void {
  $themePreference.set(preference);
}
