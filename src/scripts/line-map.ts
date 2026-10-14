/**
 * «Схема» behaviour (src/components/station/LineMap.astro): open with the header button or `M`, close with Esc,
 * the close button, a click on the backdrop or on any station link. The header is re-rendered on every navigation,
 * so elements are re-bound on `astro:page-load`; the keyboard listener is registered once.
 * Also wires the light (theme preference) and «Звук» controls to their stores.
 */
import { shortcutFor } from '~/lib/keyboard';
import { parseThemePreference } from '~/lib/themes';
import { $soundFx, setSoundFx } from '~/stores/sound';
import { $themePreference, pinTheme } from '~/stores/theme';

const dialog = () => document.querySelector<HTMLDialogElement>('[data-line-map-dialog]');

/** Where focus returns on close (WebKit does not restore it reliably by itself). */
let opener: HTMLElement | null = null;
/** True between a navigation's start and its swap (the map closes because a link was followed). */
let navigating = false;

function open(): void {
  const map = dialog();
  if (!map || map.open) return;
  opener =
    document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : document.querySelector<HTMLElement>('[data-line-map-open]');
  syncControls(map);
  map.showModal();
}

function close(): void {
  const map = dialog();
  if (map?.open) map.close();
}

function syncControls(map: HTMLDialogElement): void {
  const preference = $themePreference.get();
  for (const input of map.querySelectorAll<HTMLInputElement>('[data-theme-choice]')) {
    input.checked = input.value === preference;
  }
  map.querySelector('[data-sound-toggle]')?.setAttribute('aria-pressed', String($soundFx.get()));
}

document.addEventListener('keydown', (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const shortcut = shortcutFor({
    code: event.code,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    repeat: event.repeat,
    defaultPrevented: event.defaultPrevented,
    target,
  });
  if (shortcut !== 'line-map') return;
  const map = dialog();
  // Another modal (the player sheet) is open: leave it alone.
  if (!map || [...document.querySelectorAll('dialog[open]')].some((d) => d !== map)) return;
  event.preventDefault();
  if (map.open) close();
  else open();
});

/** Bind the current page's header (re-rendered on every navigation). Safe to call twice for the same page. */
function bindPage(): void {
  const map = dialog();
  const button = document.querySelector<HTMLButtonElement>('[data-line-map-open]');
  if (!map || !button || map.dataset.bound) return;
  map.dataset.bound = 'true';
  button.hidden = false;
  button.addEventListener('click', open);
  map.querySelector('[data-line-map-close]')?.addEventListener('click', close);
  map.addEventListener('close', () => {
    // Not when closing because a station link was followed: the new page moves focus to its <h1>.
    if (opener?.isConnected && !navigating) opener.focus();
    opener = null;
  });
  // Close on a backdrop click that also started on the backdrop (not the tail of the tap that opened the map).
  let downOnBackdrop = false;
  map.addEventListener('pointerdown', (event) => {
    downOnBackdrop = event.target === map;
  });
  map.addEventListener('click', (event) => {
    if (event.target === map) {
      if (downOnBackdrop) close();
      downOnBackdrop = false;
    } else if (event.target instanceof Element && event.target.closest('a[href]')) close();
  });
  map.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.matches('[data-theme-choice]')) {
      pinTheme(parseThemePreference(event.target.value));
    }
  });
  map.querySelector('[data-sound-toggle]')?.addEventListener('click', () => {
    setSoundFx(!$soundFx.get());
    syncControls(map);
  });
}

// Loaded lazily (on idle) by BaseLayout: bind the page we are on now, then every page after a navigation.
bindPage();
document.addEventListener('astro:page-load', bindPage);

// The old document's dialog must not be captured mid-transition.
document.addEventListener('astro:before-preparation', () => {
  navigating = true;
  close();
});
document.addEventListener('astro:after-swap', () => {
  navigating = false;
});
