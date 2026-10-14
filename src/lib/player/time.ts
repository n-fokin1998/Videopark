/** Timecodes for the player (mono «tape» labels) and waveform downsampling. */

/** `m:ss` (or `h:mm:ss` for the 24-minute «Мой милый дом»). Unknown or invalid → `0:00`. */
export function formatTime(seconds: number | undefined): string {
  const total = seconds !== undefined && Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Clamp a seek target into the playable range. */
export function clampTime(seconds: number, duration: number | undefined): number {
  const max = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : Infinity;
  return Math.min(Math.max(0, seconds), max);
}

/** Reduce the 800 precomputed peaks to `bars` values (max per group) for drawing. */
export function downsamplePeaks(peaks: readonly number[], bars: number): number[] {
  if (bars < 1 || peaks.length === 0) return [];
  if (peaks.length <= bars) return [...peaks];
  const size = peaks.length / bars;
  return Array.from({ length: bars }, (_, b) => {
    let max = 0;
    for (let i = Math.floor(b * size); i < Math.floor((b + 1) * size); i++) max = Math.max(max, peaks[i] ?? 0);
    return max;
  });
}

/** Validate a fetched peaks file (`scripts/lib/peaks.ts` → `PeaksFile`). */
export function parsePeaks(value: unknown): number[] | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { peaks } = value as Record<string, unknown>;
  return Array.isArray(peaks) && peaks.every((p) => typeof p === 'number') ? peaks : undefined;
}
