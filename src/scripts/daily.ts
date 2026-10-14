/**
 * Daily rotation for server-rendered alternatives (the platform's quote): a `[data-daily]` container holds
 * `[data-daily-item]` children, all but the build-date pick `hidden`. After load the visitor's local date decides,
 * with the same deterministic rotation as «Трек вечера» (src/lib/evening.ts). Without JS the build pick stays.
 */
import { localDateKey, pickIndexForDate } from '~/lib/evening';

function pickToday(): void {
  const key = localDateKey(new Date());
  for (const container of document.querySelectorAll<HTMLElement>('[data-daily]')) {
    const items = [...container.querySelectorAll<HTMLElement>('[data-daily-item]')];
    if (items.length === 0) continue;
    const pick = pickIndexForDate(key, items.length, container.dataset.daily ?? '');
    items.forEach((item, i) => {
      item.hidden = i !== pick;
    });
  }
}

// Loaded by the pages that use it; also re-run after every navigation (idempotent).
pickToday();
document.addEventListener('astro:page-load', pickToday);
