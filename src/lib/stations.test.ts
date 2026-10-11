import { describe, expect, it } from 'vitest';
import { ru } from '~/i18n/ui/ru';
import { translate } from '~/i18n/t';
import {
  getStation,
  isTerminal,
  lineIndex,
  lineStations,
  neighbours,
  stationForPath,
  stations,
  transitionDirection,
} from './stations';

describe('station registry', () => {
  it('lists the line in travel order, ending at Бровары', () => {
    expect(lineStations.map((s) => s.id)).toEqual([
      'platform',
      'music',
      'history',
      'lyrics',
      'photos',
      'video',
      'brovary',
    ]);
    expect(isTerminal('brovary')).toBe(true);
    expect(isTerminal('video')).toBe(false);
  });

  it('keeps Женя and Об архиве off the line', () => {
    expect(getStation('zhenya').kind).toBe('deep');
    expect(getStation('about').kind).toBe('service');
    expect(lineIndex('zhenya')).toBeUndefined();
  });

  it('has unique ids and paths', () => {
    expect(new Set(stations.map((s) => s.id)).size).toBe(stations.length);
    expect(new Set(stations.map((s) => s.path)).size).toBe(stations.length);
  });

  it('has a name and description string for every station', () => {
    for (const s of stations) {
      expect(translate('ru', s.nameKey)).toBeTruthy();
      expect(translate('ru', s.descriptionKey)).toBeTruthy();
      expect(ru.station[s.id]).toBeDefined();
    }
  });

  it('only transfers to known stations', () => {
    const ids = new Set(stations.map((s) => s.id));
    for (const s of stations) for (const transfer of s.transfers) expect(ids.has(transfer)).toBe(true);
  });

  it('reaches Женя from История and Бровары', () => {
    expect(getStation('history').transfers).toContain('zhenya');
    expect(getStation('brovary').transfers).toContain('zhenya');
  });

  it('throws on an unknown id', () => {
    // @ts-expect-error — deliberately invalid id
    expect(() => getStation('memories')).toThrow();
  });
});

describe('neighbours', () => {
  it('returns previous and next along the line', () => {
    const { previous, next } = neighbours('history');
    expect(previous?.id).toBe('music');
    expect(next?.id).toBe('lyrics');
  });

  it('has no previous at Платформа and no next at the terminal', () => {
    expect(neighbours('platform').previous).toBeUndefined();
    expect(neighbours('brovary').next).toBeUndefined();
  });

  it('has no neighbours off the line', () => {
    expect(neighbours('zhenya')).toEqual({ previous: undefined, next: undefined });
  });
});

describe('stationForPath', () => {
  it.each([
    ['/', 'platform'],
    ['/music', 'music'],
    ['/music/', 'music'],
    ['/music.html', 'music'],
    ['/music/some-release', 'music'],
    ['/lyrics/writings/some-poem', 'lyrics'],
    ['/zhenya', 'zhenya'],
    ['/uk/history', 'history'],
    ['/en', 'platform'],
  ])('%s → %s', (path, id) => {
    expect(stationForPath(path)?.id).toBe(id);
  });

  it('returns undefined for unknown paths', () => {
    expect(stationForPath('/nowhere')).toBeUndefined();
    expect(stationForPath('/musical')).toBeUndefined();
  });
});

describe('transitionDirection', () => {
  it('goes forward and back along the line', () => {
    expect(transitionDirection('/', '/music')).toBe('forward');
    expect(transitionDirection('/brovary', '/music')).toBe('back');
    expect(transitionDirection('/music/a', '/history')).toBe('forward');
  });

  it('crossfades within a station, off the line and for unknown pages', () => {
    expect(transitionDirection('/music', '/music/release')).toBe('none');
    expect(transitionDirection('/history', '/zhenya')).toBe('none');
    expect(transitionDirection('/about', '/')).toBe('none');
    expect(transitionDirection('/nowhere', '/music')).toBe('none');
  });
});
