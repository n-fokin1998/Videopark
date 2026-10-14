/**
 * Self-hosted audio (the default backend): the session's single HTMLAudioElement. Music fades in/out over 300 ms
 * on play/pause (docs/design.md §9). Browsers that ignore `volume` (iOS) simply skip the fade.
 */
import type { Backend, BackendFactory } from './backend';

const FADE_MS = 300;

export const createFileBackend: BackendFactory = (listener) => {
  const audio = new Audio();
  audio.preload = 'none';
  let target = 1;
  let fade: number | undefined;
  let pendingSeek: number | undefined;

  const stopFade = () => {
    if (fade !== undefined) cancelAnimationFrame(fade);
    fade = undefined;
  };

  const ramp = (from: number, to: number, done?: () => void) => {
    stopFade();
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (to - from) * k;
      if (k < 1) fade = requestAnimationFrame(step);
      else {
        fade = undefined;
        done?.();
      }
    };
    fade = requestAnimationFrame(step);
  };

  const duration = () => (Number.isFinite(audio.duration) ? audio.duration : undefined);

  audio.addEventListener('timeupdate', () => listener.progress(audio.currentTime, duration()));
  audio.addEventListener('durationchange', () => listener.progress(audio.currentTime, duration()));
  audio.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== undefined && pendingSeek > 0 && pendingSeek < (duration() ?? Infinity))
      audio.currentTime = pendingSeek;
    pendingSeek = undefined;
  });
  audio.addEventListener('playing', () => listener.playing());
  audio.addEventListener('waiting', () => listener.waiting());
  audio.addEventListener('pause', () => {
    if (!audio.ended) listener.paused();
  });
  audio.addEventListener('ended', () => listener.ended());
  audio.addEventListener('error', () => {
    if (audio.getAttribute('src'))
      listener.error(audio.error?.message || `media error ${audio.error?.code ?? ''}`.trim());
  });

  const backend: Backend = {
    load(url, startAt) {
      stopFade();
      audio.pause();
      pendingSeek = startAt;
      audio.src = url;
    },
    async play() {
      stopFade();
      if (audio.paused) audio.volume = 0;
      await audio.play();
      ramp(audio.volume, target);
    },
    pause() {
      if (audio.paused) return;
      ramp(audio.volume, 0, () => {
        audio.pause();
        audio.volume = target;
      });
    },
    seek(seconds) {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) audio.currentTime = seconds;
      else pendingSeek = seconds;
      listener.progress(seconds, duration());
    },
    setVolume(volume) {
      target = volume;
      if (fade === undefined) audio.volume = volume;
    },
    unload() {
      stopFade();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
  return backend;
};
