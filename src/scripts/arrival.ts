/**
 * The arrival sequence (src/components/station/Arrival.astro). Phases are CSS classes on the overlay — no animation
 * library: `is-arriving` (the train pulls in) → `is-open` (doors part) → done. Esc or «Пропустить» skip at any point.
 * While the overlay shows, the rest of the page is `inert`. Silent: nothing here touches audio (D-013).
 */
import { ARRIVAL_STORAGE_KEY } from '~/lib/arrival';

declare global {
  interface Window {
    /** Tells the pre-paint safety timer in BaseLayout that the arrival script is alive. */
    __vpArrival?: boolean;
  }
}

window.__vpArrival = true;

/** Resolve on the element's own transitionend, or after `fallbackMs` (transitions may be skipped or cut short). */
function transitionDone(element: Element, fallbackMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(done, fallbackMs);
    function done() {
      window.clearTimeout(timer);
      element.removeEventListener('transitionend', onEnd);
      resolve();
    }
    function onEnd(event: Event) {
      if (event.target === element) done();
    }
    element.addEventListener('transitionend', onEnd);
  });
}

function durationOf(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ms = value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
  return Number.isFinite(ms) ? ms : 1000;
}

document.addEventListener('astro:page-load', () => {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>('[data-arrival-overlay]');
  if (root.dataset.arrival !== 'pending') return;
  if (!overlay) {
    delete root.dataset.arrival;
    return;
  }

  const background = [...document.body.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el !== overlay && !el.contains(overlay),
  );
  for (const el of background) el.inert = true;

  const enter = overlay.querySelector<HTMLButtonElement>('[data-arrival-enter]');
  const skip = overlay.querySelector<HTMLButtonElement>('[data-arrival-skip]');
  const train = overlay.querySelector<HTMLElement>('.arrival__train');
  const doors = overlay.querySelector<HTMLElement>('.arrival__door--left');
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      localStorage.setItem(ARRIVAL_STORAGE_KEY, '1');
    } catch {
      /* storage unavailable */
    }
    for (const el of background) el.inert = false;
    document.removeEventListener('keydown', onKeydown);
    delete root.dataset.arrival;
    overlay.classList.remove('is-arriving', 'is-open', 'is-leaving');
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  };

  const leave = async () => {
    if (finished) return;
    overlay.classList.add('is-leaving');
    await transitionDone(overlay, durationOf('--dur-short') + 100);
    finish();
  };

  const arrive = async () => {
    if (!train || !doors || overlay.classList.contains('is-arriving')) return;
    // Focus stays on the button (moving it would make the final focus on <h1> look keyboard-driven).
    overlay.classList.add('is-arriving');
    await transitionDone(train, durationOf('--dur-arrival-train') + 200);
    if (finished) return;
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    overlay.classList.add('is-open');
    await transitionDone(doors, durationOf('--dur-arrival-doors') + 200);
    finish();
  };

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      void leave();
    }
  }

  document.addEventListener('keydown', onKeydown);
  enter?.addEventListener('click', () => void arrive());
  skip?.addEventListener('click', () => void leave());
  enter?.focus();
});
