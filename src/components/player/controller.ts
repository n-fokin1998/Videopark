/**
 * Player actions shared by every island (Player, PlayButton, TrackOfTheEvening) and the keyboard:
 * queue changes, the engine, saved position, Media Session and audio focus. Module scope = one instance per session.
 * Never starts sound on its own: `play` is only reached from a visitor's action (D-013).
 */
import { clampTime } from '~/lib/player/time';
import { createQueue, currentTrack, jumpTo, next as nextOf, previous as previousOf } from '~/lib/player/queue';
import type { Track } from '~/lib/player/track';
import { engine, type EngineEvent } from './audio-engine';
import { $backendLabel, $current, $duration, $position, $queue, $savedPosition, $status, $volume } from './store';
import { uiClick } from './ui-sound';

const SAVE_EVERY_MS = 5000;
const SEEK_STEP = 10;

let initialised = false;
let lastSave = 0;
let lastPositionState = 0;

function savePosition(force = false): void {
  const track = $current.get();
  if (!track) return;
  const now = Date.now();
  if (!force && now - lastSave < SAVE_EVERY_MS) return;
  lastSave = now;
  $savedPosition.set({ id: track.id, t: Math.floor($position.get()) });
}

function startAtFor(track: Track): number {
  const saved = $savedPosition.get();
  return saved?.id === track.id ? saved.t : 0;
}

function onEngine(event: EngineEvent): void {
  switch (event.type) {
    case 'progress':
      $position.set(event.position);
      if (event.duration !== undefined) $duration.set(event.duration);
      savePosition();
      updatePositionState();
      break;
    case 'playing':
      $status.set('playing');
      $backendLabel.set(engine.thirdParty());
      break;
    case 'waiting':
      if ($status.get() !== 'paused') $status.set('loading');
      break;
    case 'paused':
      if ($status.get() !== 'error') $status.set('paused');
      savePosition(true);
      break;
    case 'ended':
      if (!next({ autoplay: true })) {
        $status.set('paused');
        $position.set(0);
        savePosition(true);
      }
      break;
    case 'error':
      console.warn(`player: ${event.reason}`);
      $status.set('error');
      break;
    default: {
      const never: never = event;
      throw new Error(`player: unknown event ${JSON.stringify(never)}`);
    }
  }
  updatePlaybackState();
}

// ── Media Session (lock screen / OS controls) ────────────────────────────────

function mediaSession(): MediaSession | undefined {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : undefined;
}

function updateMetadata(track: Track | undefined): void {
  const session = mediaSession();
  if (!session || typeof MediaMetadata === 'undefined') return;
  session.metadata = track
    ? new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album ?? '',
        artwork: track.artwork
          ? [{ src: new URL(track.artwork, location.href).href, sizes: '512x512', type: 'image/webp' }]
          : [],
      })
    : null;
}

function updatePlaybackState(): void {
  const session = mediaSession();
  if (!session) return;
  const status = $status.get();
  session.playbackState = status === 'playing' || status === 'loading' ? 'playing' : $current.get() ? 'paused' : 'none';
}

function updatePositionState(): void {
  const session = mediaSession();
  const duration = $duration.get();
  const now = Date.now();
  if (!session?.setPositionState || !duration || now - lastPositionState < 1000) return;
  lastPositionState = now;
  try {
    session.setPositionState({ duration, position: Math.min($position.get(), duration), playbackRate: 1 });
  } catch {
    /* inconsistent values during a track change */
  }
}

