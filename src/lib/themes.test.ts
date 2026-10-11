import { describe, expect, it } from 'vitest';
import { defaultTheme, isTheme, parseThemePreference, themes } from './themes';

describe('themes', () => {
  it('defines the four time-of-day themes with evening as default', () => {
    expect(themes).toEqual(['dawn', 'day', 'evening', 'night']);
    expect(defaultTheme).toBe('evening');
  });

  it('validates theme names', () => {
    expect(isTheme('night')).toBe(true);
    expect(isTheme('noon')).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  it('parses stored preferences, defaulting to auto', () => {
    expect(parseThemePreference('dawn')).toBe('dawn');
    expect(parseThemePreference('garbage')).toBe('auto');
    expect(parseThemePreference(null)).toBe('auto');
  });
});
