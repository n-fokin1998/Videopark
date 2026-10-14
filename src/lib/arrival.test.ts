import { describe, expect, it } from 'vitest';
import { shouldShowArrival } from './arrival';

const base = { pathname: '/', platformPaths: ['/'], arrived: false, reducedMotion: false };

describe('shouldShowArrival', () => {
  it('plays on a first visit to the platform', () => {
    expect(shouldShowArrival(base)).toBe(true);
    expect(shouldShowArrival({ ...base, pathname: '/index.html' })).toBe(true);
    expect(shouldShowArrival({ ...base, pathname: '/uk/', platformPaths: ['/', '/uk'] })).toBe(true);
  });

  it('is skipped for returning visitors, deep links and reduced motion', () => {
    expect(shouldShowArrival({ ...base, arrived: true })).toBe(false);
    expect(shouldShowArrival({ ...base, pathname: '/music' })).toBe(false);
    expect(shouldShowArrival({ ...base, reducedMotion: true })).toBe(false);
  });
});
