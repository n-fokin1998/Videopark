/**
 * Station-to-station navigation behaviour for <ClientRouter /> (loaded once by BaseLayout):
 * - transition direction from the station registry → `data-direction` on <html> (styles in motion.css);
 * - keeps the current theme across swaps (Astro replaces <html> attributes with the new document's);
 * - after a navigation: focus the new station's <h1> and announce it in the polite live region.
 */
import { transitionDirection, type TransitionDirection } from '~/lib/stations';

let direction: TransitionDirection = 'none';

document.addEventListener('astro:before-preparation', (event) => {
  direction = transitionDirection(event.from.pathname, event.to.pathname);
});

document.addEventListener('astro:before-swap', (event) => {
  const next = event.newDocument.documentElement;
  next.dataset.direction = direction;
  const theme = document.documentElement.dataset.theme;
  if (theme) next.dataset.theme = theme;
});

let initialLoad = true;

document.addEventListener('astro:page-load', () => {
  if (initialLoad) {
    initialLoad = false;
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
