import { describe, expect, it } from 'vitest';
import { msUntilNextBoundary, resolveTheme, themeForHour, themeSchedule } from './time-of-day';

describe('themeForHour', () => {
  it.each([
    [0, 'night'],
    [4, 'night'],
    [5, 'dawn'],
    [8, 'dawn'],
    [9, 'day'],
    [16, 'day'],
    [17, 'evening'],
    [22, 'evening'],
    [23, 'night'],
  ] as const)('%i h → %s', (hour, theme) => {
    expect(themeForHour(hour)).toBe(theme);
  });

  it('keeps a dark colour-scheme preference in evening/night', () => {
    expect(themeForHour(6, 'dark')).toBe('night');
    expect(themeForHour(12, 'dark')).toBe('evening');
    expect(themeForHour(19, 'dark')).toBe('evening');
    expect(themeForHour(12, 'light')).toBe('day');
  });

  it('rejects impossible hours', () => {
    expect(() => themeForHour(24)).toThrow();
    expect(() => themeForHour(-1)).toThrow();
  });

  it('has an ascending schedule starting at midnight (the pre-paint script relies on it)', () => {
    expect(themeSchedule[0]?.[0]).toBe(0);
    const hours = themeSchedule.map(([h]) => h);
    expect([...hours].sort((a, b) => a - b)).toEqual(hours);
  });
});

describe('resolveTheme', () => {
  it('prefers a pinned theme over the clock', () => {
    expect(resolveTheme('dawn', 21)).toBe('dawn');
    expect(resolveTheme('auto', 21)).toBe('evening');
  });
});

describe('msUntilNextBoundary', () => {
  it('counts to the next theme change', () => {
    expect(msUntilNextBoundary(new Date(2026, 9, 11, 16, 30))).toBe(30 * 60 * 1000);
    expect(msUntilNextBoundary(new Date(2026, 9, 11, 23, 0))).toBe(60 * 60 * 1000);
  });
});
