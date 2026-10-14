/**
 * Station-to-station navigation behaviour for <ClientRouter /> (loaded once by BaseLayout):
 * - transition direction from the station registry → `data-direction` on <html> (styles in motion.css);
 *   a jump chosen on the line map (`[data-line-map]` links) zooms instead of sliding;
 * - keeps document-level state across swaps (Astro replaces <html> attributes with the new document's):
 *   the current theme and `data-player` (reveals the «К плееру» skip link);
 * - the lit dot of the line indicator travels from the old station to the new one (FLIP, LineIndicator.astro);
 * - after a navigation: focus the new station's <h1> and announce it in the polite live region;
 * - marks the arrival as seen on a deep-link landing (the arrival plays only for a first visit that starts at «/»).
 */
import { navigationDirection, type TransitionDirection } from '~/lib/stations';
import { ARRIVAL_STORAGE_KEY } from '~/lib/arrival';

let direction: TransitionDirection = 'none';

document.addEventListener('astro:before-preparation', (event) => {
  const viaLineMap = event.sourceElement?.closest('[data-line-map]') != null;
  direction = navigationDirection(event.from.pathname, event.to.pathname, { viaLineMap });
});

const CURRENT_DOT = '.line__station.is-current .line__dot';
/** Horizontal centre of the lit dot before the swap, for the travelling-dot animation (LineIndicator.astro). */
let dotFrom: number | undefined;

function dotCentre(dot: Element | null): number | undefined {
  if (!dot) return undefined;
  const rect = dot.getBoundingClientRect();
  return rect.width > 0 ? rect.left + rect.width / 2 : undefined;
}

document.addEventListener('astro:before-swap', (event) => {
  const current = document.documentElement.dataset;
  const next = event.newDocument.documentElement.dataset;
  next.direction = direction;
  if (current.theme) next.theme = current.theme;
  if (current.player) next.player = current.player;
  dotFrom =
    direction === 'forward' || direction === 'back' ? dotCentre(document.querySelector(CURRENT_DOT)) : undefined;
});

document.addEventListener('astro:after-swap', () => {
  const dot = document.querySelector<HTMLElement>(CURRENT_DOT);
  const to = dotCentre(dot);
  if (!dot || dotFrom === undefined || to === undefined || Math.abs(dotFrom - to) < 1) return;
  dot.style.setProperty('--travel', `${dotFrom - to}px`);
  dot.classList.add('is-travelling');
  dot.addEventListener('animationend', () => dot.classList.remove('is-travelling'), { once: true });
});

let initialLoad = true;

document.addEventListener('astro:page-load', () => {
  if (initialLoad) {
    initialLoad = false;
    if (document.documentElement.dataset.arrival !== 'pending') {
      try {
        localStorage.setItem(ARRIVAL_STORAGE_KEY, '1');
      } catch {
        /* storage unavailable: the arrival may show again — harmless */
      }
    }
    return;
  }

  const main = document.querySelector<HTMLElement>('main');
  const heading = main?.querySelector<HTMLElement>('h1');
  const target = heading ?? main;
  if (target) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  const announcer = document.querySelector<HTMLElement>('[data-route-announcer]');
  const message = main?.dataset.announce;
  if (announcer && message) {
    // Clear first so repeated visits to the same station are announced again.
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
  }
});
