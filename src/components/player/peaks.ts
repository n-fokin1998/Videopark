/** Waveform peaks fetched on demand (never decoded on the client) and cached for the session, by URL. */
import { downsamplePeaks, parsePeaks } from '~/lib/player/time';

const cache = new Map<string, Promise<number[] | undefined>>();

export function cachedPeaks(url: string, bars: number): Promise<number[] | undefined> {
  const key = `${bars}:${url}`;
  let peaks = cache.get(key);
  if (!peaks) {
    peaks = fetch(url)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((json: unknown) => {
        const values = parsePeaks(json);
        return values ? downsamplePeaks(values, bars) : undefined;
      })
      .catch(() => {
        cache.delete(key); // offline: try again next time
        return undefined;
      });
    cache.set(key, peaks);
  }
  return peaks;
}
