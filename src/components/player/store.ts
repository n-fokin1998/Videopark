/**
 * Player state (docs/architecture.md §5), shared by the persisted Player island, PlayButtons and plain scripts.
 * Persisted: queue (+ current index), volume and the saved position — a reload restores the player *paused*.
 * Live only: status, position while playing, duration, expanded sheet.
 */
import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import { currentTrack, emptyQueue, parseQueue, type QueueState } from '~/lib/player/queue';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export const $queue = persistentAtom<QueueState>('vp:player:queue', emptyQueue, {
  encode: JSON.stringify,
  decode: (raw) => parseQueue(raw),
});

export const $current = computed($queue, currentTrack);

export const $status = atom<PlayerStatus>('idle');

/** Seconds into the current track. */
export const $position = atom(0);

/** Seconds; from the audio element once known, else from content. */
export const $duration = atom<number | undefined>(undefined);

export const $volume = persistentAtom<number>('vp:player:volume', 1, {
  encode: String,
  decode: (raw) => {
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
  },
});

/** The expanded player (queue, waveform; a full-screen sheet on phones). */
export const $expanded = atom(false);

/** Third-party backend currently producing sound (e.g. «SoundCloud»), shown as source attribution. */
export const $backendLabel = atom<string | undefined>(undefined);

/** Where the current track stopped, so a reload resumes at the same spot (written by the controller, throttled). */
export const $savedPosition = persistentAtom<{ id: string; t: number } | undefined>('vp:player:position', undefined, {
  encode: (value) => (value ? JSON.stringify(value) : undefined),
  decode: (raw) => {
    try {
      const value: unknown = JSON.parse(raw);
      if (typeof value === 'object' && value !== null) {
        const { id, t } = value as Record<string, unknown>;
        if (typeof id === 'string' && typeof t === 'number' && Number.isFinite(t) && t >= 0) return { id, t };
      }
    } catch {
      /* fall through */
    }
    return undefined;
  },
});
