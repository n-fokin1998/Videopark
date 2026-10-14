import { describe, expect, it } from 'vitest';
import { dayNumber, localDateKey, permutation, pickIndexForDate } from './evening';

const keyFor = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

describe('localDateKey / dayNumber', () => {
  it('formats the local calendar date', () => {
    expect(localDateKey(new Date(2026, 9, 11, 23, 59))).toBe('2026-10-11');
    expect(localDateKey(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
  });

  it('counts days since the epoch', () => {
    expect(dayNumber('1970-01-01')).toBe(0);
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(() => dayNumber('2026-10')).toThrow();
  });
});

describe('permutation', () => {
  it('contains every index exactly once and is seeded', () => {
    const order = permutation(40, 7);
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, i) => i));
    expect(permutation(40, 7)).toEqual(order);
    expect(permutation(40, 8)).not.toEqual(order);
  });
});

describe('pickIndexForDate', () => {
  it('is deterministic for a date', () => {
    expect(pickIndexForDate('2026-10-11', 40)).toBe(pickIndexForDate('2026-10-11', 40));
  });

  it('shows every item once per cycle', () => {
    const count = 17;
    const start = count * 1000; // the first day of a cycle
    const picks = Array.from({ length: count }, (_, i) => pickIndexForDate(keyFor(start + i), count));
    expect(new Set(picks).size).toBe(count);
  });

  it('separates rotations by salt', () => {
    const days = Array.from({ length: 30 }, (_, i) => keyFor(20_000 + i));
    const a = days.map((d) => pickIndexForDate(d, 30, 'track'));
    const b = days.map((d) => pickIndexForDate(d, 30, 'quote'));
    expect(a).not.toEqual(b);
  });

  it('handles a single item and rejects none', () => {
    expect(pickIndexForDate('2026-10-11', 1)).toBe(0);
    expect(() => pickIndexForDate('2026-10-11', 0)).toThrow();
  });
});
