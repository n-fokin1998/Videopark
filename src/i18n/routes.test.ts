import { describe, expect, it } from 'vitest';
import { localizedPath, normalizePath, parseLocalizedPath } from './routes';

describe('normalizePath', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['music', '/music'],
    ['/music/', '/music'],
    ['/music.html', '/music'],
    ['/index.html', '/'],
    ['/music?x=1#top', '/music'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('localizedPath', () => {
  it('keeps Russian unprefixed (D-007)', () => {
    expect(localizedPath('/music', 'ru')).toBe('/music');
    expect(localizedPath('/', 'ru')).toBe('/');
  });

  it('prefixes other locales', () => {
    expect(localizedPath('/music', 'uk')).toBe('/uk/music');
    expect(localizedPath('/', 'en')).toBe('/en');
  });
});

describe('parseLocalizedPath', () => {
  it('detects prefixed locales', () => {
    expect(parseLocalizedPath('/uk/lyrics/some-song')).toEqual({ locale: 'uk', path: '/lyrics/some-song' });
    expect(parseLocalizedPath('/en')).toEqual({ locale: 'en', path: '/' });
  });

  it('treats everything else as Russian', () => {
    expect(parseLocalizedPath('/music')).toEqual({ locale: 'ru', path: '/music' });
    expect(parseLocalizedPath('/ru/music')).toEqual({ locale: 'ru', path: '/ru/music' });
  });
});
