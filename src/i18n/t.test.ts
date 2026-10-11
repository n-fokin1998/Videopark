import { describe, expect, it } from 'vitest';
import { plural, translate, useTranslations } from './t';

describe('translate', () => {
  it('resolves nested keys', () => {
    expect(translate('ru', 'station.music.name')).toBe('Музыка');
  });

  it('interpolates parameters', () => {
    expect(translate('ru', 'a11y.stationAnnounce', { name: 'Музыка' })).toBe('Станция «Музыка»');
    expect(translate('ru', 'site.titleTemplate', { title: 'Тексты' })).toBe('Тексты — Станция Видеопарк');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate('ru', 'a11y.stationAnnounce')).toBe('Станция «{name}»');
  });

  it('falls back to Russian for locales without a dictionary yet', () => {
    expect(translate('uk', 'station.lyrics.name')).toBe('Тексты');
  });

  it('throws on a missing key', () => {
    // @ts-expect-error — deliberately invalid key
    expect(() => translate('ru', 'station.memories.name')).toThrow(/missing key/);
  });

  it('binds a locale with useTranslations', () => {
    expect(useTranslations('ru')('line.previous')).toBe('Предыдущая');
  });
});

describe('plural', () => {
  const forms = { one: 'трек', few: 'трека', many: 'треков', other: 'трека' };

  it.each([
    [1, 'трек'],
    [2, 'трека'],
    [5, 'треков'],
    [11, 'треков'],
    [21, 'трек'],
    [22, 'трека'],
    [1.5, 'трека'],
  ])('ru %d → %s', (n, expected) => {
    expect(plural('ru', n, forms)).toBe(expected);
  });

  it('falls back to "other" when a form is missing', () => {
    expect(plural('en', 2, { one: 'track', other: 'tracks' })).toBe('tracks');
  });
});
