/**
 * «Трек вечера» (docs/vision.md §7.14): one item a day, deterministic by the visitor's local date, so returning
 * visitors find something new. Within each cycle of `count` days every item appears exactly once, in a shuffled order
 * that changes from cycle to cycle. Also used to rotate the platform's quote.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date as `YYYY-MM-DD` (the visitor's evening, not UTC). */
export function localDateKey(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days since 1970-01-01 for a `YYYY-MM-DD` key (timezone-free). */
export function dayNumber(dateKey: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`evening: invalid date key "${dateKey}"`);
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

/** mulberry32: a tiny, well-distributed seeded PRNG. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

/** A seeded Fisher–Yates permutation of `0…count-1`. */
export function permutation(count: number, seed: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const next = random(seed);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return order;
}

/**
 * Index of the item for `dateKey` among `count` items. `salt` separates independent rotations
 * (the track and the quote of the evening should not move in lockstep).
 */
export function pickIndexForDate(dateKey: string, count: number, salt = ''): number {
  if (count < 1) throw new Error('evening: nothing to pick from');
  const day = dayNumber(dateKey);
  const cycle = Math.floor(day / count);
  const order = permutation(count, hashString(`${salt}:${cycle}`));
  return order[day - cycle * count] ?? 0;
}
