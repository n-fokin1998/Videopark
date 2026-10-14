/**
 * Player queue logic (pure). The store keeps `{ tracks, index }`; these functions decide where to go next.
 */
import { isPlayable, isTrack, type Track } from './track';

export type QueueState = { tracks: Track[]; index: number };

export const emptyQueue: QueueState = { tracks: [], index: 0 };

/** «Предыдущая» restarts the current track when more than this many seconds have played. */
export const RESTART_THRESHOLD = 3;

/** A new queue from `tracks`, starting at `start`. Unplayable tracks are dropped (never a dead entry). */
export function createQueue(tracks: readonly Track[], start = 0): QueueState {
  const startId = tracks[start]?.id;
  const playable = tracks.filter(isPlayable);
  const index = Math.max(
    0,
    playable.findIndex((t) => t.id === startId),
  );
  return { tracks: playable, index };
}

export function currentTrack(queue: QueueState): Track | undefined {
  return queue.tracks[queue.index];
}

export function hasNext(queue: QueueState): boolean {
  return queue.index < queue.tracks.length - 1;
}

export function hasPrevious(queue: QueueState): boolean {
  return queue.index > 0;
}

export function next(queue: QueueState): QueueState | undefined {
  return hasNext(queue) ? { ...queue, index: queue.index + 1 } : undefined;
}

export type PreviousAction = { kind: 'restart' } | { kind: 'go'; queue: QueueState };

/** Like a CD player: restart the current track if it has been playing a while, otherwise step back. */
export function previous(queue: QueueState, position: number): PreviousAction {
  if (position > RESTART_THRESHOLD || !hasPrevious(queue)) return { kind: 'restart' };
  return { kind: 'go', queue: { ...queue, index: queue.index - 1 } };
}

export function jumpTo(queue: QueueState, index: number): QueueState | undefined {
  return index >= 0 && index < queue.tracks.length ? { ...queue, index } : undefined;
}

/** Restore a queue saved in localStorage; anything malformed becomes an empty queue. */
export function parseQueue(raw: string | undefined): QueueState {
  if (!raw) return emptyQueue;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return emptyQueue;
    const { tracks, index } = value as Record<string, unknown>;
    if (!Array.isArray(tracks) || !tracks.every(isTrack) || typeof index !== 'number') return emptyQueue;
    const playable = tracks.filter(isPlayable);
    if (playable.length === 0) return emptyQueue;
    return { tracks: playable, index: Number.isInteger(index) && index >= 0 && index < playable.length ? index : 0 };
  } catch {
    return emptyQueue;
  }
}
