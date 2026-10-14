/**
 * The audio engine (D-003, D-008): one interface over the backends — `file` (the session's single HTMLAudioElement)
 * and `soundcloud` (Widget API, lazy-imported on first use). `link` sources never reach the engine: the UI shows an
 * external link instead. The engine lives in module scope, so it survives every ClientRouter navigation.
 */
import { resolveSource, type Track } from '~/lib/player/track';
import type { Backend, BackendListener } from './backend';
import { createFileBackend } from './file-backend';

export type EngineEvent =
  | { type: 'progress'; position: number; duration: number | undefined }
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'waiting' }
  | { type: 'ended' }
  | { type: 'error'; reason: string };

type Kind = 'file' | 'soundcloud';

let subscriber: ((event: EngineEvent) => void) | undefined;
const backends = new Map<Kind, Backend>();
let active: { kind: Kind; trackId: string } | undefined;
let volume = 1;
/** A lazily created backend still loading its source (SoundCloud). */
let pendingLoad: Promise<void> | undefined;

/** Events from a backend count only while it is the active one (a stale SoundCloud widget must not move the UI). */
function listenerFor(kind: Kind): BackendListener {
  const emit = (event: EngineEvent) => {
    if (active?.kind === kind) subscriber?.(event);
  };
  return {
    progress: (position, duration) => emit({ type: 'progress', position, duration }),
    playing: () => emit({ type: 'playing' }),
    paused: () => emit({ type: 'paused' }),
    waiting: () => emit({ type: 'waiting' }),
    ended: () => emit({ type: 'ended' }),
    error: (reason) => emit({ type: 'error', reason }),
  };
}

async function backend(kind: Kind): Promise<Backend> {
  let instance = backends.get(kind);
  if (!instance) {
    switch (kind) {
      case 'file':
        instance = createFileBackend(listenerFor('file'));
        break;
      case 'soundcloud': {
        const { createSoundCloudBackend } = await import('./soundcloud-backend');
        instance = createSoundCloudBackend(listenerFor('soundcloud'));
        break;
      }
      default: {
        const never: never = kind;
        throw new Error(`engine: unknown backend ${String(never)}`);
      }
    }
    instance.setVolume(volume);
    backends.set(kind, instance);
  }
  return instance;
}

/** The file backend must exist synchronously so `play()` stays inside the click's user-activation window. */
function fileBackend(): Backend {
  let instance = backends.get('file');
  if (!instance) {
    instance = createFileBackend(listenerFor('file'));
    instance.setVolume(volume);
    backends.set('file', instance);
  }
  return instance;
}

export const engine = {
  subscribe(callback: (event: EngineEvent) => void): void {
    subscriber = callback;
  },

  /** Is this track's source already loaded (play would resume rather than restart)? */
  isLoaded(trackId: string): boolean {
    return active?.trackId === trackId;
  },

  /**
   * Load a track at `startAt` seconds without playing. Returns false when the track has no playable source.
   * Synchronous for files, so a following `play()` stays inside the click's user activation (iOS Safari).
   */
  load(track: Track, startAt = 0): boolean {
    const source = resolveSource(track);
    if (!source || source.kind === 'link') return false;
    if (active && active.kind !== source.kind) backends.get(active.kind)?.unload();
    active = { kind: source.kind, trackId: track.id };
    if (source.kind === 'file') {
      pendingLoad = undefined;
      fileBackend().load(source.src, startAt);
    } else {
      pendingLoad = backend(source.kind).then((b) => b.load(source.url, startAt));
    }
    return true;
  },

  play(): Promise<void> {
    if (!active) return Promise.reject(new Error('engine: nothing loaded'));
    if (active.kind === 'file') return fileBackend().play();
    const kind = active.kind;
    return (pendingLoad ?? Promise.resolve()).then(() => backend(kind)).then((b) => b.play());
  },

  pause(): void {
    if (active) backends.get(active.kind)?.pause();
  },

  seek(seconds: number): void {
    if (active) backends.get(active.kind)?.seek(seconds);
  },

  setVolume(value: number): void {
    volume = value;
    for (const b of backends.values()) b.setVolume(value);
  },

  /** Label of the third-party backend in use, for source attribution. */
  thirdParty(): string | undefined {
    return active?.kind === 'soundcloud' ? 'SoundCloud' : undefined;
  },
};
