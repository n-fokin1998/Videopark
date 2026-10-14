/**
 * SoundCloud fallback (D-008, docs/integrations.md §1): for recordings without a local file, a visually hidden
 * SoundCloud player iframe is driven through the Widget API (https://developers.soundcloud.com/docs/api/html5-widget).
 * Lazy-imported by the engine; the widget script and iframe load only after the visitor presses play.
 * The widget reports milliseconds; this backend speaks seconds like the others.
 */
import type { Backend, BackendFactory } from './backend';

const API_SRC = 'https://w.soundcloud.com/player/api.js';
const PLAYER_ORIGIN = 'https://w.soundcloud.com/player/';
/** If the widget has not started within this time (blocked iframe gesture on some mobile browsers), report an error. */
const START_TIMEOUT_MS = 8000;

type Widget = {
  bind: (event: string, callback: (data?: { currentPosition?: number }) => void) => void;
  load: (url: string, options: Record<string, unknown>) => void;
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  setVolume: (volume: number) => void;
  getDuration: (callback: (ms: number) => void) => void;
};

type WidgetApi = {
  Widget: ((iframe: HTMLIFrameElement) => Widget) & {
    Events: Record<'READY' | 'PLAY' | 'PAUSE' | 'FINISH' | 'PLAY_PROGRESS' | 'ERROR', string>;
  };
};

let apiPromise: Promise<WidgetApi> | undefined;

function loadApi(): Promise<WidgetApi> {
  apiPromise ??= new Promise<WidgetApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onload = () => {
      const api = (window as unknown as { SC?: WidgetApi }).SC;
      if (api) resolve(api);
      else reject(new Error('SoundCloud widget API missing'));
    };
    script.onerror = () => {
      apiPromise = undefined;
      reject(new Error('SoundCloud widget API failed to load'));
    };
    document.head.append(script);
  });
  return apiPromise;
}

export const createSoundCloudBackend: BackendFactory = (listener) => {
  let iframe: HTMLIFrameElement | undefined;
  let widget: Widget | undefined;
  let ready: Promise<Widget> | undefined;
  let duration: number | undefined;
  let startAt = 0;
  let volume = 1;
  let startTimer: number | undefined;

  const clearStartTimer = () => {
    if (startTimer !== undefined) window.clearTimeout(startTimer);
    startTimer = undefined;
  };

  const mount = async (url: string): Promise<Widget> => {
    const api = await loadApi();
    iframe = document.createElement('iframe');
    iframe.title = 'SoundCloud';
    iframe.allow = 'autoplay';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.className = 'visually-hidden';
    iframe.src = `${PLAYER_ORIGIN}?url=${encodeURIComponent(url)}&auto_play=false&visual=false`;
    document.body.append(iframe);
    const instance = api.Widget(iframe);
    const events = api.Widget.Events;
    await new Promise<void>((resolve) => instance.bind(events.READY, () => resolve()));
    instance.getDuration((ms) => {
      duration = ms > 0 ? ms / 1000 : undefined;
    });
    instance.bind(events.PLAY, () => {
      clearStartTimer();
      listener.playing();
    });
    instance.bind(events.PAUSE, () => listener.paused());
    instance.bind(events.FINISH, () => listener.ended());
    instance.bind(events.ERROR, () => listener.error('SoundCloud widget error'));
    instance.bind(events.PLAY_PROGRESS, (data) => listener.progress((data?.currentPosition ?? 0) / 1000, duration));
    instance.setVolume(volume * 100);
    if (startAt > 0) instance.seekTo(startAt * 1000);
    widget = instance;
    return instance;
  };

  const backend: Backend = {
    load(url, at) {
      backend.unload();
      startAt = at;
      ready = mount(url);
      ready.catch((error: unknown) => listener.error(error instanceof Error ? error.message : String(error)));
    },
    async play() {
      if (!ready) throw new Error('soundcloud: nothing loaded');
      listener.waiting();
      const instance = await ready;
      clearStartTimer();
      startTimer = window.setTimeout(() => listener.error('SoundCloud widget did not start'), START_TIMEOUT_MS);
      instance.play();
    },
    pause() {
      clearStartTimer();
      widget?.pause();
    },
    seek(seconds) {
      if (widget) widget.seekTo(seconds * 1000);
      else startAt = seconds;
      listener.progress(seconds, duration);
    },
    setVolume(value) {
      volume = value;
      widget?.setVolume(value * 100);
    },
    unload() {
      clearStartTimer();
      widget?.pause();
      iframe?.remove();
      iframe = undefined;
      widget = undefined;
      ready = undefined;
      duration = undefined;
    },
  };
  return backend;
};
