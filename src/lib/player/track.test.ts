import { describe, expect, it } from 'vitest';
import { isPlayable, isTrack, parseDuration, resolveSource, type Track } from './track';

const base: Track = { id: 'voda--3', title: 'Вода', artist: 'Станция Видеопарк' };
const link = { url: 'https://example.bandcamp.com/track/voda', label: 'Bandcamp' };

describe('resolveSource', () => {
  it('prefers the self-hosted file, then SoundCloud, then a link', () => {
    const all: Track = { ...base, src: '/media/audio/voda--3.m4a', soundcloud: 'https://soundcloud.com/x/y', link };
    expect(resolveSource(all)).toEqual({ kind: 'file', src: '/media/audio/voda--3.m4a' });
    expect(resolveSource({ ...base, soundcloud: 'https://soundcloud.com/x/y', link })).toEqual({
      kind: 'soundcloud',
      url: 'https://soundcloud.com/x/y',
    });
    expect(resolveSource({ ...base, link })).toEqual({ kind: 'link', ...link });
    expect(resolveSource(base)).toBeUndefined();
  });

  it('treats only file and SoundCloud as playable', () => {
    expect(isPlayable({ ...base, src: '/a.m4a' })).toBe(true);
    expect(isPlayable({ ...base, soundcloud: 'https://soundcloud.com/x/y' })).toBe(true);
    expect(isPlayable({ ...base, link })).toBe(false);
    expect(isPlayable(base)).toBe(false);
  });
});

describe('parseDuration', () => {
  it('reads m:ss', () => {
    expect(parseDuration('2:37')).toBe(157);
    expect(parseDuration('24:05')).toBe(1445);
    expect(parseDuration('2.37')).toBeUndefined();
    expect(parseDuration(undefined)).toBeUndefined();
  });
});

describe('isTrack', () => {
  it('accepts well-formed tracks and rejects junk', () => {
    expect(isTrack({ ...base, duration: 12, link })).toBe(true);
    expect(isTrack({ ...base, duration: '12' })).toBe(false);
    expect(isTrack({ ...base, link: { url: 1 } })).toBe(false);
    expect(isTrack({ id: 'x' })).toBe(false);
    expect(isTrack(null)).toBe(false);
  });
});
