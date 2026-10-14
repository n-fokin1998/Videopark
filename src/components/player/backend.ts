/** The contract every audio backend implements (file, SoundCloud widget). See audio-engine.ts. */

export type BackendListener = {
  /** Position and (once known) duration, in seconds. */
  progress: (position: number, duration: number | undefined) => void;
  playing: () => void;
  paused: () => void;
  waiting: () => void;
  ended: () => void;
  error: (reason: string) => void;
};

export type Backend = {
  /** Prepare a source; nothing is fetched until `play()` (preload none). */
  load: (url: string, startAt: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  /** Stop and release the source (switching backends). */
  unload: () => void;
};

export type BackendFactory = (listener: BackendListener) => Backend;
