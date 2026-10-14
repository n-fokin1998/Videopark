import { describe, expect, it } from 'vitest';
import { clampTime, downsamplePeaks, formatTime, parsePeaks } from './time';

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [9.9, '0:09'],
    [157, '2:37'],
    [1445, '24:05'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
    [undefined, '0:00'],
  ])('%s → %s', (seconds, text) => {
    expect(formatTime(seconds)).toBe(text);
  });
});

describe('clampTime', () => {
  it('keeps seeks inside the track', () => {
    expect(clampTime(-5, 100)).toBe(0);
    expect(clampTime(150, 100)).toBe(100);
    expect(clampTime(50, undefined)).toBe(50);
  });
});

describe('downsamplePeaks', () => {
  it('keeps the loudest value per group', () => {
    expect(downsamplePeaks([0.1, 0.9, 0.2, 0.3, 0.5, 0.4], 3)).toEqual([0.9, 0.3, 0.5]);
    expect(
      downsamplePeaks(
        Array.from({ length: 800 }, () => 0.5),
        120,
      ),
    ).toHaveLength(120);
  });

  it('passes short inputs through', () => {
    expect(downsamplePeaks([0.2, 0.4], 10)).toEqual([0.2, 0.4]);
    expect(downsamplePeaks([], 10)).toEqual([]);
    expect(downsamplePeaks([0.2], 0)).toEqual([]);
  });
});

describe('parsePeaks', () => {
  it('accepts the peaks file shape only', () => {
    expect(parsePeaks({ version: 1, duration: 3, peaks: [0, 0.5, 1] })).toEqual([0, 0.5, 1]);
    expect(parsePeaks({ peaks: ['a'] })).toBeUndefined();
    expect(parsePeaks(null)).toBeUndefined();
  });
});
