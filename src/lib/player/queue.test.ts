import { describe, expect, it } from 'vitest';
import { createQueue, currentTrack, emptyQueue, jumpTo, next, parseQueue, previous } from './queue';
import type { Track } from './track';

const track = (id: string, playable = true): Track => ({
  id,
  title: id,
  artist: 'Станция Видеопарк',
  ...(playable ? { src: `/media/audio/${id}.m4a` } : { link: { url: 'https://example.com', label: 'Bandcamp' } }),
});

const a = track('a');
const b = track('b');
const c = track('c');

describe('createQueue', () => {
  it('starts at the requested track', () => {
    const queue = createQueue([a, b, c], 1);
    expect(currentTrack(queue)?.id).toBe('b');
  });

  it('drops unplayable tracks and keeps the start', () => {
    const queue = createQueue([a, track('x', false), c], 2);
    expect(queue.tracks.map((t) => t.id)).toEqual(['a', 'c']);
    expect(currentTrack(queue)?.id).toBe('c');
  });

  it('falls back to the first playable track', () => {
    expect(currentTrack(createQueue([track('x', false), b], 0))?.id).toBe('b');
  });
});

describe('next / previous / jumpTo', () => {
  const queue = createQueue([a, b, c], 1);

  it('steps forward until the end', () => {
    expect(next(queue)?.index).toBe(2);
    expect(next({ ...queue, index: 2 })).toBeUndefined();
  });

  it('restarts after a few seconds, otherwise goes back', () => {
    expect(previous(queue, 10)).toEqual({ kind: 'restart' });
    expect(previous(queue, 1)).toEqual({ kind: 'go', queue: { ...queue, index: 0 } });
    expect(previous({ ...queue, index: 0 }, 1)).toEqual({ kind: 'restart' });
  });

  it('jumps only inside the queue', () => {
    expect(jumpTo(queue, 0)?.index).toBe(0);
    expect(jumpTo(queue, 3)).toBeUndefined();
    expect(jumpTo(queue, -1)).toBeUndefined();
  });
});

describe('parseQueue', () => {
  it('round-trips a saved queue', () => {
    const queue = createQueue([a, b], 1);
    expect(parseQueue(JSON.stringify(queue))).toEqual(queue);
  });

  it('survives junk, stale indexes and unplayable entries', () => {
    expect(parseQueue(undefined)).toEqual(emptyQueue);
    expect(parseQueue('{not json')).toEqual(emptyQueue);
    expect(parseQueue(JSON.stringify({ tracks: [{ id: 1 }], index: 0 }))).toEqual(emptyQueue);
    expect(parseQueue(JSON.stringify({ tracks: [a], index: 5 })).index).toBe(0);
    expect(parseQueue(JSON.stringify({ tracks: [track('x', false)], index: 0 }))).toEqual(emptyQueue);
  });
});