function registerMediaSession(): void {
  const session = mediaSession();
  if (!session) return;
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => play()],
    ['pause', () => pause()],
    ['previoustrack', () => previous()],
    ['nexttrack', () => next({ autoplay: true })],
    ['seekbackward', (d) => seekBy(-(d.seekOffset ?? SEEK_STEP))],
    ['seekforward', (d) => seekBy(d.seekOffset ?? SEEK_STEP)],
    ['seekto', (d) => seek(d.seekTime ?? 0)],
  ];
  for (const [action, handler] of handlers) {
    try {
      session.setActionHandler(action, handler);
    } catch {
      /* action not supported by this browser */
    }
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

/** Called once by the persisted Player island. Restores the saved position, paused. */
export function initPlayer(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  engine.subscribe(onEngine);
  engine.setVolume($volume.get());
  const track = $current.get();
  if (track) {
    $position.set(startAtFor(track));
    $duration.set(track.duration);
    $status.set('paused');
  }
  updateMetadata(track);
  updatePlaybackState();
  registerMediaSession();
  $current.listen((current) => updateMetadata(current));
  $volume.listen((value) => engine.setVolume(value));

  // Single audio focus: any other media element starting (a video) pauses the music; it does not auto-resume.
  document.addEventListener(
    'play',
    (event) => {
      if (event.target instanceof HTMLMediaElement && $status.get() === 'playing') pause();
    },
    true,
  );
  window.addEventListener('pagehide', () => savePosition(true));
}

function start(track: Track, at: number): void {
  $duration.set(track.duration);
  $position.set(at);
  if (!engine.load(track, at)) {
    $status.set('error');
    return;
  }
  $status.set('loading');
  updatePlaybackState();
  engine.play().catch((error: unknown) => {
    // Autoplay refusals (no user activation) end calmly in "paused"; anything else is an error.
    const blocked = error instanceof DOMException && error.name === 'NotAllowedError';
    if (!blocked) console.warn('player:', error);
    $status.set(blocked ? 'paused' : 'error');
    updatePlaybackState();
  });
}

/** Play `tracks` from `startIndex` (a release, a list, a single track). Replaces the queue. */
export function playTracks(tracks: readonly Track[], startIndex = 0): void {
  const queue = createQueue(tracks, startIndex);
  const track = currentTrack(queue);
  if (!track) return;
  uiClick();
  $queue.set(queue);
  start(track, 0);
}

export function play(): void {
  const track = $current.get();
  if (!track) return;
  if (engine.isLoaded(track.id) && $status.get() !== 'error') {
    $status.set('loading');
    engine.play().catch(() => $status.set('error'));
  } else {
    start(track, $position.get() || startAtFor(track));
  }
  updatePlaybackState();
}

export function pause(): void {
  engine.pause();
  $status.set('paused');
  savePosition(true);
  updatePlaybackState();
}

export function toggle(): void {
  if (!$current.get()) return;
  uiClick();
  const status = $status.get();
  if (status === 'playing' || status === 'loading') pause();
  else play();
}

/** Returns false at the end of the queue. */
export function next({ autoplay = $status.get() === 'playing' } = {}): boolean {
  const queue = nextOf($queue.get());
  const track = queue && currentTrack(queue);
  if (!queue || !track) return false;
  $queue.set(queue);
  if (autoplay) start(track, 0);
  else {
    $position.set(0);
    $duration.set(track.duration);
    $status.set('paused');
  }
  return true;
}

export function previous(): void {
  const wasPlaying = $status.get() === 'playing';
  const action = previousOf($queue.get(), $position.get());
  if (action.kind === 'restart') {
    seek(0);
    return;
  }
  const track = currentTrack(action.queue);
  if (!track) return;
  $queue.set(action.queue);
  if (wasPlaying) start(track, 0);
  else {
    $position.set(0);
    $duration.set(track.duration);
    $status.set('paused');
  }
}

export function jump(index: number): void {
  const queue = jumpTo($queue.get(), index);
  const track = queue && currentTrack(queue);
  if (!queue || !track) return;
  $queue.set(queue);
  start(track, 0);
}

export function seek(seconds: number): void {
  const track = $current.get();
  if (!track) return;
  const target = clampTime(seconds, $duration.get());
  $position.set(target);
  if (engine.isLoaded(track.id)) engine.seek(target);
  savePosition(true);
}

export function seekBy(delta: number): void {
  seek($position.get() + delta);
}

export function setVolume(value: number): void {
  $volume.set(Math.min(1, Math.max(0, value)));
}

export { SEEK_STEP };
